import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type {
  AttemptFeedback,
  CriterionVerdict,
  Delivery,
} from "../lib/practice-types";

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

// One row per scored answer in Practice Mode. Unlike prep_notes (one draft per
// question, overwritten), every attempt is kept so progress over time shows on
// the dashboard. verdicts holds the per-criterion ratings against the grading
// report (see lib/rubric.ts); the dashboard's projected grade is computed from
// the latest attempt per question.
export const practiceAttempts = pgTable("practice_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  questionId: text("question_id").notNull(),
  phase: text("phase").notNull(), // 'discussion' | 'project'
  ksbTags: text("ksb_tags").array().notNull().default([]),
  answerText: text("answer_text").notNull(),
  durationSec: integer("duration_sec"),
  wordCount: integer("word_count").notNull(),
  overallScore: integer("overall_score"), // 0-100; null for context questions
  verdicts: jsonb("verdicts").$type<CriterionVerdict[]>().notNull(),
  delivery: jsonb("delivery").$type<Delivery>().notNull(),
  feedback: jsonb("feedback").$type<AttemptFeedback>().notNull(),
});

export type PracticeAttemptRow = typeof practiceAttempts.$inferSelect;
