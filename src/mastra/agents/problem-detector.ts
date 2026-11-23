import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { PROBLEM_TYPES, SUBJECTS } from "../../db/schema.js";
import { currentModel } from "../models.js";

/**
 * What the detector returns. Kept plain (no min/max) so every provider's structured output takes
 * it; src/detect/draft.ts then checks and fixes each problem before the user sees it.
 */
export const DetectedProblems = z.object({
  problems: z
    .array(
      z.object({
        stem: z.string().describe("문제 본문(지문·조건 포함). 원문 그대로. 번호(1., ②)와 배점은 빼기"),
        type: z.enum(PROBLEM_TYPES).describe("multiple=객관식, short=단답형, essay=서술형, ox=O/X"),
        choices: z.array(z.string()).describe("객관식 보기, 순서대로. ①② 같은 번호 표시는 빼기. 객관식이 아니면 []"),
        answer: z.string().describe("객관식은 보기 번호(예: 3), O/X는 O 또는 X, 그 밖은 답. 모르면 빈 문자열"),
        answerFrom: z.enum(["source", "ai", "none"]).describe("source=자료에 정답이 적혀 있음, ai=자료에 없어서 직접 풂, none=정답 없음"),
        explanation: z.string().describe("자료에 있는 해설, 또는 직접 풀었으면 짧은 풀이. 없으면 빈 문자열"),
        subject: z.enum(SUBJECTS).describe("과목"),
        grade: z.string().describe("학년 추정(예: 중2, 고1). 모르면 빈 문자열"),
        difficulty: z.number().describe("난이도 1(쉬움)~5(어려움) 추정"),
        tags: z.array(z.string()).describe("단원·개념 태그 1~3개, 짧은 한국어"),
      }),
    )
    .describe("자료에 있는 모든 문제, 나온 순서대로"),
});
export type DetectedProblems = z.infer<typeof DetectedProblems>;

/** Reads a photo, a PDF or text of a test or worksheet and lists its problems (Mastra agent). */
export const problemDetector = new Agent({
  id: "problem-detector",
  name: "문제 인식",
  instructions: [
    "너는 시험지·학습지에서 문제를 정확히 옮겨 적는 출제 도우미야.",
    "사용자가 준 자료(사진, PDF, 글)에서 문제를 하나도 빠뜨리지 말고 나온 순서대로 뽑아.",
    "- 문제 본문과 보기는 자료의 글자 그대로 옮겨. 고치거나 요약하지 마. 읽을 수 없는 글자는 [?]로 적어.",
    "- 수식은 유니코드로 적어(x², √2, π, ≤, ½). 그림이나 표가 있으면 본문 끝에 [그림: 짧은 설명]으로 적어.",
    "- 문제 번호, 배점([3점]), 보기의 ①② 번호 표시는 빼.",
    "- 정답이 자료에 있으면 그대로 쓰고 answerFrom=source. 없으면 직접 풀어서 answerFrom=ai로 표시하고 explanation에 짧은 풀이를 써. 확실하지 않으면 answer는 비우고 answerFrom=none.",
    "- 지문 하나에 여러 문제가 딸려 있으면, 각 문제 본문 앞에 지문을 함께 넣어.",
    "- 문제가 아닌 것(안내문, 표지, 광고)은 넣지 마.",
  ].join("\n"),
  model: () => currentModel(),
});
