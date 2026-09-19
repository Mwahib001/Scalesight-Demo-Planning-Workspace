"use client";
import { usePlanning } from "../context/PlanningContext";
import { history, events } from "../data/kelarune";
import { revenueForDays, revenueWindow } from "../engine/forecastEngine";
import { money, number, percent } from "../engine/formatters";
import { ForecastChart } from "./ForecastChart";
import { MetricCard } from "./MetricCard";
import { RecommendationPanel } from "./RecommendationPanel";
import {
  PageHeading,
  PlanningFilters,
  SectionHeading,
  Interpretation,
  PlanLink,
} from "./ui";
export function RevenueForecast() {
  const { plan, state, update } = usePlanning();
  const period = state.forecastHorizon === 4 ? 30 : state.forecastHorizon * 7;
  const total = revenueForDays(plan.revenueSeries, period);
  const data = revenueWindow(plan.revenueSeries, period).map((p) => ({
    weekStart: p.weekStart,
    current: p.revenue,
    previous: p.previous,
    event: events.find((e) => e.type === "bfcm" && e.startDate === p.weekStart)
      ?.name,
  }));
  return (
    <>
      <PageHeading
        eyebrow="WHAT’S LIKELY TO HAPPEN"
        title="Revenue Forecast"
        description="An explainable revenue outlook, grounded in demand and the decisions ahead."
      />
      <div className="filter-bar">
        <div>
          <span className="field-label">Revenue outlook</span>
          <div className="segmented">
            {([4, 8, 13, 26] as const).map((d, i) => (
              <button
                key={d}
                aria-pressed={state.forecastHorizon === d}
                onClick={() => update({ forecastHorizon: d })}
              >
                {["30 days", "8 weeks", "13 weeks", "6 months"][i]}
              </button>
            ))}
          </div>
        </div>
        <p className="muted">
          Portfolio view · 24 active SKUs · expected net revenue
        </p>
      </div>
      <div className="metrics three">
        <MetricCard
          label="Expected net revenue"
          value={money(total)}
          qualifier={`Over ${period === 30 ? "30 days" : period === 56 ? "8 weeks" : period === 91 ? "13 weeks" : "26 weeks"}`}
          accent
        />
        <MetricCard
          label="30-day growth"
          value={percent(plan.revenueGrowthPct)}
          qualifier="Versus previous comparable 30 days"
        />
        <MetricCard
          label="Confidence"
          value={plan.confidence}
          qualifier="BFCM event uplift + thin launch history"
        />
      </div>
      <section className="panel">
        <SectionHeading title="The forward revenue outlook">
          <span className="subtle-badge">Illustrative · assumption-based</span>
        </SectionHeading>
        <ForecastChart data={data} revenue />
        <Interpretation>
          Revenue follows SKU-level units × selling price, adjusted for
          discounts and a 2% returns assumption. {plan.stockouts} projected
          stockouts create fulfillment risk: this is an unconstrained demand
          outlook, not a guarantee of shipped revenue. The 30-day view prorates
          the final two-day portion of the last week.
        </Interpretation>
      </section>
      <div className="two-col">
        <section className="panel">
          <SectionHeading
            title="Where revenue comes from"
            description="The six largest contributors from the SKU-level forecasts."
          />
          <div className="contributor-list">
            {[...plan.rows]
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 6)
              .map((r) => (
                <div key={r.sku.id}>
                  <PlanLink href="/sku-planning" skuId={r.sku.id}>
                    {r.sku.name}
                  </PlanLink>
                  <strong>
                    {money(revenueForDays(r.allForecast, period))}
                  </strong>
                </div>
              ))}
          </div>
        </section>
        <section className="panel">
          <SectionHeading title="The assumptions behind the outlook" />
          <div className="driver">
            <span>01</span>
            <div>
              <h3>Demand comes first</h3>
              <p>
                Reviewed SKU baselines set unit demand. Trend and seasonal
                effects enter after the first five weeks.
              </p>
            </div>
          </div>
          <div className="driver">
            <span>02</span>
            <div>
              <h3>Events change the mix</h3>
              <p>
                BFCM and confirmed promotions add demand and reduce selling
                price in their scheduled weeks.
              </p>
            </div>
          </div>
          <div className="driver">
            <span>03</span>
            <div>
              <h3>Supply determines what you can fulfill</h3>
              <p>
                Review arrival dates before treating the outlook as achievable
                revenue.
              </p>
            </div>
          </div>
          <PlanLink href="/assumptions">
            Inspect every planning assumption
          </PlanLink>
        </section>
      </div>
    </>
  );
}
export function DemandForecast() {
  const { plan } = usePlanning();
  const r = plan.selected;
  const past = history
    .filter((p) => p.skuId === r.sku.id)
    .slice(-8)
    .map((p) => ({
      weekStart: p.weekStart,
      actual: p.units,
      previous: p.planUnits,
    }));
  const future = r.forecast.map((p, i) => ({
    weekStart: p.weekStart,
    current: p.units,
    previous: p.previousForecast,
    upside: p.upsideUnits,
    downside: p.downsideUnits,
    event:
      p.eventNames.length &&
      p.eventNames.join(",") !== r.forecast[i - 1]?.eventNames.join(",")
        ? p.eventNames[0]
        : undefined,
  }));
  return (
    <>
      <PageHeading
        eyebrow="WHY THE PLAN CHANGED"
        title="Demand Forecast"
        description="From historical signals to a forward plan—with business context made visible."
      />
      <PlanningFilters />
      <div className="metrics four">
        <MetricCard
          label="Weekly planning demand"
          value={number(r.inventory.weeklyDemand)}
          qualifier="Units · first forecast week"
          accent
        />
        <MetricCard
          label="Forecast units"
          value={number(r.totalUnits)}
          qualifier={`Over the selected ${plan.state.forecastHorizon} weeks`}
        />
        <MetricCard
          label="Current inventory cover"
          value={`${number(r.inventory.weeksOfCover, 1)} wks`}
          qualifier="Available inventory / weekly demand"
        />
        <MetricCard
          label="Forecast confidence"
          value={r.confidence}
          qualifier={
            r.confidence === "Low"
              ? "Eight weeks of history · Lime analog"
              : "Reviewed baseline + event assumptions"
          }
        />
      </div>
      <section className="panel">
        <SectionHeading title={r.sku.name} description={r.sku.story} />
        <ForecastChart data={[...past, ...future]} />
        <Interpretation>
          {r.recommendations.find(
            (item) => item.title === "Forecast Review Required",
          )?.whatChanged ?? r.sku.story + "."}{" "}
          Current forecast combines baseline, trend, seasonality, known events
          and the active scenario. Upside/downside lines are illustrative
          alternatives to the base plan.
        </Interpretation>
      </section>
      <details className="panel forecast-math">
        <summary>Inspect the weekly demand calculation</summary>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Forecast contribution table"
        >
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Baseline</th>
                <th>Trend</th>
                <th>Seasonality</th>
                <th>Events</th>
                <th>Scenario</th>
                <th>Forecast units</th>
              </tr>
            </thead>
            <tbody>
              {r.forecast.map((p) => (
                <tr key={p.weekStart}>
                  <td>{p.weekStart}</td>
                  <td>{number(p.baseline, 1)}</td>
                  <td>{number(p.trendUnits, 1)}</td>
                  <td>{number(p.seasonalUnits, 1)}</td>
                  <td>{number(p.eventUnits, 1)}</td>
                  <td>{number(p.scenarioUnits, 1)}</td>
                  <td>
                    <strong>{number(p.units, 1)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <div className="two-col">
        <RecommendationPanel item={r.recommendations[0]} />
        <section className="panel">
          <SectionHeading title="From demand to the next decision" />
          <p>
            Demand feeds lead-time requirements, safety stock and the dated
            inventory projection. Review the resulting purchasing gap before
            committing spend.
          </p>
          <div className="decision-stat">
            <span>Lead-time demand</span>
            <strong>{number(r.inventory.leadTimeDemand)} units</strong>
          </div>
          <div className="decision-stat">
            <span>Additional reorder gap</span>
            <strong>{number(r.inventory.reorderGap)} units</strong>
          </div>
          <PlanLink href="/sku-planning">Open the full SKU decision</PlanLink>
        </section>
      </div>
    </>
  );
}
