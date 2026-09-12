"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "icon" | "check";

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    primary: "h-9 rounded-lg bg-[#2563EB] px-3 text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]",
    secondary: "h-9 rounded-lg border border-[#E4E9F0] bg-white px-3 text-[#162033] hover:border-border-hover hover:bg-[#F6F8FB]",
    tertiary: "h-9 rounded-lg bg-transparent px-2 text-[#667085] hover:text-[#10233F] hover:bg-[#F6F8FB]",
    icon: "grid h-9 w-9 place-items-center rounded-lg bg-transparent text-[#667085] hover:bg-[#F6F8FB] hover:text-[#10233F]",
    check: "min-h-9 rounded-lg border border-[#E4E9F0] bg-white px-3 text-left text-[#162033] hover:border-border-hover hover:bg-[#F6F8FB]",
  };
  return <button {...props} className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${styles[variant]} ${className}`}>{children}</button>;
}
