"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleCheck, Info } from "lucide-react";
import { usePlanning } from "../context/PlanningContext";
import { detailedSkus } from "../data/kelarune";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children ?? (
        <span className="date-chip">
          <CalendarDays size={15} />
          Week of Sep 14, 2026
        </span>
      )}
    </div>
  );
}
export function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function PlanLink({
  href,
  skuId,
  children,
  className = "text-link",
}: {
  href: string;
  skuId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { selectSku } = usePlanning();
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (skuId) selectSku(skuId);
      }}
    >
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
export function HorizonSwitcher() {
  const { state, update } = usePlanning();
  return (
    <div className="segmented" aria-label="Forecast horizon">
      {([4, 8, 13, 26] as const).map((h) => (
        <button
          key={h}
          aria-pressed={state.forecastHorizon === h}
          onClick={() => update({ forecastHorizon: h })}
        >
          {h} weeks
        </button>
      ))}
    </div>
  );
}
export function SkuSelector() {
  const { state, selectSku } = usePlanning();
  return (
    <label className="sku-selector">
      Planning SKU
      <select
        value={state.selectedSkuId}
        onChange={(e) => selectSku(e.target.value)}
      >
        {detailedSkus.map((s) => (
          <option value={s.id} key={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function PlanningFilters() {
  return (
    <div className="filter-bar">
      <SkuSelector />
      <div>
        <span className="field-label">Forecast horizon</span>
        <HorizonSwitcher />
      </div>
      <span className="muted filter-note">
        <CircleCheck size={15} />
        Shared across your workspace
      </span>
    </div>
  );
}
export function Interpretation({ children }: { children: React.ReactNode }) {
  return (
    <div className="interpretation">
      <Info size={17} />
      <p>{children}</p>
    </div>
  );
}
