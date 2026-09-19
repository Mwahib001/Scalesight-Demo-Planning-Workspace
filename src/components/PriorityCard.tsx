import { ArrowUpRight, Package, CalendarDays } from "lucide-react";
import type { IntelligenceItem, Risk } from "../data/entities";
import { RiskBadge } from "./RiskBadge";
import { PlanLink } from "./ui";
export function PriorityCard({
  priority,
  title,
  item,
  risk,
  metric,
  metricLabel,
  href,
  skuId,
  kind,
}: {
  priority: number;
  title: string;
  item: IntelligenceItem;
  risk: Risk;
  metric: string;
  metricLabel: string;
  href: string;
  skuId: string;
  kind: string;
}) {
  const Icon =
    priority === 1 ? ArrowUpRight : priority === 2 ? Package : CalendarDays;
  return (
    <article className={`priority-card priority-${priority}`}>
      <div className="priority-top">
        <span className="priority-kind">
          <Icon size={16} />
          {kind}
        </span>
        <span className="priority-number">0{priority}</span>
      </div>
      <h3>{title}</h3>
      <RiskBadge risk={risk} />
      <div className="priority-metric">
        <strong>{metric}</strong>
        <span>{metricLabel}</span>
      </div>
      <dl className="priority-copy">
        <div>
          <dt>What Changed</dt>
          <dd>{item.whatChanged}</dd>
        </div>
        <div>
          <dt>Why It Matters</dt>
          <dd>{item.whyItMatters}</dd>
        </div>
        <div className="action-copy">
          <dt>Recommended Action</dt>
          <dd>{item.recommendation}</dd>
        </div>
        <div>
          <dt>Decision Required</dt>
          <dd>{item.decisionRequired}</dd>
        </div>
      </dl>
      <PlanLink href={href} skuId={skuId} className="priority-link">
        {priority === 1
          ? "Review Mango plan"
          : priority === 2
            ? "Review inventory decision"
            : "Explore BFCM scenario"}
      </PlanLink>
    </article>
  );
}
