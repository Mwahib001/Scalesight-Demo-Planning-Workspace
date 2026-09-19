import { AlertTriangle, CircleCheck, Clock3, Package } from "lucide-react";
import type { Risk } from "../data/entities";
export function RiskBadge({ risk }: { risk: Risk }) {
  const Icon =
    risk === "High risk"
      ? AlertTriangle
      : risk === "Watch"
        ? Clock3
        : risk === "Overstock"
          ? Package
          : CircleCheck;
  return (
    <span className={`risk-badge risk-${risk.toLowerCase().replace(" ", "-")}`}>
      <Icon size={12} />
      {risk}
    </span>
  );
}
