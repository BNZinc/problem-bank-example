import { describe, expect, it } from "vitest";
import { normalizeAnswer, toDraft } from "./draft.js";
import { splitProblems } from "./split.js";

describe("AI 없이 나누기", () => {
  it("splits numbered problems with circled choices, answers and explanations", () => {
    const text = [
      "1. 다음 중 짝수는? ① 3 ② 5 ③ 8 ④ 9",
      "정답: ③",
      "해설: 8은 2로 나누어떨어져요.",
      "2) 물의 화학식을 쓰시오.",
      "답: H2O",
      "[3] 지구는 태양 주위를 돈다. (O/X)",
      "정답 O",
      "4. 광합성이 일어나는 과정을 설명하시오.",
    ].join("\n");
    const d = splitProblems(text, "과학");
    expect(d.map((x) => x.type)).toEqual(["multiple", "short", "ox", "essay"]);
    expect(d[0]).toMatchObject({ stem: "다음 중 짝수는?", choices: ["3", "5", "8", "9"], answer: "3", explanation: "8은 2로 나누어떨어져요.", subject: "과학", answerFrom: "source" });
    expect(d[1]).toMatchObject({ stem: "물의 화학식을 쓰시오.", answer: "H2O" });
    expect(d[2]).toMatchObject({ stem: "지구는 태양 주위를 돈다.", answer: "O" });
    expect(d[3].answer).toBe("");
    expect(d[3].check).toContain("정답이 비어 있어요");
  });

  it("reads choices on their own lines", () => {
    const d = splitProblems("문제 1) 가장 큰 수는?\n(1) 10\n(2) 100\n(3) 1000\n정답: 3");
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ type: "multiple", choices: ["10", "100", "1000"], answer: "3" });
  });

  it("keeps decimals and text without numbering as one problem", () => {
    const d = splitProblems("3.14를 반올림하여 소수 첫째 자리까지 나타내시오.");
    expect(d).toHaveLength(1);
    expect(d[0].stem).toBe("3.14를 반올림하여 소수 첫째 자리까지 나타내시오.");
  });

  it("keeps 1) choices under their question, and stem lines that start with 답", () => {
    const d = splitProblems("1. 다음 중 옳은 것은?\n1) 사과\n2) 배\n3) 감\n정답: 2\n2. 넓이를 구하시오.\n답을 구하는 과정도 쓰시오.\n답: 24");
    expect(d).toHaveLength(2);
    expect(d[0]).toMatchObject({ type: "multiple", choices: ["사과", "배", "감"], answer: "2" });
    expect(d[1].stem).toBe("넓이를 구하시오.\n답을 구하는 과정도 쓰시오.");
    expect(d[1].answer).toBe("24");
  });

  it("problems numbered 1) 2) stay separate", () => {
    const d = splitProblems("1) 2+2는?\n정답: 4\n2) 3+3은?\n정답: 6");
    expect(d.map((x) => [x.stem, x.answer])).toEqual([["2+2는?", "4"], ["3+3은?", "6"]]);
  });

  it("reads 1번. numbering and an answer list at the end", () => {
    const d = splitProblems("1번. 가장 큰 수는? ① 1 ② 9 ③ 3\n2번) 물은 몇 도에서 끓는가?\n3번. 지구는 둥글다. (O/X)\n\n[정답]\n1. ②\n2. 100℃\n3. O");
    expect(d).toHaveLength(3);
    expect(d.map((x) => x.answer)).toEqual(["2", "100℃", "O"]);
    expect(d.every((x) => x.answerFrom === "source")).toBe(true);
  });

  it("returns nothing for blank text", () => {
    expect(splitProblems("  \n \n")).toEqual([]);
  });
});

describe("drafts from any source", () => {
  it("normalizes answers", () => {
    expect(normalizeAnswer("③번", "multiple")).toBe("3");
    expect(normalizeAnswer("2, 4", "multiple")).toBe("2,4");
    expect(normalizeAnswer("○", "ox")).toBe("O");
    expect(normalizeAnswer("×", "ox")).toBe("X");
  });

  it("fixes what an AI may get wrong and says what to check", () => {
    const d = toDraft({ stem: " 1+1=? ", type: "multiple", choices: ["① 1", "② 2"], answer: "7", answerFrom: "ai", subject: "체육", difficulty: 9, tags: ["#덧셈", "#덧셈"] }, "수학", "AI 인식");
    expect(d).toMatchObject({ stem: "1+1=?", choices: ["1", "2"], answer: "", subject: "수학", difficulty: 5, tags: ["덧셈"], answerFrom: "none" });
    expect(d.check).toContain("정답 번호(7)가 보기에 없어요");
    const solved = toDraft({ stem: "2+2=?", type: "short", answer: "4", answerFrom: "ai" }, "수학", "AI 인식");
    expect(solved.check).toContain("AI가 푼 정답이에요. 맞는지 확인해 주세요");
    expect(toDraft({ stem: "x", type: "multiple", choices: ["a"] }, "기타", "").type).toBe("short");
  });
});
