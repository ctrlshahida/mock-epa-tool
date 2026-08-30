import { asc } from "drizzle-orm";
import { getDb, hasDb } from "@/db";
import { sessions, type SessionRow } from "@/db/schema";
import type { Phase } from "@/lib/ksbs";
import WpmTrend, { type WpmPoint } from "@/components/charts/WpmTrend";
import FlagRate, { type FlagRatePoint } from "@/components/charts/FlagRate";
import TimeUsed, { type TimeUsedPoint } from "@/components/charts/TimeUsed";
import KsbGrid from "@/components/KsbGrid";
import SessionTable, { type SessionTableRow } from "@/components/SessionTable";

export const dynamic = "force-dynamic";

function shortLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  if (!hasDb()) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-surface p-6">
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
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-muted">
          No sessions saved yet - run a practice session and save it from the
          debrief screen.
        </p>
      </div>
    );
  }

  const wpmData: WpmPoint[] = rows.map((r) => ({
    label: shortLabel(r.createdAt),
    discussion: r.phase === "discussion" ? r.wpm : null,
    project: r.phase === "project" ? r.wpm : null,
  }));
  const hasWpm = wpmData.some((d) => d.discussion !== null || d.project !== null);

  const flagData: FlagRatePoint[] = rows
    .filter((r) => r.distinctionFlagsTotal > 0)
    .map((r) => ({
      label: shortLabel(r.createdAt),
      phase: r.phase,
      rate: Math.round((r.distinctionFlagsHit / r.distinctionFlagsTotal) * 100),
      hit: r.distinctionFlagsHit,
      total: r.distinctionFlagsTotal,
    }));

  const timeData: TimeUsedPoint[] = rows.map((r) => ({
    label: shortLabel(r.createdAt),
    phase: r.phase,
    minutes: Math.round(r.timeUsedSec / 60),
  }));

  const ksbCounts: Record<string, number> = {};
  for (const r of rows) {
    for (const tag of r.ksbTags) {
      ksbCounts[tag] = (ksbCounts[tag] ?? 0) + 1;
    }
  }

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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Rough pace per session (wpm)</h2>
          {hasWpm ? (
            <WpmTrend data={wpmData} />
          ) : (
            <p className="text-sm text-muted">
              No transcript-enabled sessions yet - turn on the live transcript to
              collect pace data.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">
            Distinction answers showing evaluative language
          </h2>
          {flagData.length > 0 ? (
            <FlagRate data={flagData} />
          ) : (
            <p className="text-sm text-muted">
              Needs transcript-enabled sessions that hit distinction-tagged
              questions.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Time used per phase</h2>
          <TimeUsed data={timeData} />
        </section>

        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">KSB coverage</h2>
          <KsbGrid counts={ksbCounts} />
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold">Session history</h2>
        <SessionTable rows={tableRows} />
      </section>
    </div>
  );
}
