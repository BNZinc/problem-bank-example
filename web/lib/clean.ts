import type { ProblemInput } from "./types";

/**
 * Only what the server keeps: blank choices dropped, and each answer number (one or several,
 * "2,4") moved to where its choice ends up — by position, so two choices with the same text are fine.
 */
export function cleanProblem(v: ProblemInput): ProblemInput {
  const choices = v.type === "multiple" ? v.choices.map((c) => c.trim()) : [];
  const newNo: (number | null)[] = [];
  let k = 0;
  for (const c of choices) newNo.push(c ? ++k : null);
  let answer = v.answer.trim();
  if (v.type === "multiple" && answer)
    answer = answer
      .split(",")
      .map((n) => newNo[Number(n.trim()) - 1])
      .filter((n): n is number => typeof n === "number")
      .sort((a, b) => a - b)
      .join(",");
  return { ...v, choices: choices.filter(Boolean), answer, stem: v.stem.trim(), explanation: v.explanation.trim(), grade: v.grade.trim(), source: v.source.trim() };
}
