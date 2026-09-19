"use client";
import { useState } from "react";
import { assumptions, getSku, detailedSkus } from "../data/kelarune";
import { usePlanning } from "../context/PlanningContext";
import { date, number } from "../engine/formatters";
import { PageHeading, SectionHeading, Interpretation } from "./ui";
export function AssumptionTable() {
  const { state, plan } = usePlanning();
  const [filter, setFilter] = useState("all");
  const [source, setSource] = useState("all");
  const rows = assumptions.filter(
    (a) =>
      (filter === "all" || a.skuId === filter) &&
      (source === "all" || a.sourceType === source),
  );
  return (
    <>
      <PageHeading
        eyebrow="WHAT THE PLAN IS BUILT ON"
        title="Planning Assumptions"
        description="Transparent inputs, known business context, and the analyst judgments behind every recommendation."
      />
      <Interpretation>
        Confidence is Moderate because BFCM uplift and a recent product launch
        need judgment. All source data is synthetic; review names describe the
        simulated service workflow.
      </Interpretation>
      <section className="panel">
        <SectionHeading
          title="Current session assumptions"
          description="Scenario edits remain active across routes until reset; reloading starts the base plan."
        />
        <div className="assumption-summary">
          <div>
            <span>Selected SKU</span>
            <strong>{plan.selected.sku.name}</strong>
          </div>
          <div>
            <span>Scenario mode</span>
            <strong>{state.scenarioMode}</strong>
          </div>
          <div>
            <span>Demand uplift / paid spend</span>
            <strong>
              {state.demandUpliftPct}% / {state.adSpendChangePct}%
            </strong>
          </div>
          <div>
            <span>Promotion</span>
            <strong>
              {state.promotionEnabled
                ? `${state.promotionDiscountPct}% discount`
                : "Disabled"}
            </strong>
          </div>
          <div>
            <span>Lead time</span>
            <strong>{state.leadTimeWeeks} weeks</strong>
          </div>
          <div>
            <span>Incoming / new purchase</span>
            <strong>
              {number(state.incomingInventory)} /{" "}
              {number(state.purchaseQuantity)} units
            </strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <SectionHeading title="Source & review register" />
        <div className="table-toolbar">
          <label>
            Product scope
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All assumptions</option>
              <option value="portfolio">Portfolio</option>
              {detailedSkus.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source type
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">All sources</option>
              {[
                "historical_signal",
                "confirmed_business_event",
                "operational_input",
                "analyst_assumption",
              ].map((s) => (
                <option value={s} key={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Planning data table"
        >
          <table>
            <thead>
              <tr>
                <th>Input / product</th>
                <th>Value</th>
                <th>Source type</th>
                <th>Last reviewed</th>
                <th>Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={i}>
                  <td>
                    <strong>{a.key}</strong>
                    <small>
                      {a.skuId === "portfolio"
                        ? "Whole portfolio"
                        : getSku(a.skuId).name}
                    </small>
                  </td>
                  <td>
                    {typeof a.value === "number" ? number(a.value, 2) : a.value}
                  </td>
                  <td>
                    <span className="source-type">
                      {a.sourceType.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>{date(a.reviewedAt)}, 2026</td>
                  <td>{a.reviewedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="empty-state">
              No assumptions match this scope and source.
            </p>
          )}
        </div>
      </section>
      <section className="panel">
        <SectionHeading title="How the calculations work" />
        <div className="formula-grid">
          <p>
            <b>Demand forecast</b>Baseline + trend + seasonality + known events
            + scenario adjustment
          </p>
          <p>
            <b>Revenue forecast</b>Units × expected selling price × (1 − returns
            rate)
          </p>
          <p>
            <b>Weeks of cover</b>Available inventory ÷ first-week forecast
            demand
          </p>
          <p>
            <b>Required inventory</b>Weekly demand × (lead time + safety stock
            weeks)
          </p>
          <p>
            <b>Reorder gap</b>max(0, required − usable − incoming inventory)
          </p>
          <p>
            <b>Projected inventory</b>Usable stock + arrivals to date −
            cumulative demand
          </p>
          <p>
            <b>Stockout timing</b>First forecast week where end-of-week
            projected inventory ≤ 0
          </p>
          <p>
            <b>Inventory at risk</b>High-risk current stock cost + declining
            overstock above an eight-week target
          </p>
        </div>
        <p className="chart-note">
          High risk requires an actual safety breach in the selected chart
          horizon. Insufficient cover without an in-horizon breach is Watch. No
          statistical accuracy score is claimed.
        </p>
      </section>
    </>
  );
}
