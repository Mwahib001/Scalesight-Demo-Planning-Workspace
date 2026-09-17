"use client";
import { Check, RotateCcw, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "./workspace-context";
import { skuById, formatUnits, money, weekDate } from "@/data/planning";
import {
  defaultScenario,
  runScenario,
  reconciliationFixture,
} from "@/lib/calculations";
import {
  Filters,
  PageTitle,
  Metric,
  RiskBadge,
  Decision,
  SectionHeader,
  EmptyState,
} from "./ui";
import { ProjectionChart } from "./charts";
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  suffix: string;
}) {
  return (
    <label className="slider-label">
      <span>
        {label}
        <strong>
          {value.toFixed(step < 1 ? 1 : 0)}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <small>
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </small>
    </label>
  );
}
export function Scenario() {
  const w = useWorkspace(),
    s = skuById(w.selectedSku);
  const [applied, setApplied] = useState(false);
  const r = runScenario(s, w.scenario, w.horizon, w.selectedChannel),
    base = runScenario(s, defaultScenario(s), w.horizon, w.selectedChannel),
    fixture = reconciliationFixture();
  const empty =
    w.selectedCategory !== "All" && w.selectedCategory !== s.category;
  const update: typeof w.updateScenario = (v) => {
    setApplied(false);
    w.updateScenario(v);
  };
  return (
    <>
      <PageTitle
        section="MERCHANT INTELLIGENCE / WHAT IF"
        title="Scenario Planning"
        description="Explore a planning assumption before it becomes a purchasing commitment."
      />
      <Filters />
      {empty ? (
        <EmptyState />
      ) : (
        <>
          <div className="scenario-layout">
            <section className="card controls-card">
              <SectionHeader
                title="Planning assumptions"
                detail={
                  <button
                    className="icon-button"
                    aria-label="Reset scenario"
                    onClick={() => {
                      w.resetScenario();
                      setApplied(false);
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                }
              />
              <p className="muted">
                {s.id} · {s.name}
              </p>
              <Slider
                label="Demand change"
                value={w.scenario.demandChange * 100}
                min={-20}
                max={50}
                onChange={(v) => update({ demandChange: v / 100 })}
                suffix="%"
              />
              <label>
                Supplier lead-time change
                <select
                  aria-label="Supplier lead-time change"
                  value={w.scenario.leadTimeChange}
                  onChange={(e) =>
                    update({ leadTimeChange: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 9 }, (_, i) => i - 2).map((v) => (
                    <option key={v} value={v}>
                      {v > 0 ? "+" : ""}
                      {v} weeks
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle-label">
                <span>
                  Promotion <small>+15% in weeks 2–3 only</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={w.scenario.promotion}
                  onChange={(e) => update({ promotion: e.target.checked })}
                />
              </label>
              <Slider
                label="Ad-spend change"
                value={w.scenario.adSpendChange * 100}
                min={-50}
                max={100}
                onChange={(v) => update({ adSpendChange: v / 100 })}
                suffix="%"
              />
              <p className="control-note">
                {r.adEffectApplied
                  ? "Committed Online Store elasticity: 0.12. Effect applied to the modeled demand rate."
                  : "Explicit assumption only: no committed elasticity for this SKU/channel, so ad spend does not change modeled demand."}
              </p>
              <label>
                Incoming PO quantity
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={w.scenario.incomingUnits}
                  onChange={(e) =>
                    update({ incomingUnits: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Incoming PO date
                <input
                  type="date"
                  min={weekDate(1)}
                  max={weekDate(w.horizon)}
                  value={weekDate(w.scenario.incomingWeek)}
                  onChange={(e) =>
                    update({
                      incomingWeek: Math.ceil(
                        (Date.parse(e.target.value) - Date.parse(weekDate(0))) /
                          604800000,
                      ),
                    })
                  }
                />
              </label>
              <label className="toggle-label">
                <span>
                  Supplier delay
                  <small>Add selected delay to lead time and receipt</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={w.scenario.supplierDelay}
                  onChange={(e) => update({ supplierDelay: e.target.checked })}
                />
              </label>
              <label>
                Delay weeks
                <select
                  aria-label="Delay weeks"
                  value={w.scenario.delayWeeks}
                  onChange={(e) =>
                    update({ delayWeeks: Number(e.target.value) })
                  }
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option value={n} key={n}>
                      {n} weeks
                    </option>
                  ))}
                </select>
              </label>
              <Slider
                label="Safety-stock target"
                value={w.scenario.safetyWeeks}
                min={0.5}
                max={4}
                step={0.1}
                onChange={(v) => update({ safetyWeeks: v })}
                suffix="w"
              />
            </section>
            <div className="scenario-results">
              <div className="metrics two">
                <Metric
                  label="Current-plan stockout"
                  value={
                    base.projection.stockout === null
                      ? `Beyond ${w.horizon}w`
                      : `${base.projection.stockout.toFixed(1)}w`
                  }
                  note="Includes planned receipt · illustrative estimate"
                />
                <Metric
                  label="Scenario stockout"
                  value={
                    r.projection.stockout === null
                      ? `Beyond ${w.horizon}w`
                      : `${r.projection.stockout.toFixed(1)}w`
                  }
                  note="First modeled zero crossing · illustrative estimate"
                  accent
                />
                <Metric
                  label="Inventory requirement"
                  value={formatUnits(r.required)}
                  note={`Was ${formatUnits(base.required)} units · illustrative estimate`}
                />
                <Metric
                  label="Additional purchase"
                  value={`${r.recommendedRoundedUnits - base.recommendedRoundedUnits >= 0 ? "+" : ""}${formatUnits(r.recommendedRoundedUnits - base.recommendedRoundedUnits)}`}
                  note="Units versus base PO · illustrative estimate"
                />
                <Metric
                  label="Incremental cash"
                  value={money(r.capitalImpact)}
                  note="Illustrative working capital estimate"
                />
                <Metric
                  label="Scenario weekly demand"
                  value={formatUnits(r.demand)}
                  note="Base units before event windows · illustrative estimate"
                />
              </div>
              <section className="card">
                <SectionHeader
                  title="Inventory under this assumption"
                  detail={<RiskBadge risk={r.risk} />}
                />
                <ProjectionChart
                  points={r.projection.points.filter(
                    (p) => p.week <= w.horizon,
                  )}
                  stockout={
                    r.projection.stockout !== null &&
                    r.projection.stockout <= w.horizon
                      ? r.projection.stockout
                      : null
                  }
                  receiptWeek={
                    w.scenario.incomingUnits
                      ? w.scenario.incomingWeek +
                        (w.scenario.supplierDelay ? w.scenario.delayWeeks : 0)
                      : undefined
                  }
                />
                <div className="card-footnote">
                  Illustrative estimate. Only {formatUnits(r.eligibleIncoming)}{" "}
                  incoming units qualify before the need date. Effective lead
                  time: {r.lead.toFixed(0)} weeks.
                </div>
              </section>
              <Decision>
                {r.recommendation} All quantity and cash impacts are
                illustrative estimates.
              </Decision>
              <section className="card">
                <h3>From raw need to a reviewable quantity</h3>
                <dl className="calculation-list">
                  <div>
                    <dt>Raw calculated gap</dt>
                    <dd>{formatUnits(r.rawCalculatedGap)} units</dd>
                  </div>
                  <div>
                    <dt>Pack size / MOQ</dt>
                    <dd>
                      {s.packSize} / {s.moq} units
                    </dd>
                  </div>
                  <div>
                    <dt>Recommended rounded PO</dt>
                    <dd>{formatUnits(r.recommendedRoundedUnits)} units</dd>
                  </div>
                </dl>
                <p className="footnote">
                  Illustrative estimate. Quantity rounds up to pack size and
                  MOQ. It must be checked against supplier capacity, freight,
                  cash and merchandising constraints.
                </p>
                <button
                  className="btn"
                  onClick={() => {
                    w.applyNote(
                      `${s.id} ${s.name} · demand ${(w.scenario.demandChange * 100).toFixed(0)}%, effective lead ${r.lead} weeks. Recommended PO ${formatUnits(r.recommendedRoundedUnits)} units; incremental cash ${money(r.capitalImpact)}. Illustrative estimate, session-only planning assumption.`,
                    );
                    setApplied(true);
                  }}
                >
                  {applied ? <Check size={16} /> : <ArrowRight size={16} />}{" "}
                  {applied ? "Applied to session brief" : "Apply to brief"}
                </button>
                {applied && (
                  <Link className="inline-link" href="/">
                    View brief →
                  </Link>
                )}
                <p aria-live="polite" className="footnote">
                  {applied
                    ? "The executive brief now contains your labeled session scenario note."
                    : w.summary ||
                      "Changes recalculate immediately and are retained for this browser session."}
                </p>
              </section>
            </div>
          </div>
          <section className="card fixture-card">
            <SectionHeader
              eyebrow="TRANSPARENT WORKED EXAMPLE"
              title="A $27,000 purchasing conversation"
              detail={
                <span className="small-tag">
                  Illustrative purchasing example
                </span>
              }
            />
            <p>
              This committed example is independent of the selected SKU. Demand
              moves from 1,050 to 1,312.5 units/week (+25%); a 6-week lead time
              plus 2-week delay is tested with 1.33 safety weeks. Both
              requirements use the same 8-week supply window to isolate the
              demand change; 9,800 available units cover the baseline
              requirement. Stockout timing above comes from the selected SKU’s
              actual stock and receipt schedule.
            </p>
            <div className="metrics four">
              <Metric
                label="Baseline requirement"
                value={formatUnits(fixture.baseRequired)}
                note="Same 8-week supply window · illustrative estimate"
              />
              <Metric
                label="Scenario requirement"
                value={formatUnits(fixture.displayRequired)}
                note={`Raw ${formatUnits(fixture.rawRequired)} · illustrative estimate`}
              />
              <Metric
                label="Additional purchase"
                value={formatUnits(fixture.recommendedRoundedUnits)}
                note="Units · illustrative estimate"
              />
              <Metric
                label="Incremental capital"
                value={money(fixture.capitalImpact)}
                note="$7.50/unit · illustrative estimate"
              />
            </div>
            <p className="footnote">
              Available before need: 9,800 units. Raw gap:{" "}
              {formatUnits(fixture.rawCalculatedGap)}. Add 1,000 contingency
              units, round to a 600-unit pack, and enforce 1,200 MOQ: an
              allowance of {formatUnits(fixture.roundingAllowance)} yields{" "}
              {formatUnits(fixture.recommendedRoundedUnits)} recommended units.
              The fixture truncates raw units and rounds display requirements to
              50; the live model retains full precision. All quantities are
              illustrative estimates.
            </p>
            <Decision>
              Review whether to bring PO-238 forward approximately 2 weeks or
              evaluate partial expedited replenishment. Confirm the contingency
              with purchasing.
            </Decision>
          </section>
          <p className="scenario-disclaimer">
            {
              "Scenario planning is an assumption tool, not a prediction of certainty."
            }
          </p>
        </>
      )}
    </>
  );
}
