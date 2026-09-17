"use client";
import {
  customerAggregate,
  customerWeeks,
  cohorts,
  sources,
  segments,
  reorderGroups,
  formatUnits,
  money,
} from "@/data/planning";
import { growthMetrics } from "@/lib/selectors";
import { outsideReorderWindow } from "@/lib/calculations";
import { PageTitle, Metric, SectionHeader, Decision } from "./ui";
import { RevenueChart } from "./charts";
export function CustomerGrowth() {
  const g = growthMetrics();
  return (
    <>
      <PageTitle
        section="MERCHANT INTELLIGENCE / CUSTOMER VALUE"
        title="Customer & Growth Intelligence"
        description="Understand who returns, what acquisition cohorts contribute, and where to focus retention."
      />
      <p
        className="footnote"
        title="Repeat purchase rate counts customers with at least two completed orders divided by customers with at least one in the TTM window. Completed revenue excludes refunded and cancelled orders."
      >
        Analysis through Sep 13, 2026. TTM customer metrics: n = 18,000; quarter
        revenue: Jul 1–Sep 13; mature source cohorts: n = 9,000, acquired
        Mar–May. All financial figures are illustrative estimates.
      </p>
      <div className="metrics six">
        <Metric
          label="Repeat purchase rate"
          value={`${g.repeatRate.toFixed(1)}%`}
          note="TTM · completed orders"
        />
        <Metric
          label="Repeat revenue"
          value={`${g.repeatRevenue.toFixed(1)}%`}
          note="Current quarter to date"
        />
        <Metric
          label="90-day value"
          value={money(g.value)}
          note="Expected / illustrative estimate"
        />
        <Metric
          label="Outside reorder window"
          value={formatUnits(g.overdue)}
          note="High-frequency customers"
        />
        <Metric
          label="High-value segment"
          value={formatUnits(segments[0].customers)}
          note="Customers · committed segment"
        />
        <Metric
          label="Campaign B uplift"
          value={`+${Math.round((sources[1].value / sources[0].value - 1) * 100)}%`}
          note="90-day value vs baseline"
        />
      </div>
      <Decision>
        Test a targeted retention campaign with the 1,240 overdue high-frequency
        customers before increasing broad acquisition spend.
      </Decision>
      <div className="two-col">
        <section className="card">
          <SectionHeader
            title="Retention by acquisition cohort"
            detail={<span>18,000 customers</span>}
          />
          <p className="chart-caption">
            Mar–Aug 2026 cohorts · months since first completed order
          </p>
          <div className="table-scroll">
            <table className="heatmap">
              <thead>
                <tr>
                  <th>Cohort / n</th>
                  {Array.from({ length: 6 }, (_, i) => (
                    <th key={i}>M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.month}>
                    <td>
                      <strong>{c.month}</strong>
                      <small>{formatUnits(c.size)}</small>
                    </td>
                    {Array.from({ length: 6 }, (_, i) => (
                      <td key={i}>
                        {c.size < 100 ? (
                          <span>Small sample (n &lt; 100)</span>
                        ) : c.retention[i] !== undefined ? (
                          <span
                            style={{
                              background: `rgba(47,91,255,${0.07 + c.retention[i] / 180})`,
                              color: c.retention[i] >= 70 ? "#fff" : "#10233F",
                            }}
                          >
                            {c.retention[i]}%
                          </span>
                        ) : (
                          <span
                            className="unobserved"
                            title="Cohort has not reached this age"
                          >
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            Retention = cohort customers with a completed order in that month /
            acquisition cohort size. Unobserved months stay blank; cohorts below
            100 would be suppressed.
          </p>
          <div className="mini-interpretation">
            <strong>Interpretation</strong>
            <p>
              Retention declines after acquisition across these cohorts. Review
              the second-order experience before widening acquisition.
            </p>
          </div>
        </section>
        <section className="card">
          <SectionHeader
            title="New vs. repeat revenue"
            detail={<span>Current quarter</span>}
          />
          <p className="chart-caption">
            Jul 6–Sep 7 weekly buckets · observations through Sep 13 · 18,000
            TTM customers
          </p>
          <RevenueChart data={[...customerWeeks]} />
          <p
            className="footnote"
            title="Revenue includes only completed orders, net of adjustments. Refunded and cancelled orders are excluded. New revenue belongs to the first completed order; all subsequent completed orders are repeat revenue."
          >
            Completed net revenue only; refunds and cancellations excluded.
            Financial values are illustrative estimates.
          </p>
          <div className="mini-interpretation">
            <strong>Implication</strong>
            <p>
              Repeat customers contribute 46.8% of quarter revenue. Protect the
              retention cycle before committing more acquisition spend.
            </p>
          </div>
        </section>
      </div>
      <div className="two-col">
        <section className="card">
          <SectionHeader
            title="Customer segments"
            detail={<span>TTM · n = 18,000</span>}
          />
          <div
            className="segment-stack"
            aria-label="Distribution of customer segments"
          >
            {segments.map((s, i) => (
              <span
                key={s.name}
                style={{
                  width: `${(s.customers / customerAggregate.customers) * 100}%`,
                  background: [
                    "#10233F",
                    "#2F5BFF",
                    "#5577FF",
                    "#2DB8C5",
                    "#C5CDD9",
                  ][i],
                }}
                title={`${s.name}: ${formatUnits(s.customers)}`}
              />
            ))}
          </div>
          <div className="segment-list">
            {segments.map((s, i) => (
              <div key={s.name}>
                <span>
                  <i
                    style={{
                      background: [
                        "#10233F",
                        "#2F5BFF",
                        "#5577FF",
                        "#2DB8C5",
                        "#C5CDD9",
                      ][i],
                    }}
                  />
                  {s.name}
                </span>
                <strong>{formatUnits(s.customers)}</strong>
                <small>
                  {money(s.expectedValue)} expected lifetime / illustrative
                </small>
              </div>
            ))}
          </div>
          <p className="footnote">
            Expected segment value is a committed deterministic estimate. All
            values are illustrative estimates, not guaranteed lifetime revenue.
          </p>
          <div className="mini-interpretation">
            <strong>Decision</strong>
            <p>
              Prioritize high-value and loyal customers whose expected reorder
              dates have passed.
            </p>
          </div>
        </section>
        <section className="card">
          <SectionHeader
            title="90-day value by source"
            detail={<span>Mature cohorts · n = 9,000</span>}
          />
          <p className="chart-caption">
            Acquired Mar–May 2026 · complete 90-day observation windows
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Cohort n</th>
                  <th>CAC</th>
                  <th>90-day value</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr
                    key={s.name}
                    className={s.name === "Campaign B" ? "selected-row" : ""}
                  >
                    <td>
                      {s.name}
                      {s.name === "Campaign A" && (
                        <small>Baseline cohort</small>
                      )}
                    </td>
                    <td>{formatUnits(s.size)}</td>
                    <td>{money(s.cac)}</td>
                    <td>
                      <strong>
                        {s.size < 100
                          ? "Small sample (n < 100)"
                          : money(s.value)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            Realized value = net completed-order revenue within 90 days of
            acquisition / cohort size. Refunds and cancellations excluded. No
            small samples (n &lt; 100). Financial values: illustrative estimate.
          </p>
          <div className="mini-interpretation">
            <strong>Association, subject to review</strong>
            <p>
              {
                "Campaign B customers generated approximately 21% higher 90-day revenue than the baseline cohort despite higher initial CAC. This is an association in demo data, not proof of causation."
              }
            </p>
          </div>
        </section>
      </div>
      <section className="card">
        <SectionHeader
          title="Reorder risk"
          detail={<span>As of Sep 14, 2026 · n = 18,000</span>}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Review group</th>
                <th>Customers</th>
                <th>Last order</th>
                <th>Expected cadence</th>
                <th>Expected reorder date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reorderGroups.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{formatUnits(r.size)}</td>
                  <td>{r.lastOrder}</td>
                  <td>
                    {r.expectedDays} days + {r.graceDays} grace
                  </td>
                  <td>
                    {new Date(
                      Date.parse(r.lastOrder) + r.expectedDays * 86400000,
                    )
                      .toISOString()
                      .slice(0, 10)}
                  </td>
                  <td>
                    <span
                      className={
                        outsideReorderWindow(
                          r.lastOrder,
                          r.expectedDays,
                          r.graceDays,
                        )
                          ? "text-warning"
                          : "muted"
                      }
                    >
                      {outsideReorderWindow(
                        r.lastOrder,
                        r.expectedDays,
                        r.graceDays,
                      )
                        ? "⚠ Outside window"
                        : "✓ Within window"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footnote">
          Outside window when today is strictly later than last order + expected
          reorder days + grace days. Group dates are representative committed
          aggregates, not individual customer records.
        </div>
        <Decision>
          Run a small, measured retention test with the overdue group and
          compare response before expanding the audience.
        </Decision>
      </section>
    </>
  );
}
