import type { Sku, WeeklySales } from "./entities";
export const PLANNING_DATE = "2026-09-14";
export function addDays(date: string, days: number) {
  return new Date(Date.parse(date + "T00:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function generateHistory(skus: Sku[], seed = 14092026): WeeklySales[] {
  const random = seededRandom(seed);
  const rows = skus.flatMap((sku) =>
    Array.from({ length: 104 }, (_, i) => {
      const age = 103 - i;
      const weekStart = addDays(PLANNING_DATE, -(104 - i) * 7);
      const beforeLaunch = age >= sku.historyWeeks;
      const trend =
        sku.id === "mango-12"
          ? 0.64 + (i / 103) * 0.36
          : sku.trend < 0
            ? 1.3 - (i / 103) * 0.3
            : 0.85 + (i / 103) * 0.15;
      const seasonality = 1 + 0.08 * Math.sin((i * Math.PI) / 26);
      const event = weekStart.slice(5, 7) === "11" ? 1.22 : 1;
      const units = beforeLaunch
        ? 0
        : Math.round(
            sku.baseWeeklyDemand * trend * seasonality * event +
              sku.baseWeeklyDemand * (random() - 0.5) * 0.06,
          );
      const revenue = units * sku.price;
      return {
        weekStart,
        skuId: sku.id,
        units,
        revenue,
        discount: 0,
        planUnits: Math.round(
          units *
            (sku.id === "mango-12" || sku.id === "orange-12" ? 0.84 : 1.02),
        ),
      };
    }),
  );
  // Calibrate a synthetic comparable-period discount, not a UI multiplier. Every
  // historical row still reconciles: units × list price × (1 - discount).
  const comparableGross = rows.reduce((sum, row) => {
    const daysBeforePlan =
      (Date.parse(PLANNING_DATE) - Date.parse(row.weekStart)) / 86400000;
    const weight = daysBeforePlan <= 28 ? 1 : daysBeforePlan === 35 ? 2 / 7 : 0;
    return sum + row.revenue * weight;
  }, 0);
  const comparableDiscount = 1 - 318000 / 1.084 / 0.98 / comparableGross;
  return rows.map((row) =>
    row.weekStart >= addDays(PLANNING_DATE, -35)
      ? {
          ...row,
          discount: comparableDiscount,
          revenue: row.revenue * (1 - comparableDiscount),
        }
      : row,
  );
}
