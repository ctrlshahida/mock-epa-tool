import type { Insight } from "@/lib/insights";

const TONE_COLOR: Record<Insight["tone"], string> = {
  good: "#2fbf71",
  warn: "var(--warn)",
  info: "var(--accent)",
};

const TONE_LABEL: Record<Insight["tone"], string> = {
  good: "Going well",
  warn: "Work on this",
  info: "Worth noting",
};

export default function Insights({ items }: { items: Insight[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Not enough saved sessions yet for tailored suggestions - keep practicing and
        this fills in.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.id} className="flex gap-3 text-sm leading-relaxed">
          <span
            className="mt-1.5 h-2.5 w-2.5 flex-none"
            style={{ background: TONE_COLOR[it.tone] }}
            title={TONE_LABEL[it.tone]}
          />
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}
