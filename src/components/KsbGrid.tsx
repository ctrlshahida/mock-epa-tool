import { KSBS } from "@/lib/ksbs";

// Sequential ramp in the accent's own hue family (near-black surface):
// count 0 recedes to the surface, higher counts step toward the accent.
const RAMP = ["#0f1f66", "#1a35a3", "#2249c9", "#3366ff", "#8fa8ff"];
const RAMP_TEXT = ["#f2f2ef", "#f2f2ef", "#ffffff", "#ffffff", "#050310"];

function bucket(count: number, max: number): number {
  if (max <= 0) return 0;
  const idx = Math.ceil((count / max) * RAMP.length) - 1;
  return Math.min(Math.max(idx, 0), RAMP.length - 1);
}

export default function KsbGrid({ counts }: { counts: Record<string, number> }) {
  const max = Math.max(0, ...Object.values(counts));
  const groups = [
    { label: "Professional discussion", items: KSBS.filter((k) => k.phase === "discussion") },
    { label: "Project questioning", items: KSBS.filter((k) => k.phase === "project") },
  ];
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <h3 className="mb-2 text-sm font-semibold">{g.label}</h3>
          <div className="flex flex-wrap gap-1.5">
            {g.items.map((k) => {
              const count = counts[k.code] ?? 0;
              const b = bucket(count, max);
              return (
                <div
                  key={k.code}
                  title={`${k.code} - ${k.title}\nCame up ${count} time${count === 1 ? "" : "s"}${k.distinction ? "\n★ distinction-tagged" : ""}`}
                  className={`flex h-12 w-14 flex-col items-center justify-center rounded ${
                    k.distinction ? "ring-2 ring-accent/70" : ""
                  }`}
                  style={
                    count === 0
                      ? { background: "var(--surface-2)", color: "var(--muted)" }
                      : { background: RAMP[b], color: RAMP_TEXT[b] }
                  }
                >
                  <span className="font-mono text-xs font-semibold">
                    {k.code}
                    {k.distinction ? "★" : ""}
                  </span>
                  <span className="text-[11px] tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted">
        Number = times the KSB has come up across saved sessions. ★ + ring =
        distinction-tagged.
      </p>
    </div>
  );
}
