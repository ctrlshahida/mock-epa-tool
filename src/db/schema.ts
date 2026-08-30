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
