"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  distinctionLensFor,
  isDistinctionTagged,
  ksbByCode,
  PHASE_LABEL,
  type Phase,
} from "@/lib/ksbs";
import {
  DISCUSSION_QUESTIONS,
  PROJECT_QUESTIONS,
  shuffle,
  type Question,
} from "@/lib/questions";
import { PortfolioPanel } from "./SessionRunner";
import { loadPrepNotes, savePrepNote } from "@/app/prep-actions";

type PhaseFilter = Phase | "all";
type SyncState = "pending" | "saved" | "offline";

const NOTES_STORAGE_KEY = "epa-prep-notes";
const SAVE_DEBOUNCE_MS = 600;

function scaffoldFor(q: Question): string {
  if (isDistinctionTagged(q.tags)) {
    return "Situation:\nTask:\nAction:\nAlternative I considered / rejected:\nWhy mine was better:\nResult:\n";
  }
  return "Situation:\nTask:\nAction:\nResult:\n";
}

function loadLocalNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalNotes(notes: Record<string, string>) {
  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Best-effort local cache - the database call is what actually matters.
  }
}

const SYNC_LABEL: Record<SyncState, string> = {
  pending: "Saving…",
  saved: "Saved",
  offline: "Not saved - no database configured, kept on this device only",
};

export default function PrepRunner({
  initialPhase,
}: {
  initialPhase?: PhaseFilter;
}) {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>(
    initialPhase ?? "all",
  );
  const [distinctionOnly, setDistinctionOnly] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [syncState, setSyncState] = useState<Record<string, SyncState>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // The database is the durable store; localStorage is only an instant local
  // cache so the page has something to show before the network round-trip
  // resolves. On mount, also push up any drafts that only exist locally
  // (e.g. written before the database was wired up) so they stop being
  // one dev-server-restart away from disappearing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Yield once before touching state, so this reads as synchronizing
      // with an external system (localStorage, then the database) rather
      // than a synchronous setState-in-effect.
      await Promise.resolve();
      if (cancelled) return;
      const local = loadLocalNotes();
      setNotes(local);
      const { ok, notes: dbNotes } = await loadPrepNotes();
      if (cancelled || !ok) return;
      const merged = { ...local, ...dbNotes };
      setNotes(merged);
      saveLocalNotes(merged);
      for (const [id, text] of Object.entries(local)) {
        if (!(id in dbNotes) && text.trim()) savePrepNote(id, text);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const updateNote = (questionId: string, text: string) => {
    setNotes((n) => {
      const next = { ...n, [questionId]: text };
      saveLocalNotes(next);
      return next;
    });
    setSyncState((s) => ({ ...s, [questionId]: "pending" }));
    clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(
      () => flushSave(questionId, text),
      SAVE_DEBOUNCE_MS,
    );
  };

  const flushSave = async (questionId: string, text: string) => {
    clearTimeout(saveTimers.current[questionId]);
    setSyncState((s) => ({ ...s, [questionId]: "pending" }));
    const res = await savePrepNote(questionId, text);
    setSyncState((s) => ({ ...s, [questionId]: res.ok ? "saved" : "offline" }));
  };

  const baseDeck = useMemo(() => {
    const all: Question[] =
      phaseFilter === "all"
        ? [...DISCUSSION_QUESTIONS, ...PROJECT_QUESTIONS]
        : phaseFilter === "discussion"
          ? DISCUSSION_QUESTIONS
          : PROJECT_QUESTIONS;
    const filtered = distinctionOnly
      ? all.filter((q) => isDistinctionTagged(q.tags))
      : all;
    return shuffled ? shuffle(filtered) : filtered;
    // shuffleSeed isn't read above - it exists purely to force a fresh
    // shuffle when "Shuffle" is clicked again while already shuffled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseFilter, distinctionOnly, shuffled, shuffleSeed]);

  // Filters changed the deck out from under the current index - clamp back
  // into range rather than reading undefined.
  if (index >= baseDeck.length && baseDeck.length > 0) {
    setIndex(0);
  }

  const question = baseDeck[Math.min(index, baseDeck.length - 1)];
  const draftedCount = baseDeck.filter((q) => (notes[q.id] ?? "").trim()).length;

  const goTo = (i: number) => {
    if (baseDeck.length === 0) return;
    setIndex(((i % baseDeck.length) + baseDeck.length) % baseDeck.length);
  };

  const setPhase = (p: PhaseFilter) => {
    setPhaseFilter(p);
    setIndex(0);
  };

  const insertScaffold = () => {
    if (!question) return;
    if ((notes[question.id] ?? "").trim()) return;
    updateNote(question.id, scaffoldFor(question));
  };

  const lens = question ? distinctionLensFor(question.tags) : null;
  const showPortfolio = question?.phase === "discussion";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice Mode</h1>
          <p className="text-sm text-muted">
            No clock. Work through questions at your own pace and draft how
            you&apos;d structure each answer.
          </p>
        </div>
        <Link href="/" className="text-sm text-accent hover:underline">
          ← Home
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All"],
              ["discussion", PHASE_LABEL.discussion],
              ["project", PHASE_LABEL.project],
            ] as [PhaseFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPhase(value)}
              className={`border px-3 py-1.5 text-xs font-semibold ${
                phaseFilter === value
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border hover:bg-accent hover:text-accent-ink"
              }`}
            >
              {label}
            </button>
          ))}
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={distinctionOnly}
              onChange={(e) => {
                setDistinctionOnly(e.target.checked);
                setIndex(0);
              }}
            />
            Distinction-tagged only
          </label>
        </div>
        <button
          onClick={() => {
            setShuffled(true);
            setShuffleSeed((s) => s + 1);
            setIndex(0);
          }}
          className="border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-ink"
        >
          Shuffle
        </button>
      </div>

      {baseDeck.length === 0 || !question ? (
        <p className="text-sm text-muted">No questions match this filter.</p>
      ) : (
        <>
          <div className="flex items-center justify-between border border-border bg-surface p-4">
            <span className="text-xs font-semibold tabular-nums text-muted">
              Question {index + 1} of {baseDeck.length}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {draftedCount} of {baseDeck.length} drafted
            </span>
          </div>

          <section className="border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2">
              {question.tags.length === 0 && (
                <span className="bg-surface-2 px-3 py-2 text-xs text-muted">
                  context question
                </span>
              )}
              {question.tags.map((t) => {
                const distinction = ksbByCode.get(t)?.distinction;
                return (
                  <span
                    key={t}
                    title={ksbByCode.get(t)?.title}
                    className={`px-3 py-2 font-mono text-xs ${
                      distinction
                        ? "bg-accent text-accent-ink"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    {t}
                    {distinction ? " ★" : ""}
                  </span>
                );
              })}
            </div>
            {question.tags.length > 0 && (
              <div className="mt-3 space-y-1 border border-border bg-surface-2 p-3 text-sm">
                {question.tags.map((t) => {
                  const ksb = ksbByCode.get(t);
                  if (!ksb) return null;
                  return (
                    <p key={t}>
                      <span className="font-mono font-semibold">{ksb.code}</span>
                      {ksb.distinction ? " ★" : ""}
                      {" - "}
                      {ksb.title}
                    </p>
                  );
                })}
              </div>
            )}
            <p className="mt-4 text-xl leading-relaxed">{question.text}</p>
            {lens && (
              <div className="mt-4 border border-accent/40 bg-accent/10 p-4 text-sm">
                <span className="font-semibold text-accent">
                  Distinction Lens:
                </span>{" "}
                {lens}
              </div>
            )}
            {showPortfolio && <PortfolioPanel />}
          </section>

          <label className="block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Answer structure</span>
              <div className="flex items-center gap-3">
                {syncState[question.id] && (
                  <span
                    className={`text-xs ${
                      syncState[question.id] === "offline"
                        ? "text-warn"
                        : "text-muted"
                    }`}
                  >
                    {SYNC_LABEL[syncState[question.id]]}
                  </span>
                )}
                <button
                  onClick={insertScaffold}
                  className="text-xs text-accent hover:underline"
                >
                  Insert structure prompts
                </button>
              </div>
            </div>
            <textarea
              value={notes[question.id] ?? ""}
              onChange={(e) => updateNote(question.id, e.target.value)}
              rows={10}
              className="mt-1 w-full border border-border bg-surface p-3 text-sm"
              placeholder="Sketch how you'd structure this answer - situation, task, action, result - before you ever say it out loud."
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => flushSave(question.id, notes[question.id] ?? "")}
                className="border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-ink"
              >
                Save now
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <button
              onClick={() => goTo(index - 1)}
              className="border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
            >
              ← Previous
            </button>
            <button
              onClick={() => goTo(index + 1)}
              className="border border-transparent bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background"
            >
              Next question →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
