import Link from "next/link";
import { PHASE_LABEL, type Phase } from "@/lib/ksbs";
import {
  METHOD_CODE,
  practiceHref,
  type Grade,
  type OverallGrade,
} from "@/lib/rubric";
import {
  reportFeedback,
  type CriterionStanding,
  type MethodReadiness,
  type Readiness,
} from "@/lib/readiness";
import { RatingChip } from "./AttemptResultView";

const METHOD_ORDER: Phase[] = ["project", "discussion"];

function GradeCell({ active, label }: { active: boolean; label: string }) {
  return (
    <td className="px-3 py-3 text-center">
      <span
        className={`inline-flex items-center gap-2 text-xs ${
          active ? "font-bold" : "text-muted"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 border ${
            active ? "border-accent bg-accent" : "border-border"
          }`}
        />
        {label}
      </span>
    </td>
  );
}

function MethodGradeTable({ readiness }: { readiness: Readiness }) {
  const grades: { value: Grade; label: string }[] = [
    { value: "fail", label: "Fail" },
    { value: "pass", label: "Pass" },
    { value: "distinction", label: "Distinction" },
  ];
  const overall: { value: OverallGrade; label: string }[] = [
    { value: "fail", label: "Fail" },
    { value: "pass", label: "Pass" },
    { value: "merit", label: "Merit" },
    { value: "distinction", label: "Distinction" },
  ];
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Assessment method</th>
              <th className="px-3 py-2 text-center font-medium">Fail</th>
              <th className="px-3 py-2 text-center font-medium">Pass</th>
              <th className="px-3 py-2 text-center font-medium">Distinction</th>
              <th className="py-2 pl-3 font-medium">Pass criteria</th>
              <th className="py-2 pl-3 font-medium">Distinction criteria</th>
            </tr>
          </thead>
          <tbody>
            {METHOD_ORDER.map((phase) => {
              const m = readiness.methods[phase];
              return (
                <tr key={phase} className="border-b border-border/60">
                  <td className="py-3 pr-3">
                    <span className="font-mono text-xs text-muted">
                      {METHOD_CODE[phase]}
                    </span>{" "}
                    {PHASE_LABEL[phase].replace(/ \(AM\d\)/, "")}
                  </td>
                  {grades.map((g) => (
                    <GradeCell key={g.value} active={m.grade === g.value} label="" />
                  ))}
                  <td className="py-3 pl-3 tabular-nums">
                    {m.passMet}/{m.pass.length}
                  </td>
                  <td className="py-3 pl-3 tabular-nums">
                    {m.distinctionMet}/{m.distinction.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted">Overall EPA grade</h3>
        <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {overall.map((g) => {
            const active = readiness.overall === g.value;
            return (
              <div
                key={g.value}
                className={`px-4 py-3 text-center text-sm font-semibold ${
                  active ? "bg-accent text-accent-ink" : "bg-surface text-muted"
                }`}
              >
                {g.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CriteriaTable({
  title,
  rows,
}: {
  title: string;
  rows: CriterionStanding[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold text-muted">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">KSB</th>
              <th className="py-2 pr-3 font-medium">Criterion</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.criterion.id} className="border-b border-border/60 align-top">
                <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs">
                  {s.criterion.ksbs.join(", ")}
                </td>
                <td className="py-2 pr-3 text-xs">
                  {s.criterion.text}
                  {s.improve && s.standing !== "met" && (
                    <span className="mt-1 block text-accent">→ {s.improve}</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <RatingChip rating={s.standing} />
                </td>
                <td className="whitespace-nowrap py-2 text-right text-xs">
                  <Link href={practiceHref(s.criterion)} className="text-accent hover:underline">
                    Practise →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MethodDetail({ m }: { m: MethodReadiness }) {
  return (
    <details className="border border-border bg-surface-2" open={m.grade !== "distinction"}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
        {PHASE_LABEL[m.phase]} - criteria
        <span className="ml-3 text-xs font-normal text-muted">
          {m.passMet}/{m.pass.length} pass · {m.distinctionMet}/{m.distinction.length} distinction
          {m.untested > 0 && ` · ${m.untested} not practised`}
        </span>
      </summary>
      <div className="space-y-6 px-4 pb-4">
        <CriteriaTable title="Pass criteria" rows={m.pass} />
        <CriteriaTable title="Distinction criteria ★" rows={m.distinction} />
      </div>
    </details>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
        {items.length > 0 ? (
          items.map((t, i) => <li key={i}>{t}</li>)
        ) : (
          <li className="text-muted">Nothing yet.</li>
        )}
      </ul>
    </div>
  );
}

// The dashboard's projected grading report, laid out like the examiner's
// Result Statement: method grades, overall grade, per-criterion tables, then
// the Strengths / Development Opportunities / Distinction Focus prose.
export default function ReadinessReport({ readiness }: { readiness: Readiness }) {
  const fb = reportFeedback(readiness);
  return (
    <section className="space-y-5 border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Projected grading report</h2>
        <p className="mt-1 text-xs text-muted">
          If you were assessed on your latest answer to each question. Scored
          against the Accelerate People ST0116 criteria: any unmet pass
          criterion is a Fail for that method; a Distinction needs every pass
          and every distinction criterion; one Distinction overall is a Merit.
          Criteria you haven&apos;t practised count as not met. Based on{" "}
          {readiness.attemptCount} saved answer{readiness.attemptCount === 1 ? "" : "s"}.
        </p>
      </div>

      <MethodGradeTable readiness={readiness} />

      <div className="space-y-3">
        {METHOD_ORDER.map((phase) => (
          <MethodDetail key={phase} m={readiness.methods[phase]} />
        ))}
      </div>

      <div className="grid gap-6 border-t border-border pt-5 md:grid-cols-3">
        <FeedbackList title="Strengths" items={fb.strengths} />
        <FeedbackList title="Development opportunities" items={fb.development} />
        <FeedbackList title="Distinction focus" items={fb.distinctionFocus} />
      </div>

      <p className="text-[11px] text-muted">
        Automatic keyword-and-structure scoring - a practice estimate, not an
        examiner&apos;s judgement.
      </p>
    </section>
  );
}
