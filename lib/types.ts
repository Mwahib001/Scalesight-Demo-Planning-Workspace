export type Category = "Bags" | "Wallets" | "Belts" | "Travel" | "Seasonal";
export type Channel = "All" | "Online Store" | "Retail" | "Wholesale";
export type Risk = "High" | "Watch" | "Healthy" | "Excess";
export interface Merchant {
  id: string;
  name: string;
  platform: string;
  planningWeek: string;
  dataThrough: string;
}
export interface SKU {
  id: string;
  name: string;
  category: Category;
  currentInventory: number;
  baseWeeklyDemand: number;
  leadTimeWeeks: number;
  safetyStockWeeks: number;
  lossRate: number;
  unitCost: number;
  unitPrice: number;
  incomingUnits: number;
  incomingWeek: number;
  demandDelta: number;
  excessCoverThreshold: number;
  materialEvent: boolean;
  uncertainReceipt: boolean;
  packSize: number;
  moq: number;
  authored: boolean;
  elasticity?: number;
}
export interface WeeklyActual {
  skuId: string;
  weekStart: string;
  channel: Channel;
  units: number;
}
export interface ForecastVersion {
  id: string;
  skuId: string;
  issuedAt: string;
  weeks: readonly { weekStart: string; units: number }[];
}
export interface InventoryReceipt {
  id: string;
  skuId: string;
  units: number;
  expectedWeek: number;
  confirmed: boolean;
  status: "open" | "received";
}
export interface BusinessEvent {
  id: string;
  skuId: string;
  type: string;
  start: string;
  end: string;
  label: string;
  confirmed: boolean;
  effect: number;
}
export interface CustomerOrder {
  customerId: string;
  date: string;
  acquiredAt: string;
  sequence: number;
  status: "completed" | "cancelled" | "refunded";
  netRevenue: number;
}
export interface CustomerSegment {
  name: string;
  customers: number;
  expectedValue: number;
}
export interface ChangeLogItem {
  area: string;
  subject: string;
  happened: string;
  matters: string;
  decision: string;
  impact: number;
}
export interface PartnershipModel {
  name: string;
  description: string;
  steps: string;
  qualifier: string;
}
export interface ScenarioInput {
  demandChange: number;
  leadTimeChange: number;
  promotion: boolean;
  adSpendChange: number;
  incomingUnits: number;
  incomingWeek: number;
  supplierDelay: boolean;
  delayWeeks: number;
  safetyWeeks: number;
}
export interface ProjectionPoint {
  week: number;
  onHand: number;
  safety: number;
  receipt: number;
}
