"use client";
import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { date, number, money } from "../engine/formatters";
export interface ChartPoint {
  weekStart: string;
  actual?: number;
  current?: number;
  previous?: number;
  upside?: number;
  downside?: number;
  event?: string;
}
const series = [
  ["actual", "Actual", "#8a98ae"],
  ["current", "Current forecast", "#3b82f6"],
  ["previous", "Previous forecast", "#a78bfa"],
  ["upside", "Upside", "#14b8a6"],
  ["downside", "Downside", "#e9ad42"],
] as const;
export function ForecastChart({
  data,
  revenue = false,
}: {
  data: ChartPoint[];
  revenue?: boolean;
}) {
  const [hidden, setHidden] = useState<string[]>(["upside", "downside"]);
  return (
    <>
      <div className="chart-legend">
        {series
          .filter(([key]) => data.some((d) => d[key] !== undefined))
          .map(([key, label, color]) => (
            <button
              key={key}
              aria-pressed={!hidden.includes(key)}
              onClick={() =>
                setHidden((h) =>
                  h.includes(key) ? h.filter((k) => k !== key) : [...h, key],
                )
              }
            >
              <span style={{ background: color }} />
              {label}
            </button>
          ))}
      </div>
      <div
        className="chart"
        role="img"
        aria-label={
          revenue
            ? "Revenue outlook over time"
            : "Actual and forecast weekly demand"
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 18, right: 18, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              stroke="#e8edf4"
              vertical={false}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="weekStart"
              tickFormatter={date}
              tick={{ fontSize: 11, fill: "#69768c" }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              width={65}
              tickFormatter={(v) =>
                revenue ? `$${number(v / 1000, 0)}k` : number(v)
              }
              tick={{ fontSize: 11, fill: "#69768c" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={(v) => `Week of ${date(String(v))}`}
              formatter={(v, name) => [
                revenue ? money(Number(v)) : number(Number(v)),
                name,
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #dce3ed",
                fontSize: 12,
              }}
            />
            {data
              .filter((d) => d.event)
              .map((d) => (
                <ReferenceLine
                  key={d.weekStart}
                  x={d.weekStart}
                  stroke="#d1c3f0"
                  strokeDasharray="3 3"
                  label={{
                    value: d.event,
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "#78639a",
                  }}
                />
              ))}
            {series.map(([key, label, color]) => (
              <Line
                key={key}
                hide={hidden.includes(key)}
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={key === "current" ? 3 : 1.8}
                strokeDasharray={key === "previous" ? "5 5" : undefined}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                type="linear"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
