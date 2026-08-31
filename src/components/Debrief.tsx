"use client";

import { useState } from "react";
import Link from "next/link";
import { saveSession, type PhaseResult } from "@/app/actions";
import { PHASE_LABEL } from "@/lib/ksbs";

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function Debrief({
  results,
  onNotesChange,
}: {
  results: PhaseResult[];
  onNotesChange: (phase: PhaseResult["phase"], notes: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await saveSession(results);
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "Save failed.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tightest">Debrief</h1>
      {results.length === 0 && (
        <p className="text-sm text-muted">
          No phase ran long enough to record anything.
        </p>
      )}
      {results.map((r) => (
        <section
          key={r.phase}
          className="border border-border bg-surface p-5"
        >
          <h2 className="font-semibold">{PHASE_LABEL[r.phase]}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Time used</dt>
              <dd className="tabular-nums">{fmtDuration(r.timeUsedSec)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Questions covered</dt>
              <dd className="tabular-nums">{r.questionsCovered}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">KSBs touched</dt>
              <dd className="tabular-nums">{r.ksbTags.length}</dd>
            </div>
            {r.wpm !== null && (
              <div>
                <dt className="text-xs text-muted">Rough pace</dt>
                <dd className="tabular-nums">~{r.wpm} wpm</dd>
              </div>
            )}
            {r.fillerCount !== null && (
              <div>
                <dt className="text-xs text-muted">Rough filler count</dt>
                <dd className="tabular-nums">~{r.fillerCount}</dd>
              </div>
            )}
            {r.distinctionFlagsTotal > 0 && (
              <div>
                <dt className="text-xs text-muted">
                  Distinction answers with eval language
                </dt>
                <dd className="tabular-nums">
                  {r.distinctionFlagsHit}/{r.distinctionFlagsTotal}
                </dd>
              </div>
            )}
          </dl>
          {(r.wpm !== null || r.fillerCount !== null) && (
            <p className="mt-2 text-xs text-muted">
              Pace and filler numbers are rough self-review indicators from the
              live transcript, not measurements.
            </p>
          )}
          <label className="mt-4 block text-xs text-muted">
            Notes for this phase
            <textarea
              value={r.notes ?? ""}
              onChange={(e) => onNotesChange(r.phase, e.target.value)}
              rows={3}
              className="mt-1 w-full border border-border bg-surface-2 p-2 text-sm text-foreground"
              placeholder="What to work on next time…"
            />
          </label>
        </section>
      ))}

      <div className="flex items-center gap-4">
        {results.length > 0 && !saved && (
          <button
            onClick={save}
            disabled={saving}
            className="bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save session"}
          </button>
        )}
        {saved && <span className="text-sm font-medium">Saved.</span>}
        <Link href="/dashboard" className="text-sm text-accent underline">
          Go to dashboard
        </Link>
        <Link href="/" className="text-sm text-muted underline">
          Back to start
        </Link>
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
    </div>
  );
}
