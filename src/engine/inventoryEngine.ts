import type { Sku, PurchaseOrder, Risk } from "../data/entities";
import type { DemandPoint } from "./forecastEngine";
import { addDays, PLANNING_DATE } from "../data/dataset";
export interface ProjectionPoint {
  weekStart: string;
  projected: number;
  safety: number;
  arrivals: number;
  poIds: string[];
  planned: boolean;
  demand: number;
}
export function inventoryFor(
  sku: Sku,
  forecast: DemandPoint[],
  orders: PurchaseOrder[],
  leadTimeWeeks = sku.leadTimeWeeks,
  incomingInventory?: number,
  purchaseQuantity = 0,
  shrinkRate = 0,
  confirmedContext = false,
) {
  const relevant = orders.filter(
    (p) => p.skuId === sku.id && p.status !== "arrived",
  );
  const committed = relevant.filter((p) => p.status !== "planned");
  const baseIncoming = committed.reduce((n, p) => n + p.quantity, 0);
  const incoming = incomingInventory ?? baseIncoming;
  const resolved = relevant.map((p) => ({
    ...p,
    quantity:
      p.status === "planned"
        ? p.quantity
        : baseIncoming > 0
          ? (p.quantity * incoming) / baseIncoming
          : 0,
  }));
  if (baseIncoming === 0 && incoming > 0)
    resolved.push({
      id: "SCENARIO-INCOMING",
      skuId: sku.id,
      quantity: incoming,
      orderDate: PLANNING_DATE,
      expectedArrival: addDays(PLANNING_DATE, Math.ceil(leadTimeWeeks) * 7),
      status: "confirmed",
      unitCost: sku.unitCost,
    });
  // Lead-time edits move committed arrivals by the exact lead-time delta, preserving known supplier delays.
  resolved.forEach((p) => {
    if (p.status !== "planned" && p.id !== "SCENARIO-INCOMING")
      p.expectedArrival = addDays(
        p.expectedArrival,
        Math.round((leadTimeWeeks - sku.leadTimeWeeks) * 7),
      );
  });
  if (purchaseQuantity > 0)
    resolved.push({
      id: "SCENARIO-PURCHASE",
      skuId: sku.id,
      quantity: purchaseQuantity,
      orderDate: PLANNING_DATE,
      expectedArrival: addDays(PLANNING_DATE, Math.ceil(leadTimeWeeks) * 7),
      status: "planned",
      unitCost: sku.unitCost,
    });
  const weeklyDemand = forecast[0]?.units ?? 0;
  const usableInventory = sku.currentInventory * (1 - shrinkRate);
  const weeksOfCover = weeklyDemand > 0 ? usableInventory / weeklyDemand : 0;
  const safetyStock = weeklyDemand * sku.safetyStockWeeks;
  const leadTimeDemand = weeklyDemand * leadTimeWeeks;
  const requiredInventory = leadTimeDemand + safetyStock;
  const reorderGap = Math.max(
    0,
    requiredInventory - usableInventory - incoming,
  );
  let projected = usableInventory;
  const projection: ProjectionPoint[] = forecast.map((p, i) => {
    const start = p.weekStart,
      end = addDays(start, 7);
    const arrivals = resolved.filter(
      (o) => o.expectedArrival < end && (i === 0 || o.expectedArrival >= start),
    );
    const arrivalQty = arrivals.reduce((n, o) => n + o.quantity, 0);
    projected += arrivalQty - p.units;
    return {
      weekStart: start,
      projected,
      safety: p.units * sku.safetyStockWeeks,
      arrivals: arrivalQty,
      poIds: arrivals.map((o) => o.id),
      planned: arrivals.some((o) => o.status === "planned"),
      demand: p.units,
    };
  });
  const breach =
    projection.find((p) => p.projected < p.safety)?.weekStart ?? null;
  const stockoutDate =
    projection.find((p) => p.projected <= 0)?.weekStart ?? null;
  // Current cover excludes unarrived POs; future coverage is shown in the dated projection.
  const risk: Risk =
    (weeksOfCover < leadTimeWeeks + sku.safetyStockWeeks || stockoutDate) &&
    breach
      ? "High risk"
      : weeksOfCover > 10 && sku.trend < 0 && !confirmedContext
        ? "Overstock"
        : weeksOfCover < leadTimeWeeks + sku.safetyStockWeeks + 0.5
          ? "Watch"
          : "Healthy";
  const excessUnits =
    risk === "Overstock" ? Math.max(0, usableInventory - weeklyDemand * 8) : 0;
  const exposedUnits = risk === "High risk" ? usableInventory : excessUnits;
  return {
    weeklyDemand,
    usableInventory,
    weeksOfCover,
    incomingInventory: incoming,
    safetyStock,
    leadTimeDemand,
    requiredInventory,
    reorderGap,
    projection,
    breach,
    stockoutDate,
    risk,
    excessUnits,
    riskValue: exposedUnits * sku.unitCost,
    workingCapital: (incoming + purchaseQuantity) * sku.unitCost,
    purchaseCost: purchaseQuantity * sku.unitCost,
    orders: resolved,
  };
}
export type InventoryResult = ReturnType<typeof inventoryFor>;

export function purchaseOrderCost(order: PurchaseOrder) {
  return order.quantity * order.unitCost;
}
