"use server";

import { revalidatePath } from "next/cache";
import { getDb, hasDb } from "@/db";
import { sessions } from "@/db/schema";
import type { Phase } from "@/lib/ksbs";

export interface PhaseResult {
  phase: Phase;
  ksbTags: string[];
  timeUsedSec: number;
  questionsCovered: number;
  wpm: number | null;
  fillerCount: number | null;
  distinctionFlagsHit: number;
  distinctionFlagsTotal: number;
  notes: string | null;
}

// The only write path in the app: called once from the debrief screen with
// one entry per completed phase.
export async function saveSession(
  results: PhaseResult[],
): Promise<{ ok: boolean; error?: string }> {
  if (!hasDb()) {
    return { ok: false, error: "No database configured (DATABASE_URL missing) - session not saved." };
  }
  const rows = results.filter(
    (r) =>
      (r.phase === "discussion" || r.phase === "project") &&
      r.timeUsedSec > 0,
  );
  if (rows.length === 0) {
    return { ok: false, error: "Nothing to save." };
  }
  try {
    await getDb()
      .insert(sessions)
      .values(
        rows.map((r) => ({
          phase: r.phase,
          ksbTags: r.ksbTags,
          timeUsedSec: Math.round(r.timeUsedSec),
          questionsCovered: r.questionsCovered,
          wpm: r.wpm,
          fillerCount: r.fillerCount,
          distinctionFlagsHit: r.distinctionFlagsHit,
          distinctionFlagsTotal: r.distinctionFlagsTotal,
          notes: r.notes,
        })),
      );
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save session." };
  }
}
