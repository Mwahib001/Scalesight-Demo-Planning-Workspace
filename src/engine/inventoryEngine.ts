import type {
  Sku,
  PurchaseOrder,
  Risk,
  InventorySnapshot,
} from "../data/entities";
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
function projectInventory(
  current: number,
  forecast: DemandPoint[],
  orders: PurchaseOrder[],
) {
  let projected = current;
  return forecast.map((p, i): ProjectionPoint => {
    const end = addDays(p.weekStart, 7);
    const arrivals = orders.filter(
      (o) =>
        o.expectedArrival < end &&
        (i === 0 || o.expectedArrival >= p.weekStart),
    );
    const arrivalQty = arrivals.reduce((sum, o) => sum + o.quantity, 0);
    projected += arrivalQty - p.units;
    return {
      weekStart: p.weekStart,
      projected,
      safety: 0,
      arrivals: arrivalQty,
      poIds: arrivals.map((o) => o.id),
      planned: arrivals.some((o) => o.status === "planned"),
      demand: p.units,
    };
  });
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
  snapshot?: InventorySnapshot,
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
      expectedArrival: addDays(PLANNING_DATE, Math.round(leadTimeWeeks * 7)),
      status: "confirmed",
      unitCost: sku.unitCost,
    });
  // Shift all existing supply, including unconfirmed plans, by the same delta.
  // Shift the original date too so the supplier-delay counterfactual stays comparable.
  resolved.forEach((p) => {
    if (p.id !== "SCENARIO-INCOMING") {
      const delta = Math.round((leadTimeWeeks - sku.leadTimeWeeks) * 7);
      p.expectedArrival = addDays(p.expectedArrival, delta);
      if (p.originalArrival)
        p.originalArrival = addDays(p.originalArrival, delta);
    }
  });
  if (purchaseQuantity > 0)
    resolved.push({
      id: "SCENARIO-PURCHASE",
      skuId: sku.id,
      quantity: purchaseQuantity,
      orderDate: PLANNING_DATE,
      expectedArrival: addDays(PLANNING_DATE, Math.round(leadTimeWeeks * 7)),
      status: "planned",
      unitCost: sku.unitCost,
    });
  const weeklyDemand = forecast[0]?.units ?? 0;
  const currentInventory = snapshot?.onHand ?? sku.currentInventory;
  const availableInventory = snapshot?.available ?? currentInventory;
  const usableInventory = currentInventory * (1 - shrinkRate);
  const weeksOfCover = weeklyDemand > 0 ? availableInventory / weeklyDemand : 0;
  const safetyStock = weeklyDemand * sku.safetyStockWeeks;
  const leadTimeDemand = weeklyDemand * leadTimeWeeks;
  const requiredInventory = leadTimeDemand + safetyStock;
  const reorderGap = Math.max(
    0,
    requiredInventory - usableInventory - incoming,
  );
  const projection = projectInventory(currentInventory, forecast, resolved).map(
    (p) => ({ ...p, safety: p.demand * sku.safetyStockWeeks }),
  );
  const breach =
    projection.find((p) => p.projected < p.safety)?.weekStart ?? null;
  const stockoutDate =
    projection.find((p) => p.projected <= 0)?.weekStart ?? null;
  const delayImpacts = resolved
    .filter(
      (o) =>
        o.status === "delayed" &&
        o.quantity > 0 &&
        o.originalArrival &&
        o.originalArrival < o.expectedArrival,
    )
    .flatMap((order) => {
      const original = projectInventory(
        currentInventory,
        forecast,
        resolved.map((o) =>
          o.id === order.id
            ? { ...o, expectedArrival: order.originalArrival! }
            : o,
        ),
      );
      const originalBreach =
        original.find((p) => p.projected < p.demand * sku.safetyStockWeeks)
          ?.weekStart ?? null;
      const originalStockout =
        original.find((p) => p.projected <= 0)?.weekStart ?? null;
      const worsensBreach =
        breach && (!originalBreach || breach < originalBreach);
      const worsensStockout =
        stockoutDate && (!originalStockout || stockoutDate < originalStockout);
      return worsensBreach || worsensStockout
        ? [{ order, originalBreach, originalStockout }]
        : [];
    });
  const forwardDemandDeclining =
    (forecast.at(-1)?.units ?? weeklyDemand) < weeklyDemand;
  // Current cover excludes unarrived POs; future coverage is shown in the dated projection.
  const risk: Risk =
    (weeksOfCover < leadTimeWeeks + sku.safetyStockWeeks || stockoutDate) &&
    breach
      ? "High risk"
      : weeksOfCover > 10 && forwardDemandDeclining && !confirmedContext
        ? "Overstock"
        : weeklyDemand > 0 &&
            weeksOfCover < leadTimeWeeks + sku.safetyStockWeeks + 0.5
          ? "Watch"
          : "Healthy";
  const excessUnits =
    risk === "Overstock" ? Math.max(0, usableInventory - weeklyDemand * 8) : 0;
  const exposedUnits = risk === "High risk" ? usableInventory : excessUnits;
  return {
    weeklyDemand,
    currentInventory,
    availableInventory,
    usableInventory,
    weeksOfCover,
    incomingInventory: incoming,
    safetyStock,
    leadTimeDemand,
    requiredInventory,
    reorderGap,
    purchaseQuantity,
    additionalPurchaseNeeded: Math.max(0, reorderGap - purchaseQuantity),
    delayImpacts,
    projection,
    breach,
    stockoutDate,
    risk,
    excessUnits,
    riskValue: exposedUnits * sku.unitCost,
    riskValueLabel:
      risk === "Overstock"
        ? "excess stock at cost"
        : risk === "High risk"
          ? "stock exposed to shortage"
          : "stock exposure",
    workingCapital: (incoming + purchaseQuantity) * sku.unitCost,
    purchaseCost: purchaseQuantity * sku.unitCost,
    orders: resolved,
  };
}
export type InventoryResult = ReturnType<typeof inventoryFor>;

export function purchaseOrderCost(order: PurchaseOrder) {
  return order.quantity * order.unitCost;
}
