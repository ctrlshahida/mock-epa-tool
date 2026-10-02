import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// One row per completed phase (a full simulation writes two rows:
// one 'discussion', one 'project'). The comfort break is not persisted.
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  phase: text("phase").notNull(), // 'discussion' | 'project'
  ksbTags: text("ksb_tags").array().notNull().default([]),
  timeUsedSec: integer("time_used_sec").notNull(),
  questionsCovered: integer("questions_covered").notNull(),
  wpm: integer("wpm"),
  fillerCount: integer("filler_count"),
  distinctionFlagsHit: integer("distinction_flags_hit").notNull().default(0),
  distinctionFlagsTotal: integer("distinction_flags_total").notNull().default(0),
  notes: text("notes"),
});

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;

// One row per question drafted in untimed Practice Mode. Keyed by the
// question's own id (e.g. "d18", "p25d") rather than a generated uuid, since
// each question has at most one draft and we always want to upsert by id.
export const prepNotes = pgTable("prep_notes", {
  questionId: text("question_id").primaryKey(),
  text: text("text").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PrepNoteRow = typeof prepNotes.$inferSelect;
