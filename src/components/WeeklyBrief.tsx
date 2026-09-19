"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  CircleCheck,
  Package,
  Radio,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { usePlanning } from "../context/PlanningContext";
import { money, number, percent } from "../engine/formatters";
import { MetricCard } from "./MetricCard";
import { PriorityCard } from "./PriorityCard";
import { PageHeading, SectionHeading, PlanLink } from "./ui";
export function WeeklyBrief() {
  const { plan, state } = usePlanning();
  const mango = plan.rows.find((r) => r.sku.id === "mango-12")!;
  const berry = plan.rows.find((r) => r.sku.id === "berry-6")!;
  const winter = plan.rows.find((r) => r.sku.id === "winter-kit")!;
  const mangoReview = mango.recommendations.find(
    (r) => r.title === "Forecast Review Required",
  );
  const priorities = [
    {
      row: mango,
      title: "Protect your fastest mover",
      kind: "DEMAND ACCELERATION",
      metric: `${number(mango.inventory.weeksOfCover, 1)} weeks`,
      metricLabel: "Mango inventory cover",
      href: "/sku-planning",
    },
    {
      row: berry,
      title:
        berry.inventory.risk === "Overstock"
          ? "Put tied-up cash to work"
          : berry.inventory.risk === "High risk"
            ? "Protect Berry supply"
            : "Review Berry replenishment",
      kind:
        berry.inventory.risk === "Overstock"
          ? "INVENTORY OPPORTUNITY"
          : "SUPPLY PLANNING",
      metric: money(berry.inventory.riskValue),
      metricLabel: `Berry ${berry.inventory.riskValueLabel}`,
      href: "/inventory",
    },
    {
      row: winter,
      title: "Get ahead of BFCM",
      kind: "SEASONAL READINESS",
      metric: "Context matters",
      metricLabel: "Confirmed campaign, declining history",
      href: "/scenario",
    },
  ];
  const changes = [
    {
      Icon: TrendingUp,
      title: mangoReview
        ? "Mango demand is ahead of plan"
        : "Review Mango demand and supply",
      detail: mangoReview?.whatChanged ?? mango.recommendations[0].whatChanged,
      tag: "Demand",
      href: "/demand-forecast",
      sku: "mango-12",
    },
    {
      Icon: Truck,
      title: "Blood Orange shipment delayed",
      detail:
        plan.rows
          .find((r) => r.sku.id === "orange-12")!
          .recommendations.find((r) => r.title === "Replenishment Timing Risk")
          ?.whatChanged ?? "Review the supplier arrival assumption.",
      tag: "Supplier",
      href: "/sku-planning",
      sku: "orange-12",
    },
    {
      Icon: CalendarDays,
      title: "BFCM campaign is confirmed",
      detail: "Winter Discovery Kit inventory retained after analyst review.",
      tag: "Business context",
      href: "/intelligence",
      sku: "winter-kit",
    },
    {
      Icon: Package,
      title:
        berry.inventory.risk === "Overstock"
          ? "Berry purchasing needs a pause"
          : "Review Berry supply timing",
      detail: berry.recommendations[0].whatChanged,
      tag: "Inventory",
      href: "/inventory",
      sku: "berry-6",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="YOUR WEEKLY DECISION BRIEF"
        title="Weekly Planning Brief"
        description="What changed, what needs attention, and what your team should decide this week."
      />
      <div className="brief-status">
        <span>
          <span className="status-dot" />
          Planning system updated
        </span>
        <span>
          <CheckCheck size={15} />
          Reviewed by the ScaleSight team
        </span>
        <span>
          Next planning review <strong>Monday, Sep 21</strong>
        </span>
      </div>
      <div className="metrics five">
        <MetricCard
          label="30-day revenue outlook"
          value={money(plan.revenue30)}
          delta={
            plan.revenueGrowthPct === null
              ? "No comparable sales"
              : `${percent(plan.revenueGrowthPct)} vs previous 30 days`
          }
          qualifier="Net sales · after expected returns"
          accent
        />
        <MetricCard
          label="Inventory at risk"
          value={money(plan.riskValue)}
          qualifier="Stock cost exposed to supply / excess risk"
        />
        <MetricCard
          label="SKUs requiring attention"
          value={String(plan.attention).padStart(2, "0")}
          delta={`${plan.high} high risk · ${plan.watch} watch`}
          qualifier="Overstock reviewed separately"
        />
        <MetricCard
          label="Projected stockouts"
          value={String(plan.stockouts).padStart(2, "0")}
          qualifier={`Within the next ${state.forecastHorizon} weeks`}
        />
        <MetricCard
          label="Forecast confidence"
          value={plan.confidence}
          qualifier="BFCM + new-product assumptions"
        />
      </div>
      <SectionHeading
        title="This Week’s Planning Priorities"
        description="Three decisions to move your business forward."
      >
        <Link href="/intelligence" className="text-link">
          View intelligence center <ArrowRight size={15} />
        </Link>
      </SectionHeading>
      <div className="priority-grid">
        {priorities.map((p, i) => (
          <PriorityCard
            key={p.row.sku.id}
            priority={i + 1}
            title={p.title}
            kind={p.kind}
            item={
              (p.row.inventory.risk !== "High risk"
                ? p.row.recommendations.find(
                    (r) => r.title === "Business context changes the decision",
                  )
                : undefined) ?? p.row.recommendations[0]
            }
            risk={p.row.inventory.risk}
            metric={p.metric}
            metricLabel={p.metricLabel}
            href={p.href}
            skuId={p.row.sku.id}
          />
        ))}
      </div>
      <div className="brief-lower">
        <section className="panel changes-panel">
          <SectionHeading title="What Changed Since Last Week">
            <span className="subtle-badge">Analyst reviewed</span>
          </SectionHeading>
          {changes.map((c) => (
            <div className="change-row" key={c.title}>
              <span className="change-icon">
                <c.Icon size={18} />
              </span>
              <div>
                <h3>{c.title}</h3>
                <p>{c.detail}</p>
              </div>
              <PlanLink href={c.href} skuId={c.sku}>
                {c.tag}
              </PlanLink>
            </div>
          ))}
          <details className="more-changes">
            <summary>Show all 7 material changes</summary>
            <p>
              Forecast:{" "}
              {mangoReview?.whatChanged ?? mango.recommendations[0].whatChanged}
            </p>
            <p>
              Promotion: Starter Kit uplift and discount scheduled for Oct 26.
            </p>
            <p>
              Launch: Peach continues with eight weeks of observations and a
              Lime analog.
            </p>
          </details>
        </section>
        <aside className="analyst-note">
          <span className="eyebrow">
            <Sparkles size={15} />
            THE ANALYST’S PERSPECTIVE
          </span>
          <h2>{plan.outlook.title}</h2>
          <p>{plan.outlook.detail}</p>
          <div className="analyst-signature">
            <span className="profile-avatar">SS</span>
            <div>
              <strong>Your ScaleSight team</strong>
              <small>Analysis reviewed · Sep 17, 2026</small>
            </div>
            <CircleCheck size={17} />
          </div>
          <Link href="/managed-intelligence" className="text-link">
            See the intelligence behind your plan <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
      <div className="managed-strip">
        <span className="managed-strip-icon">
          <Radio size={22} />
        </span>
        <div>
          <strong>A planning system. A team behind it.</strong>
          <p>
            Continuous monitoring, considered recommendations, and a clear next
            step.
          </p>
        </div>
        <div className="mini-workflow">
          Monitor <span>→</span> Analyze <span>→</span> Recommend <span>→</span>{" "}
          Review
        </div>
        <Link
          href="/managed-intelligence"
          aria-label="Explore managed intelligence"
        >
          <ArrowRight size={20} />
        </Link>
      </div>
    </>
  );
}
