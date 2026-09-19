"use client";
import { useState } from "react";
import { usePlanning } from "../context/PlanningContext";
import { PageHeading, SectionHeading } from "./ui";
import { IntelligenceCard } from "./IntelligenceCard";
export function IntelligenceView() {
  const { plan } = usePlanning();
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");
  const items = plan.intelligence.filter(
    (i) =>
      (type === "all" || type === i.type) &&
      (priority === "all" || Number(priority) === i.priority),
  );
  const judgment = plan.intelligence.find(
    (i) => i.title === "Business context changes the decision",
  );
  return (
    <>
      <PageHeading
        eyebrow="FROM SIGNAL TO DECISION"
        title="Intelligence Center"
        description="Material changes, interpreted by your planning team. Every signal comes with a next step."
      />
      {judgment && (
        <section className="judgment-banner">
          <div>
            <span className="eyebrow">HUMAN JUDGMENT IN THE LOOP</span>
            <h2>History suggests a cut. Business context says hold.</h2>
            <p>
              Winter Discovery Kit is slowing, but the confirmed BFCM campaign
              changes the decision. ScaleSight retains the buffer and asks the
              team to validate campaign volume.
            </p>
          </div>
          <span className="judgment-seal">
            Data
            <br />
            <b>+</b>
            <br />
            Context
          </span>
        </section>
      )}
      <div className="filter-bar">
        <div>
          <span className="field-label">Intelligence type</span>
          <div className="segmented">
            {["all", "risk", "opportunity", "change"].map((t) => (
              <button
                key={t}
                aria-pressed={type === t}
                onClick={() => setType(t)}
              >
                {t === "all" ? "All intelligence" : t}
              </button>
            ))}
          </div>
        </div>
        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">All priorities</option>
            <option value="1">1 · Act now</option>
            <option value="2">2 · Review this week</option>
            <option value="3">3 · Monitor</option>
          </select>
        </label>
      </div>
      <SectionHeading
        title="Your managed intelligence queue"
        description={`${items.length} interpreted signals · deterministic rules + confirmed business context`}
      />
      <div className="intelligence-grid">
        {items.map((item, i) => (
          <IntelligenceCard key={`${item.skuId}-${i}`} item={item} />
        ))}
      </div>
      {!items.length && (
        <div className="panel empty-state">
          No signals match these filters. Try another priority or intelligence
          type.
        </div>
      )}
    </>
  );
}
