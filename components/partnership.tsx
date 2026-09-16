import { ArrowDown, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { partnershipModels } from "@/data/planning";
import { PageTitle, SectionHeader } from "./ui";
const pilot = [
  [
    "Identify problem",
    "One named merchant problem and an accountable decision owner.",
  ],
  [
    "Review data",
    "A documented inventory of available records, gaps and access constraints.",
  ],
  [
    "Define success criteria",
    "An agreed decision-usefulness measure and review period.",
  ],
  [
    "Configure environment",
    "A minimum useful view with transparent calculations and assumptions.",
  ],
  [
    "Run initial cycle",
    "A dated refresh, analyst review and merchant decision brief.",
  ],
  [
    "Review value",
    "Merchant feedback and evidence against the success criteria.",
  ],
  [
    "Decide how to scale",
    "A recorded decision to extend, revise or stop the pilot.",
  ],
];
export function Partnership() {
  return (
    <>
      <PageTitle
        section="PARTNERSHIP / A CONVERSATION STARTER"
        title="Blockify x ScaleSight Partnership"
        description="A proposed model for helping merchants turn analytical insight into better operating decisions."
      />
      <section className="statement-panel partnership-hero">
        <span className="statement-tag">PROPOSED PARTNERSHIP MODEL</span>
        <div className="partner-wordmarks">
          <strong>Blockify</strong>
          <span>×</span>
          <div>
            <b>ScaleSight</b>
            <small>Managed intelligence / data-science partner</small>
          </div>
        </div>
        <h2>FROM PROTECTED COMMERCE TO BETTER MERCHANT DECISIONS.</h2>
        <p>
          A concept for discussion. Merchant fit, delivery responsibilities and
          commercial structure would be explored together. A potential future
          integration is a possibility subject to agreement and technical
          discovery.
        </p>
      </section>
      <SectionHeader
        eyebrow="THREE STRUCTURES TO EXPLORE"
        title="A partnership shaped around merchant fit"
        detail={<span>Concepts for discussion</span>}
      />
      <div className="commercial-grid">
        {partnershipModels.map((p, i) => (
          <article className="card commercial-card" key={p.name}>
            <span className="option-letter">{String.fromCharCode(65 + i)}</span>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <div className="commercial-steps">{p.steps}</div>
            <p className="qualification">{p.qualifier}</p>
            <a className="btn secondary" href="#pilot">
              Discuss structure <ArrowDown size={15} />
            </a>
          </article>
        ))}
      </div>
      <section id="pilot" className="card pilot-section">
        <SectionHeader
          eyebrow="START SMALL. REVIEW THE EVIDENCE."
          title="One merchant. One useful pilot."
          detail={<span className="small-tag">Seven decision gates</span>}
        />
        <p className="muted">
          Use a scoped first cycle to establish whether the model helps the
          merchant make a better decision.
        </p>
        <div className="pilot-list">
          {pilot.map((p, i) => (
            <div className="pilot-step" key={p[0]}>
              <span className="pilot-number">0{i + 1}</span>
              <div>
                <h3>{p[0]}</h3>
                <p>
                  <CheckCircle2 size={13} />
                  <strong>Exit evidence:</strong> {p[1]}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="pilot-end">
          <ArrowUpRight size={27} />
          <h2>
            START WITH ONE MERCHANT. PROVE THE MODEL. THEN DECIDE HOW TO SCALE
            IT.
          </h2>
          <p>
            Commercial structure to be discussed after merchant fit and pilot
            scope.
          </p>
        </div>
      </section>
      <p className="footnote">
        This illustrative environment does not establish an approved
        partnership, an existing service offering or an automated data feed.
        Proposed responsibilities and any integration remain subject to
        agreement and technical discovery.
      </p>
    </>
  );
}
