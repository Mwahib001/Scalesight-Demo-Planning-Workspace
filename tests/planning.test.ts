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
} from "../src/data/kelarune";
import { generateHistory } from "../src/data/dataset";
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
near(base.revenueGrowthPct, 8.4);
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
console.log(
  "Planning fixtures passed: canonical metrics, all SKU covers, projections, delayed PO, context override, scenario dates, reset, 288 stress combinations.",
);
