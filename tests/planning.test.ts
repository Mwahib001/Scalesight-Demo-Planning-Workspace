import assert from "node:assert/strict";
import {
  buildPlan,
  planningReducer,
  defaultState,
  sanitizeState,
  comparePlans,
} from "../src/engine/scenarioEngine";
import {
  skus,
  history,
  purchaseOrders,
  getSku,
  events,
  snapshots,
} from "../src/data/kelarune";
import { generateHistory, addDays, PLANNING_DATE } from "../src/data/dataset";
import { recommend } from "../src/engine/recommendationEngine";
import { percent } from "../src/engine/formatters";
import type {
  MarketingEvent,
  WeeklySales,
  PurchaseOrder,
} from "../src/data/entities";
import { inventoryFor } from "../src/engine/inventoryEngine";
import { forecastSku, revenueWindow } from "../src/engine/forecastEngine";
function assertFinite(value: unknown): void {
  if (typeof value === "number") assert.ok(Number.isFinite(value));
  else if (Array.isArray(value)) value.forEach(assertFinite);
  else if (value && typeof value === "object")
    Object.values(value).forEach(assertFinite);
}
const base = buildPlan(defaultState());
const near = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.001, `${a} != ${b}`);
near(base.revenue30, 318000);
assert.notEqual(base.revenueGrowthPct, null);
near(base.revenueGrowthPct!, 8.4);
near(base.riskValue, 42000);
assert.equal(base.attention, 5);
assert.equal(base.high, 3);
assert.equal(base.watch, 2);
assert.equal(base.stockouts, 3);
assert.equal(skus.length, 24);
assert.equal(skus.filter((s) => s.detailed).length, 10);
assert.deepEqual(generateHistory(skus), history);
for (const [id, cover, risk] of [
  ["mango-12", 3.4, "High risk"],
  ["berry-6", 13.1, "Overstock"],
  ["citrus-12", 5.2, "Watch"],
  ["lime-6", 5.2, "Healthy"],
  ["starter-kit", 6, "Healthy"],
] as const) {
  const r = base.rows.find((r) => r.sku.id === id)!;
  assert.equal(Number(r.inventory.weeksOfCover.toFixed(1)), cover);
  assert.equal(r.inventory.risk, risk);
}
for (const row of base.rows) {
  if (row.inventory.risk === "High risk")
    assert.ok(row.inventory.projection.some((p) => p.projected < p.safety));
  assert.equal(
    row.inventory.stockoutDate,
    row.inventory.projection.find((p) => p.projected <= 0)?.weekStart ?? null,
  );
  let previous = row.inventory.usableInventory;
  row.inventory.projection.forEach((p) => {
    near(p.projected, previous + p.arrivals - p.demand);
    previous = p.projected;
  });
  row.recommendations.forEach((r) =>
    assert.ok(
      r.whatChanged && r.whyItMatters && r.recommendation && r.decisionRequired,
    ),
  );
}
const orange = getSku("orange-12");
const delayed = inventoryFor(
  orange,
  forecastSku(orange, 13, events),
  purchaseOrders,
);
const onTime = inventoryFor(
  orange,
  forecastSku(orange, 13, events),
  purchaseOrders.map((p) =>
    p.originalArrival ? { ...p, expectedArrival: p.originalArrival } : p,
  ),
);
assert.ok(
  delayed.stockoutDate &&
    onTime.stockoutDate &&
    delayed.stockoutDate < onTime.stockoutDate,
);
assert.ok(
  base.rows
    .find((r) => r.sku.id === "winter-kit")!
    .recommendations.some(
      (r) => r.title === "Business context changes the decision",
    ),
);
const stress = buildPlan({ ...defaultState(), demandUpliftPct: 50 });
assert.ok(stress.revenue30 > base.revenue30);
assert.ok(
  stress.selected.inventory.weeksOfCover < base.selected.inventory.weeksOfCover,
);
const delta = comparePlans(stress, base).stockoutDaysEarlier;
assert.equal(
  delta,
  (Date.parse(base.selected.inventory.stockoutDate!) -
    Date.parse(
      stress.selected.inventory.projection.find((p) => p.projected <= 0)!
        .weekStart,
    )) /
    86400000,
);
assert.deepEqual(buildPlan(defaultState()), base);
for (const horizon of [4, 8, 13, 26] as const)
  for (const mode of ["base", "upside", "downside"] as const)
    for (const s of skus) {
      const p = buildPlan({
        ...defaultState(s.id),
        forecastHorizon: horizon,
        scenarioMode: mode,
        demandUpliftPct: 50,
        adSpendChangePct: -20,
        promotionEnabled: true,
        promotionDiscountPct: 40,
        incomingInventory: 0,
        purchaseQuantity: 2000,
        leadTimeWeeks: 12,
      });
      assertFinite(p);
      assert.ok(Number.isFinite(p.revenue30));
      for (const r of p.rows) {
        assert.ok(Number.isFinite(r.inventory.weeksOfCover));
        if (r.inventory.risk === "High risk") assert.ok(r.inventory.breach);
      }
    }
assert.equal(
  sanitizeState({ ...defaultState(), demandUpliftPct: NaN }).demandUpliftPct,
  0,
);

for (const row of history) {
  near(row.revenue, row.units * getSku(row.skuId).price * (1 - row.discount));
  assert.ok(row.discount >= 0 && row.discount <= 1);
}
const edited = planningReducer(defaultState(), {
  type: "update",
  value: {
    selectedSkuId: "orange-12",
    forecastHorizon: 26,
    scenarioMode: "upside",
    demandUpliftPct: 40,
    adSpendChangePct: 50,
    promotionEnabled: true,
    promotionDiscountPct: 30,
    leadTimeWeeks: 10,
    incomingInventory: 999,
    purchaseQuantity: 3000,
  },
});
assert.deepEqual(planningReducer(edited, { type: "reset" }), defaultState());
const bought = buildPlan({ ...defaultState(), purchaseQuantity: 1000 });
near(bought.workingCapital - base.workingCapital, 5000);
near(
  bought.selected.inventory.projection[5].projected -
    base.selected.inventory.projection[5].projected,
  1000,
);
near(bought.revenue30, base.revenue30);
const promoted = buildPlan({
  ...defaultState(),
  promotionEnabled: true,
  promotionDiscountPct: 20,
});
assert.ok(
  promoted.selected.inventory.weeklyDemand >
    base.selected.inventory.weeklyDemand,
);
assert.ok(
  promoted.selected.forecast[0].sellingPrice <
    base.selected.forecast[0].sellingPrice,
);
assert.ok(promoted.selected.margin < base.selected.margin);
const drySku = { ...getSku("mango-12"), baseWeeklyDemand: 0 };
assertFinite(inventoryFor(drySku, forecastSku(drySku, 13, []), []));

near(
  revenueWindow(base.revenueSeries, 30).reduce((n, p) => n + p.revenue, 0),
  base.revenue30,
);
assert.equal(revenueWindow(base.revenueSeries, 30).at(-1)!.shownDays, 2);
let regressionCount = 0;
function regression(name: string, verify: () => void) {
  verify();
  regressionCount++;
  console.log(`PASS ${name}`);
}
regression("Available and on-hand snapshots feed distinct calculations", () => {
  const snapshot = snapshots.find((s) => s.skuId === "mango-12")!;
  const saved = { ...snapshot };
  try {
    snapshot.available = 1200;
    snapshot.committed = 1200;
    const inventory = buildPlan(defaultState()).selected.inventory;
    near(inventory.weeksOfCover, 1200 / 705);
    near(inventory.currentInventory, 2400);
    near(inventory.projection[0].projected, 1695);
    snapshot.onHand = 2000;
    near(
      buildPlan(defaultState()).selected.inventory.projection[0].projected,
      1295,
    );
  } finally {
    Object.assign(snapshot, saved);
  }
});
regression(
  "Shrink changes usable stock, not available cover or on-hand projection",
  () => {
    const sku = getSku("mango-12");
    const inv = inventoryFor(
      sku,
      forecastSku(sku, 13, []),
      purchaseOrders,
      5,
      1200,
      0,
      0.1,
      false,
      snapshots.find((s) => s.skuId === sku.id),
    );
    near(inv.usableInventory, 2160);
    near(inv.weeksOfCover, 2400 / 705);
    near(inv.projection[0].projected, 1695);
    near(inv.reorderGap, 870);
  },
);
regression(
  "Reviewed forecast units and prices survive every scenario control",
  () => {
    const changes = [
      { promotionEnabled: true, promotionDiscountPct: 40 },
      { demandUpliftPct: 50, adSpendChangePct: 50 },
      {
        scenarioMode: "upside" as const,
        leadTimeWeeks: 12,
        incomingInventory: 0,
        purchaseQuantity: 5000,
      },
    ];
    for (const change of changes) {
      const plan = buildPlan({ ...defaultState(), ...change });
      assert.deepEqual(
        plan.revenueSeries.map((p) => p.previous),
        base.revenueSeries.map((p) => p.previous),
      );
      assert.deepEqual(
        plan.selected.allForecast.map((p) => p.previousForecast),
        base.selected.allForecast.map((p) => p.previousForecast),
      );
    }
    const sku = getSku("mango-12"),
      price = sku.price;
    try {
      sku.price *= 0.8;
      assert.deepEqual(
        buildPlan(defaultState()).revenueSeries.map((p) => p.previous),
        base.revenueSeries.map((p) => p.previous),
      );
    } finally {
      sku.price = price;
    }
  },
);
regression(
  "Planned replenishment moves with longer and shorter lead times without mutating orders",
  () => {
    const saved = structuredClone(purchaseOrders);
    for (const leadTimeWeeks of [2, 12]) {
      const plan = buildPlan({ ...defaultState("peach-6"), leadTimeWeeks });
      const po = plan.selected.inventory.orders.find(
        (o) => o.id === "PLAN-8-0",
      )!;
      near(
        (Date.parse(po.expectedArrival) - Date.parse(po.orderDate)) / 86400000,
        leadTimeWeeks * 7,
      );
      if (leadTimeWeeks === 12) assert.ok(plan.selected.inventory.stockoutDate);
    }
    assert.deepEqual(purchaseOrders, saved);
  },
);
regression(
  "Half-week incoming and purchase arrivals round to a day, not a whole week",
  () => {
    const plan = buildPlan({
      ...defaultState("berry-6"),
      leadTimeWeeks: 3.5,
      incomingInventory: 100,
      purchaseQuantity: 100,
    });
    for (const id of ["SCENARIO-INCOMING", "SCENARIO-PURCHASE"]) {
      assert.equal(
        plan.selected.inventory.orders.find((o) => o.id === id)!
          .expectedArrival,
        addDays(PLANNING_DATE, 25),
      );
    }
  },
);
regression(
  "Supplier-delay warnings require an earlier breach or stockout",
  () => {
    const sku = { ...getSku("mango-12"), currentInventory: 500 };
    const po: PurchaseOrder = {
      id: "DELAY",
      skuId: sku.id,
      quantity: 1200,
      unitCost: sku.unitCost,
      orderDate: "2026-08-31",
      originalArrival: "2026-10-12",
      expectedArrival: "2026-10-19",
      status: "delayed",
    };
    const inv = inventoryFor(sku, forecastSku(sku, 13, []), [po]);
    assert.equal(inv.delayImpacts.length, 0);
    assert.ok(
      !recommend(sku, inv, [], []).some(
        (r) => r.title === "Replenishment Timing Risk",
      ),
    );
    assert.ok(
      base.rows
        .find((r) => r.sku.id === "orange-12")!
        .recommendations.some((r) => r.title === "Replenishment Timing Risk"),
    );
    const moved = buildPlan({
      ...defaultState("orange-12"),
      leadTimeWeeks: orange.leadTimeWeeks + 1,
    }).selected.inventory.orders.find((o) => o.status === "delayed")!;
    assert.equal(
      (Date.parse(moved.expectedArrival) - Date.parse(moved.originalArrival!)) /
        86400000,
      28,
    );
  },
);
regression(
  "Promotion constraints require a campaign and account for cumulative demand and arrivals",
  () => {
    const sku = {
      ...getSku("mango-12"),
      currentInventory: 1500,
      baseWeeklyDemand: 800,
    };
    const forecast = forecastSku(sku, 4, []);
    const inv = inventoryFor(sku, forecast, []);
    const hasPromotion = (
      orders: PurchaseOrder[],
      campaign: MarketingEvent[],
      enabled = false,
    ) =>
      recommend(
        sku,
        inventoryFor(sku, forecast, orders),
        campaign,
        [],
        enabled,
      ).some((r) => r.title === "Promotion Constraint");
    assert.ok(!hasPromotion([], []));
    assert.ok(hasPromotion([], [], true));
    const event: MarketingEvent = {
      id: "PROMO",
      type: "promotion",
      name: "Two-week campaign",
      startDate: "2026-09-21",
      endDate: "2026-10-04",
      confirmed: true,
      skuIds: [sku.id],
    };
    assert.ok(hasPromotion([], [event]));
    assert.ok(!hasPromotion([], [{ ...event, confirmed: false }]));
    assert.ok(
      !hasPromotion(
        [],
        [{ ...event, startDate: "2026-12-01", endDate: "2026-12-14" }],
      ),
    );
    assert.ok(
      !hasPromotion(
        [
          {
            id: "SUPPLY",
            skuId: sku.id,
            quantity: 5000,
            unitCost: sku.unitCost,
            orderDate: "2026-09-01",
            expectedArrival: "2026-09-14",
            status: "confirmed",
          },
        ],
        [event],
      ),
    );
    assert.ok(inv.projection.every((p) => p.demand < sku.currentInventory));
  },
);
regression(
  "Forecast reviews sort observations and require consecutive weekly dates",
  () => {
    const sku = getSku("mango-12");
    const rows: WeeklySales[] = ["2026-08-03", "2026-08-17", "2026-09-07"].map(
      (weekStart) => ({
        weekStart,
        skuId: sku.id,
        units: 100,
        planUnits: 90,
        revenue: 2400,
        discount: 0,
      }),
    );
    const hasReview = (h: WeeklySales[]) =>
      recommend(sku, base.selected.inventory, [], h).some(
        (r) => r.title === "Forecast Review Required",
      );
    assert.ok(!hasReview(rows));
    const consecutive = rows.map((r, i) => ({
      ...r,
      weekStart: addDays("2026-08-24", i * 7),
    }));
    assert.ok(hasReview(consecutive.reverse()));
    consecutive[1].units = 80;
    assert.ok(!hasReview(consecutive));
  },
);
regression(
  "Purchase advice deducts supply already added and explains the remaining timing problem",
  () => {
    const partial = buildPlan({ ...defaultState(), purchaseQuantity: 300 });
    assert.match(
      partial.selected.recommendations[0].recommendation,
      /330 further units/,
    );
    const complete = buildPlan({ ...defaultState(), purchaseQuantity: 5000 });
    assert.equal(
      complete.selected.inventory.stockoutDate,
      base.selected.inventory.stockoutDate,
    );
    assert.match(
      complete.selected.recommendations[0].recommendation,
      /5,000 units are already added/,
    );
    assert.match(
      complete.selected.recommendations[0].recommendation,
      /No further quantity.*Expedite supply/,
    );
    assert.doesNotMatch(
      complete.selected.recommendations[0].recommendation,
      /630 additional/,
    );
  },
);
regression(
  "Brief outlook and risk-cost labels follow downside and long-horizon plans",
  () => {
    const down = buildPlan({ ...defaultState(), scenarioMode: "downside" });
    assert.equal(down.outlook.title, "Demand is softening.");
    assert.match(down.outlook.detail, /-7.9%/);
    const berry = buildPlan({
      ...defaultState("berry-6"),
      forecastHorizon: 26,
    });
    assert.equal(
      berry.selected.inventory.riskValueLabel,
      "stock exposed to shortage",
    );
    assert.equal(berry.selected.inventory.excessUnits, 0);
    near(berry.selected.inventory.riskValue, 62000);
  },
);
regression(
  "Stockout comparison distinguishes unchanged, newly appearing, cleared, earlier, and later",
  () => {
    const clear = buildPlan(defaultState("peach-6"));
    assert.match(
      comparePlans(clear, clear).stockoutExplanation,
      /Neither plan/,
    );
    const shortage = buildPlan({
      ...defaultState("peach-6"),
      leadTimeWeeks: 12,
    });
    assert.match(
      comparePlans(shortage, clear).stockoutExplanation,
      /A stockout appears/,
    );
    assert.match(comparePlans(clear, shortage).stockoutExplanation, /clears/);
    assert.match(comparePlans(base, base).stockoutExplanation, /unchanged/);
    assert.match(comparePlans(stress, base).stockoutExplanation, /earlier/);
    assert.match(comparePlans(base, stress).stockoutExplanation, /later/);
  },
);
regression(
  "Zero comparable sales is unavailable rather than infinite growth",
  () => {
    const saved = history.map((h) => h.revenue);
    try {
      history.forEach((h) => {
        h.revenue = 0;
      });
      const plan = buildPlan(defaultState());
      assert.equal(plan.revenueGrowthPct, null);
      assert.equal(percent(plan.revenueGrowthPct), "No comparable sales");
      assert.match(plan.outlook.detail, /no comparable sales/);
      assertFinite(plan);
    } finally {
      history.forEach((h, i) => {
        h.revenue = saved[i];
      });
    }
  },
);
regression(
  "Inactive SKUs cannot remain selected or contribute to the active portfolio",
  () => {
    const sku = getSku("berry-6");
    try {
      sku.active = false;
      const plan = buildPlan({ ...defaultState(), selectedSkuId: sku.id });
      assert.notEqual(plan.state.selectedSkuId, sku.id);
      assert.ok(!plan.rows.some((r) => r.sku.id === sku.id));
    } finally {
      sku.active = true;
    }
  },
);
console.log(
  `Planning fixtures passed: canonical metrics, all SKU covers, projections, delayed PO, context override, scenario dates, reset, 288 stress combinations; ${regressionCount} audit regression groups passed.`,
);
