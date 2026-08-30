// Rough self-review heuristics for the live transcript. These are indicators,
// not scores - keep them labelled as such in the UI.

// Evaluative-language heuristic. Run against the transcript slice captured
// between "next question" clicks, only on distinction-tagged questions.
// Flag = did NOT match. Frame as "worth another pass", never as a score.
export const EVALUATIVE_REGEX =
  /\b(compar\w*|trade[- ]?off\w*|altern\w*|because|justif\w*|evaluat\w*|rather than|instead of|chose\b.*\bover\b|weigh\w*)\b/i;

export function hasEvaluativeLanguage(transcriptSlice: string): boolean {
  return EVALUATIVE_REGEX.test(transcriptSlice);
}

const FILLER_REGEX =
  /\b(um+|uh+|erm+|like|you know|sort of|kind of|basically|literally|actually)\b/gi;

export function countFillers(text: string): number {
  return (text.match(FILLER_REGEX) ?? []).length;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Words per minute over the time the transcript was actually running.
export function roughWpm(text: string, elapsedMs: number): number | null {
  const minutes = elapsedMs / 60_000;
  if (minutes < 0.5) return null; // too little speech to be meaningful
  return Math.round(countWords(text) / minutes);
}
