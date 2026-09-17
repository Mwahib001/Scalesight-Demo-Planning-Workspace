import Link from "next/link";
import {
  Database,
  RefreshCw,
  ChartNoAxesCombined,
  UserCheck,
  FileText,
  Users,
  ArrowRight,
} from "lucide-react";
import { PageTitle, SectionHeader } from "./ui";
const workflow = [
  {
    name: "Merchant Data",
    icon: Database,
    activity:
      "Orders, SKUs, inventory, customers, suppliers, campaigns, events",
    output: "Current inputs",
  },
  {
    name: "Data Refresh",
    icon: RefreshCw,
    activity: "Validate, normalize, reconcile and timestamp",
    output: "Reliable planning base",
  },
  {
    name: "Forecasting/Data Science",
    icon: ChartNoAxesCombined,
    activity: "Forecast, segment, score, simulate and detect exceptions",
    output: "Forward view",
  },
  {
    name: "Analyst Review",
    icon: UserCheck,
    activity:
      "Apply business context, challenge outputs and review assumptions",
    output: "Judgment-adjusted interpretation",
  },
  {
    name: "Decision Brief",
    icon: FileText,
    activity: "Priorities, implications, recommendations and open decisions",
    output: "Meeting-ready brief",
  },
  {
    name: "Merchant/Partner Review",
    icon: Users,
    activity: "Add operating judgment, approve and monitor",
    output: "Action and feedback",
  },
];
const archetypes = [
  [
    "A",
    "Demand + inventory",
    "An expanding catalog with uneven stock coverage.",
    "Replenishment priorities and scenario-based order reviews.",
  ],
  [
    "B",
    "Retention + LTV",
    "Repeat customers and reorder timing need attention.",
    "Segment review, retention tests and expected value assumptions.",
  ],
  [
    "C",
    "Marketing + profitability",
    "Acquisition performance needs a margin-aware view.",
    "Cohort economics and source comparisons with sample sizes.",
  ],
  [
    "D",
    "Custom predictive / operational",
    "A specific operating decision falls outside a standard dashboard.",
    "A scoped analytical environment built around that decision.",
  ],
];
export function ManagedIntelligence() {
  return (
    <>
      <PageTitle
        section="PARTNERSHIP / THE OPERATING MODEL"
        title="Managed Intelligence"
        description="The workspace is one part of a recurring, analyst-reviewed decision process."
      />
      <section className="statement-panel">
        <span className="eyebrow">
          A PROCESS, WITH PEOPLE ACCOUNTABLE FOR THE WORK
        </span>
        <h2>
          {
            "THE INTERFACE IS NOT THE PRODUCT. THE MANAGED INTELLIGENCE PROCESS BEHIND IT IS."
          }
        </h2>
        <p>
          ScaleSight is presented as the proposed managed intelligence and
          data-science partner: connecting analytical work to a useful merchant
          decision, then reviewing what changed.
        </p>
        <span className="statement-tag">Proposed partnership model</span>
      </section>
      <SectionHeader
        eyebrow="FROM DATA TO A REVIEWED DECISION"
        title="Six steps. One repeatable review cycle."
      />
      <div className="workflow-grid">
        {workflow.map((w, i) => (
          <article className="card workflow-card" key={w.name}>
            <div className="workflow-top">
              <span className="step-number">0{i + 1}</span>
              <w.icon size={22} />
            </div>
            <h3>{w.name}</h3>
            <p>{w.activity}</p>
            <div className="workflow-output">
              <span className="eyebrow">OUTPUT</span>
              <p>{w.output}</p>
            </div>
            {i < 5 && <ArrowRight className="workflow-arrow" size={18} />}
          </article>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">SCOPED TO THE MERCHANT</span>
          <h2>{"ONE MERCHANT DOES NOT EQUAL ONE STANDARD TEMPLATE."}</h2>
        </div>
      </div>
      <div className="archetype-grid">
        {archetypes.map((a) => (
          <article className="card archetype" key={a[0]}>
            <span className="archetype-letter">{a[0]}</span>
            <span className="eyebrow">MERCHANT {a[0]}</span>
            <h3>{a[1]}</h3>
            <p>{a[2]}</p>
            <p className="archetype-output">{a[3]}</p>
          </article>
        ))}
      </div>
      <section className="card discovery">
        <SectionHeader
          title="Start with discovery, then define the environment"
          detail={<span>Decisions before dashboards</span>}
        />
        <div className="discovery-steps">
          {[
            "Business problem",
            "Decision owner",
            "Available data",
            "Decision cadence",
            "Constraints",
            "Measurable success criterion",
            "Minimum useful environment",
            "Managed review cadence",
          ].map((s, i) => (
            <div key={s}>
              <span>{i + 1}</span>
              {s}
              {i < 7 && <ArrowRight size={14} />}
            </div>
          ))}
        </div>
        <p className="footnote">
          A potential future integration is a possibility subject to agreement
          and technical discovery. This demo uses static fictional data; the
          operating model would be scoped with the merchant.
        </p>
      </section>
      <div className="process-strip">
        <div>
          <strong>Make the first cycle useful enough to review.</strong>
          <p>
            Define the problem, the evidence of value, and the decision to make
            next.
          </p>
        </div>
        <Link href="/partnership">
          Explore the proposed pilot <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
