import type { ForecastPoint, ScenarioInput, Sku } from "@/lib/types";

export const skus: Sku[] = [
  { id: "citrus-vodka-soda", name: "Citrus Vodka Soda", channelMix: "Retail + wholesale", currentInventory: 4800, baseWeeklyDemand: 1140, leadTimeWeeks: 5, safetyStockWeeks: 1.2, shrinkRate: 0.02, incomingUnits: 0, risk: "high" },
  { id: "lime-vodka-soda", name: "Lime Vodka Soda", channelMix: "Retail + wholesale", currentInventory: 7200, baseWeeklyDemand: 920, leadTimeWeeks: 5, safetyStockWeeks: 1.2, shrinkRate: 0.02, incomingUnits: 1500, risk: "healthy" },
  { id: "berry-vodka-soda", name: "Berry Vodka Soda", channelMix: "Retail + distributor", currentInventory: 10300, baseWeeklyDemand: 930, leadTimeWeeks: 5, safetyStockWeeks: 1.2, shrinkRate: 0.02, incomingUnits: 0, risk: "watch" },
  { id: "variety-8-pack", name: "Variety 8-Pack", channelMix: "Retail", currentInventory: 3700, baseWeeklyDemand: 1030, leadTimeWeeks: 6, safetyStockWeeks: 1.2, shrinkRate: 0.02, incomingUnits: 1000, risk: "high" },
  { id: "variety-12-pack", name: "Variety 12-Pack", channelMix: "Retail", currentInventory: 8100, baseWeeklyDemand: 1050, leadTimeWeeks: 5, safetyStockWeeks: 1.2, shrinkRate: 0.02, incomingUnits: 1200, risk: "healthy" },
  { id: "seasonal-summer-pack", name: "Seasonal Summer Pack", channelMix: "Seasonal retail", currentInventory: 6900, baseWeeklyDemand: 650, leadTimeWeeks: 5, safetyStockWeeks: 1.2, shrinkRate: 0.02, incomingUnits: 0, risk: "overstock" },
];

export const defaultScenario = (sku: Sku): ScenarioInput => ({
  skuId: sku.id,
  growthRate: 0.25,
  leadTimeWeeks: sku.leadTimeWeeks,
  shrinkRate: sku.shrinkRate,
  promotionEnabled: false,
  distributorEnabled: sku.id === "berry-vodka-soda",
  incomingUnits: sku.id === "citrus-vodka-soda" ? 0 : sku.incomingUnits,
});

const start = new Date("2025-03-17T00:00:00");
const dateFor = (offset: number) => {
  const date = new Date(start);
  date.setDate(start.getDate() + offset * 7);
  return date.toISOString().slice(0, 10);
};

// Deliberately deterministic demo history; no random values are used.
export function forecastSeries(sku: Sku): ForecastPoint[] {
  return Array.from({ length: 68 }, (_, index) => {
    const seasonal = Math.round(Math.sin(index / 4.2) * sku.baseWeeklyDemand * 0.075);
    const trend = index > 52 && sku.id === "citrus-vodka-soda" ? (index - 52) * 18 : 0;
    const actual = index < 52 ? sku.baseWeeklyDemand + seasonal + ((index % 5) - 2) * 18 + trend : undefined;
    const base = Math.round(sku.baseWeeklyDemand * (1 + Math.max(0, index - 51) * 0.008));
    return {
      weekStart: dateFor(index),
      actual,
      base,
      conservative: Math.round(base * 0.91),
      upside: Math.round(base * 1.18),
    };
  });
}

export const formatUnits = (value: number) => new Intl.NumberFormat("en-US").format(Math.round(value));
