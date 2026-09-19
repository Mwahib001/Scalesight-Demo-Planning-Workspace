# Kelarune V1 remediation and verification record

Verified **20 September 2026** after fixing the four reported model/advice problems. This replaces the earlier acceptance summary. The full [implementation audit](IMPLEMENTATION_AUDIT.md) remains the historical record of the wider specification review; passing the checks below does not close every completeness finding in that report.

## Resolved problems

| Problem | Corrected behavior | Regression evidence |
|---|---|---|
| Available inventory ignored | The plan resolves the latest inventory snapshot on or before the planning date. Cover uses available stock; usable stock and projection use their specified, distinct on-hand bases. The inventory table and SKU decision page read the resolved values. | Mango with 2,400 on hand and 1,200 available now has **1.702128 weeks** cover. With 10% shrink, usable stock is **2,160**, while available cover remains **3.404255** and the first on-hand projection is **1,695**. |
| Promotions rewrote previous forecasts | A frozen, versioned synthetic review stores its own units, prices, returns and revenue. Demand and revenue views both use that review for the previous series. Current scenarios cannot reprice it. | The full previous units/revenue series remains identical under promotions, uplift, media changes, portfolio mode, lead time, incoming inventory, purchases, and changed current price. |
| Lead-time scenarios retained early planned supply | Edits move confirmed, delayed **and planned** arrivals. Original supplier dates move by the same delta, preserving the delay interval. New orders round to a day rather than a whole week. | Peach at 12-week lead moves `PLAN-8-0` from **October 19 to December 14**, introduces a stockout, and leaves source orders unchanged. Shorter leads and half-week inputs are also covered. |
| Recommendations contradicted the active plan | Purchase advice deducts quantities already added and explains remaining timing risk. Revenue narrative, Berry action/exposure labels and stockout comparisons follow active results. | A 5,000-unit Mango purchase is acknowledged; advice says no further quantity is needed for the lead-time requirement and calls for expediting. Downside says **“Demand is softening.”** Berry's 26-week **$62,000** exposure is labeled shortage exposure, not excess stock. No-stockout comparisons no longer say a stockout appeared or cleared. |

Related recommendation repairs:

- Promotion constraints require a confirmed campaign or enabled scenario promotion. They compare cumulative demand with available stock plus confirmed arrivals, accounting for demand already served. Unconfirmed planned supply does not count as confirmed campaign supply.
- Supplier timing findings compare against an original-arrival counterfactual and require an earlier or newly appearing breach/stockout; an unrelated pre-existing shortage does not produce the finding.
- Forecast-review findings sort history and require three consecutive over-plan weekly dates. Demand/brief interpretation consumes this rule output.
- Overstock evaluates ending forward demand against the initial forecast rather than relying solely on a static trend flag. Expired BFCM context does not suppress the inventory finding.
- Zero comparable sales returns an unavailable growth comparison, rendered as **“No comparable sales”**, instead of infinity. Inactive catalog entries are excluded from plan aggregation and cannot pass selected-SKU validation.

## Actual verification results

| Command | Result |
|---|---|
| `pnpm test` | Passed: existing fixture assertions, **288 stress combinations**, and **13 named audit regression groups**. This remains one executable Node assertion program. |
| `pnpm lint` | Passed, exit 0. |
| `pnpm build` | Passed, including a fresh engine-test run, production compilation, TypeScript and static page generation. |
| `node_modules/.bin/playwright test --reporter=list` | **27 passed, 0 failed** in 59.2 seconds, including all nine route-level axe accessibility cases and three new browser regression tests. |
| `git diff --check` | Passed. |

Browser regressions in `tests/browser/planning-regressions.spec.ts` verify purchase-aware advice across Scenario/SKU Planning, downside and long-horizon Berry copy, and Peach's shifted order date and resulting stockout. Existing route checks exercise 1440×900, 1280×720 and 390×844. Resize assertions now retry until chart layout settles rather than reading stale ResizeObserver geometry immediately after a viewport change.

Engine regressions in `tests/planning.test.ts` directly exercise available/on-hand differences, shrink, immutable prior comparisons, planned-order timing, fractional lead times, false promotion/delay findings, nonconsecutive history, purchase advice, narrative categories, zero sales and inactive IDs.

## Canonical figures preserved

- Net 30-day revenue: **$318,000**, **+8.4%** against the comparable historical period.
- Inventory at risk: **$42,000**; **3 High risk + 2 Watch = 5 supply-attention SKUs**.
- Projected stockouts: **3** over the default 13-week horizon.
- Canonical Mango/Berry/Citrus/Lime/Starter covers and statuses remain unchanged.
- Seeded history, atomic reset, scenario propagation, plotted stockout dates and the visible Winter/BFCM human-judgment example still pass.

## Remaining specification boundaries

This change addresses the reported calculation and recommendation defects. The broader audit's missing revenue comparison series, BFCM control, above-fold decisions, durable SKU links/state, intelligence sections, assumption coverage, booking destination and deployment verification are not closed by these results.

The disclosed risk policy is retained: **High risk requires a plotted in-horizon breach; insufficient current cover without that breach remains Watch.** This preserves the canonical Citrus Watch fixture and plotted-evidence requirement, but still differs from the specification's unconditional coverage-only High Stockout Risk rule. That discrepancy remains explicitly recorded in audit C4.

Revenue remains an unconstrained demand outlook, not guaranteed shipments. Projections use weekly end-of-week balances; planned replenishments remain unconfirmed. The previous forecast is a frozen synthetic demo review, not a production forecast archive. Scenario purchases do not place orders. The strategy-call control still previews the conversation and does not create a booking. No deployment or external action was performed.
