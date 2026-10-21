import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, hasDb } from "@/db";
import {
  practiceAttempts,
  sessions,
  type PracticeAttemptRow,
  type SessionRow,
} from "@/db/schema";
import { KSBS, type Phase } from "@/lib/ksbs";
import { buildInsights } from "@/lib/insights";
import { DISCUSSION_QUESTIONS, PROJECT_QUESTIONS } from "@/lib/questions";
import { computeReadiness } from "@/lib/readiness";
import type { AttemptResult } from "@/lib/practice-types";
import KsbGrid from "@/components/KsbGrid";
import Insights from "@/components/Insights";
import StatRow, { type Stat } from "@/components/StatRow";
import SessionTable, { type SessionTableRow } from "@/components/SessionTable";
import ReadinessReport from "@/components/ReadinessReport";
import AttemptsTable, { type AttemptTableRow } from "@/components/AttemptsTable";

export const dynamic = "force-dynamic";

const GRADE_LABEL = {
  fail: "Fail",
  pass: "Pass",
  merit: "Merit",
  distinction: "Distinction",
} as const;

const questionTextById = new Map(
  [...DISCUSSION_QUESTIONS, ...PROJECT_QUESTIONS].map((q) => [q.id, q.text]),
);

function toAttemptResult(r: PracticeAttemptRow): AttemptResult {
  return {
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    questionId: r.questionId,
    phase: r.phase as Phase,
    ksbTags: r.ksbTags,
    answerText: r.answerText,
    durationSec: r.durationSec,
    overallScore: r.overallScore,
    verdicts: r.verdicts,
    delivery: r.delivery,
    feedback: r.feedback,
  };
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

  // Kept separate from the sessions read so a missing practice_attempts table
  // (schema not pushed yet) degrades to a notice instead of breaking the page.
  let attempts: PracticeAttemptRow[] = [];
  let attemptsError: string | null = null;
  try {
    attempts = await getDb()
      .select()
      .from(practiceAttempts)
      .orderBy(asc(practiceAttempts.createdAt));
  } catch {
    attemptsError =
      "Couldn't read practice answers - run `npm run db:push` to create the practice_attempts table.";
  }

  if (rows.length === 0 && attempts.length === 0) {
    return (
      <div className="mx-auto max-w-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-muted">
          Nothing saved yet - score an answer in{" "}
          <Link href="/session?mode=prep" className="text-accent underline">
            Practice Mode
          </Link>{" "}
          to see your projected grade here, or run a timed session and save it
          from the debrief screen.
        </p>
        {attemptsError && <p className="mt-3 text-sm text-warn">{attemptsError}</p>}
      </div>
    );
  }

  const readiness = computeReadiness(
    attempts.map((a) => ({
      questionId: a.questionId,
      createdAt: a.createdAt,
      verdicts: a.verdicts,
    })),
  );
  const totalPass =
    readiness.methods.project.pass.length + readiness.methods.discussion.pass.length;
  const passMet = readiness.methods.project.passMet + readiness.methods.discussion.passMet;

  const ksbCounts: Record<string, number> = {};
  for (const r of rows) {
    for (const tag of r.ksbTags) ksbCounts[tag] = (ksbCounts[tag] ?? 0) + 1;
  }
  for (const a of attempts) {
    for (const tag of a.ksbTags) ksbCounts[tag] = (ksbCounts[tag] ?? 0) + 1;
  }

  const distinctionRows = rows.filter((r) => r.distinctionFlagsTotal > 0);
  const distinctionHit = distinctionRows.reduce((s, r) => s + r.distinctionFlagsHit, 0);
  const distinctionTotal = distinctionRows.reduce((s, r) => s + r.distinctionFlagsTotal, 0);

  const stats: Stat[] = [
    {
      label: "Projected EPA grade",
      value: attempts.length > 0 ? GRADE_LABEL[readiness.overall] : "-",
    },
    {
      label: "Pass criteria secured",
      value: attempts.length > 0 ? `${passMet}/${totalPass}` : "-",
    },
    { label: "Practice answers", value: String(attempts.length) },
    { label: "Sessions saved", value: String(rows.length) },
    { label: "KSB coverage", value: `${Object.keys(ksbCounts).length}/${KSBS.length}` },
    {
      label: "Distinction hit-rate",
      value: distinctionTotal > 0 ? `${Math.round((distinctionHit / distinctionTotal) * 100)}%` : "-",
    },
  ];

  const sessionTableRows: SessionTableRow[] = [...rows].reverse().map((r) => ({
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

  const attemptTableRows: AttemptTableRow[] = [...attempts]
    .reverse()
    .slice(0, 50)
    .map((a) => ({
      result: toAttemptResult(a),
      questionText: questionTextById.get(a.questionId) ?? a.questionId,
    }));

  const insights = rows.length > 0 ? buildInsights(rows) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold tracking-tightest">Dashboard</h1>

      <StatRow stats={stats} />

      {attemptsError && (
        <p className="border border-warn/40 bg-warn/10 p-3 text-sm">{attemptsError}</p>
      )}

      {attempts.length > 0 ? (
        <ReadinessReport readiness={readiness} />
      ) : (
        !attemptsError && (
          <section className="border border-border bg-surface p-5 text-sm">
            <h2 className="text-lg font-bold tracking-tight">Projected grading report</h2>
            <p className="mt-2 text-muted">
              Answer questions in{" "}
              <Link href="/session?mode=prep" className="text-accent underline">
                Practice Mode
              </Link>{" "}
              and each answer is scored against the grading report&apos;s pass and
              distinction criteria. Your projected AM1 / AM2 / overall grade
              builds up here.
            </p>
          </section>
        )
      )}

      {attempts.length > 0 && (
        <section className="border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Practice Answers</h2>
          <AttemptsTable rows={attemptTableRows} />
        </section>
      )}

      {rows.length > 0 && (
        <section className="border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Suggestions</h2>
          <Insights items={insights} />
        </section>
      )}

      <section className="border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold">KSB Coverage</h2>
        <KsbGrid counts={ksbCounts} />
      </section>

      {rows.length > 0 && (
        <section className="border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Session History</h2>
          <SessionTable rows={sessionTableRows} />
        </section>
      )}
    </div>
  );
}
