import { SUBJECTS } from "../db/schema.js";
import { normalizeAnswer, toDraft, type Draft } from "./draft.js";

/**
 * "AI 없이 나누기": splits pasted text into problems by its numbering, without any AI.
 *   1. 문제 …   1) 문제 …   1번. 문제 …   [2] …   Q3. …   문제 4) …
 *   보기: ① 보기 ② 보기 …, or lines "(1) 보기" / "1) 보기" under the question
 *   정답: ③ · 답) H2O · [정답] O        해설: … / 풀이: … / [해설] …
 *   An answer list at the end ("정답" then "1. ③", "2. 24") fills in those problems' answers.
 */
const START = /^\s*(?:문제\s*)?(?:\[(\d{1,3})\]|Q\s*(\d{1,3})\s*[.:)]|(\d{1,3})\s*번\s*[.)．]?|(\d{1,3})\s*([.)．])(?!\d))\s*/i;
/** "정답 ③", "정답: ③", "[정답] ③", "답: H2O", "답) 4" — but not "답을 구하시오" (답 needs a mark after it). */
const ANSWER = /^\s*(?:\[\s*(?:정답|답)\s*\]|정답\s*[:：)]?|답\s*[:：)])\s*(.+)$/;
const EXPLAIN = /^\s*(?:\[\s*(?:해설|풀이)\s*\]|(?:해설|풀이)\s*[:：)])\s*(.*)$/;
/** A heading over an answer list: "정답", "[정답]", "빠른 정답", "정답표". */
const ANSWER_HEAD = /^\s*\[?\s*(?:빠른\s*)?(?:정답|답안|정답\s*표)\s*\]?\s*$/;
const LINE_CHOICE = /^\s*(?:\(([1-6])\)|([1-6])\))\s+(.+)$/;
const CIRCLED = /[①②③④⑤⑥]/;
export const MAX_DRAFTS = 50;

type Block = { no: number | null; lines: string[]; choiceLines: number };

const startNo = (m: RegExpMatchArray) => Number(m[1] ?? m[2] ?? m[3] ?? m[4]);

export function splitProblems(input: string, subject: (typeof SUBJECTS)[number] = "기타"): Draft[] {
  const blocks: Block[] = [];
  let key = false; // inside an answer list
  const keyAnswers = new Map<number, string>();
  for (const line of input.replace(/\r\n?/g, "\n").split("\n")) {
    if (ANSWER_HEAD.test(line)) {
      key = true;
      continue;
    }
    const m = line.match(START);
    const cur = blocks[blocks.length - 1];
    if (key) {
      // "1. ③" "2) 24" "3번 O": an answer for an earlier problem; anything else ends the list.
      if (m && line.replace(START, "").trim()) {
        keyAnswers.set(startNo(m), line.replace(START, "").trim());
        continue;
      }
      if (!line.trim()) continue;
      key = false;
    }
    if (m && !ANSWER.test(line) && !EXPLAIN.test(line)) {
      // "1) 사과" right under a question is its next choice, not a new problem.
      const paren = m[5] === ")" && m[4] !== undefined;
      if (cur && paren && Number(m[4]) === cur.choiceLines + 1 && !CIRCLED.test(cur.lines.join(""))) {
        cur.lines.push(line);
        cur.choiceLines++;
        continue;
      }
      blocks.push({ no: startNo(m), lines: [line.replace(START, "")], choiceLines: 0 });
    } else if (cur) {
      if (LINE_CHOICE.test(line)) cur.choiceLines++;
      cur.lines.push(line);
    } else if (line.trim()) blocks.push({ no: null, lines: [line], choiceLines: 0 });
  }
  const drafts: Draft[] = [];
  for (const b of blocks) {
    const d = parseBlock(b.lines, subject);
    if (!d) continue;
    const fromKey = b.no !== null ? keyAnswers.get(b.no) : undefined;
    if (fromKey && !d.answer) {
      const answer = normalizeAnswer(fromKey, d.type);
      if (answer) {
        d.answer = answer;
        d.answerFrom = "source";
        d.check = d.check.filter((c) => c !== "정답이 비어 있어요");
      }
    }
    drafts.push(d);
  }
  return drafts;
}

function parseBlock(block: string[], subject: (typeof SUBJECTS)[number]): Draft | null {
  const body: string[] = [];
  let answer = "";
  const explanation: string[] = [];
  let explaining = false;
  for (const line of block) {
    const a = line.match(ANSWER);
    const e = line.match(EXPLAIN);
    if (a && !explaining) answer = a[1].trim();
    else if (e) {
      explaining = true;
      if (e[1].trim()) explanation.push(e[1].trim());
    } else if (explaining) explanation.push(line);
    else body.push(line);
  }
  const text = body.join("\n").trim();
  if (!text) return null;
  let stem = text;
  let choices: string[] = [];
  if (CIRCLED.test(text)) {
    const at = text.search(CIRCLED);
    stem = text.slice(0, at).trim();
    choices = text
      .slice(at)
      .split(CIRCLED)
      .map((c) => c.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  } else {
    const kept: string[] = [];
    for (const line of body) {
      const m = line.match(LINE_CHOICE);
      if (m && kept.some((k) => k.trim())) choices.push(m[3].trim());
      else if (!choices.length) kept.push(line);
      else choices[choices.length - 1] += ` ${line.trim()}`;
    }
    if (choices.length >= 2) stem = kept.join("\n").trim();
    else choices = [];
  }
  const ox = /\(\s*[O○]\s*[/,]\s*[X×]\s*\)\s*$/i.test(stem) || /^(O|X|○|×)$/i.test(answer);
  const essay = /서술하시오|과정을\s*쓰시오|설명하시오|이유를\s*쓰시오|논하시오/.test(stem);
  const type = choices.length >= 2 ? "multiple" : ox ? "ox" : essay ? "essay" : "short";
  return toDraft({ stem: stem.replace(/\(\s*[O○]\s*[/,]\s*[X×]\s*\)\s*$/i, "").trim(), choices, answer, explanation: explanation.join("\n").trim(), type, subject, difficulty: 3, answerFrom: answer ? "source" : "none" }, subject, "붙여 넣은 글");
}
