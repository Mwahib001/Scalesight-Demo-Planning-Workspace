# Kelarune V1 acceptance record

This record supersedes the previous brand's audit. The active implementation is under `src/`.

Final verification: production build and TypeScript passed; ESLint and `git diff --check` passed; all engine fixtures and 288 stress combinations passed; all 24 Playwright tests passed, including the nine route-level accessibility audits. Automated accessibility checks reported no violations in the tested views.

## Engine reconciliation

The executable fixtures in `tests/planning.test.ts` verify:

- Base net 30-day revenue: **$318,000**, with **+8.4%** versus the calibrated historical comparable period.
- Exposed stock cost: **$42,000**; **3** high-risk and **2** Watch SKUs; **3** stockouts in the default 13-week horizon.
- Canonical covers and statuses for Mango, Berry, Citrus, Lime, and Starter Kit.
- Seeded repeatability for 24 active SKUs and 10 detailed SKUs.
- Historical row revenue equals units × price × (1 − discount).
- Every high-risk row has a plotted safety breach; every stockout date equals the first nonpositive projection point.
- Every projection point reconciles prior stock + arrivals − demand.
- Delayed Blood Orange supply changes stockout timing versus its original arrival.
- Confirmed BFCM context overrides the Winter Discovery Kit history-only inventory cut.
- Scenario date differences use exactly the plotted week dates.
- Purchases change dated inventory and capital without changing unconstrained demand revenue.
- Promotions change unit demand, selling price, and margin.
- Reset restores the entire state through a single reducer action.
- Recursive finite-number checks across 288 SKU/horizon/mode stress combinations; zero-demand behavior and invalid input sanitization.

## Browser acceptance coverage

`tests/browser/smoke.spec.ts` checks all nine primary routes, direct refresh, active navigation, console errors, and horizontal overflow at 1440×900, 1280×720, and 390×844. It also exercises the canonical brief, exact priority destinations, shared scenario propagation, atomic reset, inventory filters and keyboard drill-down, the human-context recommendation, workflow tabs, assumptions, chart legend toggles, Demo Data tooltip, and mobile navigation.

`tests/browser/audit.spec.ts` audits the nine routes with axe WCAG 2 A/AA and 2.1 AA checks and verifies that the local Inter font loads.

Screenshots and failure traces are produced under ignored `test-results/`; they are verification artifacts, not production assets.

## Explicit interpretation boundaries

Risk cost is exposed stock cost, not promised savings or lost revenue. Revenue is an unconstrained demand outlook. Planned future replenishments are unconfirmed and labeled. Stockout dates have weekly precision. Scenario outputs are illustrative. Analyst review names and status dates are scripted synthetic examples. The strategy-call control previews the pilot conversation; it does not submit contact details or create a booking.

See `README.md` for the model assumptions and the five-minute demo walkthrough.
