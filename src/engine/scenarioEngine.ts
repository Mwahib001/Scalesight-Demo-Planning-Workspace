import type { PlanningState } from "../data/entities";
import {
  skus,
  getSku,
  purchaseOrders,
  events,
  history,
} from "../data/kelarune";
import { forecastSku, revenueForDays, RETURNS_RATE } from "./forecastEngine";
import { inventoryFor } from "./inventoryEngine";
import { recommend } from "./recommendationEngine";
export function defaultState(id = "mango-12"): PlanningState {
  const sku = getSku(id);
  return {
    selectedSkuId: sku.id,
    forecastHorizon: 13,
    scenarioMode: "base",
    demandUpliftPct: 0,
    adSpendChangePct: 0,
    promotionEnabled: false,
    promotionDiscountPct: 0,
    leadTimeWeeks: sku.leadTimeWeeks,
    incomingInventory: purchaseOrders
      .filter(
        (p) =>
          p.skuId === sku.id &&
          p.status !== "planned" &&
          p.status !== "arrived",
      )
      .reduce((n, p) => n + p.quantity, 0),
    purchaseQuantity: 0,
  };
}
const clamp = (n: number, min: number, max: number, fallback: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
export function sanitizeState(s: PlanningState): PlanningState {
  const d = defaultState(s.selectedSkuId);
  return {
    ...s,
    selectedSkuId: d.selectedSkuId,
    forecastHorizon: [4, 8, 13, 26].includes(s.forecastHorizon)
      ? s.forecastHorizon
      : 13,
    scenarioMode: ["base", "upside", "downside"].includes(s.scenarioMode)
      ? s.scenarioMode
      : "base",
    promotionEnabled: !!s.promotionEnabled,
    demandUpliftPct: clamp(s.demandUpliftPct, 0, 50, 0),
    adSpendChangePct: clamp(s.adSpendChangePct, -20, 50, 0),
    promotionDiscountPct: clamp(s.promotionDiscountPct, 0, 40, 0),
    leadTimeWeeks: clamp(s.leadTimeWeeks, 2, 12, d.leadTimeWeeks),
    incomingInventory: Math.round(
      clamp(s.incomingInventory, 0, 1e7, d.incomingInventory),
    ),
    purchaseQuantity: Math.round(clamp(s.purchaseQuantity, 0, 1e7, 0)),
  };
}
export function demandMultiplier(s: PlanningState) {
  // Elasticity 0.6; diminishing factor 1/(1+abs(spend)/100) dampens larger spend changes.
  // Kept separate so a client-specific response curve can replace this illustrative assumption.
  const ad =
    1 +
    ((s.adSpendChangePct / 100) * 0.6) /
      (1 + Math.abs(s.adSpendChangePct) / 100);
  const mode =
    s.scenarioMode === "upside"
      ? 1.2
      : s.scenarioMode === "downside"
        ? 0.85
        : 1;
  return (
    mode *
    (1 + s.demandUpliftPct / 100) *
    ad *
    (s.promotionEnabled ? 1 + (s.promotionDiscountPct / 100) * 0.8 : 1)
  );
}
export function buildPlan(input: PlanningState) {
  const state = sanitizeState(input);
  const rows = skus.map((sku) => {
    const selected = sku.id === state.selectedSkuId;
    // Mode is portfolio-wide; the explicit controls apply only to the selected SKU.
    const scenario = selected
      ? state
      : { ...defaultState(sku.id), scenarioMode: state.scenarioMode };
    const allForecast = forecastSku(
      sku,
      26,
      events,
      demandMultiplier(scenario),
      scenario.promotionEnabled ? scenario.promotionDiscountPct / 100 : 0,
    );
    const forecast = allForecast.slice(0, state.forecastHorizon);
    const hasContext = events.some(
      (e) => e.type === "bfcm" && e.confirmed && e.skuIds.includes(sku.id),
    );
    const inventory = inventoryFor(
      sku,
      forecast,
      purchaseOrders,
      scenario.leadTimeWeeks,
      scenario.incomingInventory,
      scenario.purchaseQuantity,
      0,
      hasContext,
    );
    const recommendations = recommend(sku, inventory, events, history);
    return {
      sku,
      confidence:
        sku.historyWeeks < 26 ? ("Low" as const) : ("Moderate" as const),
      forecast,
      allForecast,
      inventory,
      recommendations,
      totalUnits: forecast.reduce((n, p) => n + p.units, 0),
      revenue: forecast.reduce((n, p) => n + p.revenue, 0),
      margin: forecast.reduce((n, p) => n + p.margin, 0),
    };
  });
  const revenueSeries = Array.from({ length: 26 }, (_, i) => ({
    weekStart: rows[0].allForecast[i].weekStart,
    revenue: rows.reduce((n, r) => n + r.allForecast[i].revenue, 0),
    previous: rows.reduce(
      (n, r) =>
        n +
        r.allForecast[i].previousForecast *
          r.allForecast[i].sellingPrice *
          (1 - RETURNS_RATE),
      0,
    ),
  }));
  const revenue30 = revenueForDays(revenueSeries, 30);
  const previous30 =
    skus.reduce(
      (n, s) =>
        n +
        history
          .filter((h) => h.skuId === s.id)
          .slice(-5)
          .reduce((t, h, i) => t + h.revenue * (i === 0 ? 2 / 7 : 1), 0),
      0,
    ) *
    (1 - RETURNS_RATE);
  const high = rows.filter((r) => r.inventory.risk === "High risk").length;
  const watch = rows.filter((r) => r.inventory.risk === "Watch").length;
  const selected = rows.find((r) => r.sku.id === state.selectedSkuId)!;
  return {
    state,
    rows,
    selected,
    revenueSeries,
    revenue30,
    previous30,
    revenueGrowthPct: (revenue30 / previous30 - 1) * 100,
    revenue13: revenueForDays(revenueSeries, 91),
    revenue26: revenueForDays(revenueSeries, 182),
    riskValue: rows.reduce((n, r) => n + r.inventory.riskValue, 0),
    high,
    watch,
    attention: high + watch,
    stockouts: rows.filter((r) => r.inventory.stockoutDate).length,
    confidence: "Moderate" as const,
    intelligence: rows
      .filter((r) => r.sku.detailed)
      .flatMap((r) => r.recommendations)
      .sort((a, b) => a.priority - b.priority),
    workingCapital: rows.reduce((n, r) => n + r.inventory.workingCapital, 0),
    isScenario:
      state.scenarioMode !== "base" ||
      state.demandUpliftPct !== 0 ||
      state.adSpendChangePct !== 0 ||
      state.promotionEnabled ||
      state.promotionDiscountPct !== 0 ||
      state.purchaseQuantity !== 0 ||
      state.leadTimeWeeks !== defaultState(state.selectedSkuId).leadTimeWeeks ||
      state.incomingInventory !==
        defaultState(state.selectedSkuId).incomingInventory,
  };
}
export type Plan = ReturnType<typeof buildPlan>;
export type PlanRow = Plan["rows"][number];
export function comparePlans(current: Plan, base: Plan) {
  const a = current.selected.inventory.stockoutDate,
    b = base.selected.inventory.stockoutDate;
  return {
    revenueDelta: current.revenue30 - base.revenue30,
    capitalDelta: current.workingCapital - base.workingCapital,
    stockoutDaysEarlier:
      a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 86400000) : null,
  };
}

export type PlanningAction =
  | { type: "update"; value: Partial<PlanningState> }
  | { type: "select"; id: string }
  | { type: "reset" };
export function planningReducer(
  state: PlanningState,
  action: PlanningAction,
): PlanningState {
  if (action.type === "reset") return defaultState();
  if (action.type === "select")
    return state.selectedSkuId === action.id
      ? state
      : {
          ...defaultState(action.id),
          forecastHorizon: state.forecastHorizon,
          scenarioMode: state.scenarioMode,
        };
  return sanitizeState({ ...state, ...action.value });
}
