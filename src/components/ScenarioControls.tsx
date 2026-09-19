"use client";
import { RotateCcw } from "lucide-react";
import { usePlanning } from "../context/PlanningContext";
import type { PlanningState } from "../data/entities";
import { SkuSelector } from "./ui";
export function ScenarioControls() {
  const { state, update, resetToBasePlan } = usePlanning();
  const sliders: {
    key:
      | "demandUpliftPct"
      | "adSpendChangePct"
      | "promotionDiscountPct"
      | "leadTimeWeeks";
    label: string;
    min: number;
    max: number;
    unit: string;
    step: number;
  }[] = [
    {
      key: "demandUpliftPct",
      label: "Additional demand uplift",
      min: 0,
      max: 50,
      unit: "%",
      step: 1,
    },
    {
      key: "adSpendChangePct",
      label: "Paid media spend change",
      min: -20,
      max: 50,
      unit: "%",
      step: 1,
    },
    {
      key: "promotionDiscountPct",
      label: "Promotion discount",
      min: 0,
      max: 40,
      unit: "%",
      step: 1,
    },
    {
      key: "leadTimeWeeks",
      label: "Supplier lead time",
      min: 2,
      max: 12,
      unit: " weeks",
      step: 0.5,
    },
  ];
  return (
    <aside className="panel scenario-controls">
      <h2>Change the assumptions</h2>
      <p className="muted">
        Mode applies to the portfolio. Other controls apply to the selected SKU.
      </p>
      <SkuSelector />
      <label>
        Portfolio scenario
        <select
          value={state.scenarioMode}
          onChange={(e) =>
            update({
              scenarioMode: e.target.value as PlanningState["scenarioMode"],
            })
          }
        >
          <option value="base">Base plan</option>
          <option value="upside">Upside · +20% demand</option>
          <option value="downside">Downside · −15% demand</option>
        </select>
      </label>
      <label className="toggle-label">
        <span>Enable promotion</span>
        <input
          type="checkbox"
          checked={state.promotionEnabled}
          onChange={(e) => update({ promotionEnabled: e.target.checked })}
        />
      </label>
      {sliders.map((s) => (
        <label className="range-label" key={s.key}>
          <span>
            {s.label}
            <output>
              {state[s.key]}
              {s.unit}
            </output>
          </span>
          <input
            aria-label={s.label}
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={state[s.key]}
            disabled={
              s.key === "promotionDiscountPct" && !state.promotionEnabled
            }
            onChange={(e) => update({ [s.key]: Number(e.target.value) })}
          />
          <small>
            {s.min}
            {s.unit}
            <span>
              {s.max}
              {s.unit}
            </span>
          </small>
        </label>
      ))}
      <label>
        Incoming inventory (units)
        <input
          type="number"
          min={0}
          step={1}
          value={state.incomingInventory}
          onChange={(e) =>
            update({ incomingInventory: Number(e.target.value) })
          }
        />
      </label>
      <label>
        Additional purchase quantity (units)
        <input
          type="number"
          min={0}
          step={1}
          value={state.purchaseQuantity}
          onChange={(e) => update({ purchaseQuantity: Number(e.target.value) })}
        />
      </label>
      <p className="control-note">
        A new SKU starts a fresh SKU test. Higher quantities do not resolve a
        delivery that arrives after stockout.
      </p>
      <button className="button secondary full-width" onClick={resetToBasePlan}>
        <RotateCcw size={15} />
        Reset to Base Plan
      </button>
    </aside>
  );
}
