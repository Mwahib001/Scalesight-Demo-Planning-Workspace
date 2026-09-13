"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  PackageX,
  Printer,
  RotateCcw,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/button";
import { useWorkspace } from "@/components/workspace-context";
import { forecastSeries, formatUnits, skus } from "@/data/planning";
import { displayCover, scenarioMetrics } from "@/lib/calculations";
import type { Risk, Sku } from "@/lib/types";

const tones: Record<Risk, string> = {
  high: "bg-[#DC3545]/[0.08] text-[#DC3545]",
  watch: "bg-[#E5A000]/[0.10] text-[#A16207]",
  healthy: "bg-[#2E9B62]/[0.08] text-[#166534]",
  overstock: "bg-[#475569]/[0.08] text-[#334155]",
};
const labels: Record<Risk, string> = {
  high: "High risk",
  watch: "Watch",
  healthy: "Healthy",
  overstock: "Overstock",
};
const icons = {
  high: AlertTriangle,
  watch: AlertCircle,
  healthy: CheckCircle2,
  overstock: PackageX,
};

function RiskBadge({ risk, label }: { risk: Risk; label?: string }) {
  const Icon = icons[risk];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[risk]}`}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label ?? labels[risk]}
    </span>
  );
}
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[14px] border border-[#E4E9F0] bg-white p-4 shadow-[0_1px_3px_rgba(16,35,63,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}
function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.025em] text-[#10233F]">
          {title}
        </h1>
        <p className="mt-1 text-sm leading-5 text-[#667085]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
  primary = false,
  danger = false,
}: {
  label: string;
  value: string;
  detail: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`min-w-0 ${primary ? "" : ""}`}>
      <p className="text-xs font-medium text-[#667085]">{label}</p>
      <p
        className={`mt-1 tabular-nums font-bold tracking-[-0.02em] ${primary ? "text-[30px] leading-9" : "text-[24px] leading-8"} ${danger ? "text-[#DC3545]" : "text-[#162033]"}`}
      >
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-[#667085]">{detail}</p>}
    </div>
  );
}
function StatementList({
  items,
  marker = "blue",
}: {
  items: React.ReactNode[];
  marker?: "blue" | "teal" | "navy";
}) {
  const color =
    marker === "teal"
      ? "bg-[#0F9D8A]"
      : marker === "navy"
        ? "bg-[#10233F]"
        : "bg-[#2563EB]";
  return (
    <ul className="statement-list">
      {items.map((item, i) => (
        <li className="statement-item text-sm leading-6 text-[#162033]" key={i}>
          <span className={`statement-marker ${color}`} /> <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
function SkuSelect() {
  const { selectedSkuId, setSelectedSkuId } = useWorkspace();
  return (
    <label className="relative block">
      <span className="sr-only">Select SKU</span>
      <select
        value={selectedSkuId}
        onChange={(e) => setSelectedSkuId(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-[#E4E9F0] bg-white py-0 pl-3 pr-9 text-sm font-medium outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
      >
        {skus.map((sku) => (
          <option key={sku.id} value={sku.id}>
            {sku.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-2 text-[#667085]"
        size={16}
        strokeWidth={1.75}
      />
    </label>
  );
}

function ForecastChart() {
  const { selectedSkuId, scenario } = useWorkspace();
  const sku = skus.find((item) => item.id === selectedSkuId) ?? skus[0];
  const data = forecastSeries(sku).map((point, i) => {
    const multiplier =
      i < 52
        ? 1
        : 1 +
          scenario.growthRate +
          (scenario.promotionEnabled && i >= 55 && i <= 58 ? 0.15 : 0);
    const base = Math.round(point.base * multiplier);
    return {
      ...point,
      base,
      conservative: Math.round(base * 0.91),
      upside: Math.round(base * 1.18),
      label: i % 8 === 0 ? point.weekStart.slice(5) : "",
    };
  });
  return (
    <div className="h-[350px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 26, right: 18, left: -12 }}>
          <CartesianGrid vertical={false} stroke="#E4E9F0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#667085" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#667085" }}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #E4E9F0",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => `${formatUnits(Number(value))} units`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            x={data[51]?.label}
            stroke="#CBD5E1"
            label={{
              value: "FORECAST",
              fill: "#667085",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
          <ReferenceLine
            x={data[55]?.label}
            stroke="#E5A000"
            strokeDasharray="3 3"
            label={{ value: "Promotion", fill: "#A16207", fontSize: 10 }}
          />
          <ReferenceLine
            x={data[58]?.label}
            stroke="#0F9D8A"
            strokeDasharray="3 3"
            label={{
              value: "Distributor launch",
              fill: "#0F9D8A",
              fontSize: 10,
            }}
          />
          <Line
            name="Actual"
            dataKey="actual"
            stroke="#10233F"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Base forecast"
            dataKey="base"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Conservative"
            dataKey="conservative"
            stroke="#667085"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Upside"
            dataKey="upside"
            stroke="#0F9D8A"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function InventoryProjection({ sku }: { sku: Sku }) {
  const data = Array.from({ length: 6 }, (_, i) => ({
    week: `W${i + 1}`,
    inventory:
      sku.currentInventory -
      sku.baseWeeklyDemand * i +
      (i === 4 ? sku.incomingUnits : 0),
  }));
  return (
    <div className="h-44">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid vertical={false} stroke="#E4E9F0" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#667085" }} />
          <YAxis hide />
          <Tooltip />
          <ReferenceLine
            y={sku.baseWeeklyDemand * sku.safetyStockWeeks}
            stroke="#E5A000"
            strokeDasharray="4 4"
            label={{ value: "Safety stock", fill: "#A16207", fontSize: 10 }}
          />
          <ReferenceLine
            y={0}
            stroke="#DC3545"
            label={{
              value: "Projected stockout",
              fill: "#DC3545",
              fontSize: 10,
            }}
          />
          <Area
            dataKey="inventory"
            stroke="#2563EB"
            strokeWidth={2}
            fill="#2563EB"
            fillOpacity={0.12}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Weekly() {
  const { setSelectedSkuId } = useWorkspace();
  const router = useRouter();
  const cards = [
    {
      id: "citrus-vodka-soda",
      risk: "high" as Risk,
      title: "Projected stockout before next production cycle",
      rows: [
        [
          "Current inventory",
          "4,800 units",
          "Less cover than the production lead time",
        ],
        ["Forecast weekly demand", "1,140 units", "18% above recent plan"],
        ["Weeks of cover", "4.2 weeks", "Below 5-week lead time"],
        [
          "Recommended action",
          "Increase next run by ~1,800 units",
          "Confirm production capacity this week",
        ],
      ],
      note: "Demand has remained above plan for three consecutive weeks. Current inventory no longer covers the expected production lead time.",
      href: "/inventory",
      cta: "Review Inventory Plan",
    },
    {
      id: "berry-vodka-soda",
      risk: "watch" as Risk,
      title: "Distributor launch changes the historical signal",
      rows: [
        ["Current inventory", "10,300 units", "11.1 weeks cover"],
        ["Recent demand variance", "–17%", "Distributor launch in 4 weeks"],
        [
          "Recommended action",
          "Maintain / reassess",
          "Do not reduce production yet",
        ],
      ],
      note: "Do not reduce production yet. Maintain the current plan until early distributor demand becomes visible.",
      href: "/assumptions",
      cta: "View Analyst Review",
    },
    {
      id: "variety-8-pack",
      risk: "high" as Risk,
      title: "Promotion may constrain inventory",
      rows: [
        [
          "Promotion timing",
          "Starts in 3 weeks",
          "Expected uplift +25% to +35%",
        ],
        ["Current cover", "3.6 weeks", "Lead time 6 weeks"],
        [
          "Recommended action",
          "Secure component inventory",
          "Before full campaign spend",
        ],
      ],
      note: "Secure additional component inventory before activating full campaign spend.",
      href: "/scenario",
      cta: "Run Scenario",
    },
  ];
  const openPriority = (card: (typeof cards)[number]) => {
    setSelectedSkuId(card.id);
    router.push(card.href);
  };
  return (
    <>
      <PageTitle
        title="Weekly Planning Brief"
        subtitle="The decisions that require attention this week."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            onClick={(event) => {
              event.preventDefault();
              openPriority(card);
            }}
            className="group"
          >
            <Card className="flex h-full flex-col border-[#E4E9F0] bg-white p-5 shadow-none transition-colors duration-200 group-hover:border-[#CBD5E1]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                  Priority {String(index + 1).padStart(2, "0")}
                </p>

                {index === 2 ? (
                  <span className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2563EB]">
                    Action
                  </span>
                ) : (
                  <RiskBadge risk={card.risk} />
                )}
              </div>

              <h2 className="mt-5 max-w-[24rem] text-lg font-semibold leading-6 tracking-[-0.01em] text-[#10233F]">
                {card.title}
              </h2>

              <div className="mt-5 space-y-3">
                {card.rows.map((row) => (
                  <div
                    key={row[0]}
                    className="border-l-2 border-[#D9E2EC] pl-3.5"
                  >
                    <p className="text-xs leading-5 text-[#667085]">
                      {row[0]}{" "}
                      <b className="tabular-nums font-semibold text-[#162033]">
                        {row[1]}
                      </b>
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[#98A2B3]">
                      {row[2]}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-5 text-[#475467]">
                {card.note}
              </p>

              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-[#2563EB] transition-colors group-hover:text-[#1D4ED8]">
                {card.cta}
                <ArrowRight size={16} strokeWidth={1.75} />
              </span>
            </Card>
          </Link>
        ))}
      </div>
      <div className="space-section">
        <Card className="grid gap-0 overflow-hidden border-[#E4E9F0] bg-white p-0 shadow-none sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "At risk",
              value: "2 SKUs",
              detail: "Citrus + Variety 8-Pack",
            },
            {
              label: "Healthy",
              value: "3 SKUs",
              detail: "Lime, Variety 12-Pack + Berry",
            },
            {
              label: "Overstock watch",
              value: "1 SKU",
              detail: "Seasonal Summer Pack",
            },
            {
              label: "Decisions this week",
              value: "3",
              detail: "Production, launch, promotion",
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`flex min-h-[112px] flex-col justify-between p-5 ${
                i > 0
                  ? "border-t border-[#E4E9F0] sm:border-t-0 sm:border-l xl:border-l"
                  : ""
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                {item.label}
              </p>

              <div className="mt-4">
                <p className="text-[20px] font-semibold tracking-[-0.02em] text-[#1D2939]">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-[#667085]">{item.detail}</p>
              </div>
            </div>
          ))}
        </Card>

        <p className="mt-3 text-xs text-[#667085]">
          6 active SKUs <span className="mx-2 text-[#D0D5DD]">|</span> 18 months
          history <span className="mx-2 text-[#D0D5DD]">|</span> 2 incoming
          production orders
        </p>
      </div>
      <Card className="space-section overflow-hidden border-[#E4E9F0] bg-white p-0 shadow-none">
        <div className="border-b border-[#E4E9F0] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
            Weekly review
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-[#10233F]">
            What changed since last week
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[13px] tabular-nums">
            <thead className="bg-[#F6F8FB] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085]">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Change</th>
                <th className="px-5 py-3">Interpretation</th>
              </tr>
            </thead>

            <tbody>
              {[
                [
                  "Citrus Vodka Soda",
                  "Actual demand +18% vs plan",
                  "Growth is persisting beyond the prior forecast range.",
                ],
                [
                  "Berry Vodka Soda",
                  "Actual demand –17% vs plan",
                  "Weak historical signal, but launch prevents immediate production reduction.",
                ],
                [
                  "Variety 8-Pack",
                  "Promotion confirmed: Sep 28",
                  "Future demand assumption increased.",
                ],
              ].map((row, index) => {
                const priority = cards[index];
                const openRow = () => openPriority(priority);

                return (
                  <tr
                    key={row[0]}
                    aria-label={`View ${row[0]} details`}
                    className="group cursor-pointer border-t border-[#E4E9F0] transition-colors hover:bg-[#FAFBFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563EB]"
                    onClick={openRow}
                    onKeyDown={(event) => {
                      if (
                        (event.key === "Enter" || event.key === " ") &&
                        !event.nativeEvent.isComposing &&
                        event.keyCode !== 229
                      ) {
                        event.preventDefault();
                        openRow();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <td className="px-5 py-4 font-semibold text-[#162033]">
                      {row[0]}
                    </td>
                    <td className="px-5 py-4 font-medium text-[#344054]">
                      {row[1]}
                    </td>
                    <td className="px-5 py-4 leading-5 text-[#667085]">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] transition-colors group-hover:bg-[#2563EB]" />
                        {row[2]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Forecast() {
  const { selectedSkuId } = useWorkspace();
  const sku = skus.find((item) => item.id === selectedSkuId) ?? skus[0];
  const nextFour =
    sku.id === "citrus-vodka-soda" ? 4560 : sku.baseWeeklyDemand * 4;
  const nextEight =
    sku.id === "citrus-vodka-soda" ? 9480 : sku.baseWeeklyDemand * 8;
  const growth =
    sku.id === "berry-vodka-soda"
      ? "–5.0%"
      : sku.id === "seasonal-summer-pack"
        ? "–8.0%"
        : "+12.4%";
  return (
    <>
      <div className="space-y-6">
        <PageTitle
          title="Demand Forecast"
          subtitle="Forward demand by SKU with scenario-based planning."
          action={<SkuSelect />}
        />

        <Card className="overflow-hidden border-[#E4E9F0] bg-white p-0 shadow-none">
          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-5">
            {[
              [
                "Next 4 Weeks",
                `${formatUnits(nextFour)} units`,
                "near-term demand",
              ],
              [
                "Next 8 Weeks",
                `${formatUnits(nextEight)} units`,
                "planning horizon",
              ],
              ["Base Growth", growth, "planning assumption"],
              ["Upside Scenario", "+27.5%", "not a promise"],
              ["Confidence", "Moderate", "analyst-reviewed"],
            ].map(([label, value, detail], i) => (
              <div
                key={label}
                className={`relative px-5 py-5 ${
                  i > 0
                    ? "border-t border-[#E4E9F0] sm:border-t-0 sm:border-l"
                    : ""
                }`}
              >
                {i === 2 && (
                  <span
                    aria-hidden
                    className="absolute inset-y-5 left-0 hidden w-0.5 rounded-full bg-[#2563EB] sm:block"
                  />
                )}

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                  {label}
                </p>
                <p className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#10233F]">
                  {value}
                </p>
                <p className="mt-1 text-xs text-[#667085]">{detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden border-[#E4E9F0] bg-white p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-[#E4E9F0] px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                Demand outlook
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-[-0.01em] text-[#10233F]">
                Forecast range by week
              </h2>
            </div>

            <span className="hidden rounded-md border border-[#E4E9F0] bg-[#FAFBFC] px-2.5 py-1.5 text-[11px] font-medium text-[#667085] sm:inline-flex">
              Citrus Vodka Soda
            </span>
          </div>

          <div className="p-5">
            <ForecastChart />
          </div>
        </Card>

        <Card className="border-[#E4E9F0] bg-white p-5 shadow-none">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                Advisor interpretation
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475467]">
                Recent sales momentum is persistent enough to raise the base
                demand assumption. Inventory coverage should therefore be
                evaluated against the revised demand range rather than the
                previous flat-growth plan.
              </p>
            </div>

            <div className="border-t border-[#E4E9F0] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[#10233F]">
                Why the Citrus forecast changed
              </h2>
              <div className="mt-3">
                <StatementList
                  items={[
                    "Recent velocity increased.",
                    "Wholesale orders exceeded plan.",
                    "Seasonal demand remains supportive.",
                    "No known production constraint appears in the historical data.",
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="border-t border-[#E4E9F0] pt-5">
          <div className="flex flex-wrap gap-2">
            {[
              "Conservative (+3%)",
              "Base (+12%)",
              "Growth (+25%)",
              "Promotion (+40%)",
            ].map((item, i) => (
              <span
                key={item}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  i === 1
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                    : "border-[#E4E9F0] bg-white text-[#667085]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-[#667085]">
            ScaleSight uses scenario planning to support decisions rather than
            relying on a single forecast.
          </p>
        </div>
      </div>
    </>
  );
}

function Inventory() {
  const { selectedSkuId, setSelectedSkuId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const selected = skus.find((sku) => sku.id === selectedSkuId) ?? skus[0];
  const ordered = [
    "citrus-vodka-soda",
    "variety-8-pack",
    "berry-vodka-soda",
    "lime-vodka-soda",
    "variety-12-pack",
    "seasonal-summer-pack",
  ].map((id) => skus.find((sku) => sku.id === id)!);
  const action = (risk: Risk) =>
    risk === "high"
      ? "Increase production"
      : risk === "watch"
        ? "Maintain / reassess"
        : risk === "overstock"
          ? "Reduce future production"
          : "Hold";
  const facts = [
    ["Current inventory", `${formatUnits(selected.currentInventory)} units`],
    [
      "Forecast consumption",
      `${formatUnits(selected.baseWeeklyDemand)} units/week`,
    ],
    ["Incoming production", `${formatUnits(selected.incomingUnits)} units`],
    [
      "Safety stock target",
      `${formatUnits(selected.baseWeeklyDemand * selected.safetyStockWeeks)} units`,
    ],
    ["Production lead time", `${selected.leadTimeWeeks} weeks`],
    ["Recommended confirmation", "This week"],
  ];
  return (
    <>
      <PageTitle
        title="Inventory Planning"
        subtitle="Forward inventory coverage, replenishment risk and recommended action."
      />
      <Card className="overflow-hidden p-0">
        <table className="w-full table-fixed text-left text-[13px] tabular-nums">
          <colgroup>
            <col className="w-[21%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead className="bg-[#F6F8FB] text-[11px] uppercase tracking-[.04em] text-[#667085]">
            <tr>
              {[
                "SKU",
                "Stock",
                "Weekly Demand",
                "Weeks Cover",
                "Lead Time",
                "Incoming",
                "Risk",
                "Action",
              ].map((item, i) => (
                <th
                  className={`p-3 ${i > 0 && i < 6 ? "text-right" : ""}`}
                  key={item}
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map((sku) => (
              <tr
                key={sku.id}
                onClick={() => {
                  setSelectedSkuId(sku.id);
                  setOpen(true);
                }}
                className="cursor-pointer border-t border-[#E4E9F0] hover:bg-[#F6F8FB]"
              >
                <td className="p-3 font-medium text-[#162033]">{sku.name}</td>
                <td className="p-3 text-right">
                  {formatUnits(sku.currentInventory)}
                </td>
                <td className="p-3 text-right">
                  {formatUnits(sku.baseWeeklyDemand)}
                </td>
                <td className="p-3 text-right">
                  {(sku.currentInventory / sku.baseWeeklyDemand).toFixed(1)}w
                </td>
                <td className="p-3 text-right">{sku.leadTimeWeeks}w</td>
                <td className="p-3 text-right">
                  {formatUnits(sku.incomingUnits)}
                </td>
                <td className="p-3">
                  <RiskBadge risk={sku.risk} />
                </td>
                <td className="p-3 font-medium text-[#2563EB]">
                  {action(sku.risk)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {open && (
        <div className="fixed inset-0 z-40">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close drawer"
            className="absolute inset-0 bg-[#10233F]/[.24]"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[400px] overflow-auto bg-white p-6 shadow-[-4px_0_24px_rgba(16,35,63,0.12)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#667085]">
                  Inventory Detail
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#10233F]">
                  {selected.name}
                </h2>
              </div>
              <Button
                variant="icon"
                aria-label="Close inventory detail"
                onClick={() => setOpen(false)}
              >
                <X size={16} strokeWidth={1.75} />
              </Button>
            </div>
            <dl className="mt-6 divide-y divide-[#E4E9F0] text-sm tabular-nums">
              {facts.map(([label, value]) => (
                <div
                  className="flex items-center justify-between gap-4 py-3"
                  key={label}
                >
                  <dt className="text-[#667085]">{label}</dt>
                  <dd
                    className={`font-semibold ${label === "Recommended confirmation" ? "text-base text-[#10233F]" : "text-[#162033]"}`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="space-section">
              <InventoryProjection sku={selected} />
            </div>
            <div className="mt-4 border-t border-[#E4E9F0] pt-4">
              <p className="text-sm font-semibold text-[#10233F]">
                Projected safety-stock breach: Oct 5, 2026
              </p>
              <p className="mt-2 text-base font-bold text-[#DC3545]">
                Projected stockout: Oct 14, 2026
              </p>
              <p className="mt-4 text-sm">
                Illustrative additional production: <b>1,800–2,200 units</b>
              </p>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                Quantity is illustrative and should be validated against
                production constraints, minimum run sizes and working-capital
                limits.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Scenario() {
  const { selectedSkuId, scenario, updateScenario, resetScenario } =
    useWorkspace();
  const sku = skus.find((item) => item.id === selectedSkuId) ?? skus[0];
  const metrics = scenarioMetrics(sku, scenario);
  const recommendation =
    sku.id === "berry-vodka-soda"
      ? scenario.distributorEnabled
        ? "Maintain / reassess production until early launch demand becomes visible."
        : "Reduce production in response to current demand softness."
      : "Confirm additional production before increasing demand-generation activity beyond the current base plan.";
  const slider = (
    label: string,
    key: "growthRate" | "leadTimeWeeks" | "shrinkRate",
    min: number,
    max: number,
    step: number,
    format: (value: number) => string,
  ) => (
    <label className="block" key={key}>
      <span className="flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span className="tabular-nums text-[#10233F]">
          {format(scenario[key])}
        </span>
      </span>
      <input
        className="mt-2 w-full accent-[#10233F]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={scenario[key]}
        onChange={(event) =>
          updateScenario({ [key]: Number(event.target.value) })
        }
      />
    </label>
  );
  return (
    <>
      <PageTitle
        title="Scenario Planning"
        subtitle="Test how growth and operational changes affect inventory decisions."
        action={<SkuSelect />}
      />

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="h-fit border-[#E4E9F0] bg-white p-0 shadow-none">
          <div className="border-b border-[#E4E9F0] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                  Planning controls
                </p>

                <h2 className="mt-1.5 text-base font-semibold tracking-[-0.01em] text-[#10233F]">
                  Scenario inputs
                </h2>
              </div>

              <span className="rounded-md bg-[#F6F8FB] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085]">
                Live model
              </span>
            </div>
          </div>

          <div className="space-y-6 px-5 py-5">
            {(
              [
                [
                  "Demand Uplift",
                  "growthRate",
                  0,
                  0.5,
                  0.01,
                  (value: number) => `${Math.round(value * 100)}%`,
                ],
                [
                  "Production Lead Time",
                  "leadTimeWeeks",
                  4,
                  10,
                  1,
                  (value: number) => `${value} weeks`,
                ],
                [
                  "Shrink / Loss",
                  "shrinkRate",
                  0,
                  0.08,
                  0.01,
                  (value: number) => `${Math.round(value * 100)}%`,
                ],
              ] as const
            ).map(([label, key, min, max, step, format]) => (
              <label className="block" key={key}>
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#344054]">
                    {label}
                  </span>

                  <span className="rounded-md bg-[#F6F8FB] px-2 py-1 text-xs font-semibold tabular-nums text-[#10233F]">
                    {format(scenario[key])}
                  </span>
                </span>

                <input
                  className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E4E9F0] accent-[#2563EB]"
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={scenario[key]}
                  onChange={(event) =>
                    updateScenario({
                      [key]: Number(event.target.value),
                    })
                  }
                />

                <span className="mt-2 flex justify-between text-[10px] text-[#98A2B3]">
                  <span>{format(min)}</span>
                  <span>{format(max)}</span>
                </span>
              </label>
            ))}

            <label className="block border-t border-[#E4E9F0] pt-5">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#344054]">
                  Incoming Production
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">
                  Units
                </span>
              </span>

              <input
                className="mt-3 h-10 w-full rounded-md border border-[#D0D5DD] bg-white px-3 text-sm font-medium tabular-nums text-[#10233F] outline-none transition-colors placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:ring-2 focus:ring-[#BFDBFE]"
                type="number"
                min="0"
                max="50000"
                value={scenario.incomingUnits}
                onChange={(event) =>
                  updateScenario({
                    incomingUnits: Number(event.target.value),
                  })
                }
              />
            </label>

            <div className="space-y-3 border-t border-[#E4E9F0] pt-5">
              {(
                [
                  ["Promotion", "promotionEnabled"],
                  ["Distributor Launch", "distributorEnabled"],
                ] as const
              ).map(([label, key]) => {
                const checked = Boolean(scenario[key]);

                return (
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-md border px-3.5 py-3 transition-colors ${
                      checked
                        ? "border-[#BFDBFE] bg-[#EFF6FF]"
                        : "border-[#E4E9F0] bg-white hover:bg-[#FAFBFC]"
                    }`}
                    key={key}
                  >
                    <span className="text-sm font-medium text-[#344054]">
                      {label}
                    </span>

                    <span
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        checked ? "bg-[#2563EB]" : "bg-[#D0D5DD]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={checked}
                        onChange={(event) =>
                          updateScenario({
                            [key]: event.target.checked,
                          })
                        }
                      />

                      <span
                        aria-hidden
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          checked ? "translate-x-[18px]" : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </label>
                );
              })}
            </div>

            <Button
              variant="tertiary"
              onClick={resetScenario}
              className="w-full justify-center border border-[#E4E9F0] px-3 py-2.5 text-[#667085] hover:border-[#CBD5E1] hover:bg-[#FAFBFC] hover:text-[#10233F]"
            >
              <RotateCcw size={15} strokeWidth={1.75} />
              Reset to Defaults
            </Button>
          </div>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden border-[#E4E9F0] bg-white p-0 shadow-none">
            <div className="border-b border-[#E4E9F0] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                Scenario output
              </p>

              <p className="mt-1 text-sm text-[#667085]">
                Current model impact across the planning horizon
              </p>
            </div>

            <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-5">
              {[
                [
                  "Current Stockout",
                  "4.2 weeks",
                  "base estimate",
                  false,
                  false,
                ],
                [
                  "Scenario Stockout",
                  displayCover(metrics.cover),
                  "risk accelerates",
                  true,
                  true,
                ],
                [
                  "Required Production",
                  `+${formatUnits(metrics.reorderGap)}`,
                  "illustrative units",
                  true,
                  false,
                ],
                ["Safety Coverage", "At risk", "below threshold", false, false],
                [
                  "Capital Impact",
                  "+$18,600",
                  "Illustrative estimate",
                  false,
                  false,
                ],
              ].map(([label, value, detail, primary, danger], i) => (
                <div
                  className={`relative p-5 ${
                    i > 0
                      ? "border-t border-[#E4E9F0] sm:border-t-0 sm:border-l"
                      : ""
                  }`}
                  key={String(label)}
                >
                  {Boolean(primary) && (
                    <span
                      aria-hidden
                      className={`absolute inset-y-5 left-0 hidden w-0.5 rounded-full sm:block ${
                        Boolean(danger) ? "bg-[#B54708]" : "bg-[#2563EB]"
                      }`}
                    />
                  )}

                  {label === "Safety Coverage" ? (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                        {label}
                      </p>

                      <div className="mt-3">
                        <RiskBadge risk={metrics.risk} label="At risk" />
                      </div>

                      <p className="mt-2 text-xs text-[#667085]">
                        {String(detail)}
                      </p>
                    </>
                  ) : (
                    <Metric
                      label={String(label)}
                      value={String(value)}
                      detail={String(detail)}
                      primary={Boolean(primary)}
                      danger={Boolean(danger)}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="relative overflow-hidden border-[#E4E9F0] bg-white p-5 shadow-none">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1 bg-[#2563EB]"
            />

            <div className="pl-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                  Recommendation
                </p>

                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#2563EB]">
                  Advisor view
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-[15px] font-medium leading-6 text-[#10233F]">
                {recommendation}
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden border-[#E4E9F0] bg-white p-0 shadow-none">
            <div className="flex items-center justify-between border-b border-[#E4E9F0] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                  Sensitivity analysis
                </p>

                <h2 className="mt-1 text-base font-semibold tracking-[-0.01em] text-[#10233F]">
                  Growth scenarios
                </h2>
              </div>

              <span className="hidden rounded-md bg-[#F6F8FB] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085] sm:inline-flex">
                Base case highlighted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[13px] tabular-nums">
                <thead className="bg-[#F6F8FB] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">
                  <tr>
                    {["Metric", "Current", "+15%", "+25%", "+40%"].map(
                      (item) => (
                        <th className="whitespace-nowrap px-5 py-3" key={item}>
                          {item}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {[
                    ["Weekly demand", "1,140", "1,311", "1,425", "1,596"],
                    ["Usable weeks cover", "4.1", "3.6", "3.3", "2.9"],
                    ["Safety breach", "Oct 5", "Sep 28", "Sep 22", "Sep 16"],
                    [
                      "Projected stockout",
                      "Oct 14",
                      "Oct 6",
                      "Sep 30",
                      "Sep 24",
                    ],
                    ["Required production", "1,800", "2,050", "2,400", "3,100"],
                    ["Risk level", "High", "High", "High", "Critical"],
                  ].map((row) => (
                    <tr
                      className="border-t border-[#E4E9F0] transition-colors hover:bg-[#FAFBFC]"
                      key={row[0]}
                    >
                      {row.map((item, i) => (
                        <td
                          className={`px-5 py-3.5 ${
                            i === 0
                              ? "font-medium text-[#344054]"
                              : i === 3
                                ? "bg-[#EFF6FF] font-semibold text-[#1D4ED8]"
                                : item === "Critical"
                                  ? "font-semibold text-[#B54708]"
                                  : "text-[#667085]"
                          }`}
                          key={`${row[0]}-${item}`}
                        >
                          {item}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Advisor() {
  const [checked, setChecked] = useState([false, false, false, false]);
  const statements = [
    [
      "Citrus Vodka Soda",
      "Sales ran 18% above the prior plan for the third consecutive week.",
    ],
    [
      "Berry Vodka Soda",
      "Sales remain below plan, but the distributor launch scheduled in four weeks materially changes the production decision.",
    ],
    [
      "Variety 8-Pack",
      "Campaign timing is now confirmed and creates additional inventory exposure.",
    ],
  ];
  const decisions = [
    "Approve Citrus production adjustment",
    "Confirm distributor launch assumptions",
    "Confirm Variety promotion timing",
    "Update supplier lead-time estimate",
  ];
  return (
    <div className="mx-auto max-w-[1020px]">
      <PageTitle
        title="Alias Advisor Brief"
        subtitle="Prepared for this week's client planning conversation."
        action={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} strokeWidth={1.75} />
            Export PDF
          </Button>
        }
      />
      <p className="-mt-4 mb-8 text-sm text-[#667085]">
        Harbor Coast Beverages | Planning Week: Sep 7–13, 2026
      </p>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-.015em] text-[#10233F]">
          What Changed
        </h2>
        <Card className="mt-3 overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <tbody>
              {statements.map(([sku, statement]) => (
                <tr
                  className="border-b border-[#E4E9F0] last:border-0"
                  key={sku}
                >
                  <td className="w-[30%] p-4 font-semibold text-[#162033]">
                    {sku}
                  </td>
                  <td className="p-4 leading-5 text-[#667085]">{statement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-.015em] text-[#10233F]">
          Why It Matters
        </h2>
        <div className="mt-3">
          <StatementList
            items={[
              <>
                <b>Citrus:</b> Inventory coverage is now shorter than production
                lead time.
              </>,
              <>
                <b>Berry:</b> Reducing production purely from historical demand
                could leave the brand underprepared for the distributor launch.
              </>,
              <>
                <b>Variety:</b> Campaign-driven demand could reduce available
                stock before replacement inventory arrives.
              </>,
            ]}
          />
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-.015em] text-[#10233F]">
          Recommended Alias Discussion
        </h2>
        <div className="mt-3">
          <StatementList
            items={[
              "Citrus — Confirm additional production this week.",
              "Berry — Maintain production through launch and reassess after early sales data.",
              "Variety — Align campaign activation with component and finished-goods availability.",
            ]}
          />
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-.015em] text-[#10233F]">
          Client Decisions Required
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {decisions.map((decision, i) => (
            <Button
              variant="check"
              onClick={() =>
                setChecked((items) =>
                  items.map((item, j) => (j === i ? !item : item)),
                )
              }
              className="justify-start"
              key={decision}
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-[4px] border ${checked[i] ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#667085]"}`}
              >
                {checked[i] && <Check size={14} strokeWidth={1.75} />}
              </span>
              {decision}
            </Button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold tracking-[-.015em] text-[#10233F]">
          Monitor Next Week
        </h2>
        <div className="mt-3">
          <StatementList
            items={[
              "Citrus wholesale velocity",
              "Berry distributor pre-orders",
              "Variety promotion inventory allocation",
              "Seasonal Summer Pack sell-through",
            ]}
          />
        </div>
      </section>
      <footer className="mt-12 border-t border-[#E4E9F0] pt-5 text-[#667085]">
        <p className="text-[11px] font-semibold tracking-[.04em]">
          PREPARED THROUGH SCALESIGHT MANAGED INTELLIGENCE
        </p>
        <p className="mt-2 max-w-3xl text-xs leading-5">
          Forecast refresh, inventory-risk review, scenario analysis and analyst
          commentary are maintained continuously so Alias can focus on client
          strategy and operational decisions.
        </p>
      </footer>
    </div>
  );
}

function Managed() {
  const flow = [
    [
      "Data Refresh",
      "Actual demand, inventory, incoming production, business events",
      "Current planning inputs",
    ],
    [
      "Planning System",
      "Forecast refresh, inventory coverage, scenario modeling, risk detection",
      "Exceptions and forward view",
    ],
    [
      "Analyst Review",
      "Context, promotions, supplier events, business assumptions",
      "Judgment-adjusted interpretation",
    ],
    [
      "Advisor Brief",
      "Priorities, recommended actions, client decisions",
      "Meeting-ready brief",
    ],
    [
      "Alias Advisory",
      "Alias adds beverage expertise and final judgment",
      "Client conversation and action",
    ],
  ];
  const workload = [
    "Weekly data refresh",
    "Forecast maintenance",
    "Forecast-vs-actual review",
    "Inventory coverage monitoring",
    "Stockout and overstock detection",
    "Scenario and promotion updates",
    "Lead-time and shrink assumptions",
    "Replenishment calculations",
    "Exception detection",
    "Weekly advisor brief",
    "Analyst commentary",
  ];
  const alias = [
    "Client ownership",
    "Beverage and manufacturing expertise",
    "Operational strategy",
    "Client meetings",
    "Business context",
    "Final recommendations",
    "Executive relationship",
  ];
  return (
    <>
      <PageTitle
        title="Managed Planning Cycle"
        subtitle="What ScaleSight operates every week behind the scenes."
      />
      <div className="relative grid gap-3 xl:grid-cols-5">
        <div className="absolute left-[10%] right-[10%] top-[27px] hidden h-px bg-[#E4E9F0] xl:block" />
        {flow.map(([title, body, result], i) => (
          <Card key={title} className="relative">
            <p className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#667085] ring-1 ring-[#E4E9F0]">
              0{i + 1}
            </p>
            <h2 className="mt-3 font-semibold text-[#10233F]">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-[#667085]">{body}</p>
            <p className="mt-3 text-xs font-medium text-[#10233F]">{result}</p>
          </Card>
        ))}
      </div>
      <div className="space-section grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold text-[#10233F]">
            ScaleSight handles recurring workload
          </h2>
          <div className="mt-4">
            <StatementList marker="teal" items={workload.map((item) => item)} />
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[#10233F]">
            Alias stays the trusted advisor
          </h2>
          <div className="mt-4">
            <StatementList marker="navy" items={alias.map((item) => item)} />
          </div>
        </Card>
      </div>
    </>
  );
}

function Assumptions() {
  const rows = [
    [
      "Citrus Vodka Soda",
      "Growth / lead time / shrink / safety stock",
      "+12% / 5 weeks / 2% / 1.2 weeks",
      "Historical signal",
    ],
    [
      "Berry Vodka Soda",
      "Growth / distributor launch / launch uplift",
      "–5% / Oct 12, 2026 / +30%",
      "Confirmed business event",
    ],
    [
      "Variety 8-Pack",
      "Promotion / uplift / lead time",
      "Sep 28, 2026 / +30% / 6 weeks",
      "Operational input",
    ],
  ];
  return (
    <>
      <PageTitle
        title="Planning Assumptions"
        subtitle="The business context currently informing the planning model."
        action={
          <span className="text-xs text-[#667085]">
            Last reviewed by: ScaleSight Analyst | Sep 9, 2026
          </span>
        }
      />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-[13px] tabular-nums">
          <thead className="bg-[#F6F8FB] text-[11px] uppercase tracking-[.04em] text-[#667085]">
            <tr>
              {["SKU", "Assumption", "Current Value", "Source"].map((item) => (
                <th className="p-3" key={item}>
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-[#E4E9F0]" key={row[0]}>
                <td className="p-3 font-medium">{row[0]}</td>
                <td className="p-3 text-[#667085]">{row[1]}</td>
                <td className="p-3 text-[#667085]">{row[2]}</td>
                <td className="p-3">
                  <span className="rounded-full border border-[#E4E9F0] bg-white px-2 py-1 text-[11px] text-[#667085]">
                    {row[3]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <section className="space-section border-t border-[#E4E9F0] pt-5">
        <h2 className="text-xl font-semibold text-[#10233F]">
          Berry Human-Judgment Demonstration
        </h2>
        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg bg-[#F6F8FB] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[.04em] text-[#667085]">
              Without Event Context
            </p>
            <p className="mt-3 text-sm leading-6">
              Recent demand softness and 11.1 weeks cover would point toward
              reducing production.
            </p>
          </div>
          <span className="grid place-items-center text-sm font-semibold text-[#667085]">
            vs
          </span>
          <div className="rounded-lg border-l-4 border-[#2563EB] bg-[#2563EB]/[.04] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[.04em] text-[#2563EB]">
              With Distributor Launch
            </p>
            <p className="mt-3 text-sm leading-6">
              Maintain the production plan until early launch demand becomes
              visible, then reassess. The business event materially changes the
              recommendation.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export function WorkspacePage({
  view,
}: {
  view:
    | "weekly"
    | "forecast"
    | "inventory"
    | "scenario"
    | "advisor"
    | "managed"
    | "assumptions";
}) {
  const content = {
    weekly: <Weekly />,
    forecast: <Forecast />,
    inventory: <Inventory />,
    scenario: <Scenario />,
    advisor: <Advisor />,
    managed: <Managed />,
    assumptions: <Assumptions />,
  }[view];
  return <div className="mx-auto max-w-[1280px] px-6 py-7">{content}</div>;
}
