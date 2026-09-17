"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { changes, skuById, formatUnits, money } from "@/data/planning";
import { catalogMetrics } from "@/lib/selectors";
import { inventoryMetrics, workingCapitalExposure } from "@/lib/calculations";
import { useWorkspace } from "./workspace-context";
import { Metric, PageTitle, RiskBadge, SectionHeader } from "./ui";
const priorities = [
  {
    id: "SKU-104",
    label: "Protect availability",
    happened: "Demand is 23% above the prior forecast.",
    matters: "Available cover is shorter than the standard supplier lead time.",
    decision: "Review an expedited purchase order now.",
    review: "Confirm supplier capacity, freight and receipt timing.",
    route: "/forecast",
    action: "Review forecast",
  },
  {
    id: "SKU-087",
    label: "Release working capital",
    happened: "Demand is 18% below plan, with 2,000 units incoming.",
    matters: "The current stock position extends well beyond demand needs.",
    decision: "Reduce or defer the next PO, or test a controlled promotion.",
    review: "Check cancellation terms and margin before changing the plan.",
    route: "/inventory",
    action: "Review purchasing",
  },
  {
    id: "SKU-031",
    label: "Validate campaign demand",
    happened: "The campaign lifted observed velocity by 34%.",
    matters:
      "Even with the confirmed receipt, coverage falls short of lead time plus safety stock.",
    decision: "Recalculate the next 8-week need before changing the PO plan.",
    review: "Separate event-window demand from the ongoing base case.",
    route: "/scenario",
    action: "Test scenario",
  },
];
export function Executive() {
  const w = useWorkspace(),
    m = catalogMetrics();
  return (
    <>
      <PageTitle
        section="MERCHANT INTELLIGENCE / WEEKLY DECISION BRIEF"
        title="Executive Intelligence Brief"
        description="A clear view of what changed, what matters, and what to do next."
        action={
          <button
            className="btn secondary print-button"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Export brief
          </button>
        }
      />
      <div className="brief-status">
        <span>
          <span className="status-dot" />
          Your weekly decision brief is ready
        </span>
        <span>
          <CalendarDays size={13} />
          Sep 14–20, 2026 <i /> <CheckCircle2 size={13} /> Analyst-reviewed
        </span>
      </div>
      <div className="metrics five">
        <Metric
          label="Annual Revenue"
          value={`$${(m.revenue / 1e6).toFixed(1)}M`}
          note="TTM · illustrative estimate"
        />
        <Metric
          label="Active SKUs"
          value={String(m.activeSkus)}
          note="Sellable catalog"
        />
        <Metric
          label="Inventory Value"
          value={`$${(m.inventoryValue / 1e6).toFixed(2)}M`}
          note="Illustrative cost estimate"
        />
        <Metric
          label="In-Stock Rate"
          value={`${m.inStockRate.toFixed(1)}%`}
          note="Weighted availability checks"
        />
        <Metric
          label="Avg Weeks Cover"
          value={m.weightedCover.toFixed(1)}
          note="Catalog · demand weighted"
        />
      </div>
      <SectionHeader
        eyebrow="THIS WEEK’S PRIORITIES"
        title="3 Decisions Requiring Attention This Week"
        detail={
          <span className="small-tag">3 analyst-reviewed priorities</span>
        }
      />
      <div className="priority-grid">
        {priorities.map((p, i) => {
          const s = skuById(p.id),
            v = inventoryMetrics(s);
          return (
            <article
              className={`priority-card priority-${v.risk.toLowerCase()}`}
              key={p.id}
            >
              <div className="priority-top">
                <RiskBadge risk={v.risk} />
                <span>0{i + 1}</span>
              </div>
              <p className="priority-label">{p.label}</p>
              <h3>{s.name}</h3>
              <span className="sku-label">
                {s.id} <i /> {s.category}
              </span>
              <div className="priority-stats">
                <div>
                  <strong>{formatUnits(s.currentInventory)}</strong>
                  <span>units on hand</span>
                </div>
                <div>
                  <strong>
                    {v.cover.toFixed(1)}
                    <small> w</small>
                  </strong>
                  <span>weeks cover</span>
                </div>
                <div>
                  <strong>
                    {s.leadTimeWeeks}
                    <small> w</small>
                  </strong>
                  <span>lead time</span>
                </div>
              </div>
              <div className="priority-narrative">
                <p>
                  <b>What happened</b>
                  {p.happened}
                </p>
                <p>
                  <b>Why it matters</b>
                  {p.matters} {formatUnits(s.baseWeeklyDemand)}/week.
                </p>
                <p>
                  <b>Decision required</b>
                  {p.decision}
                </p>
                <p>
                  <b>Recommended review</b>
                  {p.review}
                </p>
              </div>
              <div className="impact-note">
                {i === 0 ? (
                  <>
                    <strong>
                      {money(
                        workingCapitalExposure(
                          s.baseWeeklyDemand * 2,
                          s.unitPrice,
                        ),
                      )}
                    </strong>{" "}
                    lost gross revenue exposure if a stockout persists 2 weeks
                  </>
                ) : i === 1 ? (
                  <>
                    <strong>{money(v.workingCapital)}</strong> excess working
                    capital
                  </>
                ) : (
                  <>
                    <strong>{formatUnits(s.incomingUnits)} units</strong>{" "}
                    incoming · recalculate the next 8-week requirement
                  </>
                )}
                <small>Illustrative estimate</small>
              </div>
              <Link
                className="priority-link"
                href={p.route}
                onClick={() => w.selectSku(p.id)}
              >
                {p.action}
                <ArrowRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>
      {w.note && (
        <div className="notice scenario-note">
          <strong>Session scenario note</strong>
          <p>{w.note}</p>
        </div>
      )}
      <section className="card changes-card">
        <SectionHeader
          title="What Changed Since Last Week"
          detail={<span>5 changes · ranked by decision impact</span>}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Signal</th>
                <th>What happened</th>
                <th>Why it matters</th>
                <th>Required decision</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.area}>
                  <td>
                    <span className="table-category">{c.area}</span>
                    <small>{c.subject}</small>
                  </td>
                  <td>{c.happened}</td>
                  <td className="muted">{c.matters}</td>
                  <td>
                    {c.decision}
                    <ArrowUpRight size={12} className="inline-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footnote">
          All unit and financial impacts are illustrative estimates. Review
          assumptions with the merchant before acting.
        </div>
      </section>
      <div className="process-strip">
        <div className="process-icon">
          <CheckCircle2 size={23} />
        </div>
        <div>
          <strong>Intelligence with a review process behind it.</strong>
          <p>
            Refreshed data. Scenario-based planning assumptions. A considered
            merchant conversation.
          </p>
        </div>
        <Link href="/managed-intelligence">
          Explore the operating model <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}
