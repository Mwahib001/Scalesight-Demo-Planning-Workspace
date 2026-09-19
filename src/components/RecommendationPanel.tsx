import { Sparkles } from "lucide-react";
import type { IntelligenceItem } from "../data/entities";
export function RecommendationPanel({
  item,
  compact = false,
}: {
  item: IntelligenceItem;
  compact?: boolean;
}) {
  return (
    <section className={`recommendation-panel ${compact ? "compact" : ""}`}>
      <div className="recommendation-title">
        <Sparkles size={16} />
        <strong>ScaleSight recommendation</strong>
      </div>
      <dl>
        {[
          ["What Changed", item.whatChanged],
          ["Why It Matters", item.whyItMatters],
          ["Recommended Action", item.recommendation],
          ["Decision Required", item.decisionRequired],
        ].map(([label, text]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
