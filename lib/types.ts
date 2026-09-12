export type Risk = "high" | "watch" | "healthy" | "overstock";

export interface Client {
  id: string;
  name: string;
  category: string;
  accountLabel: string;
}

export interface Sku {
  id: string;
  name: string;
  channelMix: string;
  currentInventory: number;
  baseWeeklyDemand: number;
  leadTimeWeeks: number;
  safetyStockWeeks: number;
  shrinkRate: number;
  incomingUnits: number;
  risk: Risk;
}

export interface ForecastPoint {
  weekStart: string;
  actual?: number;
  base: number;
  conservative: number;
  upside: number;
}

export interface WeeklyActual {
  weekStart: string;
  skuId: string;
  units: number;
  planUnits: number;
  channel: string;
  eventId?: string;
}

export interface ProductionOrder {
  id: string;
  skuId: string;
  units: number;
  expectedWeek: string;
  status: string;
}

export interface BusinessEvent {
  id: string;
  skuId: string;
  type: string;
  startWeek: string;
  endWeek: string;
  upliftRate: number;
  label: string;
  confirmed: boolean;
}

export interface PlanningAssumption {
  skuId: string;
  key: string;
  value: string;
  sourceType: "historical" | "confirmed_event" | "operational_input" | "analyst_judgment";
  reviewedAt: string;
  reviewedBy: string;
}

export interface AdvisorItem {
  skuId: string;
  priority: number;
  whatChanged: string;
  whyItMatters: string;
  recommendation: string;
  decisionRequired: string;
  monitorNext: string;
}

export interface ScenarioInput {
  skuId: string;
  growthRate: number;
  leadTimeWeeks: number;
  shrinkRate: number;
  promotionEnabled: boolean;
  distributorEnabled: boolean;
  incomingUnits: number;
}
