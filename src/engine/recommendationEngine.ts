import type {
  IntelligenceItem,
  Sku,
  MarketingEvent,
  WeeklySales,
} from "../data/entities";
import type { InventoryResult } from "./inventoryEngine";
import { date, money, number } from "./formatters";
import { addDays, PLANNING_DATE } from "../data/dataset";
export function recommend(
  sku: Sku,
  inv: InventoryResult,
  events: MarketingEvent[],
  history: WeeklySales[],
  promotionEnabled = false,
): IntelligenceItem[] {
  const items: IntelligenceItem[] = [];
  const add = (item: Omit<IntelligenceItem, "skuId">) =>
    items.push({ ...item, skuId: sku.id });
  const context = events.find(
    (e) =>
      e.confirmed &&
      e.type === "bfcm" &&
      e.skuIds.includes(sku.id) &&
      e.endDate >= PLANNING_DATE,
  );
  if (inv.risk === "High risk")
    add({
      type: "risk",
      priority: 1,
      title: "High Stockout Risk",
      whatChanged: `${sku.name} has ${number(inv.weeksOfCover, 1)} weeks of cover; safety stock is first breached in the week of ${date(inv.breach)}.`,
      whyItMatters: `${money(inv.riskValue)} of current stock cost is exposed to supply disruption. ${inv.stockoutDate ? `Projected stockout: week of ${date(inv.stockoutDate)}.` : "The replenishment buffer is insufficient."}`,
      recommendation:
        inv.purchaseQuantity > 0
          ? `${number(inv.purchaseQuantity)} units are already added to this scenario. ${inv.additionalPurchaseNeeded > 0 ? `Review ${number(Math.ceil(inv.additionalPurchaseNeeded))} further units. ` : "No further quantity is needed for the lead-time requirement. "}Expedite supply before the breach; the current arrival timing still leaves a shortage.`
          : inv.reorderGap > 0
            ? `Review ${number(Math.ceil(inv.reorderGap))} additional units and expedite an arrival before the breach.`
            : "Expedite existing supply before the breach; quantity alone does not solve the timing gap.",
      decisionRequired:
        "Approve an expedited supplier review before committing more demand.",
    });
  if (inv.risk === "Overstock")
    add({
      type: "risk",
      priority: 2,
      title: "Overstock Watch",
      whatChanged: `${sku.name} carries ${number(inv.weeksOfCover, 1)} weeks of cover while demand is declining.`,
      whyItMatters: `${money(inv.riskValue)} is tied up above the eight-week target.`,
      recommendation:
        "Pause additional purchasing and test a controlled bundle offer.",
      decisionRequired:
        "Approve a sell-through test without placing another purchase order.",
    });
  if (context && sku.trend < 0)
    add({
      type: "opportunity",
      priority: 2,
      title: "Business context changes the decision",
      whatChanged:
        "Historical decline suggests reducing inventory, but the BFCM campaign is confirmed.",
      whyItMatters:
        "A history-only inventory cut would leave the upcoming campaign without its planned buffer.",
      recommendation:
        "Maintain inventory and reassess against the confirmed campaign; do not automatically cut purchasing.",
      decisionRequired:
        "Validate the campaign volume and review sell-through after the event.",
    });
  const impact = inv.delayImpacts[0];
  const delayed = impact?.order;
  if (delayed)
    add({
      type: "risk",
      priority: 1,
      title: "Replenishment Timing Risk",
      whatChanged: `${delayed.id} moved from ${date(delayed.originalArrival ?? null)} to ${date(delayed.expectedArrival)}.`,
      whyItMatters: `With the delayed arrival, safety is breached in the week of ${date(inv.breach)} and stockout is ${date(inv.stockoutDate)}. With the original arrival, breach is ${date(impact.originalBreach)} and stockout is ${date(impact.originalStockout)}.`,
      recommendation:
        "Confirm a partial shipment or alternative supply before increasing paid spend.",
      decisionRequired:
        "Approve a supplier escalation and agree a revised arrival.",
    });
  const recent = history
    .filter((h) => h.skuId === sku.id)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-3);
  if (
    recent.length === 3 &&
    recent.every(
      (h, i) =>
        h.units > h.planUnits &&
        (i === 0 || h.weekStart === addDays(recent[i - 1].weekStart, 7)),
    )
  )
    add({
      type: "change",
      priority: 2,
      title: "Forecast Review Required",
      whatChanged:
        "Actual demand has exceeded plan for three consecutive weeks.",
      whyItMatters:
        "The previous plan understates the demand now flowing into purchasing.",
      recommendation:
        "Use the revised demand baseline and review the next three weekly observations.",
      decisionRequired:
        "Accept the reviewed baseline for this purchasing cycle.",
    });
  const campaigns = events.filter(
    (e) =>
      e.confirmed &&
      e.skuIds.includes(sku.id) &&
      (e.type === "promotion" || e.type === "bfcm"),
  );
  const promotion = inv.projection.find((p, i) => {
    const end = addDays(p.weekStart, 7);
    const active =
      promotionEnabled ||
      campaigns.some((e) => e.startDate < end && e.endDate >= p.weekStart);
    if (!active) return false;
    const confirmedSupply = inv.orders
      .filter((o) => o.status !== "planned" && o.expectedArrival < end)
      .reduce((sum, o) => sum + o.quantity, 0);
    const demandToDate = inv.projection
      .slice(0, i + 1)
      .reduce((sum, point) => sum + point.demand, 0);
    return demandToDate > inv.availableInventory + confirmedSupply;
  });
  if (promotion)
    add({
      type: "risk",
      priority: 1,
      title: "Promotion Constraint",
      whatChanged: `Promotion demand in the week of ${date(promotion.weekStart)} exceeds available stock plus confirmed arrivals after earlier demand is served.`,
      whyItMatters: "Promotion commitments could exceed available supply.",
      recommendation: "Stage promotion spend behind confirmed replenishment.",
      decisionRequired: "Approve a supply-gated campaign plan.",
    });
  if (!items.length)
    add({
      type: inv.risk === "Watch" ? "risk" : "change",
      priority: inv.risk === "Watch" ? 2 : 3,
      title:
        inv.risk === "Watch"
          ? "Protect the replenishment buffer"
          : "Maintain the reviewed plan",
      whatChanged:
        inv.weeklyDemand === 0
          ? `${sku.name} has no forecast consumption; weeks of cover is not applicable.`
          : `${sku.name} has ${number(inv.weeksOfCover, 1)} weeks of cover.`,
      whyItMatters:
        inv.risk === "Watch"
          ? "The buffer above lead-time demand is narrow."
          : "Supply covers the reviewed demand under the explicit planned-order assumptions.",
      recommendation:
        inv.risk === "Watch"
          ? "Confirm incoming purchase orders before approving the next campaign."
          : "Maintain the replenishment cadence and monitor weekly sell-through.",
      decisionRequired:
        inv.risk === "Watch"
          ? "Confirm supplier arrival dates this week."
          : "Review again at the next weekly planning meeting.",
    });
  return items;
}
