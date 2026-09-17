# Blockify x ScaleSight — Managed Commerce Intelligence

A fictional Northstar Commerce (Shopify Plus) demo built with Next.js App Router, TypeScript, React Context, Tailwind and Recharts. Everything is deterministic, local demo data. No auth, database, payment flow, external analyst API or live commerce integration is included. The partnership is explicitly proposed.

Deployment is left to the project owner. No hosting project or deployment configuration has been changed.

## Run locally

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`. All seven pages are statically prerendered and support direct requests and hard refreshes.

| Route                   | View                           |
| ----------------------- | ------------------------------ |
| `/`                     | Executive Intelligence Brief   |
| `/forecast`             | Demand Forecast                |
| `/inventory`            | Inventory & Purchasing         |
| `/scenario`             | Scenario Planning              |
| `/customer-growth`      | Customer & Growth Intelligence |
| `/managed-intelligence` | Managed Intelligence           |
| `/partnership`          | Proposed Partnership + Pilot   |

The retired `/advisor-brief` and `/assumptions` URLs redirect to the new brief and operating model. No old story remains in visible content. Metadata and robots disallow indexing. The favicon is a generic chart mark, not a partner logo. Inter is served from a committed local variable-font file, with a system sans fallback and no external font request.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`build` runs all unit/invariant tests before Next.js. Tests use Node's built-in test runner after a separate TypeScript compilation; no application data is sent over a network. Playwright starts the production server on port 3100. It uses `/usr/bin/google-chrome` when available, or Playwright's Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another existing compatible browser. Browser installation is not required if system Chrome is available.

The browser suite covers seven direct-refresh routes, navigation, empty states, shared selection, scenario controls, session persistence, analyst responses, drawer focus/Escape, partnership framing, 1440/1280/tablet/mobile viewports and 125% CSS zoom. Screenshots go into ignored `test-results/`. CSS zoom is a layout stress check; it is not a substitute for checking every browser's native zoom behavior.

## Data and calculations

- `data/planning.ts`: frozen source records, 12 authored + 130 generated SKUs, 24 PO records, 18 events, at least four committed versions for each authored SKU and a current forecast for all SKUs. The pure history generator produces 104 weekly observations per SKU per channel, with a fixed seed, bounded noise, trend, seasonality and named events. Channel forecasts are not committed; the forecast view explicitly shows an empty state for those filters.
- `lib/calculations.ts`: shared stock, receipt eligibility, risk, scenario, forecast refresh, MAPE and customer definitions. Incoming receipts are added once at the specified weekly boundary, after consumption to that boundary. A late receipt cannot erase an earlier stockout. Promotions only affect weeks 2–3; ad-spend elasticity exists only for SKU-104 / Online Store.
- `lib/selectors.ts`: derived catalog and customer KPI summaries and fixture validation. The catalog reconciles to revenue of 6.8M, inventory cost of 1.10M, 142 SKUs, demand-weighted cover of 8.2, seven high-risk SKUs, excess exposure of 126K, assessed risk of 184K and five weekly PO decisions.
- `components/workspace-context.tsx`: shared selection and validated scenario inputs in React Context. Session storage keeps filters, draft assumptions and an explicitly applied brief note across reloads within the same tab. Invalid storage is ignored. No local storage or backend persistence.
- `lib/analyst.ts`: five pure deterministic responses. Temporary demand scenarios do not mutate saved inputs. Unmatched input returns the prescribed fallback.

Generated tail stock and unit costs are calibrated to the specified catalog totals. In-stock rate is a weighted availability-check metric (9,400 of 10,000 checks), not a rounded count of the 142 SKUs. Risk valuation is an authored assessment of exposed quantities; it does not value every unit in a high-risk SKU as exposed. Source record costs retain precision; presentation rounds money.

Customers/orders use the permitted aggregated equivalent: 18,000 customers, 40,000 completed orders, 6,912 repeat customers, 6.8M TTM net revenue, 1.7M quarter-to-date revenue and 795,600 repeat revenue. The 90-day headline is a committed expected estimate. The source comparison contains a 9,000-customer mature subset acquired March–May; the retention heatmap includes 18,000 acquisitions March–August. Segment lifetime estimates are a separate measure from 90-day value. Refunds/cancellations do not contribute to completed revenue. Reorder group dates represent committed aggregates. No real client data is used.

## Brief ambiguities resolved

The follow-up audit supplies the ten exact inventory rows and four exact backtest observations; these now replace the initial authored placeholders. Exact workflow activity/output text, pilot exit evidence and Atlas interpretation copy are still referenced but not attached. See [AUDIT_REPORT.md](AUDIT_REPORT.md) for all 112 checks and unresolved conflicts.

The scenario figures in the prose are internally inconsistent with its explicit automated fixture. The committed reconciliation fixture takes precedence:

- 1,050 × (8 + 1.33) = 9,796.5, displayed as 9,800 to the nearest 50.
- 1,312.5 × (8 + 1.33) = 12,245.625. The supplied raw fixture truncates to 12,245; the displayed requirement rounds up to 12,250.
- 12,245 − 9,800 = 2,445 raw gap. An explicit 1,000-unit contingency, 600-unit pack and 1,200-unit MOQ produce 3,600 recommended units. Total allowance above raw need is 1,155.
- 3,600 × 7.50 = 27,000. Both values come from the same function and are asserted literally in tests.

This example is clearly separated from the live selected-SKU model, which retains unrounded math. The conflicting 13,400 requirement and 7.2/5.1-week stockout claims are not presented as calculated outputs: their necessary opening-stock and receipt assumptions were not supplied. Live stockout values come from the actual projection.

The Atlas safety-stock breach is about 2.57 weeks from the planning date (week 3), about 3.43 weeks before its 6-week replenishment. Stockout occurs at about 3.77 weeks, about 2.23 weeks before replenishment. The UI distinguishes those thresholds rather than describing the latter as a safety breach.

The audit supplies 910/1,025; 940/1,145; 960/1,210; and 980/1,108 (prior forecast / actual) for Aug 17/24/31 and Sep 7. These now join to explicit forecast versions issued before each actual week. They produce **15.3% MAPE** using actual denominators, and **18.4% mean absolute variance versus prior forecast** using prior denominators. The UI and tests distinguish these measures. The checklist's request for 18.4% MAPE from these same raw rows is inconsistent; it remains explicitly unresolved in the audit report.

The executive Nova “Watch” is the authored weekly decision priority around campaign persistence. With the supplied numeric rows and 1.2-week safety defaults, the pure inventory rules produce High for Nova and Orbit and Watch for Transit. The audit reference requests Watch / Watch / Healthy respectively. The report records that conflict rather than hardcoding lower risk labels.

## Seven-minute walkthrough

1. Executive brief: discuss availability, excess working capital and campaign uncertainty.
2. Forecast: review Atlas history, the prior/base plan, event assumptions and demo backtest.
3. Inventory: open Atlas and inspect the 3,879-unit unrounded gap and receipt timing.
4. Scenario: vary assumptions, inspect rounded purchasing/cash impacts and apply a labeled session note.
5. Customer: inspect cohort size, repeat revenue, source associations and the overdue retention group.
6. Managed intelligence: explain the six-step reviewed operating process and merchant-specific discovery.
7. Partnership: discuss proposed structures and evidence required at each pilot gate.

The audit adds local Inter font loading checks, route-specific metadata, keyboard-operable chart legends and event markers, completed-order/window selectors, small-sample guards, and axe accessibility scans. `pnpm test:e2e` runs the original smoke suite plus `tests/browser/audit.spec.ts`.
