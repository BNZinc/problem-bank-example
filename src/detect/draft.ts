import { PROBLEM_TYPES, SUBJECTS, type ProblemType } from "../db/schema.js";
import { ProblemInput } from "../problems/problem.dto.js";

/** A problem found in a photo, a PDF or pasted text, before the user saves it. */
export type Draft = ProblemInput & {
  /** Where the answer came from: printed in the source, worked out by the AI (check it), or none. */
  answerFrom: "source" | "ai" | "none";
  /** What to check before saving, in plain Korean (empty when it looks complete). */
  check: string[];
};

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩";

/** "③", "3번", "(3)", "3" → "3"; "○", "o" → "O"; "×", "x" → "X". */
export function normalizeAnswer(answer: string, type: ProblemType): string {
  const a = answer.trim();
  if (type === "multiple") {
    const nums = [...a.matchAll(new RegExp(`[${CIRCLED}]|\\d+`, "g"))].map((m) => (CIRCLED.includes(m[0]) ? String(CIRCLED.indexOf(m[0]) + 1) : m[0]));
    return nums.length ? [...new Set(nums)].join(",") : "";
  }
  if (type === "ox") {
    if (/^(o|○|◯|맞음|참|true)$/i.test(a)) return "O";
    if (/^(x|×|✕|틀림|거짓|false)$/i.test(a)) return "X";
  }
  return a;
}

/** Makes any found problem a valid draft: known subject and type, sane numbers, and what to check. */
export function toDraft(raw: Partial<Record<keyof ProblemInput | "answerFrom", unknown>>, fallbackSubject: (typeof SUBJECTS)[number], source: string): Draft {
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const list = (v: unknown, max: number, len: number) => (Array.isArray(v) ? v.map((x) => text(x, len)).filter(Boolean).slice(0, max) : []);
  let choices = list(raw.choices, 6, 500).map((c) => c.replace(new RegExp(`^[${CIRCLED}]\\s*|^\\(?[1-6][.)]\\s+`), "").trim()).filter(Boolean);
  let type = (PROBLEM_TYPES as readonly string[]).includes(raw.type as string) ? (raw.type as ProblemType) : choices.length >= 2 ? "multiple" : "short";
  if (type === "multiple" && choices.length < 2) type = "short";
  if (type !== "multiple") choices = [];
  const subject = (SUBJECTS as readonly string[]).includes(raw.subject as string) ? (raw.subject as (typeof SUBJECTS)[number]) : fallbackSubject;
  const difficulty = Math.min(5, Math.max(1, Math.round(Number(raw.difficulty) || 3)));
  let answer = normalizeAnswer(text(raw.answer, 2000), type);
  const check: string[] = [];
  if (type === "multiple" && answer && answer.split(",").some((n) => Number(n) < 1 || Number(n) > choices.length)) {
    check.push(`정답 번호(${answer})가 보기에 없어요`);
    answer = "";
  }
  if (type === "ox" && answer && !/^[OX]$/.test(answer)) {
    check.push("O/X 정답을 고르세요");
    answer = "";
  }
  const from = raw.answerFrom === "source" || raw.answerFrom === "ai" ? raw.answerFrom : "none";
  const answerFrom = answer ? from === "none" ? "source" : from : "none";
  if (!answer) check.push("정답이 비어 있어요");
  else if (answerFrom === "ai") check.push("AI가 푼 정답이에요. 맞는지 확인해 주세요");
  const stem = text(raw.stem, 5000);
  if (!stem) check.push("문제 내용이 비어 있어요");
  const tags = [...new Set(list(raw.tags, 10, 20).map((t) => t.replace(/^#/, "")))];
  return { subject, grade: text(raw.grade, 20), type, difficulty, stem, choices, answer, explanation: text(raw.explanation, 5000), tags, source: text(source, 100), answerFrom, check };
}
