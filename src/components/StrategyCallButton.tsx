import { ArrowRight } from "lucide-react";

export function StrategyCallButton() {
  return (
    <div className="strategy-call">
      <a className="button" href="mailto:arman@scalesight.org">
        Book A Strategy Call <ArrowRight size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
