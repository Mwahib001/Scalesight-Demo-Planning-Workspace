export interface Client {
  id: string;
  name: string;
  industry: string;
  currency: string;
  monthlyRevenueRange: string;
  planningWeek: string;
  refreshedAt: string;
}
export interface Sku {
  id: string;
  name: string;
  category: string;
  price: number;
  unitCost: number;
  currentInventory: number;
  baseWeeklyDemand: number;
  leadTimeWeeks: number;
  safetyStockWeeks: number;
  active: boolean;
  detailed: boolean;
  story: string;
  trend: number;
  historyWeeks: number;
}
export interface WeeklySales {
  weekStart: string;
  skuId: string;
  units: number;
  revenue: number;
  discount: number;
  planUnits: number;
  eventId?: string;
}
export interface InventorySnapshot {
  date: string;
  skuId: string;
  onHand: number;
  available: number;
  committed: number;
  incoming: number;
}
export interface PurchaseOrder {
  id: string;
  skuId: string;
  quantity: number;
  orderDate: string;
  expectedArrival: string;
  status: "planned" | "confirmed" | "delayed" | "arrived";
  unitCost: number;
  originalArrival?: string;
}
export interface MarketingEvent {
  id: string;
  type: "promotion" | "bfcm" | "campaign_change" | "launch" | "supplier_issue";
  startDate: string;
  endDate: string;
  skuIds: string[];
  plannedSpend?: number;
  discountRate?: number;
  expectedUplift?: number;
  confirmed: boolean;
  name: string;
}
export interface ForecastPoint {
  weekStart: string;
  skuId: string;
  baseUnits: number;
  downsideUnits: number;
  upsideUnits: number;
  previousForecast: number;
}
export interface PlanningAssumption {
  skuId: string;
  key: string;
  value: string | number;
  sourceType:
    | "historical_signal"
    | "confirmed_business_event"
    | "operational_input"
    | "analyst_assumption";
  reviewedAt: string;
  reviewedBy: string;
}
export interface IntelligenceItem {
  type: "risk" | "opportunity" | "change";
  priority: 1 | 2 | 3;
  skuId?: string;
  whatChanged: string;
  whyItMatters: string;
  recommendation: string;
  decisionRequired: string;
  title: string;
}
export interface PlanningState {
  selectedSkuId: string;
  forecastHorizon: 4 | 8 | 13 | 26;
  scenarioMode: "base" | "upside" | "downside";
  demandUpliftPct: number;
  adSpendChangePct: number;
  promotionEnabled: boolean;
  promotionDiscountPct: number;
  leadTimeWeeks: number;
  incomingInventory: number;
  purchaseQuantity: number;
}
export type Risk = "High risk" | "Watch" | "Overstock" | "Healthy";
