import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Executive Intelligence Brief | Blockify x ScaleSight",
};
import { WorkspacePage } from "@/components/workspace-page";
export default function Page() {
  return <WorkspacePage view="executive" />;
}
