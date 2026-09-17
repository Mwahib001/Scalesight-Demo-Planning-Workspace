import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Demand Forecast | Blockify x ScaleSight",
};
import { WorkspacePage } from "@/components/workspace-page";
export default function Page() {
  return <WorkspacePage view="forecast" />;
}
