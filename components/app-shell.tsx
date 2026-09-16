"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  SlidersHorizontal,
  Users,
  Workflow,
  Handshake,
  Menu,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import { Drawer } from "./drawer";
import { AnalystDrawer } from "./analyst-drawer";
import { merchant } from "@/data/planning";
const nav = [
  { href: "/", label: "Executive Brief", icon: LayoutDashboard },
  { href: "/forecast", label: "Demand Forecast", icon: TrendingUp },
  { href: "/inventory", label: "Inventory & Purchasing", icon: Package },
  { href: "/scenario", label: "Scenario Planning", icon: SlidersHorizontal },
  { href: "/customer-growth", label: "Customer & Growth", icon: Users },
  {
    href: "/managed-intelligence",
    label: "Managed Intelligence",
    icon: Workflow,
  },
  { href: "/partnership", label: "Partnership & Pilot", icon: Handshake },
];
function Navigation({ close }: { close?: () => void }) {
  const path = usePathname();
  return (
    <nav className="navigation" aria-label="Primary navigation">
      <Link className="brand" href="/" onClick={close}>
        <span>
          Blockify <b>×</b>
          <br />
          <strong>
            ScaleSight<span className="brand-dot">.</span>
          </strong>
        </span>
        <small>
          Managed Commerce
          <br />
          Intelligence Demo
        </small>
      </Link>
      <div className="nav-links">
        {nav.map((n, i) => (
          <div key={n.href}>
            {(i === 0 || i === 5) && (
              <p className="nav-group">
                {i === 0 ? "Merchant Intelligence" : "Partnership"}
              </p>
            )}
            <Link
              href={n.href}
              onClick={close}
              aria-current={path === n.href ? "page" : undefined}
              className={path === n.href ? "active" : ""}
            >
              <n.icon size={18} strokeWidth={1.7} />
              <span>{n.label}</span>
              {path === n.href && <span className="nav-dot" />}
            </Link>
          </div>
        ))}
      </div>
      <div className="nav-footer">
        <div>
          <ShieldCheck size={17} /> Analyst-reviewed
        </div>
        <p>
          From merchant data
          <br />
          to considered decisions.
        </p>
        <span>PROPOSED PARTNERSHIP MODEL</span>
      </div>
    </nav>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const w = useWorkspace();
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Navigation />
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            aria-label="Open navigation"
            onClick={() => setMenu(true)}
          >
            <Menu size={22} />
          </button>
          <div className="merchant-context">
            <strong>{merchant.name}</strong>
            <span>
              {merchant.platform} <i /> Illustrative merchant environment
            </span>
          </div>
          <div className="planning-context">
            <strong>Planning week: {merchant.planningWeek}</strong>
            <span>
              Data through: {merchant.dataThrough} · Illustrative refresh: 2
              hours ago
            </span>
          </div>
          <span
            tabIndex={0}
            className="demo-badge"
            title="Northstar Commerce and all figures are fictional and used only to demonstrate a potential workflow."
          >
            <Info size={12} /> DEMO DATA
            <span className="badge-tooltip">
              Northstar Commerce and all figures are fictional and used only to
              demonstrate a potential workflow.
            </span>
          </span>
        </header>
        <main id="main-content" className="main-content">
          {children}
          <footer className="page-footer">
            <span>Northstar Commerce · Fictional merchant environment</span>
            <span>
              Analyst-reviewed decision support <ArrowUpRight size={13} />
            </span>
          </footer>
        </main>
      </div>
      <button className="analyst-trigger" onClick={w.openAnalyst}>
        <MessageSquare size={17} />
        Ask ScaleSight Analyst
        <span className="online-dot" />
      </button>
      {menu && (
        <Drawer title="Navigation" onClose={() => setMenu(false)}>
          <Navigation close={() => setMenu(false)} />
        </Drawer>
      )}
      {w.analystOpen && <AnalystDrawer />}
    </>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
