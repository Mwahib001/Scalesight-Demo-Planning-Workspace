import type { Sku, ForecastPoint, MarketingEvent } from "../data/entities";
import { addDays, PLANNING_DATE } from "../data/dataset";
export const RETURNS_RATE = 0.02;
export interface DemandPoint extends ForecastPoint {
  units: number;
  revenue: number;
  margin: number;
  sellingPrice: number;
  eventNames: string[];
  baseline: number;
  trendUnits: number;
  seasonalUnits: number;
  eventUnits: number;
  scenarioUnits: number;
}
export function forecastSku(
  sku: Sku,
  horizon: number,
  events: MarketingEvent[],
  multiplier = 1,
  discount = 0,
): DemandPoint[] {
  return Array.from({ length: horizon }, (_, w) => {
    const weekStart = addDays(PLANNING_DATE, w * 7);
    const active = events.filter(
      (e) =>
        e.skuIds.includes(sku.id) &&
        e.confirmed &&
        e.startDate <= weekStart &&
        e.endDate >= weekStart,
    );
    const baseline = sku.baseWeeklyDemand;
    const trendUnits = baseline * sku.trend * Math.max(0, w - 4);
    const seasonalUnits =
      w < 5 ? 0 : baseline * 0.03 * Math.sin(((w - 4) * Math.PI) / 13);
    const eventUnits =
      (baseline + trendUnits + seasonalUnits) *
      active.reduce((n, e) => n + (e.expectedUplift ?? 0), 0);
    const baseUnits = Math.max(
      0,
      baseline + trendUnits + seasonalUnits + eventUnits,
    );
    const units = baseUnits * multiplier;
    const sellingPrice =
      sku.price *
      (1 - Math.max(discount, ...active.map((e) => e.discountRate ?? 0)));
    const revenue = units * sellingPrice * (1 - RETURNS_RATE);
    return {
      weekStart,
      skuId: sku.id,
      baseUnits,
      units,
      downsideUnits: baseUnits * 0.85,
      upsideUnits: baseUnits * 1.2,
      previousForecast:
        baseUnits * (sku.id === "mango-12" ? 0.84 : sku.trend < 0 ? 1.1 : 0.97),
      revenue,
      margin: revenue - units * sku.unitCost,
      sellingPrice,
      eventNames: active.map((e) => e.name),
      baseline,
      trendUnits,
      seasonalUnits,
      eventUnits,
      scenarioUnits: units - baseUnits,
    };
  });
}
export function revenueForDays(points: { revenue: number }[], days: number) {
  return points.reduce(
    (sum, p, i) =>
      sum + p.revenue * Math.max(0, Math.min(1, (days - i * 7) / 7)),
    0,
  );
}

export function revenueWindow<T extends { revenue: number; previous: number }>(
  points: T[],
  days: number,
) {
  return points.slice(0, Math.ceil(days / 7)).map((point, i) => {
    const shownDays = Math.min(7, days - i * 7);
    return {
      ...point,
      revenue: (point.revenue * shownDays) / 7,
      previous: (point.previous * shownDays) / 7,
      shownDays,
    };
  });
}
