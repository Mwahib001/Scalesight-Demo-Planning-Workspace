"use client";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Bar,
  BarChart,
} from "recharts";
import type { ProjectionPoint } from "@/lib/types";
export interface ForecastChartPoint {
  week: string;
  actual?: number;
  previous?: number;
  base?: number;
  range?: [number, number];
}
const axis = { fontSize: 11, fill: "#667085" };
export function ForecastChart({
  data,
  eventDates,
}: {
  data: ForecastChartPoint[];
  eventDates: { date: string; label: string }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Historical actual demand, previous forecast, updated base forecast, and lower to upper planning range in units"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 25, right: 20, left: 0, bottom: 8 }}
        >
          <CartesianGrid vertical={false} stroke="#E8ECF2" />
          <XAxis
            dataKey="week"
            tick={axis}
            tickFormatter={(d) => String(d).slice(5)}
            minTickGap={32}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={axis} width={48} axisLine={false} tickLine={false} />
          <Tooltip
            labelFormatter={(v) => `Week of ${v} · illustrative estimate`}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #DDE3EC",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          <Area
            type="monotone"
            dataKey="range"
            name="Planning range"
            stroke="none"
            fill="#2F5BFF"
            fillOpacity={0.1}
            isAnimationActive={false}
          />
          <Line
            dataKey="actual"
            name="Historical actual"
            stroke="#10233F"
            dot={false}
            strokeWidth={2.5}
            isAnimationActive={false}
          />
          <Line
            dataKey="previous"
            name="Previous forecast"
            stroke="#98A2B3"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1.7}
            isAnimationActive={false}
          />
          <Line
            dataKey="base"
            name="Updated base"
            stroke="#2F5BFF"
            dot={false}
            strokeWidth={2.5}
            isAnimationActive={false}
          />
          <ReferenceLine
            x="2026-09-14"
            stroke="#667085"
            strokeDasharray="4 4"
            label={{
              value: "PLANNING →",
              position: "insideTopRight",
              fontSize: 10,
              fill: "#667085",
            }}
          />
          {eventDates.map((e, i) => (
            <ReferenceLine
              key={e.label}
              x={e.date}
              stroke="#2DB8C5"
              strokeDasharray="2 6"
              label={{
                value: String(i + 1),
                position: "insideBottomRight",
                fontSize: 10,
                fill: "#147782",
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ProjectionChart({
  points,
  stockout,
  receiptWeek,
}: {
  points: ProjectionPoint[];
  stockout: number | null;
  receiptWeek?: number;
}) {
  return (
    <div
      className="chart projection-chart"
      role="img"
      aria-label="Projected on-hand inventory, incoming receipt steps, safety stock and below-safety region"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 25, right: 18, left: 0, bottom: 5 }}
        >
          <CartesianGrid stroke="#E8ECF2" vertical={false} />
          <XAxis
            dataKey="week"
            type="number"
            domain={[0, "dataMax"]}
            tick={axis}
            tickFormatter={(v) => `W${v}`}
          />
          <YAxis tick={axis} width={50} />
          <Tooltip
            labelFormatter={(v) => `Week ${v} · illustrative estimate`}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceArea
            y1={0}
            y2={points[0]?.safety ?? 0}
            fill="#D94A4A"
            fillOpacity={0.07}
          />
          <Area
            dataKey="onHand"
            name="Projected on-hand"
            stroke="#2F5BFF"
            fill="#2F5BFF"
            fillOpacity={0.09}
            isAnimationActive={false}
          />
          <Line
            dataKey="safety"
            name="Safety stock"
            stroke="#D79518"
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="receipt"
            name="Receipt units"
            stroke="#278A61"
            type="stepAfter"
            dot={false}
            isAnimationActive={false}
          />
          {receiptWeek !== undefined && (
            <ReferenceLine
              x={receiptWeek}
              stroke="#278A61"
              label={{
                value: "PO receipt",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
          )}
          {stockout !== null && (
            <ReferenceLine
              x={stockout}
              stroke="#D94A4A"
              strokeDasharray="3 3"
              label={{
                value: `Stockout ${stockout.toFixed(1)}w`,
                fontSize: 10,
                position: "insideBottomRight",
              }}
            />
          )}
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
export function RevenueChart({
  data,
}: {
  data: { week: string; newRevenue: number; repeatRevenue: number }[];
}) {
  return (
    <div
      className="chart short-chart"
      role="img"
      aria-label="New versus repeat weekly net revenue"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#E8ECF2" />
          <XAxis
            dataKey="week"
            tick={axis}
            tickFormatter={(d) => String(d).slice(5)}
            minTickGap={30}
          />
          <YAxis tick={axis} width={42} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            labelFormatter={(v) => `${v} · illustrative estimate`}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="newRevenue"
            name="First order revenue"
            stackId="a"
            fill="#D6DFFC"
            isAnimationActive={false}
          />
          <Bar
            dataKey="repeatRevenue"
            name="Repeat revenue"
            stackId="a"
            fill="#2F5BFF"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
