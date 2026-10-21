"use server";

import { revalidatePath } from "next/cache";
import { getDb, hasDb } from "@/db";
import { practiceAttempts } from "@/db/schema";
import { DISCUSSION_QUESTIONS, PROJECT_QUESTIONS } from "@/lib/questions";
import { scoreAnswer } from "@/lib/scoring";
import type { AttemptResult } from "@/lib/practice-types";

const MAX_ANSWER_CHARS = 20_000;
const MIN_WORDS = 5;

export type ScoreResponse =
  | { ok: true; result: AttemptResult; saved: boolean; saveError?: string }
  | { ok: false; error: string };

// Scores a Practice Mode answer against the grading-report criteria its
// question evidences, then stores the attempt so the dashboard's projected
// grade can use it. Scoring is local (no external calls) and always returns;
// a database problem only affects `saved`.
export async function scoreAndSaveAnswer(input: {
  questionId: string;
  answerText: string;
  durationSec: number | null;
}): Promise<ScoreResponse> {
  // Tags/phase come from the server's own question bank, not the client.
  const question = [...DISCUSSION_QUESTIONS, ...PROJECT_QUESTIONS].find(
    (q) => q.id === input.questionId,
  );
  if (!question) return { ok: false, error: "Unknown question." };

  const answerText = input.answerText.trim().slice(0, MAX_ANSWER_CHARS);
  if (answerText.split(/\s+/).filter(Boolean).length < MIN_WORDS) {
    return { ok: false, error: "Answer is too short to score - say or type a few sentences first." };
  }
  const durationSec =
    input.durationSec !== null && input.durationSec > 0 ? Math.round(input.durationSec) : null;

  const scored = scoreAnswer(question, answerText, durationSec);
  const result: AttemptResult = {
    id: null,
    createdAt: new Date().toISOString(),
    questionId: question.id,
    phase: question.phase,
    ksbTags: question.tags,
    answerText,
    durationSec,
    ...scored,
  };

  if (!hasDb()) {
    return {
      ok: true,
      result,
      saved: false,
      saveError: "No database configured (DATABASE_URL missing) - scored but not saved.",
    };
  }

  try {
    const [row] = await getDb()
      .insert(practiceAttempts)
      .values({
        questionId: question.id,
        phase: question.phase,
        ksbTags: question.tags,
        answerText,
        durationSec,
        wordCount: scored.delivery.words,
        overallScore: scored.overallScore,
        verdicts: scored.verdicts,
        delivery: scored.delivery,
        feedback: scored.feedback,
      })
      .returning({ id: practiceAttempts.id, createdAt: practiceAttempts.createdAt });
    revalidatePath("/dashboard");
    return {
      ok: true,
      result: { ...result, id: row.id, createdAt: row.createdAt.toISOString() },
      saved: true,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save attempt.";
    const missingTable = /relation .*practice_attempts.* does not exist/i.test(message);
    return {
      ok: true,
      result,
      saved: false,
      saveError: missingTable
        ? "Scored, but the practice_attempts table doesn't exist yet - run `npm run db:push`."
        : `Scored, but saving failed: ${message}`,
    };
  }
}
