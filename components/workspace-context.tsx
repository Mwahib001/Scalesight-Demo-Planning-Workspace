"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { skuById, categories, channels } from "@/data/planning";
import { defaultScenario, validateInput } from "@/lib/calculations";
import type { ScenarioInput, Channel } from "@/lib/types";
type State = {
  selectedSku: string;
  selectedCategory: string;
  selectedChannel: Channel;
  horizon: number;
  scenario: ScenarioInput;
  note: string;
  summary: string;
};
const initial: State = {
  selectedSku: "SKU-104",
  selectedCategory: "All",
  selectedChannel: "All",
  horizon: 13,
  scenario: defaultScenario(skuById("SKU-104")),
  note: "",
  summary: "",
};
type Context = State & {
  selectSku: (id: string) => void;
  setCategory: (v: string) => void;
  setChannel: (v: Channel) => void;
  setHorizon: (v: number) => void;
  updateScenario: (v: Partial<ScenarioInput>) => void;
  resetScenario: () => void;
  applyNote: (v: string) => void;
  openAnalyst: () => void;
  analystOpen: boolean;
  closeAnalyst: () => void;
  resetFilters: () => void;
};
const WorkspaceContext = createContext<Context | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  const [analystOpen, setAnalystOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem("northstar-workspace-v1");
        if (raw) {
          const saved = JSON.parse(raw);
          const sku = skuById(saved.selectedSku);
          const horizon = [4, 8, 13, 26, 52].includes(saved.horizon)
            ? saved.horizon
            : 13;
          setState({
            ...initial,
            selectedSku: sku.id,
            selectedCategory: ["All", ...categories].includes(
              saved.selectedCategory,
            )
              ? saved.selectedCategory
              : "All",
            selectedChannel: channels.includes(saved.selectedChannel)
              ? saved.selectedChannel
              : "All",
            horizon,
            scenario: validateInput(
              sku,
              { ...defaultScenario(sku), ...saved.scenario },
              horizon,
            ),
            note:
              typeof saved.note === "string" ? saved.note.slice(0, 1000) : "",
            summary:
              typeof saved.summary === "string"
                ? saved.summary.slice(0, 1000)
                : "",
          });
        }
      } catch {
        /* Storage is optional. */
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        sessionStorage.setItem("northstar-workspace-v1", JSON.stringify(state));
      } catch {
        /* Remain usable with storage disabled. */
      }
  }, [state, ready]);
  const update = (v: Partial<State>) => setState((s) => ({ ...s, ...v }));
  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        selectSku: (id) =>
          setState((s) =>
            s.selectedSku === id
              ? s
              : {
                  ...s,
                  selectedSku: skuById(id).id,
                  scenario: defaultScenario(skuById(id)),
                  summary: "",
                },
          ),
        setCategory: (v) => update({ selectedCategory: v }),
        setChannel: (v) => update({ selectedChannel: v }),
        setHorizon: (v) =>
          setState((s) => ({
            ...s,
            horizon: v,
            scenario: validateInput(skuById(s.selectedSku), s.scenario, v),
          })),
        updateScenario: (v) =>
          setState((s) => {
            const scenario = validateInput(
              skuById(s.selectedSku),
              { ...s.scenario, ...v },
              s.horizon,
            );
            return {
              ...s,
              scenario,
              summary: `${s.selectedSku}: demand ${(scenario.demandChange * 100).toFixed(0)}%, safety ${scenario.safetyWeeks.toFixed(1)} weeks. Session assumption.`,
            };
          }),
        resetScenario: () =>
          setState((s) => ({
            ...s,
            scenario: defaultScenario(skuById(s.selectedSku)),
            summary: "",
          })),
        applyNote: (v) => update({ note: v }),
        analystOpen,
        openAnalyst: () => setAnalystOpen(true),
        closeAnalyst: () => setAnalystOpen(false),
        resetFilters: () =>
          update({
            selectedSku: "SKU-104",
            selectedCategory: "All",
            selectedChannel: "All",
            horizon: 13,
            scenario: defaultScenario(skuById("SKU-104")),
          }),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace provider missing");
  return value;
}
