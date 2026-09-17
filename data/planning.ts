import type {
  SKU,
  Category,
  Merchant,
  InventoryReceipt,
  BusinessEvent,
  ForecastVersion,
  WeeklyActual,
  ChangeLogItem,
  PartnershipModel,
  CustomerSegment,
} from "../lib/types";

export const merchant: Merchant = Object.freeze({
  id: "northstar",
  name: "Northstar Commerce",
  platform: "Shopify Plus",
  planningWeek: "Sep 14–20, 2026",
  dataThrough: "Sep 13, 2026",
});
export const categories: readonly Category[] = [
  "Bags",
  "Wallets",
  "Belts",
  "Travel",
  "Seasonal",
];
export const channels = ["All", "Online Store", "Retail", "Wholesale"] as const;
export const weekDate = (week: number) =>
  new Date(Date.UTC(2026, 8, 14 + week * 7)).toISOString().slice(0, 10);
const authored: SKU[] = [
  ["104", "Atlas Carryall", "Bags", 4300, 1130, 6, 0, 0, 0.23, 14],
  ["087", "Meridian Wallet", "Wallets", 8900, 610, 5, 2000, 3, -0.18, 8],
  ["031", "Nova Belt", "Belts", 6200, 970, 7, 1500, 2, 0.34, 7.5],
  ["112", "Orbit Weekender", "Travel", 3750, 540, 8, 1200, 4, 0.09, 16],
  ["066", "Apex Cardholder", "Wallets", 7200, 690, 4, 0, 0, 0.02, 4],
  ["019", "Lumen Tote", "Bags", 5100, 720, 5, 1000, 3, 0.06, 12],
  ["128", "Solstice Pouch", "Travel", 2650, 410, 9, 0, 0, 0.12, 5],
  ["055", "Voyager Strap", "Belts", 9400, 430, 4, 0, 0, -0.11, 4],
  ["141", "Holiday Gift Set", "Seasonal", 3100, 360, 10, 2400, 5, 0.28, 13],
  ["073", "Transit Sling", "Bags", 4950, 760, 6, 900, 4, 0.04, 10],
  ["096", "Crescent Organizer", "Travel", 10800, 800, 4, 1000, 3, -0.08, 10],
  ["138", "Summit Travel Kit", "Travel", 9700, 700, 4, 1800, 4, -0.06, 12],
].map((r) => {
  const [
    id,
    name,
    category,
    inventory,
    demand,
    lead,
    incoming,
    incomingWeek,
    delta,
    cost,
  ] = r;
  return {
    id: `SKU-${id}`,
    name: String(name),
    category: category as Category,
    currentInventory: Number(inventory),
    baseWeeklyDemand: Number(demand),
    leadTimeWeeks: Number(lead),
    incomingUnits: Number(incoming),
    incomingWeek: Number(incomingWeek),
    demandDelta: Number(delta),
    unitCost: Number(cost),
    unitPrice: Number(id) === 104 ? 58000 / 2260 : Number(cost) * 3.5,
    safetyStockWeeks: 1.2,
    lossRate: 0.01,
    excessCoverThreshold:
      Number(id) === 87
        ? 7.049180327868853
        : Number(id) === 96
          ? 11.865
          : Number(id) === 138
            ? 12.071428571428571
            : Number(id) === 141
              ? 18
              : 14,
    materialEvent: Number(id) === 141,
    uncertainReceipt: false,
    packSize: 100,
    moq: 300,
    authored: true,
    ...(Number(id) === 104 ? { elasticity: 0.12 } : {}),
  };
});
const authoredIds = new Set(authored.map((s) => s.id));
const generated: SKU[] = Array.from({ length: 142 }, (_, i) => i + 1)
  .filter((i) => !authoredIds.has(`SKU-${String(i).padStart(3, "0")}`))
  .map((id, i) => ({
    id: `SKU-${String(id).padStart(3, "0")}`,
    name: `${["Essential", "Everyday", "Studio", "Classic", "Field"][i % 5]} ${["Carry Bag", "Pocket Wallet", "Woven Belt", "Travel Case", "Gift Edit"][i % 5]} ${String(id).padStart(3, "0")}`,
    category: categories[i % 5],
    currentInventory: 700 + i * 9,
    baseWeeklyDemand: 100 + i * 2,
    // Named deterministic exception: extended supplier lead time for three tail SKUs.
    leadTimeWeeks: [80, 90, 100].includes(id) ? 12 : 3,
    safetyStockWeeks: 1.2,
    lossRate: 0.01,
    unitCost: 5,
    unitPrice: 24,
    incomingUnits: 0,
    incomingWeek: 0,
    demandDelta: 0.03,
    excessCoverThreshold: 14,
    materialEvent: false,
    uncertainReceipt: false,
    packSize: 50,
    moq: 100,
    authored: false,
  }));
// Calibrate the generated tail to demand-weighted catalog cover and cost valuation.
const sum = (rows: SKU[], key: "currentInventory" | "baseWeeklyDemand") =>
  rows.reduce((n, s) => n + s[key], 0);
const targetGeneratedInventory =
  8.2 *
    (sum(authored, "baseWeeklyDemand") + sum(generated, "baseWeeklyDemand")) -
  sum(authored, "currentInventory");
const inventoryScale =
  targetGeneratedInventory / sum(generated, "currentInventory");
generated.forEach((s) => {
  s.currentInventory = Math.round(s.currentInventory * inventoryScale);
});
const tailCost =
  (1100000 -
    authored.reduce((n, s) => n + s.currentInventory * s.unitCost, 0)) /
  sum(generated, "currentInventory");
generated.forEach((s) => {
  s.unitCost = tailCost;
});
export const skus: readonly SKU[] = Object.freeze(
  [...authored, ...generated].map((s) => Object.freeze(s)),
);
export const featuredSkus = skus.slice(0, 10);
export const skuById = (id: string) => skus.find((s) => s.id === id) ?? skus[0];
export const receipts: readonly InventoryReceipt[] = Object.freeze(
  authored.flatMap((s, i) => [
    Object.freeze({
      id: i === 2 ? "PO-238" : `PO-${236 + i}`,
      skuId: s.id,
      units: s.incomingUnits,
      expectedWeek: s.incomingWeek,
      confirmed: true,
      status: "open" as const,
    }),
    Object.freeze({
      id: `PO-${180 + i}`,
      skuId: s.id,
      units: 900 + i * 100,
      expectedWeek: -8 + (i % 4),
      confirmed: true,
      status: "received" as const,
    }),
  ]),
);
const eventTypes = [
  "Promotion",
  "Paid campaign",
  "Seasonal event",
  "Supplier constraint",
  "Product launch",
];
export const events: readonly BusinessEvent[] = Object.freeze(
  Array.from({ length: 18 }, (_, i) =>
    Object.freeze({
      id: `EV-${i + 1}`,
      skuId: i < 5 ? "SKU-104" : authored[i % 12].id,
      type: eventTypes[i % 5],
      start: weekDate(i < 5 ? [-3, -1, 3, 5, 7][i] : -100 + i * 5),
      end: weekDate(i < 5 ? [-2, 0, 4, 6, 8][i] : -99 + i * 5),
      label: [
        "Retention offer",
        "Autumn carry campaign",
        "Autumn travel",
        "Delta capacity review",
        "New color release",
      ][i % 5],
      confirmed: i % 3 !== 0,
      effect: [0.08, 0.15, 0.1, -0.05, 0.06][i % 5],
    }),
  ),
);
// Fixed-seed, bounded noise: 5–12%; trend, seasonality and named events are explicit.
export function weeklyActuals(sku: SKU): readonly WeeklyActual[] {
  let seed = Number(sku.id.slice(4)) * 7919;
  return Array.from({ length: 104 }, (_, i) => {
    seed = (seed * 16807) % 2147483647;
    const noise = (0.05 + (seed % 701) / 10000) * (seed % 2 === 0 ? 1 : -1);
    const date = weekDate(i - 104);
    const factor = events
      .filter(
        (e) =>
          e.skuId === sku.id && e.confirmed && date >= e.start && date <= e.end,
      )
      .reduce((f, e) => f * (1 + e.effect), 1);
    const total = Math.round(
      sku.baseWeeklyDemand *
        (0.92 + (0.08 * i) / 103) *
        (1 + 0.1 * Math.sin((i * 2 * Math.PI) / 52)) *
        factor *
        (1 + noise),
    );
    const online = Math.round(total * 0.65),
      retail = Math.round(total * 0.25);
    return channels.slice(1).map((channel, c) =>
      Object.freeze({
        skuId: sku.id,
        weekStart: date,
        channel,
        units: [online, retail, total - online - retail][c],
      }),
    );
  }).flat();
}
export function forecastUnits(sku: SKU, week: number) {
  if (sku.id === "SKU-104")
    return (
      [1130, 1150, 1160, 1180, 1180, 1200, 1200, 1220][week] ??
      Math.round(1220 * (1 + 0.035 * Math.sin(week / 4)))
    );
  return Math.round(
    sku.baseWeeklyDemand * (1 + (sku.demandDelta * Math.min(week, 8)) / 24),
  );
}
export const forecastVersions: readonly ForecastVersion[] = Object.freeze(
  skus.flatMap((s) =>
    Array.from({ length: s.authored ? 4 : 1 }, (_, v) =>
      Object.freeze({
        id: `${s.id}-v${v}`,
        skuId: s.id,
        issuedAt: weekDate(v - (s.authored ? 4 : 1)),
        weeks: Object.freeze(
          Array.from({ length: 52 }, (_, w) =>
            Object.freeze({
              weekStart: weekDate(w),
              units:
                v === (s.authored ? 3 : 0)
                  ? forecastUnits(s, w)
                  : s.id === "SKU-104" && w < 8
                    ? [1000, 1020, 1020, 1030, 1040, 1040, 1050, 1050][w]
                    : Math.round(forecastUnits(s, w) * 0.9),
            }),
          ),
        ),
      }),
    ),
  ),
);
// Actuals join to versions committed before the observed week; later versions are ineligible.
export const committedBacktestVersions: readonly ForecastVersion[] =
  Object.freeze(
    [
      {
        id: "atlas-20260810",
        skuId: "SKU-104",
        issuedAt: "2026-08-10",
        weeks: [{ weekStart: "2026-08-17", units: 910 }],
      },
      {
        id: "atlas-20260817",
        skuId: "SKU-104",
        issuedAt: "2026-08-17",
        weeks: [{ weekStart: "2026-08-24", units: 940 }],
      },
      {
        id: "atlas-20260824",
        skuId: "SKU-104",
        issuedAt: "2026-08-24",
        weeks: [{ weekStart: "2026-08-31", units: 960 }],
      },
      {
        id: "atlas-20260831",
        skuId: "SKU-104",
        issuedAt: "2026-08-31",
        weeks: [{ weekStart: "2026-09-07", units: 980 }],
      },
    ].map((v) =>
      Object.freeze({
        ...v,
        weeks: Object.freeze(v.weeks.map((w) => Object.freeze(w))),
      }),
    ),
  );
export const backtest = Object.freeze(
  [
    { week: "2026-08-17", actual: 1025, interpretation: "Campaign begins" },
    { week: "2026-08-24", actual: 1145, interpretation: "Uplift strengthens" },
    { week: "2026-08-31", actual: 1210, interpretation: "Promotion peak" },
    {
      week: "2026-09-07",
      actual: 1108,
      interpretation: "Uplift persists after peak",
    },
  ].map((row) => {
    const version = [...committedBacktestVersions]
      .filter(
        (v) =>
          v.issuedAt < row.week &&
          v.weeks.some((w) => w.weekStart === row.week),
      )
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
    if (!version) throw new Error("Missing committed forecast for backtest");
    return Object.freeze({
      ...row,
      previousForecast: version.weeks.find((w) => w.weekStart === row.week)!
        .units,
      forecastIssuedAt: version.issuedAt,
      forecastVersionId: version.id,
    });
  }),
);
export const purchasingActions: Readonly<Record<string, string>> =
  Object.freeze({
    "SKU-104": "Expedite-review PO",
    "SKU-087": "Reduce-defer PO",
    "SKU-031": "Recalculate",
    "SKU-112": "Confirm receipt",
    "SKU-066": "Hold",
    "SKU-019": "Monitor",
    "SKU-128": "Alternate supply",
    "SKU-055": "Freeze PO",
    "SKU-141": "Validate launch",
    "SKU-073": "Hold",
  });
export const changes: readonly ChangeLogItem[] = Object.freeze(
  [
    {
      area: "Forecast",
      subject: "SKU-104",
      happened:
        "SKU-104 8-week forecast increased 14.2%; latest run rate is 23% above prior forecast.",
      matters: "Coverage is now shorter than lead time.",
      decision: "Confirm expedite feasibility and quantity.",
      impact: 5,
    },
    {
      area: "Inventory",
      subject: "SKU-087",
      happened: "SKU-087 incoming PO of 2,000 is still scheduled.",
      matters: "Forward exposure rises despite weaker demand.",
      decision: "Defer, reduce or pair with promotion.",
      impact: 4,
    },
    {
      area: "Campaign",
      subject: "SKU-031",
      happened: "SKU-031 Campaign B ended Sep 6; 34% uplift partly persisted.",
      matters: "The uplift may not be purely temporary.",
      decision: "Hold PO change until refreshed 8-week need is reviewed.",
      impact: 3,
    },
    {
      area: "Supplier",
      subject: "Delta lead-time",
      happened:
        "Supplier Delta lead time moved from 6 to 8 weeks for two SKUs.",
      matters: "Safety buffer is no longer adequate.",
      decision: "Review affected orders and alternative freight.",
      impact: 2,
    },
    {
      area: "Customer",
      subject: "1,240 overdue customers",
      happened:
        "1,240 high-frequency customers crossed expected reorder window.",
      matters: "Retention may be more efficient than broad acquisition.",
      decision: "Define a targeted win-back test.",
      impact: 1,
    },
  ].map((row) => Object.freeze(row)),
);
export const partnershipModels: readonly PartnershipModel[] = [
  {
    name: "Co-sell",
    description:
      "A shared discovery conversation, with a clearly scoped delivery owner.",
    steps:
      "Blockify identifies opportunity → joint discovery → ScaleSight scopes → delivers → partner terms agreed.",
    qualifier: "No pre-agreed economics implied.",
  },
  {
    name: "White-label / backend concept",
    description:
      "Blockify retains the relationship; ScaleSight operates the analytical layer.",
    steps:
      "Merchant need → scoped analytical layer → analyst review → partner-led merchant conversation.",
    qualifier: "Label conceptual; do not imply approval.",
  },
  {
    name: "Partner / revenue share",
    description:
      "An introduction-led model with terms determined through discussion.",
    steps:
      "Introduction → ScaleSight closes and delivers → agreed partner economics.",
    qualifier:
      "Commercial structure to be discussed after merchant fit and pilot scope.",
  },
];
export const segments: readonly CustomerSegment[] = Object.freeze(
  [
    { name: "High value", customers: 3480, expectedValue: 260 },
    { name: "Loyal", customers: 4600, expectedValue: 170 },
    { name: "New", customers: 4200, expectedValue: 118 },
    { name: "Lapsing", customers: 2240, expectedValue: 95 },
    { name: "One-time", customers: 3480, expectedValue: 69 },
  ].map((row) => Object.freeze(row)),
);
// Aggregated equivalent of 18,000 profiles / 40,000 orders. Disjoint, completed-order cohorts.
export const customerAggregate = Object.freeze({
  customers: 18000,
  repeatCustomers: 6912,
  completedOrders: 40000,
  ttmNetRevenue: 6800000,
  quarterNetRevenue: 1700000,
  quarterRepeatRevenue: 795600,
  expected90DayNetRevenue: 2556000,
  availabilityChecks: 10000,
  inStockChecks: 9400,
});
export const sources = Object.freeze(
  [
    { name: "Campaign A", size: 2100, value: 125, cac: 38 },
    { name: "Campaign B", size: 1800, value: 151.25, cac: 45 },
    { name: "Organic", size: 3400, value: 139, cac: 18 },
    { name: "Referral", size: 1700, value: 159.2058823529412, cac: 22 },
  ].map((row) => Object.freeze(row)),
);
export const reorderGroups = Object.freeze(
  [
    {
      name: "High-frequency • overdue",
      size: 1240,
      lastOrder: "2026-07-30",
      expectedDays: 30,
      graceDays: 7,
    },
    {
      name: "High-frequency • due soon",
      size: 1860,
      lastOrder: "2026-08-16",
      expectedDays: 30,
      graceDays: 7,
    },
    {
      name: "Other active customers",
      size: 14900,
      lastOrder: "2026-09-01",
      expectedDays: 45,
      graceDays: 7,
    },
  ].map((row) => Object.freeze(row)),
);
export const customerWeeks = Object.freeze(
  Array.from({ length: 10 }, (_, i) => ({
    week: weekDate(i - 10),
    newRevenue: (1700000 * 0.532) / 10,
    repeatRevenue: (1700000 * 0.468) / 10 + (i - 4.5) * 1300,
  })),
);
export const cohorts = Object.freeze(
  ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((month, i) => ({
    month,
    size: [3000, 3000, 3000, 3200, 3000, 2800][i],
    retention: Array.from({ length: 6 - i }, (_, j) =>
      j === 0 ? 100 : Math.round(46 - j * 4 + i * 1.3),
    ),
  })),
);
export const formatUnits = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

// Assessed exposed quantities across the seven rule-derived high-risk positions.
const assessmentIds = [
  "SKU-104",
  "SKU-031",
  "SKU-112",
  "SKU-128",
  "SKU-080",
  "SKU-090",
  "SKU-100",
];
const assessedSkus = skus.filter((s) => assessmentIds.includes(s.id));
const assessedPoolValue = assessedSkus.reduce(
  (n, s) => n + s.currentInventory * s.unitCost,
  0,
);
export const inventoryAssessments = Object.freeze(
  assessedSkus.map((s, i) =>
    Object.freeze({
      skuId: s.id,
      atRiskUnits: s.currentInventory * (184000 / assessedPoolValue),
      reviewThisWeek: i < 5,
    }),
  ),
);
// Disjoint customer buckets use completed-order counts in the TTM analysis window.
export const customerOrderBuckets = Object.freeze(
  [
    { completedOrders: 1, customers: 11088 },
    { completedOrders: 4, customers: 5648 },
    { completedOrders: 5, customers: 1264 },
  ].map((row) => Object.freeze(row)),
);
