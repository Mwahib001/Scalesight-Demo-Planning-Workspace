import { Radio, ArrowUpRight } from "lucide-react";
import type { IntelligenceItem } from "../data/entities";
import { RecommendationPanel } from "./RecommendationPanel";
import { PlanLink } from "./ui";
export function IntelligenceCard({ item }: { item: IntelligenceItem }) {
  return (
    <article className={`intelligence-card type-${item.type}`}>
      <div className="intelligence-top">
        <span>
          <Radio size={14} />
          {item.type}
        </span>
        <span className="subtle-badge">Priority {item.priority}</span>
      </div>
      <h2>{item.title}</h2>
      <RecommendationPanel item={item} compact />
      {item.skuId && (
        <PlanLink href="/sku-planning" skuId={item.skuId}>
          Open the decision context <ArrowUpRight size={13} />
        </PlanLink>
      )}
    </article>
  );
}
