"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  CircleCheck,
  FileText,
  FlaskConical,
  Layers3,
  Menu,
  Package,
  Radio,
  Settings2,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { PlanningProvider, usePlanning } from "../context/PlanningContext";
import { client } from "../data/kelarune";
const nav = [
  ["/", "Weekly Planning Brief", FileText],
  ["/revenue-forecast", "Revenue Forecast", ChartNoAxesCombined],
  ["/demand-forecast", "Demand Forecast", Activity],
  ["/inventory", "Inventory Health", Package],
  ["/sku-planning", "SKU Planning", Layers3],
  ["/scenario", "Scenario Planning", Settings2],
  ["/intelligence", "Intelligence Center", Radio],
  ["/managed-intelligence", "Managed Intelligence", Workflow],
  ["/assumptions", "Planning Assumptions", BookOpen],
] as const;
function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const { plan, resetToBasePlan } = usePlanning();
  useEffect(() => {
    if (!menu) return;
    const trigger = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sidebar = document.querySelector<HTMLElement>(".sidebar");
    sidebar?.querySelector<HTMLButtonElement>(".mobile-close")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
      if (event.key === "Tab" && sidebar) {
        const focusable = Array.from(
          sidebar.querySelectorAll<HTMLElement>("a,button"),
        ).filter((el) => el.offsetParent !== null);
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [menu]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        className={`sidebar ${menu ? "is-open" : ""}`}
        role={menu ? "dialog" : undefined}
        aria-modal={menu ? true : undefined}
        aria-label={menu ? "Workspace navigation" : undefined}
      >
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ChartNoAxesCombined size={23} />
          </span>
          <span>
            ScaleSight<small>MANAGED INTELLIGENCE</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="client-switch">
          <span className="client-avatar">K</span>
          <div>
            <strong>Kelarune Hydration</strong>
            <small>Planning workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav aria-label="Primary navigation">
          {nav.map(([href, label, Icon], i) => (
            <div key={href}>
              {(i === 0 || i === 6) && (
                <p className="nav-label">
                  {i === 0 ? "YOUR PLANNING SYSTEM" : "YOUR INTELLIGENCE TEAM"}
                </p>
              )}
              <Link
                className={path === href ? "active" : ""}
                href={href}
                onClick={() => setMenu(false)}
                aria-current={path === href ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.7} />
                <span>{label}</span>
                {href === "/intelligence" && (
                  <b className="nav-count">{plan.high}</b>
                )}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="analyst-status">
            <span className="status-dot" />
            Continuously monitored
          </div>
          <p>
            Your data. Our analysis.
            <br />
            Better decisions, together.
          </p>
          <Link href="/managed-intelligence#pilot">
            Explore the planning pilot <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar">SS</span>
          <div>
            <strong>Your ScaleSight team</strong>
            <small>Weekly guidance. Ongoing support.</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="menu-toggle icon-button"
            aria-label="Open navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>{nav.find((n) => n[0] === path)?.[1] ?? "Planning"}</strong>
          </div>
          <div className="topbar-right">
            <span className="refresh">
              <CircleCheck size={14} />
              Updated Sep 17 · 6:00 AM
            </span>
            <span className="demo-badge" tabIndex={0}>
              <FlaskConical size={13} />
              Demo Data
              <span className="badge-tooltip" role="tooltip">
                This is a fictional ecommerce brand using synthetic data to
                demonstrate the ScaleSight planning workflow.
              </span>
            </span>
            <span className="top-avatar">K</span>
          </div>
        </header>
        <main id="main-content">
          {plan.isScenario && (
            <div className="scenario-banner">
              <FlaskConical size={16} />
              <span>
                Illustrative scenario active · {plan.selected.sku.name} ·
                assumption-based outputs across this workspace
              </span>
              <button onClick={resetToBasePlan}>Reset to base plan</button>
            </div>
          )}
          {children}
          <footer className="page-footer">
            <span>
              <Sparkles size={14} />
              Planning system + analyst judgment + ongoing guidance
            </span>
            <span>{client.name} · Synthetic demo</span>
          </footer>
        </main>
      </div>
    </>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlanningProvider>
      <Shell>{children}</Shell>
    </PlanningProvider>
  );
}
