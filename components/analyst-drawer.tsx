"use client";
import { useState } from "react";
import { Drawer } from "./drawer";
import { useWorkspace } from "./workspace-context";
import { answerQuestion, questions, analystFallback } from "@/lib/analyst";
export function AnalystDrawer() {
  const w = useWorkspace();
  const [answer, setAnswer] = useState(
    "Select a question to review the committed demo data and current planning assumptions.",
  );
  const [input, setInput] = useState("");
  return (
    <Drawer title="Ask ScaleSight Analyst" onClose={w.closeAnalyst}>
      <p className="muted">Deterministic demo guidance · {w.selectedSku}</p>
      <div className="notice">
        Decision support for an analyst-reviewed workflow. Answers use committed
        demo data and scenario calculations.
      </div>
      <div className="question-list">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() =>
              setAnswer(
                answerQuestion(
                  q,
                  w.selectedSku,
                  w.scenario,
                  w.horizon,
                  w.selectedChannel,
                ),
              )
            }
          >
            {q}
            <span aria-hidden>↗</span>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAnswer(analystFallback);
        }}
      >
        <label htmlFor="analyst-question">Other question</label>
        <div className="inline-form">
          <input
            id="analyst-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a demo question"
          />
          <button className="btn secondary" type="submit">
            Ask
          </button>
        </div>
      </form>
      <div className="analyst-answer" aria-live="polite">
        <span className="eyebrow">ANALYST REVIEW</span>
        <p>{answer}</p>
      </div>
      <p className="footnote">
        Suggested questions demonstrate a potential workflow. Scenario responses
        are temporary and do not apply changes.
      </p>
    </Drawer>
  );
}
