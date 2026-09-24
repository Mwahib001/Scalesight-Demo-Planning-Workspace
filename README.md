# ScaleSight · Kelarune Planning Workspace

A fictional, interactive demonstration of **Planning System + Ongoing Analysis + Recommendations + Strategic Guidance**. Built in the existing Next.js App Router project with TypeScript, Tailwind, Recharts, Lucide, and React Context. No backend or authentication. Strategy calls use a live Calendly booking widget.

## Run and verify

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

`pnpm build` runs the engine fixture tests before the production build. Build and development use Next.js’s supported webpack compiler because this workspace blocks Turbopack’s CSS worker from binding its local port. All application routes are prerendered static pages. Deploy the repository to Vercel with the Next.js preset; set `NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/kazmiarmanmehdi/30min` before building. Restart development or rebuild after changing this public booking URL. Playwright uses an existing Chrome installation or its installed Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed. Browser tests start the production app on port 3100, so build first.

## One calculation layer

```text
src/data/entities.ts         Typed source model and scenario contract
src/data/dataset.ts          Seeded generator and date helpers
src/data/kelarune.ts         Canonical data, orders, events, and assumptions
src/engine/forecastEngine.ts SKU demand and net revenue
src/engine/inventoryEngine.ts Dated inventory, cover, safety, cash, and risk
src/engine/scenarioEngine.ts Shared portfolio plan, reducer, and comparison
src/engine/recommendationEngine.ts Deterministic four-part recommendations
src/context/PlanningContext.tsx Shared in-session state
src/components/             Read-only consumers and input controls
src/app/                    Nine primary routes + legacy redirects
```

There are 24 active SKUs, 10 detailed SKUs, and 104 seeded historical weekly observations per SKU. Peach has eight weeks of post-launch observations; earlier periods are explicitly zero. The review date is September 17, 2026, with planning beginning September 14.

The base fixtures reconcile to $318,000 net 30-day revenue, +8.4% versus the previous comparable period, $42,000 stock cost at risk, three high-risk SKUs, two Watch SKUs, and three stockouts over 13 weeks. Berry overstock is reviewed separately from the five supply-attention SKUs.

## Modeling decisions

- SKU baselines are reviewed planning inputs. The first five weeks retain those baselines; subsequent weeks add configured trend and seasonality. Confirmed events apply during their scheduled weeks.
- The final portfolio SKU's fractional expected weekly demand calibrates the synthetic catalog to the requested revenue fixture. A comparable-period discount calibrates historical net revenue to the required +8.4% comparison. Historical revenue still equals units × list price × (1 − discount). Both calibrations are disclosed in the assumptions register.
- Revenue is unconstrained demand revenue after the larger of event/scenario discounts and a 2% returns allowance. It is not promised shipped revenue. Margin is net revenue minus product unit costs; it excludes media, shipping, and overhead.
- Previous forecast units, prices and returns are captured in the frozen synthetic review in `src/data/reviewedPlan.ts`. Current promotions, prices and scenario controls do not reprice that review. This is a seeded demo review, not a production forecasting archive. Zero comparable sales produces an unavailable growth comparison, never an infinite percentage.
- Cover uses available stock from the latest inventory snapshot on or before the planning date. Usable stock is snapshot on-hand × (1 − shrink); the reorder-gap formula uses usable stock, while the literal inventory projection starts at snapshot on-hand. Available, usable and on-hand are distinct inputs. Confirmed/delayed incoming orders contribute to the projection in their arrival week. Separately labeled, unconfirmed planned replenishments support the longer-term healthy-SKU plan and are explicitly conditional.
- Weekly projections show end-of-week net stock. Negative values represent unmet demand. Stockout dates are week commencements, not invented day-level precision. Comparisons use exactly these chart dates.
- High risk requires inadequate cover or a stockout, plus a safety breach within the selected horizon. Inadequate cover outside that horizon is Watch. Declining overstock means more than ten weeks of cover and an ending forecast below the first week's demand, with excess measured above an eight-week target. Confirmed upcoming BFCM context prevents an automatic stock cut for Winter Discovery Kit.
- Risk value is current stock cost for high-risk SKUs plus excess stock cost for declining overstock. The base consists of Mango $12,000 + Blood Orange $3,200 + Passionfruit $2,640 + Berry $24,160. It is not a lost-revenue estimate.
- Incoming and scenario purchases contribute to committed working capital; unconfirmed routine replenishment plans are excluded. Lead-time edits shift all existing arrivals, including planned replenishments, by the corresponding day delta. Original supplier arrival dates shift with them to preserve the actual delay interval. New order arrivals round lead time to the nearest day, not the next whole week.
- Purchase advice accounts for quantities already added to the scenario and distinguishes the remaining quantity requirement from a late-arrival problem. Supplier-delay findings compare the actual trajectory with the original-arrival counterfactual. Promotion constraints require an active campaign or enabled scenario promotion and compare cumulative demand with available stock plus confirmed arrivals; unconfirmed plans do not count as confirmed campaign supply. Forecast-review findings require three chronologically consecutive over-plan weeks.
- Upside/downside modes apply portfolio-wide. The remaining controls apply only to the selected SKU. Selecting a different SKU starts a fresh SKU test, retaining the horizon and mode. Route navigation preserves state. Reloading starts a clean base plan. Reset is one reducer action restoring all fields, including Mango and the 13-week horizon.
- Paid media uses elasticity 0.6 with diminishing factor `1 / (1 + abs(change) / 100)`. Promotion demand elasticity is 0.8. Scenario controls clamp non-finite and out-of-range input.
- Confidence is qualitative. The static service-status strip represents the reviewed base operating cycle; the intelligence queue updates dynamically with the active scenario.

## Five-minute demo walkthrough

1. **Weekly Planning Brief:** identify Mango availability, Berry excess cash, and BFCM preparation. Read the action and decision on each card.
2. **SKU Planning:** open Mango. Reconcile 2,400 on hand, 705 weekly demand, 3.4 weeks of cover, the safety breach, and the stockout week with the chart and PO schedule.
3. **Demand Forecast:** inspect actual versus previous/current forecasts. Toggle the legend and change the shared horizon. Explain the three consecutive forecast misses.
4. **Inventory Health:** filter High risk, then Overstock. Open Blood Orange to compare the delayed arrival with the original date. Open Berry to connect stock to cash exposure.
5. **Scenario Planning:** increase Mango demand, add a purchase, change lead time, and observe units → revenue → inventory → cash → recommendation. Navigate to the brief to confirm shared values. Reset to Base Plan.
6. **Intelligence Center:** filter Opportunity. Explain why confirmed BFCM context overrides the history-only Winter Kit inventory cut.
7. **Managed Intelligence:** step through Monitor → Analyze → Prioritize → Recommend → Review. Review the operating cycle and the 30-Day Planning Pilot.
8. **Planning Assumptions:** inspect source types, reviewers, event assumptions, and current scenario inputs. Use Revenue Forecast to compare 30 days, 13 weeks, and six months.

## Demo boundaries

All data and analyst-review identities are synthetic. No orders, ad changes, or messages are submitted by the planning demo. The strategy-call button opens a live Calendly popup; visitors can complete a real booking there. If the widget script fails, a direct booking link is shown. Existing `/forecast`, `/customer-growth`, `/partnership`, and `/advisor-brief` links redirect into the new workspace.

`tests/planning.test.ts` covers reconciliation, deterministic generation, forecast and inventory math, supplier delays, context overrides, exact chart-date comparisons, atomic reset, and 288 SKU/horizon/mode stress combinations. Browser tests cover the nine routes, 1440/1280/mobile layouts, shared scenarios, filtering, keyboard use, chart controls, tooltips, workflow steps, and automated accessibility checks.
