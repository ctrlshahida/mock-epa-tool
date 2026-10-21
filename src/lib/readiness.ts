// Turns saved practice attempts into a projected grading report: per-criterion
// standing, a grade for each assessment method, and the overall EPA grade -
// the same shape as the examiner's Result Statement.

import type { Phase } from "./ksbs";
import { ksbByCode, DISTINCTION_LENS } from "./ksbs";
import {
  CRITERIA,
  METHOD_CODE,
  methodGrade,
  overallGrade,
  type Criterion,
  type Grade,
  type OverallGrade,
} from "./rubric";
import type { CriterionVerdict, Rating } from "./practice-types";

export interface AttemptForReadiness {
  questionId: string;
  createdAt: Date;
  verdicts: CriterionVerdict[];
}

// "untested" = no attempt has ever evidenced this criterion.
export type Standing = Rating | "untested";

export interface CriterionStanding {
  criterion: Criterion;
  standing: Standing;
  // Number of distinct questions that have produced evidence for it.
  questionsAttempted: number;
  // Why the standing is what it is - the verdict reason from the best answer.
  reason: string | null;
  improve: string | null;
}

export interface MethodReadiness {
  phase: Phase;
  grade: Grade;
  pass: CriterionStanding[];
  distinction: CriterionStanding[];
  passMet: number;
  distinctionMet: number;
  untested: number;
}

export interface Readiness {
  methods: Record<Phase, MethodReadiness>;
  overall: OverallGrade;
  attemptCount: number;
}

const ORDER: Record<Standing, number> = { untested: 0, not_met: 1, partial: 2, met: 3 };

export function computeReadiness(attempts: AttemptForReadiness[]): Readiness {
  // Standing reflects what you can do NOW: only the latest attempt at each
  // question counts, so a bad early answer doesn't haunt you once you've
  // fixed it. A criterion takes the best verdict across those latest answers.
  const latest = new Map<string, AttemptForReadiness>();
  for (const a of attempts) {
    const prev = latest.get(a.questionId);
    if (!prev || a.createdAt >= prev.createdAt) latest.set(a.questionId, a);
  }

  const best = new Map<
    string,
    { standing: Standing; verdict: CriterionVerdict | null; questions: number }
  >();
  for (const a of latest.values()) {
    for (const v of a.verdicts) {
      const cur = best.get(v.criterionId) ?? { standing: "untested" as Standing, verdict: null, questions: 0 };
      cur.questions += 1;
      if (ORDER[v.rating] > ORDER[cur.standing]) {
        cur.standing = v.rating;
        cur.verdict = v;
      } else if (!cur.verdict) {
        cur.verdict = v;
      }
      best.set(v.criterionId, cur);
    }
  }

  const standingFor = (cr: Criterion): CriterionStanding => {
    const b = best.get(cr.id);
    return {
      criterion: cr,
      standing: b?.standing ?? "untested",
      questionsAttempted: b?.questions ?? 0,
      reason: b?.verdict?.reason ?? null,
      improve: b?.verdict?.improve ?? null,
    };
  };

  const build = (phase: Phase): MethodReadiness => {
    const all = CRITERIA.filter((c) => c.method === phase).map(standingFor);
    const pass = all.filter((s) => s.criterion.level === "pass");
    const distinction = all.filter((s) => s.criterion.level === "distinction");
    const passMet = pass.filter((s) => s.standing === "met").length;
    const distinctionMet = distinction.filter((s) => s.standing === "met").length;
    return {
      phase,
      grade: methodGrade(passMet === pass.length, distinctionMet === distinction.length),
      pass,
      distinction,
      passMet,
      distinctionMet,
      untested: all.filter((s) => s.standing === "untested").length,
    };
  };

  const methods = { project: build("project"), discussion: build("discussion") };
  return {
    methods,
    overall: overallGrade(methods.project.grade, methods.discussion.grade),
    attemptCount: attempts.length,
  };
}

// ---------------------------------------------------------------------------
// Examiner-style prose, generated from the standings (the report's
// "Strengths", "Development Opportunities" and "Distinction Focus").
// ---------------------------------------------------------------------------

function codes(list: CriterionStanding[]): string {
  return list.map((s) => s.criterion.ksbs.join("/")).join(", ");
}

export interface ReportFeedback {
  strengths: string[];
  development: string[];
  distinctionFocus: string[];
}

export function reportFeedback(r: Readiness): ReportFeedback {
  const strengths: string[] = [];
  const development: string[] = [];
  const distinctionFocus: string[] = [];

  for (const phase of ["project", "discussion"] as Phase[]) {
    const m = r.methods[phase];
    const tag = METHOD_CODE[phase];

    const secured = m.pass.filter((s) => s.standing === "met");
    if (secured.length > 0) {
      strengths.push(`${tag}: ${secured.length} of ${m.pass.length} pass criteria secured (${codes(secured)}).`);
    }

    const weak = m.pass.filter((s) => s.standing === "partial" || s.standing === "not_met");
    if (weak.length > 0) {
      development.push(`${tag}: ${weak.length} pass criteria attempted but not yet secure - ${codes(weak)}. A single unmet pass criterion is a Fail for the method.`);
    }
    const untested = m.pass.filter((s) => s.standing === "untested");
    if (untested.length > 0) {
      development.push(`${tag}: ${untested.length} pass criteria not practised yet - ${codes(untested)}.`);
    }

    for (const s of m.distinction) {
      const label = s.criterion.ksbs.join("/");
      const lens = s.criterion.ksbs.map((k) => DISTINCTION_LENS[k]).find(Boolean);
      if (s.standing === "met") {
        distinctionFocus.push(`${tag} ${label}: evidenced - ${s.criterion.text}`);
      } else if (s.standing === "untested") {
        distinctionFocus.push(`${tag} ${label}: not practised yet. ${lens ?? ""}`.trim());
      } else {
        distinctionFocus.push(
          `${tag} ${label}: not yet sufficient. ${lens ?? s.criterion.text}`,
        );
      }
    }
  }

  if (r.attemptCount === 0) {
    development.push("No practice answers saved yet - answer a question in Practice Mode to start building your projected report.");
  }
  return { strengths, development, distinctionFocus };
}

export function ksbTitle(code: string): string {
  return ksbByCode.get(code)?.title ?? code;
}
