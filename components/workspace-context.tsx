"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { defaultScenario, skus } from "@/data/planning";
import type { ScenarioInput } from "@/lib/types";

type WorkspaceState = {
  selectedSkuId: string;
  setSelectedSkuId: (id: string) => void;
  scenario: ScenarioInput;
  updateScenario: (update: Partial<ScenarioInput>) => void;
  resetScenario: () => void;
};
const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [selectedSkuId, setSelectedSkuId] = useState("citrus-vodka-soda");
  const [scenario, setScenario] = useState(() => defaultScenario(skus[0]));
  const select = (id: string) => { const sku = skus.find((item) => item.id === id) ?? skus[0]; setSelectedSkuId(id); setScenario(defaultScenario(sku)); };
  const updateScenario = (update: Partial<ScenarioInput>) => setScenario((current) => ({
    ...current,
    ...update,
    growthRate: Math.min(0.5, Math.max(0, update.growthRate ?? current.growthRate)),
    leadTimeWeeks: Math.min(10, Math.max(4, update.leadTimeWeeks ?? current.leadTimeWeeks)),
    shrinkRate: Math.min(0.08, Math.max(0, update.shrinkRate ?? current.shrinkRate)),
    incomingUnits: Math.max(0, Math.round(update.incomingUnits ?? current.incomingUnits)),
  }));
  const value = useMemo(() => ({ selectedSkuId, setSelectedSkuId: select, scenario, updateScenario, resetScenario: () => setScenario(defaultScenario(skus.find((item) => item.id === selectedSkuId) ?? skus[0])) }), [selectedSkuId, scenario]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
