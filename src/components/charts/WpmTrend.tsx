"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK, PHASE_COLORS, PhaseLegend, tooltipStyle } from "./chartTheme";

export interface WpmPoint {
  label: string;
  discussion: number | null;
  project: number | null;
}

export default function WpmTrend({ data }: { data: WpmPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <PhaseLegend />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_INK.muted, fontSize: 11 }}
            axisLine={{ stroke: CHART_INK.axis }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_INK.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            label={undefined}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number | string, name: string) => [
              `~${v} wpm`,
              name === "discussion" ? "Professional discussion" : "Project questioning",
            ]}
          />
          <Line
            type="monotone"
            dataKey="discussion"
            stroke={PHASE_COLORS.discussion}
            strokeWidth={2}
            dot={{ r: 4, fill: PHASE_COLORS.discussion, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="project"
            stroke={PHASE_COLORS.project}
            strokeWidth={2}
            dot={{ r: 4, fill: PHASE_COLORS.project, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
