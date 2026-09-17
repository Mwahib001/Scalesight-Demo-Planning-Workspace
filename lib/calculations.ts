import type {
  SKU,
  ScenarioInput,
  Risk,
  ProjectionPoint,
  CustomerOrder,
  ForecastVersion,
  WeeklyActual,
} from "./types";
const finite = (n: number, fallback: number) =>
  Number.isFinite(n) ? n : fallback;
export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, finite(n, min)));
export const usableInventory = (stock: number, loss: number) =>
  stock * (1 - loss);
export const weeksCover = (stock: number, demand: number) =>
  demand > 0 ? stock / demand : 0;
export const requiredInventory = (
  demand: number,
  lead: number,
  safety: number,
) => demand * (lead + safety);
export const reorderGap = (
  required: number,
  usable: number,
  incoming: number,
) => Math.max(0, required - usable - incoming);
export const excessUnits = (
  postIncoming: number,
  demand: number,
  threshold: number,
) => Math.max(0, postIncoming - demand * threshold);
export const workingCapitalExposure = (units: number, cost: number) =>
  units * cost;
export const defaultScenario = (sku: SKU): ScenarioInput => ({
  demandChange: 0,
  leadTimeChange: 0,
  promotion: false,
  adSpendChange: 0,
  incomingUnits: sku.incomingUnits,
  incomingWeek: sku.incomingWeek || 3,
  supplierDelay: false,
  delayWeeks: 2,
  safetyWeeks: sku.safetyStockWeeks,
});
export function validateInput(
  sku: SKU,
  input: ScenarioInput,
  horizon = 13,
): ScenarioInput {
  const d = defaultScenario(sku);
  return {
    demandChange: clamp(finite(input.demandChange, d.demandChange), -0.2, 0.5),
    leadTimeChange: clamp(finite(input.leadTimeChange, 0), -2, 6),
    promotion: input.promotion === true,
    adSpendChange: clamp(finite(input.adSpendChange, 0), -0.5, 1),
    incomingUnits: Math.round(
      clamp(finite(input.incomingUnits, d.incomingUnits), 0, 100000),
    ),
    incomingWeek: clamp(finite(input.incomingWeek, d.incomingWeek), 1, horizon),
    supplierDelay: input.supplierDelay === true,
    delayWeeks: clamp(finite(input.delayWeeks, 2), 0, 6),
    safetyWeeks: clamp(finite(input.safetyWeeks, d.safetyWeeks), 0.5, 4),
  };
}
export function simulateInventory(
  stock: number,
  demand: readonly number[],
  receipts: readonly { week: number; units: number }[],
  safety: number,
): {
  points: ProjectionPoint[];
  stockout: number | null;
  breach: number | null;
} {
  let onHand = stock,
    stockout: number | null = null,
    breach: number | null = null;
  const points: ProjectionPoint[] = [{ week: 0, onHand, safety, receipt: 0 }];
  demand.forEach((units, i) => {
    // Receipts land at a week boundary, after consumption to that boundary.
    const before = onHand;
    onHand -= units;
    if (stockout === null && onHand <= 0)
      stockout = i + clamp(before / Math.max(units, 1), 0, 1);
    if (breach === null && onHand < safety)
      breach = i + clamp((before - safety) / Math.max(units, 1), 0, 1);
    const receipt = receipts
      .filter((r) => Math.ceil(r.week) === i + 1)
      .reduce((n, r) => n + r.units, 0);
    if (receipt) points.push({ week: i + 1, onHand, safety, receipt: 0 });
    onHand += receipt;
    points.push({ week: i + 1, onHand, safety, receipt });
  });
  return { points, stockout, breach };
}
export function riskState(
  sku: SKU,
  cover: number,
  postIncomingCover: number,
  breach: number | null,
  lead = sku.leadTimeWeeks,
  safety = sku.safetyStockWeeks,
): Risk {
  if (postIncomingCover > sku.excessCoverThreshold && sku.demandDelta <= 0)
    return "Excess";
  if ((breach !== null && breach < lead) || cover < lead + safety)
    return "High";
  if (cover < lead + safety + 1.5 || sku.materialEvent || sku.uncertainReceipt)
    return "Watch";
  return "Healthy";
}
export function inventoryMetrics(sku: SKU) {
  const usable = usableInventory(sku.currentInventory, sku.lossRate),
    safety = sku.baseWeeklyDemand * sku.safetyStockWeeks;
  const needDate = Math.max(0, (usable - safety) / sku.baseWeeklyDemand);
  const eligibleIncoming = sku.incomingWeek <= needDate ? sku.incomingUnits : 0;
  const projection = simulateInventory(
    usable,
    Array(26).fill(sku.baseWeeklyDemand),
    sku.incomingUnits
      ? [{ week: sku.incomingWeek, units: sku.incomingUnits }]
      : [],
    safety,
  );
  const required = requiredInventory(
    sku.baseWeeklyDemand,
    sku.leadTimeWeeks,
    sku.safetyStockWeeks,
  );
  const excess = excessUnits(
    sku.currentInventory + sku.incomingUnits,
    sku.baseWeeklyDemand,
    sku.excessCoverThreshold,
  );
  const cover = weeksCover(sku.currentInventory, sku.baseWeeklyDemand);
  return {
    usable,
    safety,
    needDate,
    eligibleIncoming,
    required,
    reorderGap: reorderGap(required, usable, eligibleIncoming),
    excess,
    workingCapital: workingCapitalExposure(excess, sku.unitCost),
    cover,
    projection,
    risk: riskState(
      sku,
      weeksCover(usable + eligibleIncoming, sku.baseWeeklyDemand),
      weeksCover(
        sku.currentInventory + sku.incomingUnits,
        sku.baseWeeklyDemand,
      ),
      projection.breach,
    ),
  };
}
export const riskRank = { High: 0, Excess: 1, Watch: 2, Healthy: 3 };
export function runScenario(
  sku: SKU,
  raw: ScenarioInput,
  horizon = 13,
  channel = "All",
) {
  const input = validateInput(sku, raw, horizon);
  const lead = Math.max(
    1,
    sku.leadTimeWeeks +
      input.leadTimeChange +
      (input.supplierDelay ? input.delayWeeks : 0),
  );
  const elasticity = channel === "Online Store" ? sku.elasticity : undefined;
  const demand =
    sku.baseWeeklyDemand *
    (1 + input.demandChange) *
    (1 + (elasticity ?? 0) * input.adSpendChange);
  // Explicit two-week promotion window (weeks 2 and 3). No permanent uplift.
  const weeklyDemand = Array.from(
    { length: Math.max(horizon, Math.ceil(lead + input.safetyWeeks)) },
    (_, i) => demand * (input.promotion && i >= 1 && i <= 2 ? 1.15 : 1),
  );
  const usable = usableInventory(sku.currentInventory, sku.lossRate),
    safety = demand * input.safetyWeeks;
  const noReceipt = simulateInventory(usable, weeklyDemand, [], safety);
  const incomingWeek =
    input.incomingWeek + (input.supplierDelay ? input.delayWeeks : 0);
  const eligibleIncoming =
    incomingWeek <= (noReceipt.breach ?? horizon) ? input.incomingUnits : 0;
  const projection = simulateInventory(
    usable,
    weeklyDemand,
    input.incomingUnits
      ? [{ week: incomingWeek, units: input.incomingUnits }]
      : [],
    safety,
  );
  const required =
    requiredInventory(demand, lead, input.safetyWeeks) +
    weeklyDemand.slice(0, Math.floor(lead)).reduce((n, d) => n + d - demand, 0);
  const rawCalculatedGap = reorderGap(required, usable, eligibleIncoming);
  const recommendedRoundedUnits =
    rawCalculatedGap > 0
      ? Math.max(
          sku.moq,
          Math.ceil(rawCalculatedGap / sku.packSize) * sku.packSize,
        )
      : 0;
  const base = inventoryMetrics(sku);
  const basePO =
    base.reorderGap > 0
      ? Math.max(
          sku.moq,
          Math.ceil(base.reorderGap / sku.packSize) * sku.packSize,
        )
      : 0;
  const capitalImpact = (recommendedRoundedUnits - basePO) * sku.unitCost;
  const recommendation =
    rawCalculatedGap > 0
      ? `Review ${recommendedRoundedUnits.toLocaleString("en-US")} units with purchasing; ${eligibleIncoming < input.incomingUnits ? "bring the planned receipt forward or evaluate partial expedited replenishment." : "evaluate supplier capacity and an expedited replenishment option."}`
      : "Current modeled supply covers the requirement. Review receipt timing before adding a purchase order.";
  return {
    input,
    lead,
    demand,
    weeklyDemand,
    required,
    rawCalculatedGap,
    recommendedRoundedUnits,
    basePO,
    capitalImpact,
    eligibleIncoming,
    projection,
    recommendation,
    adEffectApplied: elasticity !== undefined,
    risk: riskState(
      sku,
      (usable + eligibleIncoming) / demand,
      (sku.currentInventory + input.incomingUnits) / demand,
      projection.breach,
      lead,
      input.safetyWeeks,
    ),
  };
}
// The supplied fixture rounds its 1.33-week safety input and truncates raw units.
// Preserve those explicit display conventions; keep the general engine unrounded.
export function reconciliationFixture(demandChange = 0.25, delay = 2) {
  const demand = 1050 * (1 + demandChange),
    required = Math.floor(requiredInventory(demand, 6 + delay, 1.33));
  const available = 9800,
    rawCalculatedGap = reorderGap(required, available, 0);
  const contingency = rawCalculatedGap > 0 ? 1000 : 0;
  const recommendedRoundedUnits =
    rawCalculatedGap > 0
      ? Math.max(1200, Math.ceil((rawCalculatedGap + contingency) / 600) * 600)
      : 0;
  return {
    demand,
    baseRequired: Math.round(requiredInventory(1050, 8, 1.33) / 50) * 50,
    rawRequired: required,
    displayRequired: Math.ceil(required / 50) * 50,
    available,
    rawCalculatedGap,
    recommendedRoundedUnits,
    roundingAllowance: recommendedRoundedUnits - rawCalculatedGap,
    capitalImpact: workingCapitalExposure(recommendedRoundedUnits, 7.5),
  };
}
export function mape(
  rows: readonly { actual: number; previousForecast: number }[],
) {
  const valid = rows.filter((r) => r.actual > 0);
  return valid.length
    ? (valid.reduce(
        (n, r) => n + Math.abs(r.actual - r.previousForecast) / r.actual,
        0,
      ) /
        valid.length) *
        100
    : null;
}
export function confidence(
  historyLength: number,
  residual: number,
  eventUncertainty: boolean,
) {
  return historyLength >= 52 && residual < 0.12 && !eventUncertainty
    ? "Higher"
    : historyLength >= 26 && residual < 0.3
      ? "Moderate"
      : "Limited";
}
export function rollingRefresh(
  history: readonly WeeklyActual[],
  prior: ForecastVersion,
  actual: WeeklyActual,
  issuedAt: string,
) {
  if (prior.issuedAt >= actual.weekStart)
    throw new Error(
      "Comparison requires a version committed before the actual week.",
    );
  const appended = [...history, actual];
  const committed = prior.weeks.find((w) => w.weekStart === actual.weekStart);
  if (!committed)
    throw new Error("No committed comparison exists for this actual.");
  const comparison = {
    actual: actual.units,
    previousForecast: committed.units,
    variance: actual.units - committed.units,
  };
  const base =
    appended.slice(-4).reduce((n, r) => n + r.units, 0) /
    Math.min(4, appended.length);
  const updated: ForecastVersion = {
    ...prior,
    id: `${prior.id}-refresh`,
    issuedAt,
    weeks: prior.weeks.map((w) => ({
      ...w,
      units: w.weekStart > actual.weekStart ? Math.round(base) : w.units,
    })),
  };
  return {
    history: appended,
    comparison,
    updated,
    interpretation:
      comparison.variance > 0
        ? "Observed demand above the committed plan."
        : "Observed demand at or below the committed plan.",
    priorVersion: prior,
  };
}
export const outsideReorderWindow = (
  last: string,
  days: number,
  grace: number,
  today = "2026-09-14",
) => Date.parse(today) > Date.parse(last) + (days + grace) * 86400000;
export function customerMetrics(
  orders: readonly CustomerOrder[],
  window?: { start: string; end: string },
) {
  const completed = orders.filter(
    (o) =>
      o.status === "completed" &&
      (!window || (o.date >= window.start && o.date <= window.end)),
  );
  const ids = new Set(completed.map((o) => o.customerId));
  const counts = new Map<string, number>();
  completed.forEach((o) =>
    counts.set(o.customerId, (counts.get(o.customerId) ?? 0) + 1),
  );
  return {
    repeatPurchaseRate: ids.size
      ? [...counts.values()].filter((n) => n >= 2).length / ids.size
      : 0,
    newRevenue: completed
      .filter((o) => o.sequence === 1)
      .reduce((n, o) => n + o.netRevenue, 0),
    repeatRevenue: completed
      .filter((o) => o.sequence > 1)
      .reduce((n, o) => n + o.netRevenue, 0),
    realized90DayValue: completed
      .filter(
        (o) =>
          Date.parse(o.date) >= Date.parse(o.acquiredAt) &&
          Date.parse(o.date) < Date.parse(o.acquiredAt) + 90 * 86400000,
      )
      .reduce((n, o) => n + o.netRevenue, 0),
  };
}

// Mean absolute one-step residual against the preceding four observations.
// This internal stability heuristic is not an accuracy claim or a backtest.
export function residualStability(values: readonly number[]) {
  const residuals = values.slice(4).map((actual, i) => {
    const priorMean = values.slice(i, i + 4).reduce((n, v) => n + v, 0) / 4;
    return priorMean > 0 ? Math.abs(actual - priorMean) / priorMean : 1;
  });
  return residuals.length
    ? residuals.reduce((n, v) => n + v, 0) / residuals.length
    : 1;
}

export const priorForecastVariance = (actual: number, prior: number) =>
  prior > 0 ? ((actual - prior) / prior) * 100 : null;
export function meanPriorForecastVariance(
  rows: readonly { actual: number; previousForecast: number }[],
) {
  const valid = rows.filter((r) => r.previousForecast > 0);
  return valid.length
    ? valid.reduce(
        (n, r) =>
          n + Math.abs(priorForecastVariance(r.actual, r.previousForecast)!),
        0,
      ) / valid.length
    : null;
}
export function repeatRateFromBuckets(
  buckets: readonly { completedOrders: number; customers: number }[],
) {
  const eligible = buckets.filter((b) => b.completedOrders >= 1);
  const total = eligible.reduce((n, b) => n + b.customers, 0);
  return total
    ? eligible
        .filter((b) => b.completedOrders >= 2)
        .reduce((n, b) => n + b.customers, 0) / total
    : 0;
}
