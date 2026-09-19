import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/AppShell";
export const metadata: Metadata = {
  title: "ScaleSight — Kelarune Planning Workspace",
  description:
    "A fictional ecommerce planning workspace demonstrating ScaleSight managed intelligence: demand, inventory, recommendations, and strategic guidance.",
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
