"use client";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { InventoryResult } from "../engine/inventoryEngine";
import { date, number } from "../engine/formatters";
export function InventoryProjectionChart({
  inventory,
}: {
  inventory: InventoryResult;
}) {
  return (
    <>
      <div className="chart-legend static">
        <span>
          <i style={{ background: "#3b82f6" }} />
          Projected stock
        </span>
        <span>
          <i style={{ background: "#e6a326" }} />
          Safety stock
        </span>
        <span>
          <i style={{ background: "#14b8a6" }} />
          PO arrival
        </span>
      </div>
      <div
        className="chart"
        role="img"
        aria-label="Inventory projection including safety stock and purchase order arrivals"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={inventory.projection}
            margin={{ top: 25, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e8edf4"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="weekStart"
              tickFormatter={date}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              width={65}
              tickFormatter={(v) => number(v)}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={(v) => `Week of ${date(String(v))}`}
              formatter={(v, n) => [number(Number(v)), n]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #dce3ed",
                fontSize: 12,
              }}
            />
            <ReferenceLine y={0} stroke="#e26060" />
            {inventory.projection
              .filter((p) => p.arrivals > 0)
              .map((p) => (
                <ReferenceLine
                  key={p.weekStart}
                  x={p.weekStart}
                  stroke="#8acdbf"
                  strokeDasharray="3 3"
                  label={{
                    value: p.planned ? "Planned PO" : "PO",
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "#278a77",
                  }}
                />
              ))}
            {inventory.breach && (
              <ReferenceLine
                x={inventory.breach}
                stroke="#e26060"
                strokeDasharray="3 3"
                label={{
                  value: "Safety breach",
                  position: "insideBottomRight",
                  fontSize: 10,
                  fill: "#bf4b4b",
                }}
              />
            )}
            <Line
              dataKey="projected"
              name="Projected units"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              type="linear"
            />
            <Line
              dataKey="safety"
              name="Safety stock"
              stroke="#e6a326"
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">
        End-of-week net inventory. Negative values represent unmet demand. PO
        arrivals are credited in their arrival week; dashed planned POs remain
        assumptions. Safety breach: {date(inventory.breach)}. Stockout:{" "}
        {date(inventory.stockoutDate)}.
      </p>
    </>
  );
}
