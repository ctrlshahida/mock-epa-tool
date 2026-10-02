"use server";

import { eq } from "drizzle-orm";
import { getDb, hasDb } from "@/db";
import { prepNotes } from "@/db/schema";

// Practice Mode's answer-structure drafts. Backed by the database so they
// survive dev-server restarts and port changes, unlike localStorage - if no
// DATABASE_URL is configured these are simply no-ops and the client falls
// back to localStorage on its own.

export async function loadPrepNotes(): Promise<{
  ok: boolean;
  notes: Record<string, string>;
}> {
  if (!hasDb()) return { ok: false, notes: {} };
  const rows = await getDb().select().from(prepNotes);
  const notes: Record<string, string> = {};
  for (const row of rows) notes[row.questionId] = row.text;
  return { ok: true, notes };
}

export async function savePrepNote(
  questionId: string,
  text: string,
): Promise<{ ok: boolean }> {
  if (!hasDb()) return { ok: false };
  if (text.trim() === "") {
    await getDb().delete(prepNotes).where(eq(prepNotes.questionId, questionId));
    return { ok: true };
  }
  await getDb()
    .insert(prepNotes)
    .values({ questionId, text })
    .onConflictDoUpdate({
      target: prepNotes.questionId,
      set: { text, updatedAt: new Date() },
    });
  return { ok: true };
}
