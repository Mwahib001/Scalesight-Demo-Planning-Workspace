"use client";
import Link from "next/link";
import {
  skuById,
  forecastUnits,
  weeklyActuals,
  weekDate,
  backtest,
  events,
  formatUnits,
  forecastVersions,
} from "@/data/planning";
import {
  confidence,
  inventoryMetrics,
  mape,
  residualStability,
} from "@/lib/calculations";
import { useWorkspace } from "./workspace-context";
import {
  PageTitle,
  Filters,
  Metric,
  SectionHeader,
  Decision,
  EmptyState,
} from "./ui";
import { ForecastChart, ForecastChartPoint } from "./charts";
export function Forecast() {
  const w = useWorkspace(),
    s = skuById(w.selectedSku);
  const empty =
    (w.selectedCategory !== "All" && w.selectedCategory !== s.category) ||
    w.selectedChannel !== "All";
  const history = weeklyActuals(s);
  const historyTotals = Array.from({ length: 104 }, (_, i) =>
    history
      .filter((h) => h.weekStart === weekDate(i - 104))
      .reduce((n, h) => n + h.units, 0),
  );
  const points: ForecastChartPoint[] = Array.from({ length: 12 }, (_, i) => {
    const week = weekDate(i - 12);
    return {
      week,
      actual:
        s.id === "SKU-104" && i >= 8
          ? backtest[i - 8].actual
          : history
              .filter((h) => h.weekStart === week)
              .reduce((n, h) => n + h.units, 0),
    };
  });
  const versions = forecastVersions.filter((v) => v.skuId === s.id),
    previous = versions.at(-2);
  for (let i = 0; i < w.horizon; i++) {
    const base = forecastUnits(s, i);
    points.push({
      week: weekDate(i),
      base,
      previous: previous?.weeks[i].units,
      range: [Math.round(base * 0.86), Math.round(base * 1.16)],
    });
  }
  const next4 = Array.from({ length: 4 }, (_, i) => forecastUnits(s, i)).reduce(
      (a, b) => a + b,
      0,
    ),
    next8 = Array.from({ length: 8 }, (_, i) => forecastUnits(s, i)).reduce(
      (a, b) => a + b,
      0,
    ),
    prior8 = previous?.weeks.slice(0, 8).reduce((n, p) => n + p.units, 0);
  const m = inventoryMetrics(s);
  const early = s.leadTimeWeeks - (m.projection.stockout ?? s.leadTimeWeeks);
  const chartEvents = events.filter(
    (e) =>
      e.skuId === s.id &&
      e.start >= weekDate(-12) &&
      e.start < weekDate(w.horizon),
  );
  return (
    <>
      <PageTitle
        section="MERCHANT INTELLIGENCE / DEMAND"
        title="Demand Forecast"
        description="A rolling view of demand, reviewed in the context of events and purchasing decisions."
      />
      <Filters />
      {empty ? (
        <EmptyState />
      ) : (
        <>
          <div className="metrics five">
            <Metric
              label="Next 4 weeks"
              value={formatUnits(next4)}
              note="Units · illustrative estimate"
            />
            <Metric
              label="Next 8 weeks"
              value={formatUnits(next8)}
              note={`${prior8 ? `Was ${formatUnits(prior8)} · ` : ""}illustrative estimate`}
            />
            <Metric
              label="Forecast change"
              value={
                prior8
                  ? `${((next8 / prior8 - 1) * 100).toFixed(1)}%`
                  : "New baseline"
              }
              note="Versus prior 8-week plan"
            />
            <Metric
              label="Trend"
              value={s.demandDelta > 0 ? "Increasing" : "Softening"}
              note={
                s.id === "SKU-104"
                  ? "Post-campaign"
                  : "Current planning assumption"
              }
            />
            <Metric
              label="Confidence"
              value={confidence(
                104,
                s.id === "SKU-104"
                  ? (mape(backtest) ?? 100) / 100
                  : residualStability(historyTotals),
                chartEvents.some((e) => !e.confirmed),
              )}
              note="Analyst-reviewed"
            />
          </div>
          <section className="card">
            <SectionHeader
              title={`${s.name} · demand outlook`}
              detail={
                <span>
                  {s.id} ·{" "}
                  {w.horizon === 52 ? "12 months" : `${w.horizon} weeks`} ahead
                </span>
              }
            />
            <p className="chart-caption">
              Weekly units · illustrative estimate · range expresses planning
              uncertainty
            </p>
            <ForecastChart
              data={points}
              eventDates={chartEvents.map((e) => ({
                date: e.start,
                label: e.label,
              }))}
            />
            <div className="event-markers">
              {chartEvents.map((e, i) => (
                <button
                  key={e.id}
                  className="event-chip"
                  title={`${e.start}–${e.end} | ${e.type} | ${e.label} | ${e.confirmed ? "Confirmed" : "Assumed, unconfirmed"} | Assumed effect ${(e.effect * 100).toFixed(0)}%; bounded to the event window.`}
                >
                  {i + 1}. {e.type}
                  <span className="event-tooltip">
                    {e.start}–{e.end}
                    <br />
                    {e.label} · {e.confirmed ? "Confirmed" : "Unconfirmed"}
                    <br />
                    Assumed effect: {Math.round(e.effect * 100)}% within event
                    window
                  </span>
                </button>
              ))}
            </div>
            <div className="card-footnote">
              Planning range is a deterministic sensitivity band, not a
              calibrated confidence interval. History uses completed weekly
              observations; the base case is a scenario-based planning
              assumption.
            </div>
          </section>
          <div className="two-col interpretation-grid">
            <section className="card">
              <span className="eyebrow">ANALYST INTERPRETATION</span>
              <h3>
                {s.demandDelta > 0
                  ? "Demand has strengthened. Persistence needs review."
                  : "Demand softness calls for a measured purchase plan."}
              </h3>
              <p>
                {s.id === "SKU-104"
                  ? "The autumn campaign coincides with a step-up in observed demand. The updated eight-week base plan is higher than its committed prior version, but the recent uplift should not be carried forward indefinitely. Review the campaign window, remaining demand and supplier timing together."
                  : `${s.name} is reviewed against its historical baseline, category cover threshold and confirmed receipts. Event assumptions remain separate from observed demand.`}
              </p>
              <p className="footnote">
                104 weeks of history · residual stability and event uncertainty
                inform the confidence label.
              </p>
            </section>
            <section className="card implication">
              <span className="eyebrow">BUSINESS IMPLICATION</span>
              <h3>
                {early > 0
                  ? `${early.toFixed(1)} weeks between stockout and standard replenishment`
                  : "Review receipts against the current demand plan"}
              </h3>
              <p>
                At the modeled weekly rate, safety stock is reached in
                approximately{" "}
                {m.projection.breach?.toFixed(1) ?? "more than 26"} weeks;
                stockout is projected in{" "}
                {m.projection.stockout?.toFixed(1) ?? "more than 26"} weeks.
                Standard lead time is {s.leadTimeWeeks} weeks.
              </p>
              <p className="footnote">
                Illustrative estimate · assumes the updated base demand rate
                persists. Safety-stock breach and stockout are separate
                thresholds.
              </p>
            </section>
          </div>
          <Decision>
            {m.reorderGap > 0
              ? `Review ${formatUnits(m.reorderGap)} units of unrounded replenishment need and confirm the earliest feasible receipt. Illustrative estimate.`
              : "Review receipt timing before committing additional inventory."}{" "}
            <Link href="/inventory">Review purchasing →</Link>
          </Decision>
          <section className="card">
            <SectionHeader
              title="Forecast vs. Actual"
              detail={
                <span className="small-tag">Committed version comparison</span>
              }
            />
            {s.id === "SKU-104" ? (
              <>
                <div className="backtest-summary">
                  <strong>{mape(backtest)?.toFixed(1)}%</strong>
                  <span>recent 4-week MAPE (demo backtest)</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Week</th>
                        <th>Previous forecast</th>
                        <th>Actual</th>
                        <th>Variance</th>
                        <th>Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtest.map((r) => (
                        <tr key={r.week}>
                          <td>{r.week}</td>
                          <td>{formatUnits(r.previousForecast)}</td>
                          <td>{formatUnits(r.actual)}</td>
                          <td>+{formatUnits(r.actual - r.previousForecast)}</td>
                          <td>{r.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="muted">
                A committed four-week backtest is available for SKU-104. No
                accuracy metric is inferred for this SKU.
              </p>
            )}
            <div className="card-footnote">
              Append actual → compare against the version committed before the
              actual → re-estimate → update interpretation → retain prior
              version. Zero actuals are excluded from MAPE. Unit figures:
              illustrative estimate.
            </div>
          </section>
        </>
      )}
    </>
  );
}
