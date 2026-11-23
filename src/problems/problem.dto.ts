import { z } from "zod";
import { PROBLEM_TYPES, SUBJECTS } from "../db/schema.js";

const tag = z.string().trim().min(1).max(20);

/** One problem as the screen sends it (new or edited). Checked the same way for AI drafts. */
export const ProblemInput = z
  .object({
    subject: z.enum(SUBJECTS),
    grade: z.string().trim().max(20).default(""),
    type: z.enum(PROBLEM_TYPES),
    difficulty: z.coerce.number().int().min(1).max(5).default(3),
    stem: z.string().trim().min(1, "문제 내용을 적어 주세요").max(5000),
    choices: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
    answer: z.string().trim().max(2000).default(""),
    explanation: z.string().trim().max(5000).default(""),
    tags: z.array(tag).max(10).default([]),
    source: z.string().trim().max(100).default(""),
  })
  .superRefine((p, ctx) => {
    if (p.type === "multiple") {
      if (p.choices.length < 2) ctx.addIssue({ code: "custom", path: ["choices"], message: "객관식은 보기가 2개 이상 있어야 해요" });
      if (p.answer && !/^[1-6](\s*,\s*[1-6])*$/.test(p.answer)) ctx.addIssue({ code: "custom", path: ["answer"], message: "객관식 정답은 보기 번호(예: 3)로 적어 주세요" });
      else if (p.answer && p.answer.split(",").some((n) => Number(n) > p.choices.length)) ctx.addIssue({ code: "custom", path: ["answer"], message: "정답 번호가 보기 수보다 커요" });
    } else if (p.choices.length) {
      ctx.addIssue({ code: "custom", path: ["choices"], message: "보기는 객관식에만 있어요" });
    }
    if (p.type === "ox" && p.answer && !/^[OX]$/.test(p.answer)) ctx.addIssue({ code: "custom", path: ["answer"], message: "O/X 문제의 정답은 O 또는 X예요" });
  })
  .transform((p) => ({ ...p, tags: [...new Set(p.tags.map((t) => t.replace(/^#/, "")))] }));
export type ProblemInput = z.infer<typeof ProblemInput>;

export const ProblemBulk = z.object({ problems: z.array(ProblemInput).min(1).max(50) });
export type ProblemBulk = z.infer<typeof ProblemBulk>;

/** A query value given once ("수학"), comma-separated ("수학,과학") or repeated (?subject=a&subject=b). */
const split = (v: unknown) => (v === undefined ? [] : (Array.isArray(v) ? v : String(v).split(",")).map((x) => String(x).trim()).filter(Boolean));
const list = <T extends z.ZodType>(item: T) => z.preprocess(split, z.array(item).max(50));

export const ProblemQuery = z.object({
  q: z.string().trim().max(100).optional(),
  subject: list(z.enum(SUBJECTS)),
  type: list(z.enum(PROBLEM_TYPES)),
  difficulty: list(z.coerce.number().int().min(1).max(5)),
  tag: z.string().trim().max(20).optional(),
  ids: list(z.coerce.number().int().positive()),
  sort: z.enum(["new", "old", "easy", "hard"]).default("new"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProblemQuery = z.infer<typeof ProblemQuery>;
