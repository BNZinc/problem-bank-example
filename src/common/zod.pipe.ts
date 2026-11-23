import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { z, type ZodType } from "zod";

// Messages people can read: Korean, plain. A schema's own message ("제목을 적어 주세요") wins.
z.config({
  customError: (iss) => {
    const n = (v: unknown) => Number(v);
    if (iss.code === "too_big") return iss.origin === "string" ? `${n(iss.maximum)}자까지 적을 수 있어요` : iss.origin === "array" ? `${n(iss.maximum)}개까지 넣을 수 있어요` : `${n(iss.maximum)} 이하여야 해요`;
    if (iss.code === "too_small") return iss.origin === "string" ? (n(iss.minimum) <= 1 ? "비어 있어요" : `${n(iss.minimum)}자 이상 적어 주세요`) : iss.origin === "array" ? `${n(iss.minimum)}개 이상 있어야 해요` : `${n(iss.minimum)} 이상이어야 해요`;
    if (iss.code === "invalid_value") return "고를 수 있는 값이 아니에요";
    if (iss.code === "invalid_type") return "형식이 맞지 않아요";
    return undefined;
  },
});

/** Field names as people see them on screen. Add yours when you add a field. */
const NAMES: Record<string, string> = {
  title: "제목", body: "내용", tags: "태그", q: "찾는 말", stem: "문제", choices: "보기", answer: "정답", explanation: "해설",
  source: "출처", subject: "과목", grade: "학년", type: "유형", difficulty: "난이도", problems: "문제", problemIds: "문제 목록",
  subtitle: "부제", columns: "단", text: "글", page: "쪽", size: "개수",
};

/** ["problems", 1, "choices", 6] → "2번 문제 · 7번 보기" (counted from 1, as on screen). */
const where = (path: PropertyKey[]) => {
  const out: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const name = NAMES[String(path[i])] ?? String(path[i]);
    if (typeof path[i + 1] === "number") out.push(`${Number(path[++i]) + 1}번 ${name}`);
    else out.push(typeof path[i] === "number" ? `${Number(path[i]) + 1}번` : name);
  }
  return out.join(" · ");
};

/** Checks a request body (or query) against a zod schema: `@Body(new ZodPipe(Schema))`. */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const at = first?.path.length ? `${where(first.path)}: ` : "";
      throw new BadRequestException({ code: "BAD_INPUT", message: `${at}${first?.message ?? "입력값을 확인해 주세요"}` });
    }
    return parsed.data;
  }
}
