# Codex Implementation Prompt — Alias Planning Intelligence Workspace

Paste this entire document to Codex as your task prompt (or save it in the repo, e.g. as `CODEX_TASK.md`, and tell Codex: "Read CODEX_TASK.md fully, then implement it"). It is self-contained, but also tells Codex which other files in the repo to read first.

---

## 0. BEFORE YOU WRITE ANY CODE

1. Run `ls -R` (or equivalent) on the existing project to see what's already scaffolded. **Do not re-scaffold or overwrite existing config** (package.json, tsconfig, tailwind.config, next.config) unless something is missing or broken — this project already exists with dependencies installed.
2. Read, in this order:
   - `design-reference/Alias_Advising_x_ScaleSight_Demo_Specification.pdf` (or the equivalent `.md` transcript if present) — this is the master product/technical spec. Treat it as the ultimate source of truth for **content, behavior, calculations, and business rules**.
   - `design-reference/design-system.json` — Stitch's generated design tokens. Treat it as the source of truth for **exact pixel/hex/spacing values**, reconciled with the PDF below in Section 2.
   - `design-reference/stitch-export/README.md` — manifest of the 9 generated screens + which route each maps to.
   - The `screen.html` + `screenshot.png` in each `design-reference/stitch-export/<folder>/` — use these as the **visual/layout reference** for each screen. Recreate their layout and spacing intent as real React/Tailwind components — do not just iframe or copy-paste the raw Stitch HTML, since it's static and unstyled by our actual token system in places, and contains no real state/interactivity.
3. Do not ask me clarifying questions before starting — every ambiguity you'd hit is resolved below. If you find a genuine contradiction not covered here, pick the interpretation that matches the PDF (it's the governing document) and leave a `// NOTE:` comment explaining the call.

---

## 1. CRITICAL — DUPLICATE SCREEN EXPORTS

The Stitch export contains **two versions each** of `demand-forecast` and `alias-advisor-brief` (`-1` and `-2` suffixes) because the design prompts for those two screens were corrected mid-project after the first generation was found to be missing required content. **Do not assume the higher number is automatically correct — verify by content, not by filename.**

**Resolution rule — content wins over layout:**
- For **Demand Forecast**: open both `demand-forecast-1/screen.html` and `demand-forecast-2/screen.html`. Whichever one contains a "Why the Citrus forecast changed" section with these four bullets is the complete one:
  - "Recent velocity increased."
  - "Wholesale orders exceeded plan."
  - "Seasonal demand remains supportive."
  - "No known production constraint appears in the historical data."
  Use that version's layout. If **neither** version contains this section, use whichever has the better/cleaner layout and **add the missing section yourself** — it is a required part of the spec (PDF page 11, "Screen 2B").
- For **Alias Advisor Brief**: open both `alias-advisor-brief-1/screen.html` and `alias-advisor-brief-2/screen.html`. Whichever one contains **both** of the following is the complete one:
  1. The tagline "Prepared for this week's client planning conversation." directly under the page title.
  2. The full sentence "Forecast refresh, inventory-risk review, scenario analysis and analyst commentary are maintained continuously so Alias can focus on client strategy and operational decisions." following the "PREPARED THROUGH SCALESIGHT MANAGED INTELLIGENCE" line.
  Use that version's layout. If neither has both, use the better layout and add the missing text — required per PDF page 16–17.
- **Regardless of which HTML file you pick for layout**, the actual rendered copy on both final pages (`/forecast` and `/advisor-brief`) must match the **Copy Manifest in Section 9** of this document exactly — that manifest is the single source of truth for text content, not either Stitch export. If a chosen HTML file's copy differs even slightly from Section 9, Section 9 wins.
- After implementation, delete or archive the unused `-1`/`-2` reference folder so there's no ambiguity for future contributors (move it to `design-reference/archive/` — don't delete the historical record, just get it out of the active reference path).

---

## 2. DESIGN TOKENS — RECONCILED SOURCE OF TRUTH

`design-system.json` contains **two different color systems**. Only one of them is correct for this brand:

- ✅ **USE**: the prose color descriptions and the `overridePrimaryColor` / `overrideSecondaryColor` / `overrideTertiaryColor` / `overrideNeutralColor` fields, plus the explicit hex values named in the `styleGuidelines` text (Primary Navy `#10233F`, Interactive Blue `#2563EB`, Intelligence Teal `#0F9D8A`, Canvas Base `#F6F8FB`, Surface `#FFFFFF`, Structural Stroke `#E4E9F0`, Text Primary `#162033`, Text Secondary `#667085`, High Risk `#DC3545`, Caution `#E5A000`, Healthy `#2E9B62`, Overstock `#475569`). These match the original PDF spec's color table exactly (PDF page 24), with Overstock as a reasonable Stitch-added extension the PDF left unspecified.
- ❌ **DO NOT USE**: the `theme.namedColors` block (the one with keys like `primary`, `secondary`, `tertiary`, `surface_container_*`, values like `#000d23`, `#0051d5`, `#00110d`). This is Stitch's auto-generated Material-3 theming scaffold and **does not match the intended brand palette** — if you wire your Tailwind theme to these values instead of the ones above, every screen will render in the wrong colors (near-black primary instead of navy, wrong blue, near-black teal, etc). Ignore this block entirely.

### Final color tokens (add to `tailwind.config` theme.extend.colors)
```
primary-navy:   #10233F   // headings, high-contrast UI, Actual data series
primary-blue:   #2563EB   // primary buttons/actions, Base forecast series, focus rings
teal:           #0F9D8A   // positive insight, Upside series
canvas:         #F6F8FB   // app background
surface:        #FFFFFF   // card/table/drawer surfaces
border:         #E4E9F0   // all dividers, card outlines, table lines
text-primary:   #162033   // body copy, metrics, table rows
text-secondary: #667085   // metadata, axis labels, helper text
danger:         #DC3545   // High risk
danger-text:    #DC3545
warning:        #E5A000   // Watch/Caution dot
warning-text:   #A16207   // Watch/Caution label text (not the same as the dot color)
success:        #2E9B62   // Healthy dot
success-text:   #166534   // Healthy label text
overstock:      #475569   // Overstock dot
overstock-text: #334155   // Overstock label text
```
Status pill backgrounds: use the dot color at low opacity via Tailwind's `/` opacity syntax — e.g. `bg-[#DC3545]/[0.08]` for High Risk, `bg-[#E5A000]/[0.10]` for Caution, `bg-[#2E9B62]/[0.08]` for Healthy, `bg-[#475569]/[0.08]` for Overstock. Every pill pairs the dot/tint with an explicit text label — never color alone.

### Typography (add as Tailwind fontSize keys or a small CSS utility layer)
| Token | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `headline-h1` | 32px | 700 | 40px | -0.025em | Top-level page titles |
| `headline-h2` | 24px | 650 | 32px | -0.015em | Major section headers |
| `headline-h3` | 18px | 600 | 24px | -0.01em | Card/section titles |
| `body-default` | 14px | 400 | 20px | — | Body copy |
| `body-medium` | 14px | 500 | 20px | — | Emphasized body copy |
| `table-cell` | 13px | 400 | 18px | — | Table cell text |
| `label-caps` | 11px | 600 | 14px | +0.04em, uppercase | Nav group headers, table sort headers, badge titles |
| `metadata-sm` | 12px | 500 | 16px | — | Metric labels, timestamps, captions |
| `display-metric` | 32px | 700 | 38px | -0.02em | Large KPI numbers |

Font: Inter everywhere. Apply `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) to **every** table, metric tile, KPI, and chart tooltip — non-negotiable, prevents digit jitter.

### Layout & spacing
- Sidebar: fixed **240px**
- Top header bar: fixed **68px**
- Main content max-width: **1280px**, page gutters **24px** (`space-lg`)
- Grid: 12 columns, **20px** gutters (`gutter` token)
- Card internal padding: **16px** (`space-md`) for module padding, **24px** (`space-lg`) between major card divisions, **4px** (`space-xs`) for metric tag spacing, **8px** (`space-sm`) for title-to-subtitle spacing
- Card radius: **14px**. Buttons/inputs radius: **8px**. Status pills: full pill (`9999px`). Checkboxes: **4px**.

### Elevation (use as exact box-shadow values, not generic Tailwind shadow-md/lg)
- Level 1 (cards): `0 1px 3px rgba(16, 35, 63, 0.04)` + 1px solid border `#E4E9F0`
- Level 2 (dropdowns/menus): `0 4px 12px rgba(16, 35, 63, 0.08)` + 1px solid border `#E4E9F0`
- Level 3 (drawers/overlays): `-4px 0 24px rgba(16, 35, 63, 0.12)`, rendered over a scrim of `#10233F` at 24% opacity
- Never use full-width heavy shadows to separate sections inside a card — use a 1px `#E4E9F0` hairline rule instead.

### Buttons
- **Primary**: bg `#2563EB`, text white, `font-weight:500`, radius 8px, height 36px. Hover `#1D4ED8`. Active `#1E40AF`. Focus-visible: 2px ring `#2563EB` with 2px white offset.
- **Secondary**: bg white, 1px border `#E4E9F0`, text `#162033`. Hover: bg `#F6F8FB`, border `#CBD5E1`.
- **Tertiary**: transparent bg, text `#667085`. Hover: text `#10233F`.

### Form inputs
Height 36px, bg white, 1px border `#E4E9F0`, radius 8px, padding `0 12px`, font-size 14px. Focus: border `#2563EB` + external box-shadow `0 0 0 3px rgba(37, 99, 235, 0.12)`.

### Charts (Recharts)
- Actual: solid, `#10233F`, stroke-width 2.5
- Base forecast: solid, `#2563EB`, stroke-width 2 (visually dominant)
- Upside: fine line or filled area, `#0F9D8A`, stroke-width 1.5
- Conservative: dashed, `#667085`, `stroke-dasharray="4 4"`
- Gridlines: horizontal only, `#E4E9F0`, 1px, no vertical grid noise
- No animation that delays reading the chart during a live screen share (`isAnimationActive={false}` or a very short duration on Recharts components)

---

## 3. TECH STACK (already installed — do not change)
Next.js (App Router) + TypeScript + Tailwind CSS + Recharts + Lucide icons + React Context/hooks for state. shadcn/ui optional for accessible primitives (drawer, tooltip, switch, slider). No Redux, no backend, no auth, no database.

---

## 4. ROUTES (Information Architecture)

| Route | Screen | Stitch export folder |
|---|---|---|
| `/` | Weekly Planning Brief | `weekly-planning-brief` |
| `/forecast` | Demand Forecast | `demand-forecast-1` **or** `demand-forecast-2` — resolve per Section 1 |
| `/inventory` | Inventory Planning (+ detail drawer) | `inventory-planning` |
| `/scenario` | Scenario Planning | `scenario-planning` |
| `/advisor-brief` | Alias Advisor Brief | `alias-advisor-brief-1` **or** `alias-advisor-brief-2` — resolve per Section 1 |
| `/managed-intelligence` | Managed Planning Cycle | `managed-planning-cycle` |
| `/assumptions` | Planning Assumptions | `planning-assumptions` |

Persistent across navigation: `selectedClient` (fixed to Harbor Coast Beverages), `selectedSku` (shared by Forecast/Inventory/Scenario), scenario input values, and the fixed planning week (Sep 7–13, 2026). Browser refresh on any route must succeed with no dead-end state. "Generate Weekly Brief" CTA on `/` routes directly to `/advisor-brief`.

---

## 5. GLOBAL APP SHELL

- **Sidebar** (240px fixed, collapses to icon rail/drawer below ~1024px): "Alias Advising" wordmark, subtitle "Planning intelligence managed by ScaleSight". Nav groups: **Overview** (Weekly Planning Brief) · **Planning** (Demand Forecast, Inventory Planning, Scenario Planning) · **Advisor** (Alias Advisor Brief) · **Managed Service** (Planning Cycle, Assumptions). Active route gets a highlighted state (left accent bar or tinted background); inactive items in `text-secondary`.
- **Header** (68px fixed): left — "Harbor Coast Beverages" bold + "RTD Beverage | Demo Account" muted. Right — "Planning Week: Sep 7–13, 2026", "Intelligence refreshed 2 hours ago" (static demo string), "Alias Advisor View" badge.
- **Demo badge**: small "DEMO DATA" pill, always visible. Tooltip/title text on hover: "Harbor Coast is fictional and used only to demonstrate the Alias × ScaleSight workflow."
- Icons: Lucide, line-style only.
- Avoid entirely: neon, glassmorphism, gradients, glowing "AI" motifs, robot/sparkle icons, dense cluttered widgets, dark mode, mobile-first layout assumptions.

---

## 6. DATA MODEL (TypeScript — put in `/data` and `/lib/types.ts`)

```typescript
type Risk = "high" | "watch" | "healthy" | "overstock";

interface Client { id: string; name: string; category: string; accountLabel: string; }

interface Sku {
  id: string;
  name: string;
  channelMix: string;
  currentInventory: number;
  baseWeeklyDemand: number;
  leadTimeWeeks: number;
  safetyStockWeeks: number;
  shrinkRate: number;
}

interface WeeklyActual { weekStart: string; skuId: string; units: number; planUnits: number; channel: string; eventId?: string; }

interface ForecastPoint { weekStart: string; skuId: string; baseUnits: number; conservativeUnits: number; upsideUnits: number; }

interface ProductionOrder { id: string; skuId: string; units: number; expectedWeek: string; status: string; }

interface BusinessEvent { id: string; skuId: string; type: string; startWeek: string; endWeek: string; upliftRate: number; label: string; confirmed: boolean; }

interface PlanningAssumption { skuId: string; key: string; value: string; sourceType: "historical" | "confirmed_event" | "operational_input" | "analyst_judgment"; reviewedAt: string; reviewedBy: string; }

interface AdvisorItem { skuId: string; priority: number; whatChanged: string; whyItMatters: string; recommendation: string; decisionRequired: string; monitorNext: string; }

interface ScenarioInput {
  skuId: string;
  growthRate: number;       // clamp 0–0.50
  leadTimeWeeks: number;    // clamp 4–10
  shrinkRate: number;       // clamp 0–0.08
  promotionEnabled: boolean;
  distributorEnabled: boolean;
  incomingUnits: number;    // non-negative
}
```

Six SKUs, ~78 weekly points each (18 months), render ~52 on default chart view, 16-week forecast horizon. Use a fixed seed / committed arrays so the demo is repeatable — never `Math.random()` without a seed. Keep source data immutable; all scenario outputs are derived.

**Per-SKU baseline values to encode** (from the PDF's canonical dataset):

| SKU | Stock | Weekly demand | Lead time | Incoming | Risk |
|---|---|---|---|---|---|
| Citrus Vodka Soda | 4,800 | 1,140 | 5w | 0 | High |
| Lime Vodka Soda | 7,200 | 920 | 5w | 1,500 | Healthy |
| Berry Vodka Soda | 10,300 | 930 | 5w | 0 | Watch |
| Variety 8-Pack | 3,700 | 1,030 | 6w | 1,000 | High |
| Variety 12-Pack | 8,100 | 1,050 | 5w | 1,200 | Healthy |
| Seasonal Summer Pack | 6,900 | 650 | 5w | 0 | Overstock |

---

## 7. CALCULATION LOGIC (`/lib/calculations.ts` — deterministic, full precision, round only for display)

```
weeksOfCover        = currentInventory / forecastWeeklyDemand
adjustedDemand       = baseForecast × (1 + scenarioGrowthRate)     // total uplift over base, not compounding
usableInventory      = currentInventory × (1 – shrinkRate)
leadTimeDemand        = adjustedWeeklyDemand × leadTimeWeeks
safetyStock           = adjustedWeeklyDemand × safetyStockWeeks
requiredInventory     = leadTimeDemand + safetyStock
reorderGap            = max(0, requiredInventory – usableInventory – incomingInventory)
stockoutWeeks         = usableInventory / adjustedWeeklyDemand
```

Rules:
- Guard divide-by-zero/invalid demand → render "Not available", never `NaN`/`Infinity`.
- Scenario growth is the **total** uplift over base weekly demand (does not compound with itself).
- Promotion uplift applies **only inside its configured window** — do not let it compound indefinitely.
- Distributor-launch toggle adds launch uplift for Berry and flips the recommendation copy from "reduce" to "maintain / reassess."
- Incoming production applies on its scheduled week in the projection chart and reduces the reorder gap — never subtract it twice.
- All monetary outputs (e.g. capital impact) must render with a visible "Illustrative estimate" label next to the number, every time, no exceptions.

**Risk classification:**
- High: usable cover < lead time + safety-stock weeks, or a projected breach occurs before replenishment.
- Watch: within ~1.5 weeks of threshold, or a material business event changes the recommendation.
- Healthy: coverage clears lead time + safety stock, no active exception.
- Overstock: coverage materially exceeds the demand horizon while forward demand is declining.

---

## 8. STATE & INTERACTION CONTRACT (React Context)

| State key | Type | Notes |
|---|---|---|
| `selectedClient` | string | fixed to `harbor-coast` |
| `selectedSku` | string | default `citrus-vodka-soda` |
| `growthRate` | number | clamp 0–0.50, default 0.25 |
| `leadTimeWeeks` | number | clamp 4–10, default 5 |
| `shrinkRate` | number | clamp 0–0.08, default 0.02 |
| `promotionEnabled` | boolean | default false (Citrus) |
| `distributorEnabled` | boolean | default true for Berry context, false for Citrus |
| `incomingUnits` | number | non-negative integer, default 0 for Citrus |
| `scenarioSummary` | derived string | optional, feeds the Advisor Brief's "scenario considered" line |

Required interaction matrix:
- Select SKU → updates chart, summary cards, assumptions panel, inventory detail, and control defaults everywhere.
- Change growth/lead time/shrink → recalculates scenario metrics, risk badge, recommendation copy, and the projection chart live.
- Toggle promotion/distributor event → updates the forecast window and the context-aware recommendation text.
- Edit incoming stock → updates inventory projection, reorder gap, and status.
- Navigating between screens preserves the selected SKU and active scenario for the session (Context, not per-page local state).
- "Reset" on Scenario Planning restores the selected SKU's defaults only — no hidden global mutations.

---

## 9. COPY MANIFEST (exact strings — this section overrides anything different found in the Stitch HTML exports)

### `/` — Weekly Planning Brief
H1 "Weekly Planning Brief", subtitle "The decisions that require attention this week."

**Priority 1 — Citrus Vodka Soda** (HIGH RISK) — "Projected stockout before next production cycle"
- Current inventory 4,800 units — Less cover than the production lead time
- Forecast weekly demand 1,140 units — 18% above recent plan
- Weeks of cover 4.2 weeks — Below 5-week lead time
- Recommended action: Increase next run by ~1,800 units — Confirm production capacity this week
- Advisor note: "Demand has remained above plan for three consecutive weeks. Current inventory no longer covers the expected production lead time."
- CTA: "Review Inventory Plan"

**Priority 2 — Berry Vodka Soda** (WATCH) — "Distributor launch changes the historical signal"
- "10,300 units | 11.1 weeks cover | –17% recent demand variance | distributor launch in 4 weeks"
- "Do not reduce production yet. Maintain the current plan until early distributor demand becomes visible."
- CTA: "View Analyst Review"

**Priority 3 — Variety 8-Pack** (ACTION) — "Promotion may constrain inventory"
- "Promotion starts in 3 weeks | expected uplift +25% to +35% | current cover 3.6 weeks | lead time 6 weeks"
- "Secure additional component inventory before activating full campaign spend."
- CTA: "Run Scenario"

Weekly context row: "SKUs at risk: 2 (Citrus + Variety 8-Pack)" · "Healthy SKUs: 3 (Lime, Variety 12-Pack + monitored Berry)" · "Overstock watch: 1 (Seasonal Summer Pack)" · "Decisions this week: 3 (Production, launch, promotion)". Caption: "6 active SKUs | 18 months history | 2 incoming production orders"

"What changed since last week" table:
| SKU | Change | Interpretation |
|---|---|---|
| Citrus Vodka Soda | Actual demand +18% vs plan | Growth is persisting beyond the prior forecast range. |
| Berry Vodka Soda | Actual demand –17% vs plan | Weak historical signal, but launch prevents immediate production reduction. |
| Variety 8-Pack | Promotion confirmed: Sep 28 | Future demand assumption increased. |

Rules: cards are entirely clickable and route with SKU preselected; risk labels always pair color with text/icon; tabular numerals on all metrics; **no chart on this page** — decision-first, meaning-first before any chart appears anywhere on this screen.

### `/forecast` — Demand Forecast
H1 "Demand Forecast", subtitle "Forward demand by SKU with scenario-based planning." SKU dropdown default Citrus Vodka Soda, six SKUs. ~52 history points + 16-week forecast horizon. Series: Actual/Base/Conservative/Upside.

Metrics: Next 4 Weeks 4,560 units · Next 8 Weeks 9,480 units · Base Growth +12.4% ("planning assumption") · Upside Scenario +27.5% ("not a promise") · Confidence "Moderate" (qualitative — never a fabricated percentage).

Companion text: "Recent sales momentum is persistent enough to raise the base demand assumption. Inventory coverage should therefore be evaluated against the revised demand range rather than the previous flat-growth plan."

Scenario tabs: Conservative +3% · Base +12% (default) · Growth +25% · Promotion +40% (temporary, window-only). Required note: "ScaleSight uses scenario planning to support decisions rather than relying on a single 'perfect' forecast."

**"Why the Citrus forecast changed"** (this is the section that was missing from one of the two Stitch exports — confirm it's present, add it if not):
- Recent velocity increased.
- Wholesale orders exceeded plan.
- Seasonal demand remains supportive.
- No known production constraint appears in the historical data.

### `/inventory` — Inventory Planning + drawer
H1 "Inventory Planning", subtitle "Forward inventory coverage, replenishment risk and recommended action." Table sorted by urgency (High first):

| SKU | Stock | Weekly | Cover | Lead | Incoming | Risk | Action |
|---|---|---|---|---|---|---|---|
| Citrus Vodka Soda | 4,800 | 1,140 | 4.2w | 5w | 0 | High | Increase production |
| Variety 8-Pack | 3,700 | 1,030 | 3.6w | 6w | 1,000 | High | Increase production |
| Berry Vodka Soda | 10,300 | 930 | 11.1w | 5w | 0 | Watch | Maintain / reassess |
| Lime Vodka Soda | 7,200 | 920 | 7.8w | 5w | 1,500 | Healthy | Hold |
| Variety 12-Pack | 8,100 | 1,050 | 7.7w | 5w | 1,200 | Healthy | Hold |
| Seasonal Summer Pack | 6,900 | 650 | 10.6w | 5w | 0 | Overstock | Reduce future production |

Drawer (Citrus example): Current inventory 4,800 units · Forecast consumption 1,140/week · Incoming production 0 · Safety stock target 1,300 · Lead time 5 weeks · Safety-stock breach Oct 5, 2026 · Stockout Oct 14, 2026 · Confirm production this week · Illustrative additional production 1,800–2,200 units. Qualifier: "Quantity is illustrative and should be validated against production constraints, minimum run sizes and working-capital limits." Selected SKU must survive navigation to Scenario Planning.

### `/scenario` — Scenario Planning
H1 "Scenario Planning", subtitle "Test how growth and operational changes affect inventory decisions." Controls: Demand uplift 0–50% (default 25%), Lead time 4–10w (default 5), Shrink 0–8% (default 2%), Promotion toggle (off), Distributor launch toggle (off for Citrus / on for Berry), Incoming production 0–50,000 (default 0).

Citrus @ +25%: Current stockout 4.2w ("base estimate") · Scenario stockout 2.9w ("risk accelerates") · Required production +2,400 ("illustrative units") · Safety coverage "At risk" ("below threshold") · Capital impact +$18,600 ("Illustrative estimate" — always visible). Recommendation: "Confirm additional production before increasing demand-generation activity beyond the current base plan."

Comparison table:
| Metric | Current | +15% | +25% | +40% |
|---|---|---|---|---|
| Weekly demand | 1,140 | 1,311 | 1,425 | 1,596 |
| Usable weeks cover | 4.1 | 3.6 | 3.3 | 2.9 |
| Safety breach | Oct 5 | Sep 28 | Sep 22 | Sep 16 |
| Projected stockout | Oct 14 | Oct 6 | Sep 30 | Sep 24 |
| Required production | 1,800 | 2,050 | 2,400 | 3,100 |
| Risk level | High | High | High | Critical |

### `/advisor-brief` — Alias Advisor Brief
Title "Alias Advisor Brief". **Tagline directly under the title** (the piece that was missing from one Stitch export — confirm present): "Prepared for this week's client planning conversation." Then "Harbor Coast Beverages | Planning Week: Sep 7–13, 2026". Export PDF button optional.

What Changed:
- Citrus Vodka Soda: "Sales ran 18% above the prior plan for the third consecutive week."
- Berry Vodka Soda: "Sales remain below plan, but the distributor launch scheduled in four weeks materially changes the production decision."
- Variety 8-Pack: "Campaign timing is now confirmed and creates additional inventory exposure."

Why It Matters:
- Citrus: Inventory coverage is now shorter than production lead time.
- Berry: Reducing production purely from historical demand could leave the brand underprepared for the distributor launch.
- Variety: Campaign-driven demand could reduce available stock before replacement inventory arrives.

Recommended Alias Discussion:
- Citrus — Confirm additional production this week.
- Berry — Maintain production through launch and reassess after early sales data.
- Variety — Align campaign activation with component and finished-goods availability.

Client Decisions Required (checkboxes): Approve Citrus production adjustment · Confirm distributor launch assumptions · Confirm Variety promotion timing · Update supplier lead-time estimate.

Monitor Next Week: Citrus wholesale velocity · Berry distributor pre-orders · Variety promotion inventory allocation · Seasonal Summer Pack sell-through.

**Footer attribution (the sentence that was missing from one Stitch export — confirm present, small/subtle/gray, NOT prominent):** heading "PREPARED THROUGH SCALESIGHT MANAGED INTELLIGENCE" followed by "Forecast refresh, inventory-risk review, scenario analysis and analyst commentary are maintained continuously so Alias can focus on client strategy and operational decisions." Alias branding stays visually dominant on this page; ScaleSight attribution stays subtle. Do not expose internal formula labels here. Print-friendly (optional `window.print()` export); print view must exclude navigation.

### `/managed-intelligence` — Managed Planning Cycle
H1 "Managed Planning Cycle", subtitle "What ScaleSight operates every week behind the scenes."

5-step flow: 1) Data Refresh → Current planning inputs · 2) Planning System → Exceptions and forward view · 3) Analyst Review → Judgment-adjusted interpretation · 4) Advisor Brief → Meeting-ready brief · 5) Alias Advisory → Client conversation and action.

Two equal-weight panels:
- "ScaleSight handles recurring workload": Weekly data refresh, Forecast maintenance, Forecast-vs-actual review, Inventory coverage monitoring, Stockout and overstock detection, Scenario and promotion updates, Lead-time and shrink assumptions, Replenishment calculations, Exception detection, Weekly advisor brief, Analyst commentary.
- "Alias stays the trusted advisor": Client ownership, Beverage and manufacturing expertise, Operational strategy, Client meetings, Business context, Final recommendations, Executive relationship.

Never imply ScaleSight replaces Adam or Ryan — panels must read as complementary equals.

### `/assumptions` — Planning Assumptions
H1 "Planning Assumptions", subtitle "The business context currently informing the planning model." "Last reviewed by: ScaleSight Analyst | Sep 9, 2026"

| SKU | Assumption | Value |
|---|---|---|
| Citrus Vodka Soda | Growth / lead time / shrink / safety stock | +12% / 5 weeks / 2% / 1.2 weeks |
| Berry Vodka Soda | Growth / distributor launch / launch uplift | –5% / Oct 12, 2026 / +30% |
| Variety 8-Pack | Promotion / uplift / lead time | Sep 28, 2026 / +30% / 6 weeks |

Berry human-judgment demonstration:
- Without event context: "Recent demand softness and 11.1 weeks cover would point toward reducing production."
- With distributor launch: "Maintain the production plan until early launch demand becomes visible, then reassess. The business event materially changes the recommendation."

---

## 10. LANGUAGE RULES (enforce across every screen and every commit)
**Use**: managed intelligence, planning intelligence, scenario-based, analyst-reviewed, decision support, planning assumption, operational risk, forward view.
**Never use anywhere in the UI**: "AI-powered", "autonomous", "magic", "perfect forecast", "predictive certainty", "guaranteed", "real-time", "black-box scoring", or any confidence language more precise than Low/Moderate/High (no fabricated statistical accuracy percentages).

---

## 11. BUILD BOUNDARIES — DO NOT BUILD
Login, registration, payment, live Shopify/ERP/API connections, real client data ingestion, an AI chatbot, multi-tenant backend, database infrastructure, permissions system, email sending, or a production-grade forecasting engine. This is a static, deterministic, fictional-data prototype only.

---

## 12. DEFINITION OF DONE — self-check before you consider the task complete

- [ ] All 7 routes load directly (hard refresh) with zero console errors.
- [ ] Typecheck, lint, and production build all pass clean.
- [ ] Every number in Section 9 reconciles (weeks-of-cover math checks out; no `NaN`/`Infinity` anywhere).
- [ ] Selecting a SKU updates chart, cards, assumptions, and inventory detail consistently across `/forecast`, `/inventory`, `/scenario`.
- [ ] Changing scenario controls updates metrics, risk badge, recommendation copy, and chart live, with no full-page reload.
- [ ] Berry's distributor-launch toggle visibly flips the recommendation from "reduce" to "maintain / reassess" — this is the single most important behavior in the whole demo; do not skip it.
- [ ] All monetary values show "Illustrative estimate."
- [ ] No risk/status indicator relies on color alone — every one has a text label too.
- [ ] "DEMO DATA" badge is visible on every screen with the correct tooltip text.
- [ ] No banned vocabulary (Section 10) appears anywhere in rendered UI copy.
- [ ] `/advisor-brief` print view excludes the sidebar/header nav.
- [ ] The duplicate-screen resolution from Section 1 has been applied and the unused folder archived.
- [ ] 1440×900 renders cleanly with the full sidebar; no clipped labels or overlapping elements.

Work through the routes in this order: `/` → `/forecast` → `/inventory` → `/scenario` → `/advisor-brief` → `/managed-intelligence` → `/assumptions`, since each screen after the first reuses components (RiskBadge, MetricCard, PriorityCard, charts) you'll build along the way.
