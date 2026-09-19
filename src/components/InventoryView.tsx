"use client";
import { usePlanning } from "../context/PlanningContext";
import { money } from "../engine/formatters";
import {
  PageHeading,
  SectionHeading,
  HorizonSwitcher,
  Interpretation,
} from "./ui";
import { MetricCard } from "./MetricCard";
import { InventoryHealthTable } from "./InventoryHealthTable";
export function InventoryView() {
  const { plan, state } = usePlanning();
  return (
    <>
      <PageHeading
        eyebrow="WHAT’S AT RISK"
        title="Inventory Health"
        description="Prioritize supply gaps, protect availability, and put working capital where it matters."
      />
      <div className="metrics four">
        <MetricCard
          label="Inventory at risk"
          value={money(plan.riskValue)}
          qualifier="Exposed stock at cost, not lost revenue"
          accent
        />
        <MetricCard
          label="High-risk products"
          value={String(plan.high)}
          qualifier="Breach visible in the selected horizon"
        />
        <MetricCard
          label="Projected stockouts"
          value={String(plan.stockouts)}
          qualifier={`Within ${state.forecastHorizon} weeks`}
        />
        <MetricCard
          label="SKUs on watch"
          value={String(plan.watch)}
          qualifier="Narrow replenishment buffer"
        />
      </div>
      <section className="panel">
        <SectionHeading
          title="Prioritized inventory decisions"
          description="Open a product to inspect the forecast, purchase orders, and recommendation."
        >
          <HorizonSwitcher />
        </SectionHeading>
        <InventoryHealthTable />
        <Interpretation>
          Weeks of cover uses stock available today. Incoming stock only
          contributes when its arrival week is reached. A large purchase order
          can still arrive too late; check timing as well as quantity.
        </Interpretation>
      </section>
    </>
  );
}
