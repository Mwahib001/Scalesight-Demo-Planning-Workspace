"use client";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  ChartNoAxesCombined,
  CheckCheck,
  Compass,
  Focus,
  MessageSquareText,
  RefreshCcw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeading, SectionHeading, PlanLink } from "./ui";
const steps = [
  {
    name: "Monitor",
    icon: Activity,
    title: "Always watching the signals that matter.",
    text: "Revenue, demand, inventory, and SKU performance are reviewed together. Material changes are surfaced for analyst attention.",
    output: "A refreshed view of business performance and supply exposure.",
  },
  {
    name: "Analyze",
    icon: Search,
    title: "Turn a change into an explanation.",
    text: "The planning team tests the signal against history, purchase orders, campaigns, and supplier context. Assumptions are explicit and confidence stays qualitative.",
    output: "A business explanation of what changed and why it matters.",
  },
  {
    name: "Prioritize",
    icon: Focus,
    title: "Know which decisions come first.",
    text: "Timing, cash exposure, and commercial importance determine what needs management attention this week.",
    output: "A short, ordered planning brief with clear decision owners.",
  },
  {
    name: "Recommend",
    icon: Compass,
    title: "Every insight has a next step.",
    text: "The team prepares purchasing actions, demand scenarios, and commercial trade-offs. Every recommendation includes the change, meaning, action, and decision required.",
    output: "Considered actions and scenario analysis on demand.",
  },
  {
    name: "Review",
    icon: Users,
    title: "Make the decision with your team.",
    text: "A planning review brings your business context into the model. Decisions update the assumptions, and the next monitoring cycle begins.",
    output: "Strategic guidance and ongoing decision support.",
  },
];
export function ManagedWorkflow() {
  const [active, setActive] = useState(0);
  const s = steps[active];
  return (
    <section className="workflow-panel">
      <div className="workflow-heading">
        <span className="eyebrow">YOUR CONTINUOUS INTELLIGENCE LOOP</span>
        <span>
          <RefreshCcw size={14} />
          Always connected to your business
        </span>
      </div>
      <div
        className="workflow-steps"
        role="tablist"
        aria-label="Managed intelligence workflow"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const next = (active + (e.key === "ArrowRight" ? 1 : 4)) % 5;
            setActive(next);
            document.getElementById(`workflow-tab-${next}`)?.focus();
          }
        }}
      >
        {steps.map((step, i) => (
          <button
            role="tab"
            id={`workflow-tab-${i}`}
            aria-selected={active === i}
            aria-controls="workflow-detail"
            tabIndex={active === i ? 0 : -1}
            className={active === i ? "selected" : ""}
            key={step.name}
            onClick={() => setActive(i)}
          >
            <span className="workflow-step-icon">
              <step.icon size={23} />
            </span>
            <small>0{i + 1}</small>
            <strong>{step.name}</strong>
            {i < 4 && <ArrowRight className="workflow-arrow" size={20} />}
          </button>
        ))}
      </div>
      <div
        className="workflow-detail"
        id="workflow-detail"
        role="tabpanel"
        aria-labelledby={`workflow-tab-${active}`}
      >
        <div>
          <span className="eyebrow">
            {s.name.toUpperCase()} · SCALESIGHT + YOUR TEAM
          </span>
          <h2>{s.title}</h2>
          <p>{s.text}</p>
        </div>
        <div className="workflow-output">
          <CheckCheck size={22} />
          <span>WHAT YOU RECEIVE</span>
          <strong>{s.output}</strong>
        </div>
      </div>
      <div className="loop-return">
        <RefreshCcw size={13} />
        Your decisions inform the next monitoring cycle
      </div>
    </section>
  );
}
const outcomes = [
  ["Better demand visibility", "Plan purchasing earlier."],
  ["Earlier stockout detection", "Protect potential revenue."],
  ["Overstock identification", "Reduce unnecessary cash tied up in inventory."],
  [
    "Scenario planning",
    "Understand promotion, spend, and demand before committing.",
  ],
  ["Weekly prioritization", "Know what needs management attention."],
  [
    "Recommendations + analyst guidance",
    "Decide with context, with a team alongside you.",
  ],
];
export function ManagedIntelligence() {
  return (
    <>
      <PageHeading
        eyebrow="THE SYSTEM DOESN’T RUN ALONE"
        title="Managed Intelligence"
        description="A planning system is the foundation. Ongoing analysis and human judgment make it valuable."
      />
      <section className="service-hero">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} />
            PLANNING SYSTEM + YOUR INTELLIGENCE TEAM
          </span>
          <h2>
            Clarity about what’s coming.
            <br />
            Confidence in what to do next.
          </h2>
          <p>
            ScaleSight continuously connects your revenue, demand, and
            inventory—then works with your team to turn the findings into better
            business decisions.
          </p>
        </div>
        <div className="service-equation">
          <span>
            <ChartNoAxesCombined size={22} />
            Planning system
          </span>
          <b>+</b>
          <span>
            <Users size={22} />
            Analyst judgment
          </span>
          <b>=</b>
          <span>
            <Compass size={22} />A considered next step
          </span>
        </div>
      </section>
      <div className="service-status">
        {[
          ["Data Updated", "Sep 17, 2026 · 6:00 AM"],
          ["Business Monitored", "Revenue · Demand · Inventory · SKUs"],
          ["Changes Analyzed", "7 material changes"],
          ["Priorities Identified", "3 require attention"],
          ["Recommendations Prepared", "4 actions"],
          ["Next Planning Review", "Monday"],
        ].map(([a, b]) => (
          <div key={a}>
            <span>{a}</span>
            <strong>{b}</strong>
          </div>
        ))}
      </div>
      <p className="chart-note">
        Operating-cycle status reflects the reviewed base brief. Scenario
        signals are recalculated separately in the Intelligence Center.
      </p>
      <ManagedWorkflow />
      <SectionHeading
        title="What your team gets—and why it matters"
        description="An ongoing service, connected directly to operating outcomes."
      />
      <div className="outcome-grid">
        {outcomes.map(([a, b], i) => (
          <article className="panel outcome-card" key={a}>
            <span>0{i + 1}</span>
            <h3>{a}</h3>
            <p>{b}</p>
          </article>
        ))}
      </div>
      <section className="panel">
        <SectionHeading
          title="From refreshed data to a business decision"
          description="A weekly operating rhythm, with continuous monitoring between reviews."
        />
        <div className="operating-cycle">
          {[
            "Data Refresh",
            "Planning System",
            "ScaleSight Analyst Review",
            "Weekly Intelligence",
            "Planning Review",
            "Business Decision",
          ].map((v, i) => (
            <div key={v}>
              <span>{i + 1}</span>
              <strong>{v}</strong>
              {i < 5 && <ArrowRight size={15} />}
            </div>
          ))}
        </div>
        <div className="service-deliverables">
          <p>
            <CheckCheck size={17} />
            Forecast and planning updates
          </p>
          <p>
            <CheckCheck size={17} />
            Weekly business analysis + executive planning reports
          </p>
          <p>
            <CheckCheck size={17} />
            Scenario analysis on demand
          </p>
          <p>
            <CheckCheck size={17} />
            Planning review + strategic guidance
          </p>
          <p>
            <CheckCheck size={17} />
            Prioritized recommendations
          </p>
          <p>
            <CheckCheck size={17} />
            Ongoing decision support
          </p>
        </div>
      </section>
      <section className="pilot-panel" id="pilot">
        <div>
          <span className="eyebrow">BUILD YOUR FIRST PLANNING SYSTEM</span>
          <h2>The 30-Day Planning Pilot</h2>
          <p>
            Start with your priority SKUs, align the assumptions, and establish
            a planning rhythm your team can use.
          </p>
        </div>
        <div className="pilot-weeks">
          {[
            [
              "Week 1",
              "Understand the business",
              "Align data, decisions, and priority SKUs.",
            ],
            [
              "Week 2",
              "Build the first plan",
              "Set baselines and make assumptions visible.",
            ],
            [
              "Week 3",
              "Review the decisions",
              "Stress-test demand, supply, and cash.",
            ],
            [
              "Week 4",
              "Establish the rhythm",
              "Deliver the executive brief and ongoing review plan.",
            ],
          ].map(([a, b, c]) => (
            <div key={a}>
              <span>{a}</span>
              <h3>{b}</h3>
              <p>{c}</p>
            </div>
          ))}
        </div>
        <details className="strategy-call">
          <summary className="button">
            Book A Strategy Call <ArrowRight size={16} />
          </summary>
          <div>
            <MessageSquareText size={22} />
            <h3>Your first conversation</h3>
            <p>
              Bring your current purchasing process, the decisions that are
              hardest to make, and a list of priority products. Your ScaleSight
              contact can arrange the strategy session and scope the pilot.
            </p>
            <p className="muted">
              Demo preview: booking and contact submission are not connected.
            </p>
          </div>
        </details>
        <PlanLink href="/">Return to your weekly planning brief</PlanLink>
      </section>
    </>
  );
}
