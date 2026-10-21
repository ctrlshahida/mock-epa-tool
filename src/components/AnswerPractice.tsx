"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { scoreAndSaveAnswer } from "@/app/practice-actions";
import { criteriaForQuestion } from "@/lib/rubric";
import type { Question } from "@/lib/questions";
import type { AttemptResult } from "@/lib/practice-types";
import { countWords } from "@/lib/analysis";
import { useSpeech } from "./useSpeech";
import type { CameraPanelHandle } from "./CameraPanel";
import AttemptResultView from "./AttemptResultView";

export interface ScoredState {
  result: AttemptResult;
  saved: boolean;
  saveError?: string;
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Answer one question out loud (live transcript, optional camera recording) or
// by typing, then score it against the grading-report criteria and save the
// attempt. Mounted with key={question.id}, so each question starts clean.
export default function AnswerPractice({
  question,
  transcriptOn,
  onEnableTranscript,
  cameraOn,
  cameraRef,
  scored,
  onScored,
}: {
  question: Question;
  transcriptOn: boolean;
  onEnableTranscript: () => void;
  cameraOn: boolean;
  cameraRef: RefObject<CameraPanelHandle | null>;
  scored: ScoredState | undefined;
  onScored: (questionId: string, s: ScoredState) => void;
}) {
  const speech = useSpeech(transcriptOn);

  // The answer on screen = typed/edited text + whatever the recogniser has
  // heard since `sliceStart`. Editing (only allowed while not listening) folds
  // the live slice into the typed text, so the two never double up.
  const [typed, setTyped] = useState("");
  const [sliceStart, setSliceStart] = useState(0);
  const [answering, setAnswering] = useState(false);
  const [accumSec, setAccumSec] = useState(0);
  const [segSec, setSegSec] = useState(0);
  const segStartRef = useRef(0);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const live = transcriptOn
    ? (
        speech.finalText.slice(sliceStart) +
        (speech.listening && speech.interim ? " " + speech.interim : "")
      ).trim()
    : "";
  // Not trimmed: the textarea is controlled, so trimming `typed` here would
  // swallow a trailing space as the user types it.
  const answerText = live
    ? typed + (typed && !/\s$/.test(typed) ? " " : "") + live
    : typed;
  const words = countWords(answerText);
  const criteria = criteriaForQuestion(question);
  const canRecord = transcriptOn || cameraOn;

  useEffect(() => {
    if (!answering) return;
    const id = setInterval(
      () => setSegSec(Math.floor((Date.now() - segStartRef.current) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, [answering]);

  // Leaving the question mid-answer must not leave the camera recording.
  useEffect(() => {
    const camera = cameraRef;
    return () => camera.current?.stop();
  }, [cameraRef]);

  const start = () => {
    setError(null);
    setTyped(answerText);
    setSliceStart(speech.finalText.length);
    segStartRef.current = Date.now();
    setSegSec(0);
    setAnswering(true);
    if (transcriptOn) speech.start();
    if (cameraOn) cameraRef.current?.start();
  };

  const stop = () => {
    const seconds = Math.round((Date.now() - segStartRef.current) / 1000);
    setAccumSec((a) => a + seconds);
    setSegSec(0);
    setAnswering(false);
    speech.stop();
    cameraRef.current?.stop();
  };

  const clear = () => {
    setTyped("");
    setSliceStart(speech.finalText.length);
    setAccumSec(0);
    setError(null);
  };

  const score = async () => {
    setScoring(true);
    setError(null);
    try {
      const res = await scoreAndSaveAnswer({
        questionId: question.id,
        answerText,
        durationSec: accumSec > 0 ? accumSec : null,
      });
      if (res.ok) {
        onScored(question.id, { result: res.result, saved: res.saved, saveError: res.saveError });
      } else {
        setError(res.error);
      }
    } catch {
      setError("Scoring failed - check the dev server is running and try again.");
    } finally {
      setScoring(false);
    }
  };

  return (
    <section className="border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Practise this answer</h2>
          <p className="text-xs text-muted">
            {criteria.length > 0
              ? `Scored against ${criteria.length} grading-report ${
                  criteria.length === 1 ? "criterion" : "criteria"
                } (${criteria.filter((c) => c.level === "pass").length} pass, ${
                  criteria.filter((c) => c.level === "distinction").length
                } distinction).`
              : "Context question - it isn't tied to a grading criterion, so it's scored on delivery only."}
          </p>
        </div>
        {!transcriptOn && (
          <button
            onClick={onEnableTranscript}
            className="border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
          >
            Turn on live transcript
          </button>
        )}
        {canRecord && (
          <div className="flex items-center gap-3">
            {answering && (
              <span className="flex items-center gap-1.5 text-xs tabular-nums text-warn">
                <span className="inline-block h-2 w-2 animate-pulse bg-warn" />
                {fmtClock(accumSec + segSec)}
              </span>
            )}
            {!answering && accumSec > 0 && (
              <span className="text-xs tabular-nums text-muted">{fmtClock(accumSec)}</span>
            )}
            {answering ? (
              <button
                onClick={stop}
                className="border border-warn/50 px-4 py-2 text-sm font-semibold text-warn hover:bg-warn/10"
              >
                ■ Stop
              </button>
            ) : (
              <button
                onClick={start}
                className="border border-transparent bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background"
              >
                {answerText ? "● Continue answering" : "● Start answering"}
              </button>
            )}
          </div>
        )}
      </div>

      {transcriptOn && !speech.supported && (
        <p className="mt-3 text-xs text-warn">
          Live transcript isn&apos;t supported in this browser (try Chrome or Edge) -
          type your answer below instead.
        </p>
      )}
      {speech.error && <p className="mt-3 text-xs text-warn">{speech.error}</p>}
      {transcriptOn && (answering || speech.debug.started) && (
        <p className="mt-3 font-mono text-[11px] text-muted">
          speech engine: started {speech.debug.started ? "✓" : "✗"} · mic audio{" "}
          {speech.debug.audio ? "✓" : "✗"} · speech detected{" "}
          {speech.debug.speechDetected ? "✓" : "✗"} · results {speech.debug.results} ·
          restarts {speech.debug.ends} · last error {speech.debug.lastError ?? "none"}
        </p>
      )}
      {transcriptOn && answering && !speech.error && !live && segSec >= 8 && (
        <p className="mt-3 text-xs text-warn">
          Listening, but nothing heard yet. Check the padlock icon in the address
          bar allows the microphone, that the right mic is selected in Windows
          sound settings, and speak a full sentence (captions appear after a
          pause). If it stays blank, type your answer instead.
        </p>
      )}

      <label className="mt-4 block">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {transcriptOn
              ? answering
                ? "Live transcript - listening…"
                : "Your answer (live transcript - edit any mis-heard words before scoring)"
              : "Your answer (type it, or turn on Live transcript to speak it)"}
          </span>
          <span className="tabular-nums">{words} words</span>
        </div>
        <textarea
          value={answerText}
          readOnly={answering}
          onChange={(e) => {
            setTyped(e.target.value);
            setSliceStart(speech.finalText.length);
          }}
          rows={8}
          className="mt-1 w-full border border-border bg-surface-2 p-3 text-sm"
          placeholder={
            transcriptOn
              ? "Press Start answering and speak - your words appear here."
              : "Type how you'd answer this out loud…"
          }
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={score}
          disabled={answering || scoring || words < 5}
          className="border border-transparent bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background disabled:opacity-40"
        >
          {scoring ? "Scoring…" : "Score against grading report"}
        </button>
        <button
          onClick={clear}
          disabled={answering || scoring || (!answerText && accumSec === 0)}
          className="border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-ink disabled:opacity-40"
        >
          Clear answer
        </button>
        {error && <span className="text-xs text-warn">{error}</span>}
      </div>

      {scored && (
        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Result</h3>
            {scored.saved ? (
              <span className="text-xs text-muted">Saved - counts toward your dashboard</span>
            ) : (
              <span className="text-xs text-warn">{scored.saveError ?? "Not saved."}</span>
            )}
          </div>
          <AttemptResultView result={scored.result} />
        </div>
      )}
    </section>
  );
}
