import { Executive } from "./executive";
import { Forecast } from "./forecast";
import { Inventory } from "./inventory";
import { Scenario } from "./scenario";
import { CustomerGrowth } from "./customer-growth";
import { ManagedIntelligence } from "./managed-intelligence";
import { Partnership } from "./partnership";
export function WorkspacePage({
  view,
}: {
  view:
    | "executive"
    | "forecast"
    | "inventory"
    | "scenario"
    | "customer-growth"
    | "managed-intelligence"
    | "partnership";
}) {
  const pages = {
    executive: Executive,
    forecast: Forecast,
    inventory: Inventory,
    scenario: Scenario,
    "customer-growth": CustomerGrowth,
    "managed-intelligence": ManagedIntelligence,
    partnership: Partnership,
  };
  const Page = pages[view];
  return <Page />;
}
