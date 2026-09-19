export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
export const number = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
export const date = (s: string | null) =>
  s
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(s + "T00:00:00Z"))
    : "None in horizon";
export const percent = (n: number | null) =>
  n === null ? "No comparable sales" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
