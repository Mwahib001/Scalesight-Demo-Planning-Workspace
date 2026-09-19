import { ArrowUpRight } from "lucide-react";
export function MetricCard({
  label,
  value,
  delta,
  qualifier,
  accent = false,
}: {
  label: string;
  value: string;
  delta?: string;
  qualifier: string;
  accent?: boolean;
}) {
  return (
    <article className={`metric-card ${accent ? "accent" : ""}`}>
      <div className="metric-label">
        {label}
        <ArrowUpRight size={14} />
      </div>
      <strong>{value}</strong>
      {delta && <span className="metric-delta">{delta}</span>}
      <p>{qualifier}</p>
    </article>
  );
}
