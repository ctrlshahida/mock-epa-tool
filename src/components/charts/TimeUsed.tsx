"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK, PHASE_COLORS, PhaseLegend, tooltipStyle } from "./chartTheme";

export interface TimeUsedPoint {
  label: string;
  phase: string;
  minutes: number;
}

export default function TimeUsed({ data }: { data: TimeUsedPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <PhaseLegend />
        <span className="text-xs text-muted">dashed line = 60-min allowance</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }} barCategoryGap="25%">
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_INK.muted, fontSize: 11 }}
            axisLine={{ stroke: CHART_INK.axis }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}m`}
            tick={{ fill: CHART_INK.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(v: number | string) => [`${v} min`, "Time used"]}
          />
          <ReferenceLine y={60} stroke={CHART_INK.muted} strokeDasharray="4 4" />
          <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((d, i) => (
              <Cell key={i} fill={PHASE_COLORS[d.phase] ?? PHASE_COLORS.discussion} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
