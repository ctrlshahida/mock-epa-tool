// Shared chart chrome for the dashboard (near-black surface #0d0d0d).
// One hue (accent blue) + one achromatic neutral - inherently CVD-safe since
// there's no second hue to confuse. Validator: worst-pair CVD dE 27.3,
// normal-vision dE 32.4 (both well clear). The accent's contrast vs this
// surface is 2.95:1 - just under the 3:1 floor, so per the relief rule the
// legend (always shown) and the session-history table (SessionTable) carry
// the marks rather than color alone.
export const PHASE_COLORS: Record<string, string> = {
  discussion: "#3366ff", // accent - professional discussion (AM2)
  project: "#9a9a95", // neutral - project questioning (AM1)
};

export const CHART_INK = {
  muted: "#8a8a86",
  grid: "#1c1c1c",
  axis: "#242424",
  tooltipBg: "#111111",
  tooltipBorder: "#242424",
};

export interface ChartPoint {
  label: string; // short date label for the x axis
  phase?: string;
  discussion?: number | null;
  project?: number | null;
  value?: number;
}

export function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

export function PhaseLegend() {
  return (
    <div className="flex gap-4">
      <Swatch color={PHASE_COLORS.discussion} label="Professional discussion" />
      <Swatch color={PHASE_COLORS.project} label="Project questioning" />
    </div>
  );
}

export const tooltipStyle = {
  contentStyle: {
    background: CHART_INK.tooltipBg,
    border: `1px solid ${CHART_INK.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
    color: "#f2f2ef",
  },
  labelStyle: { color: "#8a8a86" },
  itemStyle: { color: "#f2f2ef" },
};
