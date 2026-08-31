import { KSBS, ksbByCode, distinctionLensFor, PHASE_LABEL, type Phase } from "./ksbs";
import type { SessionRow } from "@/db/schema";

export interface Insight {
  id: string;
  tone: "good" | "warn" | "info";
  text: string;
}

const PHASE_BUDGET_SEC = 3600;
const PHASES: Phase[] = ["discussion", "project"];

// Worded, actionable read of the saved session history - built to answer
// "what should I actually change next time", not just show raw numbers.
export function buildInsights(rows: SessionRow[]): Insight[] {
  const insights: Insight[] = [];
  if (rows.length === 0) return insights;

  const byPhase = (phase: Phase) => rows.filter((r) => r.phase === phase);

  // ---- KSB coverage gaps ----
  const touched = new Set<string>();
  for (const r of rows) for (const t of r.ksbTags) touched.add(t);

  for (const phase of PHASES) {
    const missing = KSBS.filter((k) => k.phase === phase && !touched.has(k.code)).sort(
      (a, b) => Number(b.distinction) - Number(a.distinction),
    );
    if (missing.length === 0) continue;
    const codes = missing.slice(0, 6).map((k) => k.code);
    const more = missing.length - codes.length;
    insights.push({
      id: `gap-${phase}`,
      tone: "warn",
      text: `${PHASE_LABEL[phase]}: you haven't hit ${codes.join(", ")}${
        more > 0 ? ` (+${more} more)` : ""
      } in any saved session yet - steer your next practice toward these.`,
    });
  }

  // ---- Distinction language rate per phase ----
  for (const phase of PHASES) {
    const phaseRows = byPhase(phase).filter((r) => r.distinctionFlagsTotal > 0);
    if (phaseRows.length === 0) continue;
    const hit = phaseRows.reduce((s, r) => s + r.distinctionFlagsHit, 0);
    const total = phaseRows.reduce((s, r) => s + r.distinctionFlagsTotal, 0);
    const rate = hit / total;

    const distinctionCodesTouched = new Set<string>();
    for (const r of phaseRows) {
      for (const t of r.ksbTags) if (ksbByCode.get(t)?.distinction) distinctionCodesTouched.add(t);
    }

    if (rate < 0.6) {
      const tip = [...distinctionCodesTouched]
        .map((c) => distinctionLensFor([c]))
        .find((l): l is string => Boolean(l));
      insights.push({
        id: `distinction-${phase}`,
        tone: "warn",
        text:
          `${PHASE_LABEL[phase]}: only ${hit}/${total} distinction-tagged answers showed ` +
          `evaluative language (compare / because / rather than…).` +
          (tip ? ` Try this next time: ${tip}` : ""),
      });
    } else if (rate >= 0.85) {
      insights.push({
        id: `distinction-${phase}`,
        tone: "good",
        text: `${PHASE_LABEL[phase]}: ${hit}/${total} distinction-tagged answers showed evaluative language - keep comparing and justifying like that.`,
      });
    }
  }

  // ---- Pacing vs the 60-minute budget ----
  for (const phase of PHASES) {
    const phaseRows = byPhase(phase);
    if (phaseRows.length === 0) continue;
    const avgUsed = phaseRows.reduce((s, r) => s + r.timeUsedSec, 0) / phaseRows.length;
    const frac = avgUsed / PHASE_BUDGET_SEC;
    if (frac < 0.6) {
      insights.push({
        id: `pace-${phase}`,
        tone: "info",
        text: `${PHASE_LABEL[phase]}: you're averaging ${Math.round(
          avgUsed / 60,
        )}m of the 60m allowed - that's a lot of time left unused. Try elaborating answers with more examples and comparisons rather than wrapping up early.`,
      });
    } else if (frac > 0.95) {
      insights.push({
        id: `pace-${phase}`,
        tone: "good",
        text: `${PHASE_LABEL[phase]}: you're using close to the full 60 minutes on average, which matches real EPA pacing.`,
      });
    }
  }

  // ---- Filler word trend (earlier sessions vs recent ones) ----
  const fillerRows = rows.filter((r) => r.fillerCount !== null && r.timeUsedSec > 0);
  if (fillerRows.length >= 2) {
    const perMin = (r: SessionRow) => (r.fillerCount ?? 0) / (r.timeUsedSec / 60);
    const half = Math.floor(fillerRows.length / 2);
    const earlier = fillerRows.slice(0, half);
    const later = fillerRows.slice(half);
    const avgEarlier = earlier.reduce((s, r) => s + perMin(r), 0) / earlier.length;
    const avgLater = later.reduce((s, r) => s + perMin(r), 0) / later.length;
    if (avgLater < avgEarlier * 0.8) {
      insights.push({
        id: "filler-trend",
        tone: "good",
        text: `Filler words are trending down - about ${avgEarlier.toFixed(1)}/min in your earlier sessions vs ${avgLater.toFixed(1)}/min more recently.`,
      });
    } else if (avgLater > avgEarlier * 1.2) {
      insights.push({
        id: "filler-trend",
        tone: "warn",
        text: `Filler words are trending up - about ${avgEarlier.toFixed(1)}/min in your earlier sessions vs ${avgLater.toFixed(1)}/min more recently. Worth slowing down and pausing instead of filling the silence.`,
      });
    }
  }

  return insights;
}
