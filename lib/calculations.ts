import type { Risk, ScenarioInput, Sku } from "@/lib/types";

export function scenarioMetrics(sku: Sku, input: ScenarioInput) {
  const demand = sku.baseWeeklyDemand * (1 + Math.min(0.5, Math.max(0, input.growthRate)));
  const usableInventory = sku.currentInventory * (1 - Math.min(0.08, Math.max(0, input.shrinkRate)));
  const leadTime = Math.min(10, Math.max(4, input.leadTimeWeeks));
  const safetyStock = demand * sku.safetyStockWeeks;
  const requiredInventory = demand * leadTime + safetyStock;
  const reorderGap = Math.max(0, requiredInventory - usableInventory - Math.max(0, input.incomingUnits));
  const cover = demand > 0 ? usableInventory / demand : null;
  const baseCover = sku.baseWeeklyDemand > 0 ? sku.currentInventory / sku.baseWeeklyDemand : null;
  const risk: Risk = cover === null ? "watch" : cover < leadTime + sku.safetyStockWeeks ? "high" : cover > 10 && sku.id === "seasonal-summer-pack" ? "overstock" : cover < leadTime + sku.safetyStockWeeks + 1.5 ? "watch" : "healthy";
  return { demand, usableInventory, safetyStock, requiredInventory, reorderGap, cover, baseCover, risk };
}

export function displayCover(value: number | null) {
  return value === null || !Number.isFinite(value) ? "Not available" : `${value.toFixed(1)}w`;
}
