"use client";
import { useState } from "react";
import { usePlanning } from "../context/PlanningContext";
import { date, money, number } from "../engine/formatters";
import { RiskBadge } from "./RiskBadge";
import { PlanLink } from "./ui";
import type { Risk } from "../data/entities";
const urgency: Record<Risk, number> = {
  "High risk": 0,
  Watch: 1,
  Overstock: 2,
  Healthy: 3,
};
export function InventoryHealthTable() {
  const { plan } = usePlanning();
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("urgency");
  const [search, setSearch] = useState("");
  const rows = plan.rows
    .filter(
      (r) =>
        r.sku.detailed &&
        (filter === "All" || r.inventory.risk === filter) &&
        r.sku.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "cover"
        ? a.inventory.weeksOfCover - b.inventory.weeksOfCover
        : sort === "cash"
          ? b.inventory.riskValue - a.inventory.riskValue
          : urgency[a.inventory.risk] - urgency[b.inventory.risk],
    );
  return (
    <>
      <div className="table-toolbar">
        <label>
          Search SKUs
          <input
            type="search"
            placeholder="Find a product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Risk filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "High risk", "Watch", "Overstock", "Healthy"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="urgency">Planning urgency</option>
            <option value="cover">Lowest cover</option>
            <option value="cash">Cost at risk</option>
          </select>
        </label>
        <span className="muted">{rows.length} detailed SKUs</span>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Planning data table"
      >
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product / recommended action</th>
              <th>Status</th>
              <th>On hand</th>
              <th>Weekly demand</th>
              <th>Cover / lead</th>
              <th>Incoming</th>
              <th>Stockout week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku.id}>
                <td>
                  <PlanLink href="/sku-planning" skuId={r.sku.id}>
                    {r.sku.name}
                  </PlanLink>
                  <small>{r.recommendations[0].recommendation}</small>
                </td>
                <td>
                  <RiskBadge risk={r.inventory.risk} />
                </td>
                <td>{number(r.inventory.currentInventory)}</td>
                <td>{number(r.inventory.weeklyDemand)}</td>
                <td>
                  <strong>{number(r.inventory.weeksOfCover, 1)}</strong> /{" "}
                  {number(
                    r.sku.id === plan.state.selectedSkuId
                      ? plan.state.leadTimeWeeks
                      : r.sku.leadTimeWeeks,
                    1,
                  )}
                  w
                </td>
                <td>{number(r.inventory.incomingInventory)}</td>
                <td>{date(r.inventory.stockoutDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="empty-state">
            No products match these filters. Try another risk level or product
            name.
          </p>
        )}
      </div>
      <p className="chart-note">
        24 active SKUs contribute to portfolio metrics; 10 are shown in detail.
        Cost at risk: {money(plan.riskValue)}. Incoming excludes unconfirmed
        future replenishments.
      </p>
    </>
  );
}
