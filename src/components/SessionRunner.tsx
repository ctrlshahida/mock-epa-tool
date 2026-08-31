"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  distinctionLensFor,
  isDistinctionTagged,
  ksbByCode,
  PHASE_LABEL,
  type Phase,
} from "@/lib/ksbs";
import { bankFor, shuffle, type Question } from "@/lib/questions";
import {
  countFillers,
  hasEvaluativeLanguage,
  roughWpm,
} from "@/lib/analysis";
import type { PhaseResult } from "@/app/actions";
import { useSpeech } from "./useSpeech";
import CameraPanel from "./CameraPanel";
import Debrief from "./Debrief";

type StepKind = Phase | "break";

interface Step {
  kind: StepKind;
  durationSec: number;
}

const STEP_LABEL: Record<StepKind, string> = {
  discussion: PHASE_LABEL.discussion,
  break: "Comfort Break",
  project: PHASE_LABEL.project,
};

const TIMEOUT_GRACE_SEC = 15;

function planFor(mode: string): Step[] {
  const discussion: Step = { kind: "discussion", durationSec: 60 * 60 };
  const project: Step = { kind: "project", durationSec: 60 * 60 };
  const comfortBreak: Step = { kind: "break", durationSec: 30 * 60 };
  if (mode === "discussion") return [discussion];
  if (mode === "project") return [project];
  return [discussion, comfortBreak, project];
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PhaseAccumulator {
  questionsCovered: number;
  ksbTags: Set<string>;
  flagsHit: number;
  flagsTotal: number;
  transcriptStartIdx: number;
}

function freshAccumulator(startIdx: number): PhaseAccumulator {
  return {
    questionsCovered: 0,
    ksbTags: new Set(),
    flagsHit: 0,
    flagsTotal: 0,
    transcriptStartIdx: startIdx,
  };
}

export default function SessionRunner() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "full";
  const cameraOn = params.get("camera") === "1";
  const transcriptOn = params.get("transcript") === "1";

  const plan = useMemo(() => planFor(mode), [mode]);
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const step = plan[stepIndex];

  // ----- timer -----
  const [elapsed, setElapsed] = useState(0);
  const [extension, setExtension] = useState(0);
  const [paused, setPaused] = useState(false);
  const [graceLeft, setGraceLeft] = useState(TIMEOUT_GRACE_SEC);
  const remaining = step ? step.durationSec + extension - elapsed : 0;
  // Derived, not stored state - "hit zero" is fully a function of remaining.
  const timedOut = Boolean(step) && !finished && remaining <= 0;

  // ----- questions -----
  const [deck, setDeck] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const question: Question | undefined = deck[qIndex];
  // Real value is set on mount/next-question (an event/effect, not render) -
  // Date.now() itself must never run during render.
  const questionShownAtRef = useRef(0);

  // ----- speech -----
  const speech = useSpeech(transcriptOn);
  // State, not a ref: it's read during render for the live-transcript panel,
  // and refs can't be read during render.
  const [sliceStart, setSliceStart] = useState(0);

  // ----- per-phase results -----
  const accRef = useRef<PhaseAccumulator>(freshAccumulator(0));
  const [results, setResults] = useState<PhaseResult[]>([]);
  const [notes, setNotes] = useState<Record<Phase, string>>({
    discussion: "",
    project: "",
  });
  const [lastAnswerFlag, setLastAnswerFlag] = useState<string | null>(null);
  // Mirrors accRef.current.questionsCovered for display - refs can't be
  // read during render.
  const [questionNumber, setQuestionNumber] = useState(1);

  // Reset local per-phase state when the phase changes - adjusting state
  // during render (React's documented alternative to an Effect for this)
  // rather than an Effect, since this is a pure reset, not a side effect.
  const [prevStepIndex, setPrevStepIndex] = useState(-1);
  if (step && stepIndex !== prevStepIndex) {
    setPrevStepIndex(stepIndex);
    setElapsed(0);
    setExtension(0);
    setPaused(false);
    setLastAnswerFlag(null);
    if (step.kind !== "break") {
      setDeck(shuffle(bankFor(step.kind)));
      setQIndex(0);
      setQuestionNumber(1);
      setSliceStart(speech.finalText.length);
    }
  }

  // Reset the grace countdown whenever we freshly enter a timed-out state -
  // same render-time-adjustment pattern as above.
  const [wasTimedOut, setWasTimedOut] = useState(false);
  if (timedOut !== wasTimedOut) {
    setWasTimedOut(timedOut);
    if (timedOut) setGraceLeft(TIMEOUT_GRACE_SEC);
  }

  // Side effects that must not run during render: refs and the external Web
  // Speech API.
  useEffect(() => {
    if (!step) return;
    if (step.kind !== "break") {
      questionShownAtRef.current = Date.now();
      accRef.current = freshAccumulator(speech.finalText.length);
      if (transcriptOn) speech.start();
    } else {
      speech.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Countdown tick.
  useEffect(() => {
    if (!step || finished || paused || timedOut) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [step, finished, paused, timedOut]);

  const currentSlice = useCallback((): string => {
    return (
      speech.finalText.slice(sliceStart) + " " + speech.interim
    ).trim();
  }, [speech.finalText, speech.interim, sliceStart]);

  // Score the answer just given (if the question was distinction-tagged) and
  // fold its KSB tags into the phase accumulator.
  const closeOutQuestion = useCallback(
    (q: Question, countIt: boolean) => {
      const acc = accRef.current;
      if (!countIt) return;
      acc.questionsCovered += 1;
      setQuestionNumber(acc.questionsCovered + 1);
      q.tags.forEach((t) => acc.ksbTags.add(t));
      if (transcriptOn && isDistinctionTagged(q.tags)) {
        const slice = currentSlice();
        acc.flagsTotal += 1;
        if (hasEvaluativeLanguage(slice)) {
          acc.flagsHit += 1;
          setLastAnswerFlag(null);
        } else {
          const codes = q.tags
            .filter((t) => ksbByCode.get(t)?.distinction)
            .join(", ");
          const lens = distinctionLensFor(q.tags);
          setLastAnswerFlag(
            `That ${codes} answer didn't show evaluative language (compare / because / rather than…) - worth another pass.` +
              (lens ? ` Add this: ${lens}` : ""),
          );
        }
      }
      setSliceStart(speech.finalText.length);
    },
    [transcriptOn, currentSlice, speech.finalText.length],
  );

  const nextQuestion = () => {
    if (!question) return;
    closeOutQuestion(question, true);
    questionShownAtRef.current = Date.now();
    if (qIndex + 1 >= deck.length) {
      // Bank exhausted - reshuffle and go again.
      setDeck(shuffle(bankFor(step.kind as Phase)));
      setQIndex(0);
    } else {
      setQIndex(qIndex + 1);
    }
  };

  const finalizePhase = useCallback(() => {
    if (!step) return;
    if (step.kind !== "break") {
      // Count the on-screen question if it was meaningfully engaged with.
      const secondsOnQuestion =
        (Date.now() - questionShownAtRef.current) / 1000;
      const engaged =
        currentSlice().split(/\s+/).filter(Boolean).length >= 5 ||
        secondsOnQuestion > 20;
      if (question && engaged) closeOutQuestion(question, true);

      const acc = accRef.current;
      const timeUsedSec = elapsed;
      let wpm: number | null = null;
      let fillerCount: number | null = null;
      if (transcriptOn) {
        const phaseText = speech.finalText.slice(acc.transcriptStartIdx);
        wpm = roughWpm(phaseText, timeUsedSec * 1000);
        fillerCount = countFillers(phaseText);
      }
      const phase = step.kind;
      setResults((rs) => [
        ...rs.filter((r) => r.phase !== phase),
        {
          phase,
          ksbTags: [...acc.ksbTags],
          timeUsedSec,
          questionsCovered: acc.questionsCovered,
          wpm,
          fillerCount,
          distinctionFlagsHit: acc.flagsHit,
          distinctionFlagsTotal: acc.flagsTotal,
          notes: null, // filled from `notes` state at render/save time
        },
      ]);
    }
    speech.stop();
  }, [step, question, elapsed, transcriptOn, speech, closeOutQuestion, currentSlice]);

  const advancePhase = useCallback(() => {
    finalizePhase();
    if (stepIndex + 1 < plan.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setFinished(true);
    }
  }, [finalizePhase, stepIndex, plan.length]);

  // Auto-advance countdown while the timeout confirmation is up. The tick and
  // the auto-advance both happen inside the timer callback (not the effect
  // body itself), so this only ever calls setState from a callback.
  useEffect(() => {
    if (!timedOut) return;
    const id = setTimeout(() => {
      if (graceLeft <= 1) {
        advancePhase();
      } else {
        setGraceLeft((g) => g - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [timedOut, graceLeft, advancePhase]);

  // ---------------------------------------------------------------- debrief
  if (finished || !step) {
    const withNotes = results
      .sort((a, b) => (a.phase === "discussion" ? -1 : 1) - (b.phase === "discussion" ? -1 : 1))
      .map((r) => ({ ...r, notes: notes[r.phase] || null }));
    return (
      <Debrief
        results={withNotes}
        onNotesChange={(phase, n) => setNotes((old) => ({ ...old, [phase]: n }))}
      />
    );
  }

  // ------------------------------------------------------------------ break
  if (step.kind === "break") {
    return (
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Comfort Break</h1>
        <p className="text-sm text-muted">
          30 minutes between the two assessment methods. Step away from the
          screen.
        </p>
        <div className="text-6xl font-semibold tabular-nums">
          {fmtClock(Math.max(remaining, 0))}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={advancePhase}
            className="border border-transparent bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background"
          >
            Skip break → project questioning
          </button>
        </div>
        {timedOut && (
          <TimeoutOverlay
            stepLabel={STEP_LABEL[step.kind]}
            nextLabel={stepIndex + 1 < plan.length ? STEP_LABEL[plan[stepIndex + 1].kind] : "debrief"}
            graceLeft={graceLeft}
            onContinue={advancePhase}
            onExtend={() => setExtension((x) => x + 120)}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- question phase
  const lens = question ? distinctionLensFor(question.tags) : null;
  const showPortfolio = step.kind === "discussion";
  const hasSidebar = cameraOn || transcriptOn;

  return (
    <div
      className={
        hasSidebar
          ? "grid gap-6 lg:grid-cols-[2fr_1fr]"
          : "mx-auto max-w-3xl"
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight">{STEP_LABEL[step.kind]}</div>
            <span className="bg-accent/15 px-2 py-1 text-xs font-semibold tabular-nums text-accent">
              Question {questionNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-3xl font-bold tabular-nums ${
                remaining < 300 ? "text-warn" : ""
              }`}
            >
              {fmtClock(Math.max(remaining, 0))}
            </span>
            <button
              onClick={() => setPaused((p) => !p)}
              className="border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-ink"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={advancePhase}
              className="border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-ink"
              title="End this phase early"
            >
              End phase
            </button>
          </div>
        </div>

        {question && (
          <section className="border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2">
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
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={nextQuestion}
                className="border border-transparent bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background"
              >
                Next question
              </button>
              {paused && <span className="text-sm text-muted">Paused</span>}
            </div>
          </section>
        )}

        {lastAnswerFlag && (
          <div className="border border-warn/40 bg-warn/10 p-3 text-sm">
            {lastAnswerFlag}
          </div>
        )}

        <label className="block">
          <span className="text-xs text-muted">Notes for this phase</span>
          <textarea
            value={notes[step.kind as Phase]}
            onChange={(e) =>
              setNotes((old) => ({ ...old, [step.kind]: e.target.value }))
            }
            rows={4}
            className="mt-1 w-full border border-border bg-surface p-3 text-sm"
            placeholder="Anything you'd say differently, evidence you forgot to mention…"
          />
        </label>
      </div>

      <div className="space-y-4">
        {cameraOn && <CameraPanel />}
        {transcriptOn && (
          <section className="border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Live transcript</h3>
              <span
                className={`text-xs ${speech.listening ? "text-accent" : "text-muted"}`}
              >
                {speech.supported
                  ? speech.listening
                    ? "listening"
                    : "off"
                  : "not supported in this browser"}
              </span>
            </div>
            {speech.error && (
              <p className="mt-2 text-xs text-warn">{speech.error}</p>
            )}
            <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-muted">
              {currentSlice() || "…"}
            </p>
            <p className="mt-2 text-[11px] text-muted">
              Rough captions of the current answer. On distinction-tagged
              questions this slice is checked for evaluative language when you
              hit &quot;next&quot; - an indicator, not a score.
            </p>
          </section>
        )}
      </div>

      {timedOut && (
        <TimeoutOverlay
          stepLabel={STEP_LABEL[step.kind]}
          nextLabel={
            stepIndex + 1 < plan.length
              ? STEP_LABEL[plan[stepIndex + 1].kind]
              : "debrief"
          }
          graceLeft={graceLeft}
          onContinue={advancePhase}
          onExtend={() => setExtension((x) => x + 120)}
        />
      )}
    </div>
  );
}

function PortfolioPanel() {
  const src = "/portfolio.pdf#view=FitH";
  return (
    <div className="mt-4 border border-border bg-surface-2">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted">
        <span>📄 Portfolio</span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Open in new tab
        </a>
      </div>
      <iframe
        src={src}
        title="Portfolio"
        className="h-[55vh] w-full border-0"
      />
    </div>
  );
}

function TimeoutOverlay({
  stepLabel,
  nextLabel,
  graceLeft,
  onContinue,
  onExtend,
}: {
  stepLabel: string;
  nextLabel: string;
  graceLeft: number;
  onContinue: () => void;
  onExtend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md border border-border bg-surface p-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Time&apos;s up</h2>
        <p className="mt-2 text-sm text-muted">
          {stepLabel} has hit its limit. Moving on to {nextLabel} in{" "}
          <span className="tabular-nums text-foreground">{graceLeft}s</span>.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={onExtend}
            className="border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
          >
            +2 minutes
          </button>
          <button
            onClick={onContinue}
            className="border border-transparent bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background"
          >
            Continue now
          </button>
        </div>
      </div>
    </div>
  );
}
