"use client";
import { FlaskConical } from "lucide-react";
import { usePlanning } from "../context/PlanningContext";
import { money, number, date } from "../engine/formatters";
import { ScenarioControls } from "./ScenarioControls";
import { InventoryProjectionChart } from "./InventoryProjectionChart";
import { RecommendationPanel } from "./RecommendationPanel";
import { RiskBadge } from "./RiskBadge";
import {
  PageHeading,
  SectionHeading,
  HorizonSwitcher,
  Interpretation,
} from "./ui";
export function ScenarioView() {
  const { plan, base, comparison } = usePlanning();
  const r = plan.selected,
    b = base.selected;
  const results = [
    [
      "Weekly demand",
      number(b.inventory.weeklyDemand),
      number(r.inventory.weeklyDemand),
    ],
    ["30-day portfolio revenue", money(base.revenue30), money(plan.revenue30)],
    ["SKU margin over horizon", money(b.margin), money(r.margin)],
    [
      "Weeks of cover",
      number(b.inventory.weeksOfCover, 1),
      number(r.inventory.weeksOfCover, 1),
    ],
    ["Safety breach week", date(b.inventory.breach), date(r.inventory.breach)],
    [
      "Stockout week",
      date(b.inventory.stockoutDate),
      date(r.inventory.stockoutDate),
    ],
    [
      "Required inventory",
      number(b.inventory.requiredInventory),
      number(r.inventory.requiredInventory),
    ],
    [
      "Reorder gap",
      number(b.inventory.reorderGap),
      number(r.inventory.reorderGap),
    ],
    [
      "Committed + purchase cost",
      money(b.inventory.workingCapital),
      money(r.inventory.workingCapital),
    ],
  ];
  return (
    <>
      <PageHeading
        eyebrow="UNDERSTAND THE TRADE-OFF"
        title="Scenario Planning"
        description="See how a change in demand, spend, or supply changes the decision—before committing."
      />
      <div className="illustrative-notice">
        <FlaskConical size={17} />
        Illustrative, assumption-based scenarios. No orders are placed and no
        advertising spend is changed.
      </div>
      <div className="scenario-layout">
        <ScenarioControls />
        <div className="scenario-results">
          <section className="panel">
            <SectionHeading title="What changes in this plan?">
              <RiskBadge risk={r.inventory.risk} />
            </SectionHeading>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Planning data table"
            >
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Planning measure</th>
                    <th>Base plan</th>
                    <th>Current scenario</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(([label, a, z]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{a}</td>
                      <td className={a !== z ? "changed-value" : ""}>{z}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="chart-note">
              SKU margin is net revenue minus product cost; media spend,
              fulfillment, and overhead are excluded.
            </p>
            <Interpretation>
              {comparison.stockoutExplanation} The portfolio working-capital
              change is {money(comparison.capitalDelta)}. Review both purchasing
              quantity and arrival timing.
            </Interpretation>
          </section>
          <section className="panel">
            <SectionHeading title="The resulting inventory trajectory">
              <HorizonSwitcher />
            </SectionHeading>
            <InventoryProjectionChart inventory={r.inventory} />
          </section>
          <RecommendationPanel item={r.recommendations[0]} />
        </div>
      </div>
    </>
  );
}
