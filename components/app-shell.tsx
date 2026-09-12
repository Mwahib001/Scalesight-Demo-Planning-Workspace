"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Clock, FileText, Info, LayoutDashboard, Menu, Package, RefreshCw, Settings2, SlidersHorizontal, TrendingUp, UserCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/button";
import { WorkspaceProvider } from "@/components/workspace-context";

type NavItem = { href: string; label: string; icon: LucideIcon };
const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/", label: "Weekly Planning Brief", icon: LayoutDashboard }] },
  { label: "Planning", items: [{ href: "/forecast", label: "Demand Forecast", icon: TrendingUp }, { href: "/inventory", label: "Inventory Planning", icon: Package }, { href: "/scenario", label: "Scenario Planning", icon: SlidersHorizontal }] },
  { label: "Advisor", items: [{ href: "/advisor-brief", label: "Alias Advisor Brief", icon: FileText }] },
  { label: "Managed Service", items: [{ href: "/managed-intelligence", label: "Planning Cycle", icon: RefreshCw }, { href: "/assumptions", label: "Assumptions", icon: Settings2 }] },
];

function Navigation({ compact = false, close }: { compact?: boolean; close?: () => void }) {
  const pathname = usePathname();
  return <nav className="flex h-full flex-col px-3 py-6" aria-label="Primary navigation">
    <div className={`mb-9 ${compact ? "px-0 text-center" : "px-3"}`}><p className="text-[21px] font-bold tracking-[-0.035em] text-[#10233F]">{compact ? "A" : "Alias Advising"}</p>{!compact && <p className="mt-1 text-xs font-medium leading-4 text-[#667085]">Planning intelligence<br />managed by ScaleSight</p>}</div>
    <div className="space-y-6">{navGroups.map((group) => <div key={group.label}>{!compact && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#667085]">{group.label}</p>}{group.items.map((item) => { const active = pathname === item.href; const Icon = item.icon; return <Link onClick={close} key={item.href} href={item.href} title={compact ? item.label : undefined} className={`relative flex items-center rounded-lg py-2.5 text-sm font-medium transition ${compact ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-[#2563EB]/[0.08] text-[#10233F]" : "text-[#667085] hover:bg-[#F6F8FB] hover:text-[#10233F]"}`}><Icon aria-hidden size={18} strokeWidth={1.75} />{!compact && item.label}{active && <span className="absolute -left-3 h-5 w-[3px] rounded-r bg-[#2563EB]" />}</Link>; })}</div>)}</div>
    {!compact && <div className="mt-auto border-t border-[#E4E9F0] px-3 pt-5"><p className="text-[11px] font-semibold text-[#10233F]">ALIAS × SCALESIGHT</p><p className="mt-1 text-[11px] leading-4 text-[#667085]">Decision support for the next client conversation.</p></div>}
  </nav>;
}

function DemoBadge() { return <span title="Harbor Coast is fictional and used only to demonstrate the Alias × ScaleSight workflow." className="inline-flex cursor-help items-center gap-1 rounded-full bg-[#10233F]/[0.07] px-2 py-1 text-[10px] font-semibold tracking-[0.04em] text-[#10233F]"><Info size={14} strokeWidth={1.75} />DEMO DATA</span>; }

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <WorkspaceProvider><div className="min-h-screen bg-[#F6F8FB] text-[#162033]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-[#E4E9F0] bg-white lg:block xl:block"><Navigation /></aside>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[64px] border-r border-[#E4E9F0] bg-white min-[1024px]:block xl:hidden"><Navigation compact /></aside>
    <header className="fixed inset-x-0 top-0 z-20 h-[68px] border-b border-[#E4E9F0] bg-white min-[1024px]:left-[64px] xl:left-[240px]"><div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="icon" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="min-[1024px]:hidden"><Menu size={16} strokeWidth={1.75} /></Button><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#162033]">Harbor Coast Beverages</p><p className="hidden text-xs font-medium text-[#667085] sm:block">RTD Beverage <span className="mx-1 text-[#E4E9F0]">|</span> Demo Account</p></div></div><div className="flex items-center gap-2 sm:gap-3"><span className="hidden text-xs font-medium text-[#667085] lg:inline">Planning Week: Sep 7–13, 2026</span><span className="hidden items-center gap-1.5 rounded-full bg-[#F6F8FB] px-3 py-1.5 text-xs text-[#667085] xl:inline-flex"><Clock size={14} strokeWidth={1.75} />Intelligence refreshed 2 hours ago</span><span className="hidden items-center gap-1.5 rounded-full border border-[#E4E9F0] px-3 py-1.5 text-xs font-medium text-[#10233F] sm:inline-flex"><UserCheck size={14} strokeWidth={1.75} />Alias Advisor View</span><DemoBadge /></div></div></header>
    {menuOpen && <div className="fixed inset-0 z-50 min-[1024px]:hidden"><button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute inset-0 bg-[#10233F]/[0.24]" /><aside className="relative h-full w-[280px] bg-white shadow-[-4px_0_24px_rgba(16,35,63,0.12)]"><Button variant="icon" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="absolute right-4 top-5"><X size={16} strokeWidth={1.75} /></Button><Navigation close={() => setMenuOpen(false)} /></aside></div>}
    <main className="pt-[68px] min-[1024px]:pl-[64px] xl:pl-[240px]">{children}</main>
  </div></WorkspaceProvider>;
}
