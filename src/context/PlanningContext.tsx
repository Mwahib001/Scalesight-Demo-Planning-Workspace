"use client";
import { createContext, useContext, useMemo, useReducer } from "react";
import type { PlanningState } from "../data/entities";
import {
  buildPlan,
  defaultState,
  planningReducer,
  comparePlans,
  type Plan,
} from "../engine/scenarioEngine";
type Context = {
  state: PlanningState;
  plan: Plan;
  base: Plan;
  comparison: ReturnType<typeof comparePlans>;
  update: (v: Partial<PlanningState>) => void;
  selectSku: (id: string) => void;
  resetToBasePlan: () => void;
};
const PlanningContext = createContext<Context | null>(null);
export function PlanningProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(planningReducer, undefined, () =>
    defaultState(),
  );
  const plan = useMemo(() => buildPlan(state), [state]);
  const base = useMemo(
    () =>
      buildPlan({
        ...defaultState(state.selectedSkuId),
        forecastHorizon: state.forecastHorizon,
      }),
    [state.selectedSkuId, state.forecastHorizon],
  );
  return (
    <PlanningContext.Provider
      value={{
        state,
        plan,
        base,
        comparison: comparePlans(plan, base),
        update: (v) => dispatch({ type: "update", value: v }),
        selectSku: (id) => dispatch({ type: "select", id }),
        resetToBasePlan: () => dispatch({ type: "reset" }),
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}
export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) throw new Error("PlanningProvider is required");
  return context;
}
