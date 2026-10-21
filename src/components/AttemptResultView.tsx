import { criterionById } from "@/lib/rubric";
import type { AttemptResult, Rating } from "@/lib/practice-types";

export const RATING_COLOR: Record<Rating | "untested", string> = {
  met: "#2fbf71",
  partial: "#e0a526",
  not_met: "var(--warn)",
  untested: "var(--border)",
};

export const RATING_LABEL: Record<Rating | "untested", string> = {
  met: "Met",
  partial: "Partly",
  not_met: "Not met",
  untested: "Not practised",
};

export function RatingChip({ rating }: { rating: Rating | "untested" }) {
  const solid = rating !== "untested";
  return (
    <span
      className="inline-block whitespace-nowrap px-2 py-1 text-[11px] font-semibold"
      style={
        solid
          ? { background: RATING_COLOR[rating], color: "#050505" }
          : { border: "1px solid var(--border)", color: "var(--muted)" }
      }
    >
      {RATING_LABEL[rating]}
    </span>
  );
}

// A scored answer in the examiner's terms: each grading-report criterion the
// question evidences, with a verdict, why, and what to add.
export default function AttemptResultView({ result }: { result: AttemptResult }) {
  const d = result.delivery;
  const verdicts = [...result.verdicts].sort((a, b) => {
    const la = criterionById.get(a.criterionId)?.level === "pass" ? 0 : 1;
    const lb = criterionById.get(b.criterionId)?.level === "pass" ? 0 : 1;
    return la - lb;
  });

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {result.overallScore !== null ? (
          <div>
            <span className="text-3xl font-bold tabular-nums">{result.overallScore}%</span>
            <span className="ml-2 text-xs text-muted">
              of the grading criteria this question evidences
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted">
            Context question - no grading criteria, delivery feedback only
          </span>
        )}
        <span className="text-xs text-muted">
          {d.words} words
          {d.wpm !== null && ` · ~${d.wpm} wpm`} · ~{d.fillers} fillers
        </span>
      </div>

      {verdicts.length > 0 && (
        <ul className="space-y-2">
          {verdicts.map((v) => {
            const cr = criterionById.get(v.criterionId);
            if (!cr) return null;
            return (
              <li key={v.criterionId} className="border border-border bg-surface-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <RatingChip rating={v.rating} />
                  <span className="font-mono text-xs font-semibold">
                    {cr.ksbs.join(" · ")}
                  </span>
                  <span
                    className={`px-2 py-1 text-[11px] font-semibold ${
                      cr.level === "distinction"
                        ? "bg-accent text-accent-ink"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    {cr.level === "distinction" ? "Distinction ★" : "Pass"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">{cr.text}</p>
                <p className="mt-2 text-xs">{v.reason}</p>
                {v.improve && (
                  <p className="mt-1 text-xs text-accent">→ {v.improve}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold">Strengths</h4>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
            {result.feedback.strengths.length > 0 ? (
              result.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li className="text-muted">Nothing stood out yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold">Development opportunities</h4>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
            {result.feedback.improvements.length > 0 ? (
              result.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li className="text-muted">None - nicely done.</li>
            )}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Scored by an automatic keyword-and-structure check against the grading
        report&apos;s criteria - a practice estimate, not an examiner&apos;s
        judgement. It can miss a good answer phrased unusually, so use it to spot
        gaps, not to guarantee a grade.
      </p>
    </div>
  );
}
