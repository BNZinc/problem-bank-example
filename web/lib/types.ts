export const SUBJECTS = ["국어", "영어", "수학", "과학", "사회", "기타"] as const;
export type Subject = (typeof SUBJECTS)[number];
export const TYPES = ["multiple", "short", "essay", "ox"] as const;
export type ProblemType = (typeof TYPES)[number];
export const TYPE_LABEL: Record<ProblemType, string> = { multiple: "객관식", short: "단답형", essay: "서술형", ox: "O/X" };
export const DIFF_LABEL = ["", "아주 쉬움", "쉬움", "보통", "어려움", "아주 어려움"];
export const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥"];

export type ProblemInput = {
  subject: Subject;
  grade: string;
  type: ProblemType;
  difficulty: number;
  stem: string;
  choices: string[];
  answer: string;
  explanation: string;
  tags: string[];
  source: string;
};
export type Problem = ProblemInput & { id: number; createdAt: string; updatedAt: string };
export type Draft = ProblemInput & { answerFrom: "source" | "ai" | "none"; check: string[] };
export type Page<T> = { items: T[]; total: number; page: number; size: number };
export type Facets = { total: number; subject: { key: string; n: number }[]; type: { key: string; n: number }[]; difficulty: { key: string; n: number }[]; tags: { key: string; n: number }[] };
export type Worksheet = { id: number; title: string; subtitle: string; problemIds: number[]; withAnswers: boolean; columns: 1 | 2; createdAt: string; updatedAt: string };
export type WorksheetFull = Worksheet & { problems: Problem[] };
export type AiStatus = { enabled: true; provider: string; model: string } | { enabled: false; message: string };

export const emptyProblem = (): ProblemInput => ({ subject: "수학", grade: "", type: "multiple", difficulty: 3, stem: "", choices: ["", "", "", "", ""], answer: "", explanation: "", tags: [], source: "" });

/** How an answer reads: "③", "O", or the text. */
export function answerText(p: Pick<ProblemInput, "type" | "answer">): string {
  if (!p.answer) return "";
  if (p.type === "multiple") return p.answer.split(",").map((n) => CIRCLED[Number(n) - 1] ?? n).join(", ");
  return p.answer;
}
