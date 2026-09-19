"use client";
import { usePlanning } from "../context/PlanningContext";
import { purchaseOrderCost } from "../engine/inventoryEngine";
import { events } from "../data/kelarune";
import { date, money, number } from "../engine/formatters";
import { MetricCard } from "./MetricCard";
import { RiskBadge } from "./RiskBadge";
import { InventoryProjectionChart } from "./InventoryProjectionChart";
import { RecommendationPanel } from "./RecommendationPanel";
import {
  PageHeading,
  PlanningFilters,
  SectionHeading,
  Interpretation,
  PlanLink,
} from "./ui";
export function SKUDetail() {
  const { plan } = usePlanning();
  const r = plan.selected;
  const inv = r.inventory;
  return (
    <>
      <PageHeading
        eyebrow="THE SINGLE-SKU DECISION"
        title="SKU Planning"
        description="Demand, supply, cash, and business context—brought together in one decision."
      />
      <PlanningFilters />
      <div className="sku-title">
        <div>
          <h2>{r.sku.name}</h2>
          <p>{r.sku.story}</p>
        </div>
        <RiskBadge risk={inv.risk} />
      </div>
      <div className="metrics four">
        <MetricCard
          label="Inventory cover"
          value={`${number(inv.weeksOfCover, 1)} wks`}
          qualifier={`${number(plan.state.leadTimeWeeks, 1)}-week supplier lead time`}
          accent
        />
        <MetricCard
          label="Required inventory"
          value={number(inv.requiredInventory)}
          qualifier="Lead-time demand + safety stock"
        />
        <MetricCard
          label="Reorder gap"
          value={number(inv.reorderGap)}
          qualifier="Required − usable − incoming; minimum zero"
        />
        <MetricCard
          label="Stockout week"
          value={date(inv.stockoutDate)}
          qualifier={`Within the ${plan.state.forecastHorizon}-week horizon`}
        />
      </div>
      <section className="panel">
        <SectionHeading title="Will supply arrive in time?">
          <PlanLink href="/scenario">Stress-test this plan</PlanLink>
        </SectionHeading>
        <InventoryProjectionChart inventory={inv} />
        <Interpretation>
          {inv.stockoutDate
            ? `The projection reaches zero in the week of ${date(inv.stockoutDate)}. Review expediting before increasing demand.`
            : "Stock remains positive over this horizon, conditional on the planned arrivals shown."}{" "}
          Cover and reorder gap use current inventory; the chart additionally
          accounts for dated future replenishment assumptions.
        </Interpretation>
      </section>
      <div className="two-col">
        <RecommendationPanel item={r.recommendations[0]} />
        <section className="panel">
          <SectionHeading title="Purchasing & cash" />
          <div className="decision-stat">
            <span>Usable stock</span>
            <strong>{number(inv.usableInventory)} units</strong>
          </div>
          <div className="decision-stat">
            <span>Lead-time demand</span>
            <strong>{number(inv.leadTimeDemand)} units</strong>
          </div>
          <div className="decision-stat">
            <span>Safety stock</span>
            <strong>{number(inv.safetyStock)} units</strong>
          </div>
          <div className="decision-stat">
            <span>Committed + scenario purchase cost</span>
            <strong>{money(inv.workingCapital)}</strong>
          </div>
          <p className="muted">
            Working capital excludes unconfirmed replenishment plans. Scenario
            purchases are illustrative commitments.
          </p>
        </section>
      </div>
      <section className="panel">
        <SectionHeading title="Purchase orders & arrival assumptions" />
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Planning data table"
        >
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Quantity</th>
                <th>Expected arrival</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {inv.orders.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{number(p.quantity)}</td>
                  <td>
                    {date(p.expectedArrival)}
                    {p.originalArrival && (
                      <small>Previously {date(p.originalArrival)}</small>
                    )}
                  </td>
                  <td>
                    <span className="subtle-badge">{p.status}</span>
                  </td>
                  <td>{money(purchaseOrderCost(p))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!inv.orders.length && (
            <p className="empty-state">
              No incoming purchase orders. Review the recommendation before
              adding supply.
            </p>
          )}
        </div>
      </section>
      <section className="panel">
        <SectionHeading title="Business context & scheduled events" />
        {events
          .filter((e) => e.skuIds.includes(r.sku.id))
          .map((e) => (
            <div className="event-row" key={e.id}>
              <strong>{e.name}</strong>
              <span>
                {date(e.startDate)} – {date(e.endDate)}
              </span>
              <span className="subtle-badge">
                {e.confirmed
                  ? "Confirmed business event"
                  : "Analyst assumption"}
              </span>
            </div>
          ))}
        {!events.some((e) => e.skuIds.includes(r.sku.id)) && (
          <p className="muted">
            No scheduled campaigns. The reviewed historical demand signal drives
            this plan.
          </p>
        )}
        <PlanLink href="/assumptions">
          Review data sources and assumptions
        </PlanLink>
      </section>
    </>
  );
}
