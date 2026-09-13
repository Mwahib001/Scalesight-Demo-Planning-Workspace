import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Alias Planning Intelligence",
  description: "Planning intelligence workspace for Harbor Coast Beverages.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${fraunces.variable}`}>
      <body className="min-h-full"><AppShell>{children}</AppShell></body>
    </html>
  );
}
