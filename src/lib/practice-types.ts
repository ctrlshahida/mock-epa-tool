// Shared shapes for scored Practice Mode answers. Plain types only - safe to
// import from the client, the server action and the DB schema.

export type Rating = "met" | "partial" | "not_met";

export interface CriterionVerdict {
  criterionId: string;
  rating: Rating;
  // What the check found in the answer.
  reason: string;
  // What to add to move up a rating; null when already met.
  improve: string | null;
}

export interface Delivery {
  words: number;
  wpm: number | null;
  fillers: number;
  fillersPer100: number;
  star: { situation: boolean; action: boolean; result: boolean };
  firstPerson: number;
  we: number;
  specifics: boolean;
}

export interface AttemptFeedback {
  strengths: string[];
  improvements: string[];
}

export interface AttemptResult {
  id: string | null;
  createdAt: string; // ISO
  questionId: string;
  phase: "discussion" | "project";
  ksbTags: string[];
  answerText: string;
  durationSec: number | null;
  // 0-100 across the criteria this question evidences; null for context
  // questions that evidence none.
  overallScore: number | null;
  verdicts: CriterionVerdict[];
  delivery: Delivery;
  feedback: AttemptFeedback;
}
