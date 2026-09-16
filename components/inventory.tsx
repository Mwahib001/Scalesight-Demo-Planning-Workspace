"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Package } from "lucide-react";
import { featuredSkus, skuById, formatUnits, money } from "@/data/planning";
import { inventoryMetrics, riskRank } from "@/lib/calculations";
import { catalogMetrics } from "@/lib/selectors";
import { useWorkspace } from "./workspace-context";
import { Drawer } from "./drawer";
import { ProjectionChart } from "./charts";
import {
  PageTitle,
  Metric,
  RiskBadge,
  SectionHeader,
  Filters,
  EmptyState,
} from "./ui";
export function Inventory() {
  const w = useWorkspace();
  const [detail, setDetail] = useState<string | null>(null);
  const metrics = catalogMetrics();
  const rows = featuredSkus
    .filter(
      (s) => w.selectedCategory === "All" || s.category === w.selectedCategory,
    )
    .map((s) => ({ s, m: inventoryMetrics(s) }))
    .sort(
      (a, b) =>
        riskRank[a.m.risk] - riskRank[b.m.risk] || a.m.cover - b.m.cover,
    );
  const s = detail ? skuById(detail) : null,
    m = s ? inventoryMetrics(s) : null;
  return (
    <>
      <PageTitle
        section="MERCHANT INTELLIGENCE / SUPPLY"
        title="Inventory & Purchasing"
        description="Prioritize availability, release excess capital, and review the next purchase decision."
      />
      <div className="metrics six">
        <Metric
          label="Inventory Value"
          value={`$${(metrics.inventoryValue / 1e6).toFixed(2)}M`}
          note="Illustrative cost estimate"
        />
        <Metric
          label="Inventory at Risk"
          value={`$${Math.round(metrics.inventoryAtRisk / 1000)}K`}
          note="Assessed units · illustrative estimate"
        />
        <Metric
          label="Excess Value"
          value={`$${Math.round(metrics.excessValue / 1000)}K`}
          note="Illustrative estimate"
        />
        <Metric
          label="At Stockout Risk"
          value={String(metrics.stockoutRisk)}
          note="SKUs · lead-time rule"
        />
        <Metric
          label="PO Decisions"
          value={String(metrics.poDecisions)}
          note="Scheduled for this week"
        />
        <Metric
          label="Avg Cover"
          value={`${metrics.weightedCover.toFixed(1)}w`}
          note="Catalog · demand weighted"
        />
      </div>
      <Filters />
      {rows.length === 0 || w.selectedChannel !== "All" ? (
        <EmptyState />
      ) : (
        <section className="card inventory-card">
          <SectionHeader
            title="Purchasing review queue"
            detail={<span>10 authored positions · operational urgency</span>}
          />
          <p className="chart-caption">
            Select a SKU to inspect the calculation and receipt timeline. All
            units and value impacts are illustrative estimates.
          </p>
          <div className="table-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>SKU / Product</th>
                  <th>Inv.</th>
                  <th>ROS/wk</th>
                  <th>Cover</th>
                  <th>Lead</th>
                  <th className="secondary-column">Incoming</th>
                  <th className="secondary-column">Delta</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, m }) => (
                  <tr
                    key={s.id}
                    className={w.selectedSku === s.id ? "selected-row" : ""}
                    onClick={(e) => {
                      e.currentTarget
                        .querySelector<HTMLButtonElement>("button")
                        ?.focus();
                      w.selectSku(s.id);
                      setDetail(s.id);
                    }}
                  >
                    <td>
                      <button
                        className="row-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          w.selectSku(s.id);
                          setDetail(s.id);
                        }}
                      >
                        <strong>{s.name}</strong>
                        <small>{s.id}</small>
                      </button>
                    </td>
                    <td>{formatUnits(s.currentInventory)}</td>
                    <td>{formatUnits(s.baseWeeklyDemand)}</td>
                    <td>{m.cover.toFixed(1)}w</td>
                    <td>{s.leadTimeWeeks}w</td>
                    <td className="secondary-column">
                      {formatUnits(s.incomingUnits)}
                    </td>
                    <td className="secondary-column">
                      {s.demandDelta > 0 ? "+" : ""}
                      {Math.round(s.demandDelta * 100)}%
                    </td>
                    <td>
                      <RiskBadge risk={m.risk} />
                    </td>
                    <td className="action-cell">
                      {m.risk === "High"
                        ? "Review PO"
                        : m.risk === "Excess"
                          ? "Defer / test"
                          : m.risk === "Watch"
                            ? "Recalculate"
                            : "Monitor"}
                      <ArrowUpRight size={13} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footnote">
            ROS = modeled weekly rate of sale. High risk: usable cover is below
            lead time plus safety, or the projected safety breach precedes
            replenishment. Excess: above category cover threshold with flat or
            declining demand.
          </div>
        </section>
      )}
      <div className="two-col">
        <section className="card">
          <span className="eyebrow">TIMING BEFORE QUANTITY</span>
          <h3>A purchase order only helps if it arrives in time.</h3>
          <p>
            Only confirmed receipts expected before the need date reduce the
            reorder gap. The projection adds each receipt once, at its expected
            arrival boundary.
          </p>
        </section>
        <section className="card">
          <span className="eyebrow">MERCHANT REVIEW</span>
          <h3>Use the queue to prepare the supplier conversation.</h3>
          <p>
            Inventory at risk reflects assessed exposed units. Weekly PO
            decisions are the five records flagged for this planning cycle.
            Neither is a blanket instruction to buy.
          </p>
        </section>
      </div>
      {s && m && (
        <Drawer
          title={`${s.id} · ${s.name}`}
          onClose={() => setDetail(null)}
          wide
        >
          <div className="drawer-subtitle">
            <RiskBadge risk={m.risk} />
            <span>{s.category} · illustrative estimate</span>
          </div>
          <div className="metrics three">
            <Metric
              label="Current inventory"
              value={formatUnits(s.currentInventory)}
              note="Units · before loss"
            />
            <Metric
              label="Usable inventory"
              value={formatUnits(m.usable)}
              note={`${s.lossRate * 100}% loss assumption`}
            />
            <Metric
              label="Weekly demand"
              value={formatUnits(s.baseWeeklyDemand)}
              note="Base units / week"
            />
          </div>
          <dl className="calculation-list">
            <div>
              <dt>Safety stock target</dt>
              <dd>
                {s.safetyStockWeeks} weeks · {formatUnits(m.safety)} units
              </dd>
            </div>
            <div>
              <dt>Supplier lead time</dt>
              <dd>{s.leadTimeWeeks} weeks</dd>
            </div>
            <div>
              <dt>Confirmed incoming</dt>
              <dd>{formatUnits(s.incomingUnits)} units</dd>
            </div>
            <div>
              <dt>Eligible before need date</dt>
              <dd>{formatUnits(m.eligibleIncoming)} units</dd>
            </div>
            <div>
              <dt>Projected safety-stock breach</dt>
              <dd>Week {Math.ceil(m.projection.breach ?? 26)}</dd>
            </div>
            <div>
              <dt>Projected stockout</dt>
              <dd>{m.projection.stockout?.toFixed(1) ?? "Beyond 26"} weeks</dd>
            </div>
            <div>
              <dt>Lead time + safety requirement</dt>
              <dd>{formatUnits(m.required)} units</dd>
            </div>
            <div className="highlight">
              <dt>Illustrative reorder gap</dt>
              <dd>{formatUnits(m.reorderGap)} units</dd>
            </div>
          </dl>
          <ProjectionChart
            points={m.projection.points.filter((p) => p.week <= w.horizon)}
            stockout={m.projection.stockout}
            receiptWeek={s.incomingUnits ? s.incomingWeek : undefined}
          />
          <p className="footnote">
            The model carries negative on-hand as unmet demand. A late receipt
            does not erase an earlier stockout.
          </p>
          <div className="notice">
            <Package size={18} />
            <p>
              {m.risk === "Excess"
                ? `${money(m.workingCapital)} excess working capital, illustrative estimate. Review a deferral or a controlled promotion.`
                : `Review the ${formatUnits(m.reorderGap)}-unit replenishment gap with purchasing. Illustrative estimate.`}
            </p>
          </div>
          <p className="qualification">
            Order quantity is illustrative and must be checked against MOQ,
            supplier capacity, freight, cash and merchandising constraints.
          </p>
          <div className="button-row">
            <Link
              href="/scenario"
              className="btn"
              onClick={() => setDetail(null)}
            >
              Test scenario <ArrowUpRight size={15} />
            </Link>
            <button
              className="btn secondary"
              onClick={() => {
                setDetail(null);
                setTimeout(w.openAnalyst, 0);
              }}
            >
              Ask analyst
            </button>
            <button className="btn text" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
        </Drawer>
      )}
    </>
  );
}
