"use client";
import {
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  PackageOpen,
  ArrowUpRight,
  Search,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { skus, categories, channels } from "@/data/planning";
import { useWorkspace } from "./workspace-context";
import type { Risk, Channel } from "@/lib/types";
export function PageTitle({
  section,
  title,
  description,
  action,
}: {
  section: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{section}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric-card ${accent ? "metric-accent" : ""}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="metric-note">{note}</span>
    </div>
  );
}
export function RiskBadge({ risk }: { risk: Risk }) {
  const Icon = {
    High: AlertTriangle,
    Watch: CircleAlert,
    Healthy: CircleCheck,
    Excess: PackageOpen,
  }[risk];
  return (
    <span className={`risk-badge risk-${risk.toLowerCase()}`}>
      <Icon size={13} />
      {risk}
    </span>
  );
}
export function SectionHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {detail && <div className="section-detail">{detail}</div>}
    </div>
  );
}
export function Decision({ children }: { children: React.ReactNode }) {
  return (
    <div className="decision-line">
      <span>
        <ArrowUpRight size={17} /> Recommended review
      </span>
      <p>{children}</p>
    </div>
  );
}
export function Filters() {
  const w = useWorkspace();
  const [search, setSearch] = useState("");
  const matches = skus.filter((s) =>
    `${s.id} ${s.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="filter-bar">
      <div className="sku-filter">
        <label htmlFor="sku-search">
          <Search size={12} /> Find a SKU
        </label>
        <input
          id="sku-search"
          placeholder="Search 142 SKUs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="SKU"
          value={w.selectedSku}
          onChange={(e) => w.selectSku(e.target.value)}
        >
          {!matches.some((s) => s.id === w.selectedSku) && (
            <option value={w.selectedSku}>
              {skus.find((s) => s.id === w.selectedSku)?.name} (selected)
            </option>
          )}
          {matches.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} · {s.name}
            </option>
          ))}
        </select>
        {matches.length === 0 && (
          <small>No matching SKUs. Clear search to browse.</small>
        )}
      </div>
      <label>
        Category
        <select
          aria-label="Category"
          value={w.selectedCategory}
          onChange={(e) => w.setCategory(e.target.value)}
        >
          {["All", ...categories].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Channel
        <select
          aria-label="Channel"
          value={w.selectedChannel}
          onChange={(e) => w.setChannel(e.target.value as Channel)}
        >
          {channels.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Horizon
        <select
          aria-label="Horizon"
          value={w.horizon}
          onChange={(e) => w.setHorizon(Number(e.target.value))}
        >
          {[4, 8, 13, 26, 52].map((v) => (
            <option key={v} value={v}>
              {v === 52 ? "12 months" : `${v} weeks`}
            </option>
          ))}
        </select>
      </label>
      <button
        className="icon-button"
        aria-label="Reset filters"
        title="Reset filters"
        onClick={() => {
          setSearch("");
          w.resetFilters();
        }}
      >
        <RotateCcw size={17} />
      </button>
    </div>
  );
}
export function EmptyState() {
  const w = useWorkspace();
  return (
    <div className="card empty-state">
      <Search size={28} />
      <h2>No committed demo series</h2>
      <p>
        This SKU/category/channel combination has no committed forecast in this
        environment. Choose All channels and a matching category to review the
        available series.
      </p>
      <button className="btn" onClick={w.resetFilters}>
        Reset to Atlas Carryall
      </button>
    </div>
  );
}
