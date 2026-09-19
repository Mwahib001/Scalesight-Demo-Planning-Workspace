# ScaleSight Demo Planning Workspace — implementation audit

Audited **19 September 2026**, commit **`7b1cce24c41eac1d7fde25a507e8b52639648afc`**. Reviewer: Codex, using source inspection, a fresh production build, automated tests, independent counterfactual probes, and rendered-browser inspection.

The governing reference is the supplied [48-page V1 specification](</home/admin11/Downloads/ScaleSight_Demo_Planning_Workspace_Product_Technical_Specification_v1.pdf>), read end to end, together with the user's attached audit checklist. Existing README and acceptance claims were treated as unverified. Older Stitch prompts/assets were inspected as repository content, not substituted for the governing PDF.

**No application fixes were made.** Additions are this report and reproducible audit evidence. Failures below distinguish current-demo defects from defects exposed by changed inputs and from unverified deployment requirements.

## 1. Build & test verification

### Commands and actual results

| Command executed | Fresh result | Interpretation |
|---|---|---|
| `pnpm test` | Passed; **1 Node assertion program**, zero assertion failures; **288 stress combinations completed** | The 288 combinations are iterations across 24 SKUs × 4 horizons × 3 modes, not 288 separately reported unit tests. |
| `pnpm lint` | Passed | ESLint returned exit 0 for the application. Also rerun after adding audit scripts. |
| `pnpm build` | Passed | Runs the same engine assertion program again, then Next.js 16.3.4 production compilation, TypeScript, and prerendering. Build reported 18 generated pages, including framework/metadata routes. |
| `node_modules/.bin/playwright test --reporter=json > audit-evidence/existing-browser-suite.json` | **23 passed, 1 failed, 0 skipped** | Failure: `/demand-forecast` horizontal-overflow assertion immediately after resizing to 1280. All nine axe accessibility cases passed. |
| `node_modules/.bin/playwright test --grep 'route, refresh, responsive layout: /demand-forecast' --reporter=json > audit-evidence/demand-browser-rerun.json` | **1 passed, 0 failed** | Isolated rerun passed. This does not replace the original full-suite result with “24/24 passed.” |
| `node audit-evidence/engine-probes.cjs` | **19 audit checks: 9 passed, 10 failed** | Independent calls into freshly compiled application functions, including temporary in-memory counterfactual data. Source data is restored after each mutation. |
| `node audit-evidence/browser-probes.cjs` against `next start -p 3101` | **16 audit checks: 7 passed, 9 failed** | Captured all nine routes at 1440×900 and 1280×720, scenario navigation, contextual links, workflow, chart labels, focus, and booking behavior. No uncaught browser errors. |

The audit collectors intentionally finish collecting evidence despite failed checks; their exit status is not a pass/fail verdict. Several checks describe the same underlying gap, so these counts are not counts of unique defects.

Evidence: [original browser suite](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/existing-browser-suite.json), [isolated rerun](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/demand-browser-rerun.json), [engine probes and results](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/engine-probes.cjs), [engine result data](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/engine-probes.json), [browser probes](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/browser-probes.cjs), [browser result data](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/browser-probes.json).

The prior [acceptance record](/home/admin11/github-projects/ecommerce-scalesight/AUDIT_REPORT.md:5) claimed all 24 browser tests passed, plus engine stress coverage, build, TypeScript, and lint. Build/lint/engine claims were reproduced. The full browser claim was not reproduced in the initial run; the single failure passed on rerun. More importantly, those existing assertions do not establish formula/spec completeness: the independent probes expose failures outside their coverage.

### Actual repository structure

| Responsibility | Actual location |
|---|---|
| Entity definitions | `src/data/entities.ts` |
| Seeded history generator / planning date | `src/data/dataset.ts` |
| Client, SKUs, orders, events, snapshots, assumptions | `src/data/kelarune.ts` |
| Calculations | `src/engine/{forecastEngine,inventoryEngine,scenarioEngine,recommendationEngine,formatters}.ts` |
| Shared session state | `src/context/PlanningContext.tsx` |
| Reusable UI and substantive page views | `src/components/` — including `SKUDetail.tsx`, `ForecastViews.tsx`, `ManagedWorkflow.tsx` |
| Nine primary route wrappers | `src/app/page.tsx` and the eight specified route directories |
| Compatibility redirects | `/forecast`, `/customer-growth`, `/partnership`, `/advisor-brief` |
| Existing automated verification | `tests/planning.test.ts`, `tests/browser/smoke.spec.ts`, `tests/browser/audit.spec.ts` |

All nine primary routes were opened in the production app. The build is locally runnable; a public Vercel deployment was not established or verified during this audit.

## 2. Critical gaps

### C1. Available inventory is not an input to the inventory calculation

**Locations:** [inventoryEngine.ts:13](/home/admin11/github-projects/ecommerce-scalesight/src/engine/inventoryEngine.ts:13), lines 67–76; [scenarioEngine.ts:97](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:97); [kelarune.ts:299](/home/admin11/github-projects/ecommerce-scalesight/src/data/kelarune.ts:299).

`InventorySnapshot` defines `onHand`, `available`, and `committed`, but `buildPlan` never supplies snapshots to `inventoryFor`. Cover is `sku.currentInventory * (1 - shrinkRate) / weeklyDemand`. It is not the PDF §16.1 formula `available_inventory / forecast_weekly_demand`.

**Reproduction:** leave Mango on-hand at 2,400, set its snapshot to 1,200 available and 1,200 committed. Cover remains **3.404255 weeks** instead of **1.702128 weeks**. Every screen consistently repeats the wrong result; a shared function alone does not ensure reconciliation with the actual inventory entity.

The shrink probe exposes a second substitution: with 10% shrink, usable inventory is correctly 2,160, but cover becomes **3.063830** despite unchanged available inventory. Projection also starts at usable stock: first projected point is **1,455**, versus **1,695** under the PDF's literal `current_inventory + arrivals − demand`. The UI documents usable-stock projection in `AssumptionTable.tsx:172`; that makes this interpretation visible, but it still differs from the supplied formula. Current base data masks both differences because available equals on-hand and shrink is zero.

**Fix:** resolve one authoritative inventory snapshot per SKU; pass available, current, committed, and usable values explicitly. Use available for cover, usable for the reorder calculation, and the agreed current-stock basis for projection. If shrink is intended to reduce the projection opening balance, specify that adjustment separately and reconcile its label/formula rather than silently substituting variables. Add a case where available differs from on-hand.

### C2. A new promotion changes the “previous forecast” revenue line

**Locations:** [scenarioEngine.ts:121](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:121), especially lines 127–129; [forecastEngine.ts:44](/home/admin11/github-projects/ecommerce-scalesight/src/engine/forecastEngine.ts:44).

Previous forecast units are multiplied by the **current scenario's selling price**. Enabling Mango's 20% promotion moves the first portfolio previous-revenue point from **$71,018.7548 to $68,233.0460**, a **$2,785.7088 reduction** in the supposedly prior plan. The historical comparable-period growth denominator does remain unchanged; the defect is specifically the previous-forecast comparison series.

PDF §6 requires a meaningful current-versus-previous comparison. Repricing the previous plan under a new decision understates or distorts the change being explained. In addition, previous units are synthesized from current `baseUnits` and fixed ratios, rather than represented as an independently versioned reviewed plan.

**Fix:** retain a previous-plan series with its own units, effective prices, discounts, events, and returns assumptions. Current scenario controls must leave that series unchanged. A regression test should compare the entire prior series before/after promotion, demand, and event edits.

### C3. Lead-time scenarios preserve implausibly early planned replenishments

**Locations:** [inventoryEngine.ts:29](/home/admin11/github-projects/ecommerce-scalesight/src/engine/inventoryEngine.ts:29), lines 49–54; [kelarune.ts:214](/home/admin11/github-projects/ecommerce-scalesight/src/data/kelarune.ts:214).

Changing lead time shifts confirmed/delayed arrivals, but explicitly excludes existing **planned** orders. These unconfirmed orders nevertheless supply the projection and protect healthy-SKU outcomes.

**Reproduction:** Peach, 12-week lead time: `PLAN-8-0` remains ordered **September 21** and arriving **October 19**, a **4-week** interval. The selected plan reports no stockout and Watch while still benefiting from that unchanged arrival. This breaks the supply-dependency behavior required by PDF §10 and the state contract.

**Fix:** recompute unconfirmed replenishment dates from the effective lead time and order dates, or distinguish an explicitly locked exception from orders governed by the supplier assumption. Do not let an unchanged unconfirmed plan silently neutralize a lead-time stress test. For newly added orders, replace `Math.ceil(leadTimeWeeks) * 7` at lines 44/62 with a documented date calculation that respects half-week inputs; currently 3.5 weeks becomes 4 weeks.

### C4. Recommendation labels exist, but several conditions do not implement the specified rules

**Locations:** [recommendationEngine.ts:18](/home/admin11/github-projects/ecommerce-scalesight/src/engine/recommendationEngine.ts:18) and [inventoryEngine.ts:100](/home/admin11/github-projects/ecommerce-scalesight/src/engine/inventoryEngine.ts:100). Required rules: PDF §17.

| Rule | Actual behavior / evidence | Concrete correction |
|---|---|---|
| High Stockout Risk | Requires both the cover/stockout condition **and an in-horizon safety breach**. Lime with 4-week horizon and 12-week lead has 5.203 weeks cover against a 13-week requirement, but receives Watch and no High Stockout Risk recommendation. | Compute the lead-time coverage finding independently of display horizon; expose an additional in-horizon urgency indicator or evaluate through the required replenishment period. |
| Overstock Watch | Uses fixed `weeksOfCover > 10` and `sku.trend < 0`, rather than measuring decline in the event-adjusted forward series. Any confirmed BFCM context suppresses overstock regardless of event timing. Berry's base example works, but this is a static proxy for the required forward-demand condition. | Define target/excess thresholds as planning assumptions and evaluate actual forward demand and relevant event windows. Preserve the explicit analyst override. |
| Promotion Constraint | Lines 89–98 check whether **any single forecast week's demand exceeds current usable stock**. No active promotion is required and no promotion-window supply calculation occurs. Mango with stock 100, no events, and promotion off still receives Promotion Constraint. | Require an enabled/scheduled promotion; compare promotion-window demand with available supply for that window, including dated arrivals. |
| Forecast Review Required | Lines 74–75 take the last three array records; they do not establish date order or consecutive weekly periods. Over-plan observations on August 3, August 17, and September 7 trigger the claim “three consecutive weeks.” | Sort and validate period continuity, then count consecutive actual-versus-plan exceedances. |
| Replenishment Timing Risk | Lines 61–62 require a delayed order and breach before delayed arrival, but never compare against the original arrival. With Mango stock 500, original October 12 arrival and delayed October 19 arrival, breach is September 14 in both cases; the delay still generates this finding. | Compare original versus delayed supply trajectories and distinguish a delay-caused/worsened breach from an already-existing shortage. |

The horizon-dependent High risk policy is explicitly disclosed at [AssumptionTable.tsx:184](/home/admin11/github-projects/ecommerce-scalesight/src/components/AssumptionTable.tsx:184), so it is an acknowledged implementation choice, not hidden behavior. It still differs from the checklist's literal rule. The PDF also asks high-risk findings to reconcile with plotted shortages; a separate coverage finding and a sufficiently long analysis horizon would satisfy both concerns more clearly.

### C5. Decision copy can contradict the active calculation

**Locations:** [WeeklyBrief.tsx:26](/home/admin11/github-projects/ecommerce-scalesight/src/components/WeeklyBrief.tsx:26), lines 38–39, 84–86, 206–216; [recommendationEngine.ts:28](/home/admin11/github-projects/ecommerce-scalesight/src/engine/recommendationEngine.ts:28); [ScenarioView.tsx:102](/home/admin11/github-projects/ecommerce-scalesight/src/components/ScenarioView.tsx:102).

Verified examples:

- Portfolio Downside produces **$270,300 and −7.9% growth** in the rendered brief, while the analyst heading still says **“Growth is coming. Supply needs to keep up.”**
- At a 26-week horizon, Berry becomes High risk with **$62,000** current-stock exposure and **zero calculated excess units**. The priority still labels that amount **“Berry excess stock at cost”** and the change title still says purchasing needs a pause. The amount's meaning has changed under its fixed label.
- Adding 5,000 Mango purchase units increases portfolio committed/purchase cost from **$41,600 to $66,600** and supplies the trajectory on the scenario arrival date, but the recommendation still asks to review **630 additional units**. The first shortage legitimately remains unchanged because the purchase arrives too late; the advice does not acknowledge that quantity has already been added and timing is now the question.
- `comparePlans` returns `null` both when one stockout is absent and when both are absent. The scenario interpretation renders **“A stockout appears or clears…”** in either case, including an unchanged no-stockout base plan.

These are decision-integrity defects, not merely wording preferences: PDF §§5, 9–10, and 25 require the interpretation to follow the active plan without contradictions.

**Fix:** produce the brief's narrative, risk-cost label, action priorities, and stockout-change category as structured engine outputs. Distinguish excess cost from shortage exposure; distinguish both-clear, newly-at-risk, resolved, earlier, later, and unchanged stockout states. Keep the literal reorder-gap metric if required, but make purchasing advice account for scenario supply already added and the remaining timing shortfall.

### C6. Zero comparable sales produces infinite growth

**Location:** [scenarioEngine.ts:155](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:155), rendered through [formatters.ts:17](/home/admin11/github-projects/ecommerce-scalesight/src/engine/formatters.ts:17).

Setting the historical comparable period's revenue to zero gives `previous30 = 0` and `revenueGrowthPct = Infinity`. The percentage formatter then produces `+Infinity%`. Existing seeded data does not trigger this, and zero **SKU demand** is separately guarded, but the unguarded portfolio denominator violates the PDF §25 no-NaN/Infinity requirement under this explicit data boundary case.

**Fix:** return a typed unavailable comparison when comparable revenue is zero, render “No comparable sales,” and retain absolute revenue change. Do not invent a zero-percent growth rate. Test both zero/positive current revenue against a zero comparable period.

## 3. Completeness gaps

### G1. Weekly decisions are below the fold at both required sizes

[WeeklyBrief.tsx:112](/home/admin11/github-projects/ecommerce-scalesight/src/components/WeeklyBrief.tsx:112) places metrics before priorities; [PriorityCard.tsx:43](/home/admin11/github-projects/ecommerce-scalesight/src/components/PriorityCard.tsx:43) puts action/decision after the explanatory copy. The PDF permits top metrics before priorities; the failure is the audit checklist's explicit **above-fold decisions** requirement, not merely the presence of a metric row.

At **1440×900**, priority titles start around y=610, recommended actions at y=932–943, and all three CTAs at y=1123. At **1280×720**, titles start around y=592, actions at y=915–947, CTAs at y=1109. None of the recommended actions or priority CTAs is above the initial fold. There is no chart-first layout, but the actionable decision is still buried.

**Fix:** place a concise action and CTA at the top of each priority, with the complete four-field explanation underneath or expandable. Reduce introductory/card vertical space. Evidence: [1440 brief](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/brief-1440.png), [1280 brief](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/brief-1280.png), browser geometry results.

### G2. Revenue Forecast lacks the required comparisons and driver explanation

[ForecastViews.tsx:16](/home/admin11/github-projects/ecommerce-scalesight/src/components/ForecastViews.tsx:16) passes only future current/previous revenue to the chart. Browser legend inspection confirms exactly **Current forecast / Previous forecast**. There is no historical actual revenue series or separate base/upside/downside revenue series. Generic support for other series in `ForecastChart` does not supply missing revenue data.

The contributor list at lines 85–103 is genuinely calculated, but **“The assumptions behind the outlook”** at lines 107–135 explains general methodology rather than what changed for named driver SKUs. It lacks quantified current-versus-previous attribution. PDF §6 requires both the richer comparison and analyst interpretation tied to the drivers.

**Fix:** build historical and versioned scenario revenue series in the calculation layer; expose the required comparisons and selected-period forecast change. Generate explanation such as a named SKU's demand/price/event contribution and associated supply risk from the same deltas. The 30-day/13-week/6-month switches already work.

### G3. Demand event annotations exist, but the launch is placed on the wrong date

[ForecastViews.tsx:149](/home/admin11/github-projects/ecommerce-scalesight/src/components/ForecastViews.tsx:149) gives historical points no events, then annotates the first future week in which an active event-name list changes. [kelarune.ts:288](/home/admin11/github-projects/ecommerce-scalesight/src/data/kelarune.ts:288) dates Peach's launch to **July 20**; the chart plots **“Peach launch · Lime analog” on September 14**, the first forecast week, although July 20 is visible in its historical range. Only the first event name survives if several coincide.

All five event types are actually rendered on suitable SKUs: Starter promotion, Citrus BFCM, Peach launch, Orange supplier issue, and Passion paid-media expansion. Thus the finding is date fidelity and overlapping/historical-event coverage, not missing event rendering altogether. See [Peach screenshot](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/peach-launch-marker.png).

PDF §7 also calls for next-four/next-eight-week demand and explicit base/upside assumptions. The page instead shows first-week demand and total for the selected horizon. Its interpretation exists, but Mango's “three consecutive periods” statement is SKU-specific literal copy at line 209, rather than the actual review-rule output; there is no clearly titled, derived “Why The Forecast Changed” section.

**Fix:** join event start/end dates to the combined historical/future axis, support multiple events per week, and show the required summary windows and a calculated explanation. Add an explicit base series where the current scenario differs from base.

### G4. SKU Planning has a useful decision foundation, but missing decision inputs and plot detail

[SKUDetail.tsx:36](/home/admin11/github-projects/ecommerce-scalesight/src/components/SKUDetail.tsx:36) shows cover, required inventory, reorder gap, stockout week, a real trajectory, cash and orders. Its recommendation has meaningful selected-SKU numbers. However, the PDF §9 historical/forward demand, revenue contribution, margin contribution, and confidence are not brought together here; some exist on other pages or only in the model. The requested distinct **ScaleSight Analysis** and **Recommended Decision** sections are represented only partially by chart interpretation and a generic recommendation panel.

[InventoryProjectionChart.tsx:74](/home/admin11/github-projects/ecommerce-scalesight/src/components/InventoryProjectionChart.tsx:74) plots a zero line, PO markers, and a named safety breach. It does **not** plot a named stockout marker at `stockoutDate`; stockout is a metric and chart footnote only. Browser SVG labels are “PO” and “Safety breach.” The line visibly crosses zero, but the required stockout date must be inferred from the axis. [Screenshot](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/sku-planning-1280.png).

Only `recommendations[0]` is shown at line 73, which can hide a supplier/context finding behind the initial stock-risk recommendation. **Fix:** add the missing selected-SKU decision metrics and demand context; show the relevant analysis/decision explicitly; plot and label stockout separately; expose additional applicable recommendations.

### G5. BFCM scenario mode and durable SKU context are missing

**BFCM:** [ScenarioControls.tsx:19](/home/admin11/github-projects/ecommerce-scalesight/src/components/ScenarioControls.tsx:19) supplies demand, media, promotion/discount, lead time, incoming inventory, purchase quantity, and portfolio Base/Upside/Downside. There is **no BFCM control**. BFCM remains a fixed confirmed event in `kelarune.ts:244`; “Explore BFCM scenario” only selects Winter and opens the ordinary scenario page. PDF §10's BFCM mode is not implemented. Add a clearly scoped campaign scenario control with explicit assumptions; retain the formal `scenarioMode` enum unless extending the contract deliberately.

**State loss through context links:** [scenarioEngine.ts:203](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:203) resets every SKU-specific override on SKU selection. Browser reproduction: set Mango uplift to 20%, navigate through the Berry priority, return to Mango: uplift is **0%**. Same-SKU route navigation preserves state correctly. A note at `ScenarioControls.tsx:137` discloses fresh SKU tests, so this is deliberate behavior, but it falls short of “scenario edits remain active across routes until reset” and makes contextual exploration discard work. Preserve overrides per SKU or provide an explicit reset action separate from selection.

**Deep links:** [ui.tsx:65](/home/admin11/github-projects/ecommerce-scalesight/src/components/ui.tsx:65) encodes selection only in `onClick`, while `href` is the general route. Opening the Berry inventory link directly gives `/sku-planning` with **Mango selected**. Refresh/new-tab/shared links therefore lose the intended SKU. Berry's brief CTA also opens the general inventory list without a selected-row filter. Add a SKU query parameter or SKU route and initialize the selection from it; connect the inventory CTA to the relevant row/detail.

### G6. Intelligence Center substitutes one queue for the five required sections

[IntelligenceView.tsx:45](/home/admin11/github-projects/ecommerce-scalesight/src/components/IntelligenceView.tsx:45) renders All/Risk/Opportunity/Change filters and one queue. The requested **Needs Attention, Opportunities, Changes Since Last Week, Upcoming Risks, Recommended Actions** sections do not exist as populated sections; there is no upcoming-risk time grouping. The 13 base queue items are real rule outputs, and the human-context banner is substantive.

**Fix:** organize the existing outputs into the five required decision views, with real change baselines and upcoming event/breach dates. Keep the useful filters. Do not replace this with five headings over duplicated content.

### G7. Assumptions register is incomplete and loses multi-SKU event applicability

[kelarune.ts:309](/home/admin11/github-projects/ecommerce-scalesight/src/data/kelarune.ts:309) registers weekly baseline, lead time, safety stock, portfolio explanations, and event entries. It omits per-SKU **selling price, unit cost, explicit growth/trend rate**, and the supplier's original/revised arrival delta as structured assumptions required by PDF §13. The event entry uses only `event.skuIds[0]` at line 391: filtering Winter/Peach hides their BFCM event row, and filtering Travel hides its shared Starter promotion. Portfolio assumptions disappear from SKU-specific filters as well.

The table has source types, dates and reviewers, but uses **“ScaleSight planning team” / “Operations review”** instead of clearly showing the required **“Last Reviewed By: ScaleSight Analyst”** sign-off. Attribution to operations is useful; it should not replace the analyst-review field.

**Fix:** register every operative assumption with units, applicable SKUs, source, and analyst review. Preserve operational source ownership separately. Include global and multi-SKU assumptions when filtering a product, and clearly distinguish reviewed base values from active scenario overrides.

### G8. Managed Intelligence status is scripted, and the commercial CTA is only a preview

The operating-model visualization **passes** the core differentiator requirement; it does not need a wholesale rebuild. However, [ManagedWorkflow.tsx:180](/home/admin11/github-projects/ecommerce-scalesight/src/components/ManagedWorkflow.tsx:180) hardcodes timestamp, 7 changes, 3 priorities, and 4 actions. A footnote correctly says these describe the reviewed base brief, but there is no underlying published-review entity linking those counts to its changes/actions. The base intelligence queue contains 13 signals; the app does not identify which four constitute “Recommendations Prepared.” Do not simply replace this count with all signals; model the published review and derive counts from its selected items.

At [ManagedWorkflow.tsx:300](/home/admin11/github-projects/ecommerce-scalesight/src/components/ManagedWorkflow.tsx:300), **Book A Strategy Call** opens a `<details>` preview whose text explicitly says booking/contact submission are not connected. It does not reach a booking destination. PDF §24 and the final DoD require a working commercial next step. The prototype avoids pretending it booked anything, but the acceptance gap remains. Configure a real external booking/contact destination; no backend or email sending needs to be added.

### G9. Portfolio confidence, history provenance, and reuse are only partially modeled

- [scenarioEngine.ts:163](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:163) returns portfolio confidence as the literal **Moderate**. SKU confidence at line 110 is derived only from history length. The required base word appears, but the executive confidence is not calculated or read from a centrally reviewed confidence assessment. There is no percentage certainty violation. Use an explicit qualitative review record/rule with a reason that is shared by the brief and assumptions.
- [dataset.ts:14](/home/admin11/github-projects/ecommerce-scalesight/src/data/dataset.ts:14) generates 104 weeks per SKU with repeatable noise, trend and a November multiplier. There are **no explicit historical stockout periods** or linked historical promotion/campaign events; the only zero-sales history belongs to Peach before launch. PDF §15 requires those situations to be embedded. Add dated historical events and stockout-constrained observations, with consistent inventory/sales context.
- The reviewed baseline can legitimately be an analyst input in this deterministic V1, but it is **not calculated from history**: the same configured baseline feeds both forecast and synthetic history generation. The final SKU's demand and recent historical discount are calibrated to the executive fixture. These calibrations are disclosed and mathematically reconcile; they are not evidence of independent forecasting validity. Label their provenance as reviewed/calibrated inputs consistently.
- [scenarioEngine.ts:80](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:80) imports one global catalog, and the entities have no client linkage beyond the standalone `Client`. `AppShell.tsx:101` and priority copy contain the brand/SKU-specific presentation. PDF §18's client configuration/reuse boundary and documented public/prospect/pilot/partner modes are incomplete. Add a dataset/config boundary and document the four modes; do not implement excluded multitenant infrastructure.

### G10. Deployment/error handling acceptance is not demonstrated

The actual `src/app` tree has no app-level `error.tsx` or `global-error.tsx` providing the PDF p.47 friendly error boundary. Add a simple recoverable application error view. README explains how to deploy to Vercel, but the audit has no verified production/preview URL or branch-to-deployment evidence. Local prerendering and route success satisfy local build readiness, not the stable-public-URL requirement. Verify those deployment criteria separately before claiming the PDF's final DoD is complete.

### Route-by-route disposition

| Route | Verified content | Remaining gap |
|---|---|---|
| `/` | All five metrics; Mango/Berry/BFCM priorities with four fields and CTAs; changes section; no opening chart. `WeeklyBrief.tsx:112,141,172`. | G1 above fold; C5 scenario-sensitive narrative; G8 scripted review metadata. |
| `/revenue-forecast` | Working 30d/13w/6m selection; computed totals/contributors; adjacent explanation. `ForecastViews.tsx:18,38,75,90`. | C2 prior-plan repricing; G2 missing series and driver attribution. |
| `/demand-forecast` | SKU/horizon controls; historical actuals; current/prior forecasts; toggleable upside/downside; all event types; interpretation and calculation detail. `ForecastViews.tsx:146`. | G3 launch date, base comparison, summary windows and derived explanation. |
| `/inventory` | Urgency default, filters, icon/text statuses, linked SKU names, calculated fields. `InventoryHealthTable.tsx:15,26,85`. | C1 available input; G5 contextual URL; abbreviated recommendation lacks four fields (below). |
| `/sku-planning` | Real trajectory, safety/PO/breach, selected-SKU recommendation, cash/orders/events. `SKUDetail.tsx:36,59,72,98,143`. | C1/C3; G4 missing context and stockout marker. |
| `/scenario` | Shared calculations, input validation, base/current comparison, chart, immediate updates, atomic reset, illustrative notice. `ScenarioView.tsx:19,61,115`. | C3/C5; G5 BFCM and selection persistence. |
| `/intelligence` | Derived priority-sorted queue, four-field cards, real human override. `IntelligenceView.tsx:10,25,77`. | C4 conditions; G6 required section structure. |
| `/managed-intelligence` | Interactive five-step loop, six outcomes, six status fields, operating cycle, four-week pilot. `ManagedWorkflow.tsx:54,125,180,218,261`. | G8 modeled review counts and booking destination. |
| `/assumptions` | Source/reviewer table, filters, session assumptions, formulas, synthetic disclosure. `AssumptionTable.tsx:28,69,149`. | C1 formula discrepancy; G7 missing inputs/applicability/sign-off. |

**Four-field recommendation audit:** `RecommendationPanel.tsx:17` and `PriorityCard.tsx:43` render all four fields; `IntelligenceCard.tsx:17` reuses that panel. Demand/SKU/Scenario reuse it as well. **Exception:** [InventoryHealthTable.tsx:88](/home/admin11/github-projects/ecommerce-scalesight/src/components/InventoryHealthTable.tsx:88) renders only the action underneath the SKU name. This is reasonable compact table design, but fails the user's strict “every recommendation anywhere” checklist. Provide a row expansion/popover with all four fields, or clearly identify this as an action preview with an accessible full decision link. The entire row is not clickable; the SKU-name link is keyboard accessible and supplies the drill-down.

## 4. Minor/cosmetic issues

### M1. Token application is partial; typography still has very small labels

[globals.css:10](/home/admin11/github-projects/ecommerce-scalesight/src/app/globals.css:10) defines the requested palette. Canvas, sidebar, text, muted and border variables are actually used. However, `--bg-dark`, `--primary-blue`, `--accent-purple` and several status tokens are predominantly definitions rather than the source of component styling; charts hardcode colors in [ForecastChart.tsx:24](/home/admin11/github-projects/ecommerce-scalesight/src/components/ForecastChart.tsx:24) and `InventoryProjectionChart.tsx:23`. Replace duplicate literals with shared tokens. The rendered navy sidebar, blue actions, purple accents and white cards do match the intended visual family; this is not an unstyled default component system.

Small labels remain: `globals.css:161,1830,2345` uses 8px; chart event labels are 10px and axes 11px. These are hard to scan even though automated contrast/accessibility checks pass. Increase the smallest labels, particularly decision/chart annotations. Core body/input labels are readable and labeled.

### M2. Responsive chart resizing has a transient overflow and a timing-sensitive test

The original test failed at [smoke.spec.ts:38](/home/admin11/github-projects/ecommerce-scalesight/tests/browser/smoke.spec.ts:38), which asserts immediately after resizing. Independent browser probes measured **1355px document width at a 1280px viewport** briefly on Revenue, Demand and SKU Planning; after 450ms each settled to 1280. All nine pages fit at both desktop sizes after settling, and checked chart text stayed within SVG bounds. The isolated demand test passed.

**Fix:** contain chart layout during ResizeObserver updates (`ForecastChart.tsx:67`, `InventoryProjectionChart.tsx:40`, `globals.css:963`) and make the browser assertion wait for a stable layout using a retrying assertion. Do not describe the current evidence as a persistent desktop clipping failure or as a clean original suite run.

### M3. Domain literals in page/component files

Every route/component TSX file was scanned with `rg -n '[0-9]'`; numeric words and copy were also reviewed. Raw inventories: [components](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/component-numeric-literals.txt) and [route wrappers](/home/admin11/github-projects/ecommerce-scalesight/audit-evidence/route-numeric-literals.txt). The route-wrapper scan is empty. The following are the domain/configuration literals found; presentation dimensions, SVG sizes/colors, indexes, formatting precision and formula operators are not fabricated business data.

| File:line | Literal(s) / interpretation | Action |
|---|---|---|
| `ui.tsx:27` | `Week of Sep 14, 2026` | Read the planning date/client config. |
| `AppShell.tsx:167` | `Updated Sep 17 · 6:00 AM` | Read shared review metadata. |
| `WeeklyBrief.tsx:109,190,193,220` | `Monday, Sep 21`; `7 material changes`; `Oct 26`; `Sep 17, 2026` | Derive from review/event records; G8. |
| `WeeklyBrief.tsx:86,196` | “eight-week target” / eight-week launch history in prose | Bind to the actual target/history assumptions. |
| `ManagedWorkflow.tsx:182,184,185,186,187` | Timestamp, `7`, `3`, `4`, `Monday` | Model the published base review; G8. |
| `AssumptionTable.tsx:136` | Appends `2026` to every formatted review date | Format the year from `a.reviewedAt`; will mislabel a future year's data. |
| `ForecastViews.tsx:50` | `24 active SKUs` | Count active catalog rows. |
| `InventoryHealthTable.tsx:119` | `24 active SKUs`; `10 ... shown in detail` | Derive active/detailed totals. |
| `ForecastViews.tsx:78` | `2% returns assumption` | Read the engine's returns assumption, currently separately `RETURNS_RATE = 0.02`. |
| `ScenarioControls.tsx:71,72` | `+20%`, `−15%` mode descriptions | Share the mode constants used by `demandMultiplier`; currently matching duplicates. |
| `ScenarioControls.tsx:23–50,118–131` | 0–50, −20–50, 0–40, 2–12, half-week step, nonnegative integer quantities | Legitimate contract constraints, not hardcoded outputs; centralize to prevent drift. |
| `ui.tsx:81`; `ForecastViews.tsx:18,38,44,57,61,63,80`; `ScenarioView.tsx:25`; `WeeklyBrief.tsx:114,116` | Horizon enums and 30-day/8-week/13-week/6-month labels/conversions | Legitimate period definitions; share a period mapping. Numeric totals still come from engine outputs. |
| `ForecastViews.tsx:151,199,209,114` | 8 historical display points; “Eight weeks of history”; “three consecutive periods”; “first five weeks” | Display-window constant is fine; bind the history/condition/methodology claims to actual model data. |
| `ManagedWorkflow.tsx:264,273,278,283,288` | 30-Day Pilot; Week 1/2/3/4 | Legitimate fixed service-package content, not a computed business metric. Centralize if the offer becomes configurable. |

Other numeric expressions are rendering/configuration mechanics: priority ranks `1/2/3`, workflow step indexes `0–4`/cycle positions, six-contributor display limit, formula `0/1` constants, `number(...,1/2)` and `padStart(2,"0")`, chart thousands conversion, and markup/CSS dimensions. Their full locations remain in the scan; they do not constitute independent reconciliation violations. Hardcoded SKU identifiers in `WeeklyBrief.tsx:22–24,61,68,73,89`, `ForecastViews.tsx:208`, and CTA choice in `PriorityCard.tsx:62` also limit reuse even where the identifiers contain digits rather than numeric business values.

### M4. Dormant design exports contain prohibited certainty copy

The whole-repository search found these exact strings outside the active application:

| Location | Exact string |
|---|---|
| `stitch-assets/demand-forecast-2/screen.html:528` | `Confidence interval: ±95% range` |
| `stitch-assets/archive/demand-forecast-1/screen.html:353` | `Confidence interval: ±95% range` |
| `stitch-assets/planning-assumptions/screen.html:537` | `Commercial Outcome: 100% Fill Rate Guaranteed` |

They are not imported by `src/` or served as active route content. Therefore these are stale reference-asset violations, **not fabricated certainty observed in the live workspace**. Remove/correct them or prominently mark these exports superseded so future implementation does not reintroduce them. Search results that quote forbidden language as prohibitions in implementation instructions are not product claims.

## 5. Confirmed correct

### Canonical inventory rows reconcile through actual engine calls

The audit called `inventoryFor` with each real SKU, generated forecast, actual orders and base state, rather than comparing static table objects. Result data is retained in `engine-probes.json`.

| SKU | On hand | Weekly demand | Unrounded computed cover | Display cover | Lead | Incoming | Computed status |
|---|---:|---:|---:|---:|---:|---:|---|
| Mango Hydration 12-Pack | 2,400 | 705 | 3.404255319 | 3.4 | 5.0 | 1,200 | High risk |
| Berry Hydration 6-Pack | 6,200 | 473 | 13.107822410 | 13.1 | 4.0 | 0 | Overstock |
| Citrus Hydration 12-Pack | 3,150 | 610 | 5.163934426 | 5.2 | 5.0 | 1,800 | Watch |
| Lime Hydration 6-Pack | 4,100 | 788 | 5.203045685 | 5.2 | 3.5 | 1,500 | Healthy |
| Electrolyte Starter Kit | 1,480 | 246 | 6.016260163 | 6.0 | 4.0 | 600 | Healthy |

All five match PDF §4 within specified rounding. This confirms the base fixture, while C1 documents why it is insufficient for distinct available/committed stock.

### Executive arithmetic and shared model

`buildPlan(defaultState())` returns net 30-day revenue **$318,000**, prior comparable **$293,357.933579**, growth **8.4%**, inventory exposure **$42,000**, **3 High risk + 2 Watch = 5 requiring attention**, and **3 projected stockouts**. Exposure independently decomposes to Mango **$12,000** + Blood Orange **$3,200** + Passionfruit **$2,640** + Berry excess **$24,160**. Forecast confidence is the required **Moderate**, with its non-derived implementation separately flagged in G9.

The money/counts are aggregated at [scenarioEngine.ts:133](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:133), not injected into individual metric cards. The disclosed dataset calibration yields the requested fixture; it is not a per-component multiplier.

[PlanningContext.tsx:21](/home/admin11/github-projects/ecommerce-scalesight/src/context/PlanningContext.tsx:21) owns one reducer and memoized plan. Mango traces as follows:

| Screen | Same underlying output |
|---|---|
| Weekly Brief | `plan.rows.find(mango).inventory.weeksOfCover`, `WeeklyBrief.tsx:22,30` |
| Inventory Health | `plan.rows` → row inventory, `InventoryHealthTable.tsx:15,96` |
| SKU Planning | `plan.selected.inventory`, `SKUDetail.tsx:18–20,39` |
| Scenario Planning | `plan.selected.inventory`, with a separately derived base for comparison, `ScenarioView.tsx:16–30` |

No component independently divides stock by demand for these four views.

### Mango scenario reconciliation: source and browser

| Measure | Base | Mango +20% demand | Portfolio Upside |
|---|---:|---:|---:|
| Net 30-day portfolio revenue | $318,000 | $332,212.80 | $381,600 |
| Mango weekly units | 705 | 846 | 846 |
| Mango cover | 3.404255 | 2.836879 | 2.836879 |
| Mango safety breach week | Sep 28 | Sep 21 | Sep 21 |
| Mango stockout week | Oct 5 | Sep 28 | Sep 28 |
| Mango required inventory | 4,230 | 5,076 | 5,076 |
| Mango reorder gap | 630 | 1,476 | 1,476 |
| High-risk SKUs | 3 | 3 | 5 |
| Projected stockouts | 3 | 3 | 4 |

Mango-only revenue increase is exactly `705 × 20% × $24 × 98% × 30/7 = $14,212.80`. Browser navigation showed **2.8 weeks** in Brief, Inventory and SKU Planning, **846 units / 5,076 required / 1,476 gap** in Scenario, and the revised recommendation to review **1,476 units**. The same stockout date appears in the metric and underlying first nonpositive chart point.

Portfolio Upside changes all SKU demand by +20%, so its revenue rises proportionally by +20%, risk count rises **3→5**, and Mango stockout advances **7 days**. That is a coherent comparable shift to PDF §10's illustrative $420K→$486K / 2→5 / 11-day example; those illustration numbers are not required canonical fixtures. Weekly resolution correctly avoids inventing an 11-day movement.

Additional direct control checks: +25% ad spend yields Mango **789.6 units**, **3.039514 cover**, and **$326,527.68** portfolio revenue under the documented diminishing-response assumption. Lead time 7 weeks yields **5,640 required / 2,040 gap**. Incoming zero yields **1,830 gap**. These latter supply controls correctly do not change unconstrained demand revenue or today's available-stock cover. Purchase timing/recommendation caveats are C3/C5.

**Specification ambiguity:** the state appendix says incoming inventory affects “cover,” but the literal cover formula uses available inventory only. This audit prioritizes the explicit formula: dated incoming changes future projection, reorder gap, and cash; it should not silently inflate today's cover. Similarly, a purchase alone should not create unconstrained revenue. “Updates together” means all dependent views recompute coherently, not that every numeric field must change for every control.

### Literal formula audit

| PDF formula | Actual implementation | Result |
|---|---|---|
| Available / weekly demand | `inventoryEngine.ts:68` uses usable inventory | **Fail C1**; matches only under current base equivalence. |
| Current × (1 − shrink) | `inventoryEngine.ts:67` | Correct usable-stock formula; production caller fixes shrink at 0. |
| Weekly demand × lead weeks | `inventoryEngine.ts:70` | Correct, including fractional demand/lead arithmetic. Arrival-date rounding is separately C3. |
| Weekly demand × safety weeks | `inventoryEngine.ts:69`; projected threshold uses each week's units at line 88 | Correct. |
| Lead-time demand + safety stock | `inventoryEngine.ts:71` | Correct. |
| max(0, required − usable − incoming) | `inventoryEngine.ts:72` | Correct literal formula. Purchase-aware advice is separately C5. |
| Current + arrived supply − cumulative demand | `inventoryEngine.ts:76–84` | Dated-arrival recurrence correct; opening variable differs under shrink, **C1**. |
| First projected week ≤ 0 | `inventoryEngine.ts:97` | Correct week-start label for an end-of-week balance; absence returns null. Stockout annotation is G4. |
| Units × effective price, discounts/mix/promo/returns | `forecastEngine.ts:43–47` | Current revenue correct: discounts change effective SKU price, mix comes from SKU aggregation, and 2% returns are applied. Previous comparison is **C2**. |

The 30-day chart helper prorates the fifth week's two days; independent summation equals the executive 30-day total. Promotions affect demand, selling price and margin. Purchases alter dated supply and cost without manufacturing sales. Existing trajectory/stress assertions verify finite baseline outputs and first-nonpositive stockout dates; they do not cover the counterexamples in §2.

### State contract and interaction validation

Definitions: [entities.ts:95](/home/admin11/github-projects/ecommerce-scalesight/src/data/entities.ts:95). Defaults/clamps: [scenarioEngine.ts:12](/home/admin11/github-projects/ecommerce-scalesight/src/engine/scenarioEngine.ts:12). UI constraints: [ScenarioControls.tsx:19](/home/admin11/github-projects/ecommerce-scalesight/src/components/ScenarioControls.tsx:19), `ui.tsx:77`.

| State key | Default verified | Enforcement / result |
|---|---|---|
| `selectedSkuId: string` | `mango-12` | Unknown ID falls back, but validation checks existence, **not active status**. Counterfactual inactive Berry is still accepted. Selector offers 10 detailed SKUs; engine includes all 24, without an active filter. Fix for the active-ID contract and reuse. |
| `forecastHorizon` | `13` | Typed union and sanitizer enforce `4/8/13/26`; working pressed-state buttons. |
| `scenarioMode` | `base` | Typed union/select/sanitizer enforce `base/upside/downside`. |
| `demandUpliftPct` | `0` | UI 0–50; sanitizer clamps; 51 becomes 50; non-finite becomes 0. |
| `adSpendChangePct` | `0` | UI −20–50; sanitizer clamps; −21 becomes −20. |
| `promotionEnabled` | `false` | Checkbox and boolean conversion; discount input disabled when off. |
| `promotionDiscountPct` | `0` | UI 0–40; sanitizer clamps; 41 becomes 40. |
| `leadTimeWeeks` | Selected SKU base; Mango 5 | UI 2–12 in 0.5 steps; sanitizer clamps; 99 becomes 12. |
| `incomingInventory` | Committed/delayed SKU orders; Mango 1,200 | UI minimum 0 and integer step; sanitizer clamps/rounds. Additional undocumented upper cap is 10,000,000. |
| `purchaseQuantity` | `0` | UI minimum 0 and integer step; sanitizer clamps/rounds (1.6→2), same 10,000,000 cap. |

The numeric state ranges are enforced in both inputs and the reducer path, not merely declared in TypeScript. The supplied browser scenario test changed multiple controls, navigated to SKU Planning, verified persistence, returned and reset all inputs. The independent reducer check compared the entire reset object with `defaultState()`: SKU, horizon, mode, uplift, spend, promotion flag/discount, lead, incoming, purchase all reset atomically. Normal same-SKU route navigation also passed the independent +20% trace. SKU-switch/deep-link limitations are G5; reload intentionally starts base and is disclosed.

### Managed-intelligence principle and human judgment are materially implemented

Browser interaction opened all five tabs in [ManagedWorkflow.tsx:54](/home/admin11/github-projects/ecommerce-scalesight/src/components/ManagedWorkflow.tsx:54): **Monitor → Analyze → Prioritize → Recommend → Review**. Each exposes distinct substantive analyst/team activity and a “What you receive” outcome. Connecting arrows and a return-to-monitoring explanation make it a genuine stepper/loop, not a prose paragraph. Keyboard arrow navigation is implemented.

All six service/outcome pairings at `ManagedWorkflow.tsx:125` were read and visually checked: demand visibility→earlier purchasing; stockout detection→protected revenue; overstock identification→less tied-up cash; scenarios→understand commitments; weekly priorities→management attention; recommendations plus analyst guidance→contextual decisions. All six status fields and the Data Refresh→Planning System→Analyst Review→Weekly Intelligence→Planning Review→Business Decision cycle exist. The pilot has substantive week-by-week deliverables. G8 concerns provenance and conversion, not absence of these structures.

The required human override is backed by `recommendationEngine.ts:47` and visibly rendered at [IntelligenceView.tsx:25](/home/admin11/github-projects/ecommerce-scalesight/src/components/IntelligenceView.tsx:25): Winter's declining history suggests an inventory cut, but the confirmed BFCM event changes the decision to retain the buffer and validate campaign volume. Independent source and rendered-browser checks passed. This explicit spec requirement is **not missing**.

### Design, accessibility, interpretation and exclusions

- **Demo disclosure:** [AppShell.tsx:169](/home/admin11/github-projects/ecommerce-scalesight/src/components/AppShell.tsx:169) persistently renders Demo Data with the exact faithful tooltip: “This is a fictional ecommerce brand using synthetic data to demonstrate the ScaleSight planning workflow.” Existing interaction tests verified it. Scenario has its own always-visible illustrative notice (`ScenarioView.tsx:61`), and the shell labels active scenarios across routes (`AppShell.tsx:181`).
- **Risk labeling:** [RiskBadge.tsx:3](/home/admin11/github-projects/ecommerce-scalesight/src/components/RiskBadge.tsx:3) pairs text with distinct icons for High risk, Watch, Overstock, Healthy; tables and priority/detail/scenario cards reuse it. Charts label projected/safety/PO lines and safety breach; risk meaning is not communicated solely by badge color. The unlabeled zero line/missing named stockout marker is G4, rather than a claim that all risk labeling fails.
- **Keyboard and labels:** scenario inputs have visible labels; measured focused demand slider outline was **3px solid rgb(59,130,246)**. All nine existing axe WCAG 2 A/AA and 2.1 AA checks passed with no reported violations; Inter loaded. Inventory drill-down uses keyboard-accessible links. Mobile-navigation focus trapping/Escape is implemented and its existing test passed. These checks do not prove exhaustive accessibility; small labels remain M1.
- **Chart interpretation:** Revenue has adjacent revenue-method/supply-risk prose (`ForecastViews.tsx:76`); Demand has adjacent source/change explanation (`:207`); SKU trajectory has a selected-plan explanation (`SKUDetail.tsx:64`); Scenario has a comparison interpretation (`ScenarioView.tsx:102`) and its inventory chart has the reusable explanatory footnote (`InventoryProjectionChart.tsx:124`). No active chart was found entirely without adjacent explanatory content; accuracy/thinness findings remain C5/G2/G3.
- **No live certainty fabrication:** source/copy search plus rendered pages found no active “AI score,” ML-predicted claim, confidence percentage, or fabricated forecast accuracy. Active labels are qualitative Low/Moderate. Percentage growth, uplift, discounts, and returns are explicitly economic assumptions. Dormant violations are listed precisely in M4.
- **Finite baseline data:** all supplied catalog/scenario stress combinations completed without NaN/Infinity. An independent zero-demand SKU yields finite cover 0 and no projected stockout with positive stock. That avoids arithmetic failure but is semantically weak: show “No consumption / cover not applicable” instead of `0 weeks / Watch`. Zero comparable sales is the separate C6 failure.
- **V1 exclusions:** read the route tree, imports, package dependencies, data/context/engine code, and whole-repository scope search. The active app has no login/authentication, registration, billing/payment flow, backend/database calls, live Shopify/ERP integration, AI chatbot, email sending, or mobile packaging. Its data stays local and synthetic. Framework/static-asset requests are not business-backend integration. Archived design exports and instruction text do not establish live functionality. No excluded integration was exercised or added by this audit.

## 6. Final verdict

**This feels like a managed planning intelligence environment.** It has concrete four-part recommendations tied to purchasing decisions, a visible example where analyst context overrides a history-only action, and a substantive interactive operating model with outcomes and recurring review. Those are real differentiators beyond a collection of charts.

**Overall alignment: substantial structural alignment, but not acceptance-ready or ship-ready against the supplied V1 specification.** The base fixture and the central model are credible; they do not justify the earlier broad acceptance claim. Available inventory is ignored, prior revenue forecasts can rewrite themselves, lead-time scenarios preserve impossible planned arrivals, and several deterministic rules/advice paths fail under changed inputs. The required comparison content, BFCM control, above-fold decisions, durable SKU context, and working commercial destination also remain incomplete.

Resolve C1–C6 first and add regression cases for their specific counterexamples. Then complete the missing route content and context behavior, derive review/status/assumption content from shared records, and verify the real deployment and booking destination. Preserve the existing managed-intelligence loop and human-judgment example: those parts already serve the product principle well.
