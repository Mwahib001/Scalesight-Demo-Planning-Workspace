import {
  skus,
  customerAggregate,
  reorderGroups,
  backtest,
  inventoryAssessments,
} from "../data/planning";
import { inventoryMetrics, mape, outsideReorderWindow } from "./calculations";
export function catalogMetrics() {
  const inventoryValue = skus.reduce(
    (n, s) => n + s.currentInventory * s.unitCost,
    0,
  );
  const weightedCover =
    skus.reduce((n, s) => n + s.currentInventory, 0) /
    skus.reduce((n, s) => n + s.baseWeeklyDemand, 0);
  const risks = skus.map((s) => ({ sku: s, ...inventoryMetrics(s) }));
  return {
    inventoryAtRisk: inventoryAssessments.reduce(
      (n, a) =>
        n + a.atRiskUnits * (skus.find((s) => s.id === a.skuId)?.unitCost ?? 0),
      0,
    ),
    poDecisions: inventoryAssessments.filter((a) => a.reviewThisWeek).length,
    revenue: customerAggregate.ttmNetRevenue,
    activeSkus: skus.length,
    inventoryValue,
    weightedCover,
    inStockRate:
      (customerAggregate.inStockChecks / customerAggregate.availabilityChecks) *
      100,
    stockoutRisk: risks.filter((r) => r.risk === "High").length,
    excessValue: risks.reduce((n, r) => n + r.workingCapital, 0),
    risks,
  };
}
export function growthMetrics() {
  return {
    repeatRate:
      (customerAggregate.repeatCustomers / customerAggregate.customers) * 100,
    repeatRevenue:
      (customerAggregate.quarterRepeatRevenue /
        customerAggregate.quarterNetRevenue) *
      100,
    value:
      customerAggregate.expected90DayNetRevenue / customerAggregate.customers,
    overdue: reorderGroups
      .filter((g) =>
        outsideReorderWindow(g.lastOrder, g.expectedDays, g.graceDays),
      )
      .reduce((n, g) => n + g.size, 0),
  };
}
export function validateFixtures() {
  const m = catalogMetrics();
  const assert = (value: boolean, message: string) => {
    if (!value) throw new Error(`Demo invariant: ${message}`);
  };
  assert(Math.abs(m.inventoryAtRisk - 184000) < 1, "risk assessment");
  assert(Math.abs(m.excessValue - 126000) < 1, "excess capital");
  assert(m.stockoutRisk === 7, "high risk SKUs");
  assert(m.poDecisions === 5, "PO decisions");
  assert(m.activeSkus === 142, "142 active SKUs");
  assert(Math.abs(m.revenue - 6800000) < 1, "TTM revenue");
  assert(Math.abs(m.inventoryValue - 1100000) < 1, "inventory cost");
  assert(m.inStockRate === 94, "availability checks");
  assert(Math.abs(m.weightedCover - 8.2) < 0.01, "weighted cover");
  assert(Math.abs((mape(backtest) ?? 0) - 18.4) < 0.0001, "MAPE");
  skus.forEach((s) =>
    assert(
      s.baseWeeklyDemand > 0 &&
        s.currentInventory >= 0 &&
        s.unitCost > 0 &&
        s.lossRate >= 0 &&
        s.lossRate < 1,
      `valid ${s.id}`,
    ),
  );
  return m;
}
