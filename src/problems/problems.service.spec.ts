import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../db/client.js";
import { SAMPLE_PROBLEMS } from "../seed/samples.js";
import { WorkspaceService } from "../workspace/workspace.service.js";
import { ProblemInput, ProblemQuery } from "./problem.dto.js";
import { ProblemsService } from "./problems.service.js";

let db: Db;
let close: () => void;
let service: ProblemsService;
const q = (v: Record<string, unknown> = {}) => ProblemQuery.parse(v);

beforeAll(async () => {
  ({ db, close } = await openDatabase(":memory:"));
  service = new ProblemsService(db);
  await new WorkspaceService(db).ensure("local");
});
afterAll(() => close());

describe("problem bank", () => {
  it("starts with the samples, once", async () => {
    expect((await service.list("local", q())).total).toBe(SAMPLE_PROBLEMS.length);
    await new WorkspaceService(db).ensure("local");
    expect((await service.list("local", q())).total).toBe(SAMPLE_PROBLEMS.length);
  });

  it("filters by subject, type, difficulty, tag and words", async () => {
    const math = await service.list("local", q({ subject: "수학" }));
    expect(math.items.every((p) => p.subject === "수학")).toBe(true);
    const mixed = await service.list("local", q({ subject: "수학,과학", type: ["multiple"], difficulty: "2,3" }));
    expect(mixed.items.every((p) => ["수학", "과학"].includes(p.subject) && p.type === "multiple" && [2, 3].includes(p.difficulty))).toBe(true);
    expect((await service.list("local", q({ tag: "문법" }))).items.every((p) => p.tags.includes("문법"))).toBe(true);
    expect((await service.list("local", q({ q: "광합성" }))).total).toBe(1);
    expect((await service.list("local", q({ q: "100%_" }))).total).toBe(0);
  });

  it("counts facets and keeps spaces apart", async () => {
    const f = await service.facets("local");
    expect(f.total).toBe(SAMPLE_PROBLEMS.length);
    expect(f.subject.find((s) => s.key === "수학")?.n).toBe(SAMPLE_PROBLEMS.filter((p) => p.subject === "수학").length);
    expect(f.tags.some((t) => t.key === "문법")).toBe(true);
    const [first] = (await service.list("local", q())).items;
    await expect(service.get("someone-else", first.id)).rejects.toThrow();
  });

  it("checks problems before saving", () => {
    expect(ProblemInput.safeParse({ subject: "수학", type: "multiple", stem: "?", choices: ["a"] }).success).toBe(false);
    expect(ProblemInput.safeParse({ subject: "수학", type: "multiple", stem: "?", choices: ["a", "b"], answer: "3" }).success).toBe(false);
    expect(ProblemInput.safeParse({ subject: "수학", type: "ox", stem: "?", answer: "예" }).success).toBe(false);
    expect(ProblemInput.parse({ subject: "수학", type: "short", stem: " 1+1 ", tags: ["#덧셈", "덧셈"] })).toMatchObject({ stem: "1+1", tags: ["덧셈"], difficulty: 3 });
  });

  it("saves, edits and deletes", async () => {
    const made = await service.create("local", ProblemInput.parse({ subject: "기타", type: "short", stem: "새 문제", answer: "답" }));
    const edited = await service.update("local", made.id, ProblemInput.parse({ subject: "기타", type: "short", stem: "고친 문제", answer: "답" }));
    expect(edited.stem).toBe("고친 문제");
    await service.remove("local", made.id);
    await expect(service.get("local", made.id)).rejects.toThrow();
  });
});
