import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { validateFixtures } from "@/lib/selectors";
validateFixtures();
export const metadata: Metadata = {
  title: "Blockify x ScaleSight — Managed Commerce Intelligence",
  description:
    "An illustrative, analyst-reviewed managed commerce intelligence demo for fictional merchant Northstar Commerce. Proposed partnership model.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
