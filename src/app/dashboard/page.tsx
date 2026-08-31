import { asc } from "drizzle-orm";
import { getDb, hasDb } from "@/db";
import { sessions, type SessionRow } from "@/db/schema";
import { KSBS, type Phase } from "@/lib/ksbs";
import { buildInsights } from "@/lib/insights";
import KsbGrid from "@/components/KsbGrid";
import Insights from "@/components/Insights";
import StatRow, { type Stat } from "@/components/StatRow";
import SessionTable, { type SessionTableRow } from "@/components/SessionTable";

export const dynamic = "force-dynamic";

function shortLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  if (!hasDb()) {
    return (
      <div className="mx-auto max-w-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-muted">
          No database configured yet. Provision Neon through the Vercel
          Marketplace (<code className="font-mono">vercel install neon</code>),
          pull the env vars (<code className="font-mono">vercel env pull .env.local</code>),
          then push the schema with{" "}
          <code className="font-mono">npm run db:push</code>.
        </p>
      </div>
    );
  }

  // Server Component read path: direct Drizzle query, no API round-trip.
  const rows: SessionRow[] = await getDb()
    .select()
    .from(sessions)
    .orderBy(asc(sessions.createdAt));

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-muted">
          No sessions saved yet - run a practice session and save it from the
          debrief screen.
        </p>
      </div>
    );
  }

  const insights = buildInsights(rows);

  const ksbCounts: Record<string, number> = {};
  for (const r of rows) {
    for (const tag of r.ksbTags) {
      ksbCounts[tag] = (ksbCounts[tag] ?? 0) + 1;
    }
  }

  const distinctionRows = rows.filter((r) => r.distinctionFlagsTotal > 0);
  const distinctionHit = distinctionRows.reduce((s, r) => s + r.distinctionFlagsHit, 0);
  const distinctionTotal = distinctionRows.reduce((s, r) => s + r.distinctionFlagsTotal, 0);

  const stats: Stat[] = [
    { label: "Sessions saved", value: String(rows.length) },
    { label: "KSB coverage", value: `${Object.keys(ksbCounts).length}/${KSBS.length}` },
    {
      label: "Distinction hit-rate",
      value: distinctionTotal > 0 ? `${Math.round((distinctionHit / distinctionTotal) * 100)}%` : "-",
    },
    { label: "Last session", value: shortLabel(rows[rows.length - 1].createdAt) },
  ];

  const tableRows: SessionTableRow[] = [...rows].reverse().map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    phase: r.phase as Phase,
    timeUsedSec: r.timeUsedSec,
    questionsCovered: r.questionsCovered,
    wpm: r.wpm,
    fillerCount: r.fillerCount,
    distinctionFlagsHit: r.distinctionFlagsHit,
    distinctionFlagsTotal: r.distinctionFlagsTotal,
    ksbTags: r.ksbTags,
    notes: r.notes,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold tracking-tightest">Dashboard</h1>

      <StatRow stats={stats} />

      <section className="border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold">Suggestions</h2>
        <Insights items={insights} />
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold">KSB Coverage</h2>
        <KsbGrid counts={ksbCounts} />
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold">Session History</h2>
        <SessionTable rows={tableRows} />
      </section>
    </div>
  );
}
