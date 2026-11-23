import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 객관식 · 단답형 · 서술형 · O/X */
export const PROBLEM_TYPES = ["multiple", "short", "essay", "ox"] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

export const SUBJECTS = ["국어", "영어", "수학", "과학", "사회", "기타"] as const;

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

/**
 * A problem in the bank. `workspace`: whose bank it is — "local" on your own computer, or one
 * visitor's own space on the public demo (src/workspace).
 */
export const problems = sqliteTable(
  "problems",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspace: text("workspace").notNull().default("local"),
    subject: text("subject").notNull(),
    grade: text("grade").notNull().default(""),
    type: text("type", { enum: PROBLEM_TYPES }).notNull(),
    /** 1 (쉬움) … 5 (어려움) */
    difficulty: integer("difficulty").notNull().default(3),
    stem: text("stem").notNull(),
    /** 객관식 보기, in order (①②③④⑤ are added on screen). Empty for other types. */
    choices: text("choices", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    /** 객관식: the choice's number ("3"); O/X: "O" or "X"; otherwise the answer text. */
    answer: text("answer").notNull().default(""),
    explanation: text("explanation").notNull().default(""),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    /** Where it came from, in the user's words ("직접 만듦", "3단원 학습지"). */
    source: text("source").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("problems_workspace_idx").on(t.workspace, t.id)],
);

/** A 문제지: an ordered list of problems to print. */
export const worksheets = sqliteTable(
  "worksheets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspace: text("workspace").notNull().default("local"),
    title: text("title").notNull(),
    /** A line under the title: class, date, time limit. */
    subtitle: text("subtitle").notNull().default(""),
    problemIds: text("problem_ids", { mode: "json" }).$type<number[]>().notNull().default(sql`'[]'`),
    /** Print with an answer page at the end. */
    withAnswers: integer("with_answers", { mode: "boolean" }).notNull().default(true),
    /** Two columns on paper. */
    columns: integer("columns").notNull().default(2),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("worksheets_workspace_idx").on(t.workspace, t.id)],
);

/** Public-demo visitors' spaces (DEMO_MODE): when each was last used, so old ones are cleared. */
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(now),
  seenAt: text("seen_at").notNull().default(now),
  /** AI uses today (YYYY-MM-DD:count), for the demo's daily limit. */
  aiDay: text("ai_day").notNull().default(""),
});

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
export type Worksheet = typeof worksheets.$inferSelect;
