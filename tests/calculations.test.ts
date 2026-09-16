import test from "node:test";
import assert from "node:assert/strict";
import {
  backtest,
  skus,
  skuById,
  weeklyActuals,
  forecastVersions,
  receipts,
  events,
  sources,
  segments,
  cohorts,
  customerWeeks,
  customerAggregate,
} from "../data/planning";
import {
  validateFixtures,
  catalogMetrics,
  growthMetrics,
} from "../lib/selectors";
import {
  inventoryMetrics,
  reconciliationFixture,
  defaultScenario,
  runScenario,
  mape,
  simulateInventory,
  rollingRefresh,
  customerMetrics,
  outsideReorderWindow,
  validateInput,
  riskState,
} from "../lib/calculations";
import { answerQuestion, questions } from "../lib/analyst";
test("build-blocking catalog and customer invariants reconcile", () => {
  const m = validateFixtures();
  assert.equal(m.activeSkus, 142);
  assert.ok(Math.abs(m.inventoryValue - 1100000) < 1);
  assert.equal(m.stockoutRisk, 7);
  assert.ok(Math.abs(m.excessValue - 126000) < 1);
  const g = growthMetrics();
  assert.equal(g.repeatRate, 38.4);
  assert.ok(Math.abs(g.repeatRevenue - 46.8) < 1e-9);
  assert.equal(g.value, 142);
  assert.equal(g.overdue, 1240);
  assert.equal(
    segments.reduce((n, s) => n + s.customers, 0),
    18000,
  );
  assert.equal(
    cohorts.reduce((n, s) => n + s.size, 0),
    18000,
  );
  assert.equal(
    customerWeeks.reduce((n, w) => n + w.newRevenue + w.repeatRevenue, 0),
    1700000,
  );
  assert.equal(
    customerWeeks.reduce((n, w) => n + w.repeatRevenue, 0),
    customerAggregate.quarterRepeatRevenue,
  );
  assert.equal(
    sources.reduce((n, s) => n + s.size, 0),
    9000,
  );
  assert.equal(sources[1].value / sources[0].value, 1.21);
});
test("SKU-104 exact worked inventory example", () => {
  const m = inventoryMetrics(skuById("SKU-104"));
  assert.equal(m.usable, 4257);
  assert.equal(m.safety, 1356);
  assert.equal(m.required, 8136);
  assert.equal(m.reorderGap, 3879);
  assert.equal(m.eligibleIncoming, 0);
  assert.equal(Math.ceil(m.projection.breach!), 3);
  assert.equal(m.cover.toFixed(1), "3.8");
  assert.equal(m.projection.stockout?.toFixed(1), "3.8");
});
test("scenario fixture preserves raw gap, allowance, purchase and cash", () => {
  const r = reconciliationFixture();
  assert.equal(r.baseRequired, 9800);
  assert.equal(r.rawRequired, 12245);
  assert.equal(r.displayRequired, 12250);
  assert.equal(r.rawCalculatedGap, 2445);
  assert.equal(r.roundingAllowance, 1155);
  assert.equal(r.recommendedRoundedUnits, 3600);
  assert.equal(r.capitalImpact, 27000);
  assert.equal(r.recommendedRoundedUnits * 7.5, r.capitalImpact);
  assert.equal(3600 * 7.5, 27000);
});
test("four-week committed MAPE is 18.4 and ignores zero actuals", () => {
  assert.ok(Math.abs(mape(backtest)! - 18.4) < 1e-9);
  assert.equal(mape([{ actual: 0, previousForecast: 100 }]), null);
  assert.equal(
    mape([
      { actual: 100, previousForecast: 90 },
      { actual: 0, previousForecast: 200 },
    ]),
    10,
  );
});
test("dataset volumes, deterministic history, immutable source records", () => {
  assert.equal(skus.filter((s) => s.authored).length, 12);
  assert.equal(skus.filter((s) => !s.authored).length, 130);
  assert.equal(weeklyActuals(skus[0]).length, 104 * 3);
  assert.deepEqual(weeklyActuals(skus[0]), weeklyActuals(skus[0]));
  assert.equal(forecastVersions.length, 12 * 4 + 130);
  assert.equal(receipts.length, 24);
  assert.equal(events.length, 18);
  assert.ok(Object.isFrozen(skus));
  assert.ok(Object.isFrozen(skus[0]));
});
test("forecast totals use the committed prior version", () => {
  const versions = forecastVersions.filter((v) => v.skuId === "SKU-104");
  const current = versions.at(-1)!;
  assert.equal(
    current.weeks.slice(0, 4).reduce((n, w) => n + w.units, 0),
    4620,
  );
  assert.equal(
    current.weeks.slice(0, 8).reduce((n, w) => n + w.units, 0),
    9420,
  );
  assert.equal(
    versions
      .at(-2)!
      .weeks.slice(0, 8)
      .reduce((n, w) => n + w.units, 0),
    8250,
  );
});
test("receipt eligibility excludes late PO and does not double count", () => {
  const s = { ...skuById("SKU-104"), incomingUnits: 2000, incomingWeek: 2 };
  assert.equal(inventoryMetrics(s).eligibleIncoming, 2000);
  assert.equal(
    inventoryMetrics(s).projection.points.at(-1)!.onHand,
    4257 + 2000 - 1130 * 26,
  );
  const late = inventoryMetrics({ ...s, incomingWeek: 5 });
  assert.equal(late.eligibleIncoming, 0);
  assert.equal(late.reorderGap, 3879);
  assert.equal(late.projection.stockout?.toFixed(1), "3.8");
});
test("projection does not let a receipt erase an earlier stockout", () => {
  const r = simulateInventory(
    150,
    [100, 100, 100],
    [{ week: 2, units: 400 }],
    50,
  );
  assert.equal(r.stockout, 1.5);
  assert.equal(r.points.at(-1)?.onHand, 250);
});
test("promotion ends; ad elasticity applies only to committed SKU/channel", () => {
  const s = skus[0],
    d = defaultScenario(s);
  const r = runScenario(
    s,
    { ...d, promotion: true, adSpendChange: 1 },
    13,
    "All",
  );
  assert.equal(r.weeklyDemand[0], 1130);
  assert.equal(r.weeklyDemand[1], 1130 * 1.15);
  assert.equal(r.weeklyDemand[3], 1130);
  assert.equal(r.adEffectApplied, false);
  assert.equal(
    runScenario(s, { ...d, adSpendChange: 1 }, 13, "Online Store").demand,
    1130 * 1.12,
  );
  assert.equal(
    runScenario(
      skus[1],
      { ...defaultScenario(skus[1]), adSpendChange: 1 },
      13,
      "Online Store",
    ).adEffectApplied,
    false,
  );
});
test("scenario clamps invalid input without NaN and resets without mutation", () => {
  const s = skus[0],
    before = JSON.stringify(s);
  const d = validateInput(
    s,
    {
      ...defaultScenario(s),
      demandChange: Infinity,
      incomingUnits: NaN,
      safetyWeeks: 100,
      incomingWeek: 99,
    },
    4,
  );
  assert.equal(d.demandChange, 0);
  assert.equal(d.incomingUnits, 0);
  assert.equal(d.safetyWeeks, 4);
  assert.equal(d.incomingWeek, 4);
  const r = runScenario(s, d, 4);
  assert.ok(Number.isFinite(r.required));
  assert.equal(JSON.stringify(s), before);
  assert.equal(defaultScenario(s).demandChange, 0);
});
test("scenario rounded PO and cash use the same result", () => {
  for (const s of skus) {
    const r = runScenario(s, {
      ...defaultScenario(s),
      demandChange: 0.5,
      supplierDelay: true,
    });
    assert.equal(r.recommendedRoundedUnits % s.packSize, 0);
    assert.equal(
      r.capitalImpact,
      (r.recommendedRoundedUnits - r.basePO) * s.unitCost,
    );
    assert.ok(r.recommendedRoundedUnits >= r.rawCalculatedGap);
  }
});
test("pure risk rules cover all states", () => {
  const s = skus[0];
  assert.equal(riskState(s, 3, 3, 2), "High");
  assert.equal(riskState({ ...s, demandDelta: -0.1 }, 20, 20, null), "Excess");
  assert.equal(riskState({ ...s, materialEvent: true }, 10, 10, null), "Watch");
  assert.equal(riskState(s, 10, 10, null), "Healthy");
});
test("rolling refresh compares BEFORE re-estimation and retains prior", () => {
  const prior = {
    id: "v1",
    skuId: "SKU-104",
    issuedAt: "2026-08-10",
    weeks: [
      { weekStart: "2026-08-17", units: 800 },
      { weekStart: "2026-08-24", units: 900 },
    ],
  };
  const actual = {
    skuId: "SKU-104",
    weekStart: "2026-08-17",
    channel: "All" as const,
    units: 1000,
  };
  const r = rollingRefresh([], prior, actual, "2026-08-24");
  assert.equal(r.comparison.previousForecast, 800);
  assert.equal(r.comparison.variance, 200);
  assert.equal(r.updated.weeks[1].units, 1000);
  assert.equal(r.priorVersion.weeks[1].units, 900);
  assert.throws(() =>
    rollingRefresh(
      [],
      { ...prior, issuedAt: "2026-08-18" },
      actual,
      "2026-08-24",
    ),
  );
});
test("customer definitions exclude cancelled/refunded and use exact windows", () => {
  const base = {
    customerId: "c1",
    acquiredAt: "2026-01-01",
    date: "2026-01-01",
    sequence: 1,
    status: "completed" as const,
    netRevenue: 100,
  };
  const m = customerMetrics([
    base,
    { ...base, sequence: 2, date: "2026-01-20", netRevenue: 50 },
    { ...base, customerId: "c2", status: "cancelled", netRevenue: 900 },
    { ...base, status: "refunded", netRevenue: 900 },
    { ...base, sequence: 3, date: "2026-04-01", netRevenue: 20 },
  ]);
  assert.equal(m.repeatPurchaseRate, 1);
  assert.equal(m.newRevenue, 100);
  assert.equal(m.repeatRevenue, 70);
  assert.equal(m.realized90DayValue, 150);
  assert.equal(outsideReorderWindow("2026-08-08", 30, 7), false);
  assert.equal(outsideReorderWindow("2026-08-07", 30, 7), true);
});
test("analyst suggestions are deterministic, isolated and support fallback", () => {
  const input = defaultScenario(skus[0]),
    saved = JSON.stringify(input);
  for (const q of questions) {
    assert.equal(
      answerQuestion(q, "SKU-104", input, 13, "All"),
      answerQuestion(q, "SKU-104", input, 13, "All"),
    );
  }
  assert.equal(JSON.stringify(input), saved);
  assert.match(
    answerQuestion("unmatched", "SKU-104", input, 13, "All"),
    /supports the suggested demo questions/,
  );
  assert.match(
    answerQuestion(questions[2], "SKU-104", input, 13, "All"),
    /illustrative estimate/,
  );
  assert.equal(catalogMetrics().risks.length, 142);
});
