"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Clock,
  FileText,
  Info,
  LayoutDashboard,
  Menu,
  Package,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/button";
import { WorkspaceProvider } from "@/components/workspace-context";

type NavItem = { href: string; label: string; icon: LucideIcon };
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Weekly Planning Brief", icon: LayoutDashboard },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/forecast", label: "Demand Forecast", icon: TrendingUp },
      { href: "/inventory", label: "Inventory Planning", icon: Package },
      {
        href: "/scenario",
        label: "Scenario Planning",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: "Advisor",
    items: [
      { href: "/advisor-brief", label: "Alias Advisor Brief", icon: FileText },
    ],
  },
  {
    label: "Managed Service",
    items: [
      {
        href: "/managed-intelligence",
        label: "Planning Cycle",
        icon: RefreshCw,
      },
      { href: "/assumptions", label: "Assumptions", icon: Settings2 },
    ],
  },
];

function Navigation({
  compact = false,
  close,
}: {
  compact?: boolean;
  close?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav
      className="flex h-full min-h-0 flex-col px-3 py-6"
      aria-label="Primary navigation"
    >
      <div className={`mb-10  shrink-0 ${compact ? "px-0 text-center" : "px-3"}`}>
        <p className="text-[21px] font-bold tracking-[-0.035em] text-[#10233F]">
          {compact ? "A" : "Alias Advising"}
        </p>

        {!compact && (
          <p className="mt-1.5 text-xs font-medium leading-4 text-[#667085]">
            Planning intelligence
            <br />
            managed by ScaleSight
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain pr-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!compact && (
              <div className="mb-3 flex items-center gap-3 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">
                  {group.label}
                </p>
                <span className="h-px flex-1 bg-[#E4E9F0]" />
              </div>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    title={compact ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                      compact ? "justify-center px-2" : "gap-3 px-3"
                    } ${
                      active
                        ? "bg-[#F6F8FB] text-[#10233F] shadow-[inset_0_0_0_1px_#E4E9F0]"
                        : "text-[#667085] hover:bg-[#FAFBFC] hover:text-[#10233F]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                        active
                          ? "bg-white text-[#2563EB] shadow-[0_1px_3px_rgba(16,35,63,0.08)]"
                          : "text-[#98A2B3] group-hover:bg-white group-hover:text-[#2563EB]"
                      }`}
                    >
                      <Icon
                        aria-hidden
                        size={18}
                        strokeWidth={1.75}
                      />
                    </span>

                    {!compact && (
                      <span className="truncate tracking-[-0.005em]">
                        {item.label}
                      </span>
                    )}

                    {active && (
                      <span
                        aria-hidden
                        className="absolute -left-3 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-[#2563EB]"
                      />
                    )}

                    {active && !compact && (
                      <span
                        aria-hidden
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-[#2563EB]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-5 shrink-0 border-t border-[#E4E9F0] px-3 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#10233F]">
            Alias × ScaleSight
          </p>
          <p className="mt-1.5 max-w-[170px] text-[11px] leading-4 text-[#667085]">
            Decision support for the next client conversation.
          </p>
        </div>
      )}
    </nav>
  );
}

function DemoBadge() {
  return (
    <span
      title="Harbor Coast is fictional and used only to demonstrate the Alias × ScaleSight workflow."
      className="inline-flex cursor-help items-center gap-1 rounded-full bg-[#10233F]/[0.07] px-2 py-1 text-[10px] font-semibold tracking-[0.04em] text-[#10233F]"
    >
      <Info size={14} strokeWidth={1.75} />
      DEMO DATA
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-[#F6F8FB] text-[#162033]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-[#E4E9F0] bg-white xl:block">
          <Navigation />
        </aside>

        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[64px] border-r border-[#E4E9F0] bg-white min-[1024px]:block xl:hidden">
          <Navigation compact />
        </aside>

        <header className="fixed inset-x-0 top-0 z-20 h-[68px] border-b border-[#E4E9F0] bg-white/95 backdrop-blur-sm min-[1024px]:left-[64px] xl:left-[240px]">
          <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="icon"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
                className="min-[1024px]:hidden"
              >
                <Menu size={16} strokeWidth={1.75} />
              </Button>

              <div className="min-w-0 border-l-2 border-[#2563EB] pl-3">
                <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#10233F]">
                  Harbor Coast Beverages
                </p>
                <p className="hidden text-xs font-medium text-[#667085] sm:block">
                  RTD Beverage <span className="mx-1 text-[#D0D5DD]">|</span>{" "}
                  Demo Account
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden text-xs font-medium text-[#667085] lg:inline">
                Planning Week: Sep 7–13, 2026
              </span>

              <span className="hidden items-center gap-1.5 rounded-md border border-[#E4E9F0] bg-[#FAFBFC] px-3 py-1.5 text-xs font-medium text-[#667085] xl:inline-flex">
                <Clock
                  size={14}
                  strokeWidth={1.75}
                  className="text-[#2563EB]"
                />
                Intelligence refreshed 2 hours ago
              </span>

              <span className="hidden items-center gap-1.5 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] sm:inline-flex">
                <UserCheck size={14} strokeWidth={1.75} />
                Alias Advisor View
              </span>

              <DemoBadge />
            </div>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 min-[1024px]:hidden">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute inset-0 bg-[#10233F]/[0.24]"
            />

            <aside className="relative flex h-full min-h-0 w-[280px] flex-col border-r border-[#E4E9F0] bg-white shadow-[8px_0_24px_rgba(16,35,63,0.08)]">
              <Button
                variant="icon"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className="absolute right-4 top-5"
              >
                <X size={16} strokeWidth={1.75} />
              </Button>

              <Navigation close={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 overflow-x-hidden pt-[68px] min-[1024px]:pl-[64px] xl:pl-[240px]">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
