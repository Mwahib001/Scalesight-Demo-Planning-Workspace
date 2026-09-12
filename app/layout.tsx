import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Alias Planning Intelligence",
  description: "Planning intelligence workspace for Harbor Coast Beverages.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full"><AppShell>{children}</AppShell></body>
    </html>
  );
}
