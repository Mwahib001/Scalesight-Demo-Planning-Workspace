import type {
  Client,
  Sku,
  PurchaseOrder,
  MarketingEvent,
  PlanningAssumption,
  InventorySnapshot,
} from "./entities";
import { addDays, generateHistory, PLANNING_DATE } from "./dataset";
export const client: Client = {
  id: "kelarune",
  name: "Kelarune Hydration",
  industry: "Premium hydration · Direct to consumer",
  currency: "USD",
  monthlyRevenueRange: "$250K–$400K",
  planningWeek: PLANNING_DATE,
  refreshedAt: "2026-09-17T06:00:00Z",
};
const make = (
  id: string,
  name: string,
  inventory: number,
  demand: number,
  lead: number,
  safety: number,
  price: number,
  cost: number,
  story: string,
  trend = 0,
): Sku => ({
  id,
  name,
  category: name.includes("Kit") ? "Kits & bundles" : "Hydration packs",
  currentInventory: inventory,
  baseWeeklyDemand: demand,
  leadTimeWeeks: lead,
  safetyStockWeeks: safety,
  price,
  unitCost: cost,
  active: true,
  detailed: true,
  story,
  trend,
  historyWeeks: 104,
});
const core: Sku[] = [
  make(
    "mango-12",
    "Mango Hydration 12-Pack",
    2400,
    705,
    5,
    1,
    24,
    5,
    "Hero acceleration · demand ahead of plan",
    0.012,
  ),
  make(
    "berry-6",
    "Berry Hydration 6-Pack",
    6200,
    473,
    4,
    1,
    14,
    10,
    "Slowing demand · cash tied up",
    -0.014,
  ),
  make(
    "citrus-12",
    "Citrus Hydration 12-Pack",
    3150,
    610,
    5,
    0.1,
    24,
    6,
    "BFCM readiness · narrow inventory buffer",
    0.005,
  ),
  make(
    "lime-6",
    "Lime Hydration 6-Pack",
    4100,
    788,
    3.5,
    1,
    14,
    4,
    "Healthy replenishment · stable demand",
  ),
  make(
    "starter-kit",
    "Electrolyte Starter Kit",
    1480,
    246,
    4,
    1,
    28,
    8,
    "Healthy demand · planned promotion",
  ),
  make(
    "orange-12",
    "Blood Orange Hydration 12-Pack",
    800,
    210,
    6,
    1,
    24,
    4,
    "Supplier delay · repeated forecast miss",
    0.008,
  ),
  make(
    "passion-12",
    "Passionfruit Hydration 12-Pack",
    660,
    180,
    5,
    1,
    24,
    4,
    "Paid media increase · constrained supply",
    0.008,
  ),
  make(
    "travel-kit",
    "Daily Travel Kit",
    920,
    160,
    5,
    0.5,
    22,
    7,
    "Promotion readiness · limited buffer",
  ),
  {
    ...make(
      "peach-6",
      "Peach Hydration 6-Pack",
      800,
      100,
      4,
      1,
      14,
      4,
      "New launch · Lime analog informs assumptions",
      0.01,
    ),
    historyWeeks: 8,
  },
  make(
    "winter-kit",
    "Winter Discovery Kit",
    1500,
    100,
    4,
    1,
    28,
    8,
    "Slow mover · confirmed BFCM overrides inventory cut",
    -0.02,
  ),
];
// All portfolio SKUs have the same seeded history and forecast rules. One fractional
// weekly rate balances the synthetic catalog to the specified $318,000 net 30-day fixture.
const extras = Array.from({ length: 14 }, (_, i) => ({
  ...make(
    `reserve-${i + 1}`,
    `${["Guava", "Grapefruit", "Watermelon", "Coconut", "Pineapple", "Ginger", "Raspberry"][i % 7]} ${i < 7 ? "Hydration Singles" : "Refill Pouch"}`,
    80,
    10,
    3,
    1,
    12,
    3,
    "Routine replenishment",
  ),
  detailed: false,
}));
const targetWeeklyGross = 318000 / (30 / 7) / 0.98;
const grossBeforeLast = [...core, ...extras.slice(0, -1)].reduce(
  (s, k) => s + k.baseWeeklyDemand * k.price,
  0,
);
extras[13].baseWeeklyDemand =
  (targetWeeklyGross - grossBeforeLast) / extras[13].price;
extras[13].currentInventory = Math.ceil(extras[13].baseWeeklyDemand * 8);
export const skus = [...core, ...extras];
export const detailedSkus = skus.filter((s) => s.detailed);
export function getSku(id: string) {
  return skus.find((s) => s.id === id) ?? skus[0];
}
const incoming = [1200, 0, 1800, 1500, 600, 1200, 900, 800, 0, 0];
export const purchaseOrders: PurchaseOrder[] = skus.flatMap((sku, i) => {
  const orders: PurchaseOrder[] = [];
  if (incoming[i])
    orders.push({
      id: `PO-${2100 + i}`,
      skuId: sku.id,
      quantity: incoming[i],
      unitCost: sku.unitCost,
      orderDate: "2026-08-31",
      expectedArrival: addDays(
        PLANNING_DATE,
        (i === 5 ? 6 : i === 0 ? 5 : 3) * 7,
      ),
      status: i === 5 ? "delayed" : "confirmed",
      ...(i === 5 ? { originalArrival: addDays(PLANNING_DATE, 2 * 7) } : {}),
    });
  // Future replenishments are explicit analyst assumptions, separate from committed incoming.
  if (
    !["mango-12", "berry-6", "orange-12", "passion-12", "winter-kit"].includes(
      sku.id,
    )
  ) {
    [5, 9, 13, 17, 21, 25].forEach((w, j) =>
      orders.push({
        id: `PLAN-${i}-${j}`,
        skuId: sku.id,
        quantity: Math.ceil(sku.baseWeeklyDemand * 5),
        unitCost: sku.unitCost,
        orderDate: addDays(PLANNING_DATE, (w - sku.leadTimeWeeks) * 7),
        expectedArrival: addDays(PLANNING_DATE, w * 7),
        status: "planned",
      }),
    );
  }
  if (sku.id === "winter-kit")
    orders.push({
      id: "PLAN-BFCM",
      skuId: sku.id,
      quantity: 1500,
      unitCost: sku.unitCost,
      orderDate: "2026-10-12",
      expectedArrival: "2026-11-09",
      status: "planned",
    });
  return orders;
});
export const events: MarketingEvent[] = [
  {
    id: "bfcm",
    name: "BFCM campaign",
    type: "bfcm",
    startDate: "2026-11-23",
    endDate: "2026-12-06",
    skuIds: ["citrus-12", "winter-kit", "peach-6"],
    expectedUplift: 0.65,
    discountRate: 0.15,
    plannedSpend: 18000,
    confirmed: true,
  },
  {
    id: "media",
    name: "Paid media expansion",
    type: "campaign_change",
    startDate: "2026-10-19",
    endDate: "2026-11-15",
    skuIds: ["passion-12"],
    expectedUplift: 0.2,
    plannedSpend: 8000,
    confirmed: true,
  },
  {
    id: "promo",
    name: "Starter kit promotion",
    type: "promotion",
    startDate: "2026-10-26",
    endDate: "2026-11-08",
    skuIds: ["starter-kit", "travel-kit"],
    expectedUplift: 0.2,
    discountRate: 0.1,
    confirmed: true,
  },
  {
    id: "delay",
    name: "Supplier arrival delayed by four weeks",
    type: "supplier_issue",
    startDate: "2026-09-28",
    endDate: "2026-10-26",
    skuIds: ["orange-12"],
    confirmed: true,
  },
  {
    id: "launch",
    name: "Peach launch · Lime analog",
    type: "launch",
    startDate: "2026-07-20",
    endDate: "2026-09-21",
    skuIds: ["peach-6"],
    confirmed: true,
  },
];
export const history = generateHistory(skus);
export const snapshots: InventorySnapshot[] = skus.map((s) => ({
  date: PLANNING_DATE,
  skuId: s.id,
  onHand: s.currentInventory,
  available: s.currentInventory,
  committed: 0,
  incoming: purchaseOrders
    .filter((p) => p.skuId === s.id && p.status !== "planned")
    .reduce((n, p) => n + p.quantity, 0),
}));
export const assumptions: PlanningAssumption[] = skus.flatMap((s) => [
  {
    skuId: s.id,
    key: "Weekly demand baseline",
    value: s.baseWeeklyDemand,
    sourceType: "historical_signal" as const,
    reviewedAt: "2026-09-17",
    reviewedBy: "ScaleSight planning team",
  },
  {
    skuId: s.id,
    key: "Lead time (weeks)",
    value: s.leadTimeWeeks,
    sourceType: "operational_input" as const,
    reviewedAt: "2026-09-17",
    reviewedBy: "Operations review",
  },
  {
    skuId: s.id,
    key: "Safety stock (weeks)",
    value: s.safetyStockWeeks,
    sourceType: "analyst_assumption" as const,
    reviewedAt: "2026-09-17",
    reviewedBy: "ScaleSight planning team",
  },
]);
assumptions.push(
  ...[
    ["Returns rate", "2% of gross sales", "analyst_assumption"],
    ["Shrink rate", "0% — available stock reconciled", "operational_input"],
    [
      "Paid media elasticity",
      "0.6; diminishing factor 1 / (1 + |change| / 100)",
      "analyst_assumption",
    ],
    [
      "Future replenishment",
      "Planned POs are unconfirmed assumptions; shown separately from incoming",
      "analyst_assumption",
    ],
    [
      "30-day comparable period",
      "Calibrated synthetic net sales of $293,357.93; +8.4% comparison",
      "historical_signal",
    ],
    [
      "Confidence",
      "Moderate: BFCM uplift and an eight-week launch history",
      "analyst_assumption",
    ],
    [
      "BFCM context",
      "Confirmed campaign: retain Winter Discovery Kit inventory",
      "confirmed_business_event",
    ],
    [
      "Portfolio calibration",
      "24 active SKUs; final portfolio SKU weekly rate balances $318,000 net outlook",
      "analyst_assumption",
    ],
    [
      "Historical comparable pricing",
      "Recent-period discount calibrated to the canonical comparison; revenue always equals units × price × (1 − discount)",
      "historical_signal",
    ],
    [
      "Near-term baseline",
      "First five forecast weeks held at reviewed baseline; trend and seasonality apply thereafter",
      "analyst_assumption",
    ],
  ].map(([key, value, sourceType]) => ({
    skuId: "portfolio",
    key,
    value,
    sourceType: sourceType as PlanningAssumption["sourceType"],
    reviewedAt: "2026-09-17",
    reviewedBy: "ScaleSight planning team",
  })),
);

assumptions.push(
  ...events.map((event) => ({
    skuId: event.skuIds[0] ?? "portfolio",
    key: event.name,
    value: `${event.startDate} to ${event.endDate}; uplift ${((event.expectedUplift ?? 0) * 100).toFixed(0)}%; discount ${((event.discountRate ?? 0) * 100).toFixed(0)}%`,
    sourceType: event.confirmed
      ? ("confirmed_business_event" as const)
      : ("analyst_assumption" as const),
    reviewedAt: "2026-09-17",
    reviewedBy: "ScaleSight planning team",
  })),
);
assumptions.push({
  skuId: "portfolio",
  key: "Promotion response",
  value:
    "0.8 demand elasticity; larger of scheduled/scenario discounts applied, without stacking",
  sourceType: "analyst_assumption",
  reviewedAt: "2026-09-17",
  reviewedBy: "ScaleSight planning team",
});
