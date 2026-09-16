import { changes, skus, skuById, money, formatUnits } from "../data/planning";
import { inventoryMetrics, runScenario } from "./calculations";
import type { ScenarioInput } from "./types";
export const questions = [
  "Why is SKU-104 at risk?",
  "What happens if demand increases 20%?",
  "Which SKUs tie up the most working capital?",
  "What changed since last week?",
  "Which purchasing decisions require attention?",
];
export function answerQuestion(
  question: string,
  selectedSku: string,
  scenario: ScenarioInput,
  horizon: number,
  channel: string,
) {
  if (question === questions[0]) {
    const s = skuById("SKU-104"),
      m = inventoryMetrics(s);
    return `${s.id} ${s.name} has ${formatUnits(s.currentInventory)} units, ${m.cover.toFixed(1)} weeks cover and a ${s.leadTimeWeeks}-week lead time. Usable stock is ${formatUnits(m.usable)} after loss. Safety stock is breached in week ${Math.ceil(m.projection.breach ?? 0)}. Latest observed demand is 23% above the prior forecast; the next 8-week base plan is 14.2% above its prior version. Review an expedited PO. Unit impacts are an illustrative estimate.`;
  }
  if (question === questions[1]) {
    const r = runScenario(
      skuById(selectedSku),
      { ...scenario, demandChange: 0.2 },
      horizon,
      channel,
    );
    return `Temporary assumption for ${selectedSku}: demand ${formatUnits(r.demand)} units/week; recommended PO ${formatUnits(r.recommendedRoundedUnits)} units; incremental cash ${money(r.capitalImpact)}. Illustrative estimate. ${r.recommendation} Saved scenario inputs have not changed.`;
  }
  if (question === questions[2])
    return skus
      .map((s) => ({ s, m: inventoryMetrics(s) }))
      .filter((r) => r.m.workingCapital > 0)
      .sort((a, b) => b.m.workingCapital - a.m.workingCapital)
      .slice(0, 5)
      .map(
        (r) =>
          `${r.s.id} ${r.s.name}: ${money(r.m.workingCapital)} illustrative estimate (${formatUnits(r.m.excess)} excess units).`,
      )
      .join("\n\n");
  if (question === questions[3])
    return [...changes]
      .sort((a, b) => b.impact - a.impact)
      .map(
        (c) =>
          `${c.area} / ${c.subject}: ${c.happened}. ${c.matters}. Decision: ${c.decision}.`,
      )
      .join("\n\n");
  if (question === questions[4])
    return skus
      .map((s) => ({ s, m: inventoryMetrics(s) }))
      .filter((r) => r.m.risk === "High" || r.m.risk === "Watch")
      .map(
        (r) =>
          `${r.m.risk} — ${r.s.id} ${r.s.name}: ${r.m.risk === "High" ? "Review receipt timing and an expedited purchase order." : "Confirm event assumptions before increasing the order."}`,
      )
      .join("\n\n");
  return "This prototype supports the suggested demo questions. A production analyst workflow would be scoped around the merchant's needs.";
}
