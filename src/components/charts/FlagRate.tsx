"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK, PHASE_COLORS, PhaseLegend, tooltipStyle } from "./chartTheme";

export interface FlagRatePoint {
  label: string;
  phase: string;
  rate: number; // 0-100
  hit: number;
  total: number;
}

export default function FlagRate({ data }: { data: FlagRatePoint[] }) {
  return (
    <div>
      <div className="mb-2">
        <PhaseLegend />
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
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: CHART_INK.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(v: number | string, _name, item) => {
              const p = item?.payload as FlagRatePoint | undefined;
              return [
                p ? `${v}% (${p.hit}/${p.total} answers)` : `${v}%`,
                "Eval language present",
              ];
            }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((d, i) => (
              <Cell key={i} fill={PHASE_COLORS[d.phase] ?? PHASE_COLORS.discussion} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
