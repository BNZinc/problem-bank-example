import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanProblem } from "./clean.ts";

const base = { subject: "수학" as const, grade: "", type: "multiple" as const, difficulty: 3, stem: "?", explanation: "", tags: [], source: "" };

test("several answers stay", () => {
  assert.equal(cleanProblem({ ...base, choices: ["1", "2", "3", "4"], answer: "2,4" }).answer, "2,4");
});

test("blank choices go and answer numbers follow their choices", () => {
  const p = cleanProblem({ ...base, choices: ["a", "", "c", " ", "e"], answer: "3,5" });
  assert.deepEqual(p.choices, ["a", "c", "e"]);
  assert.equal(p.answer, "2,3");
});

test("two choices with the same text keep the right answer", () => {
  assert.equal(cleanProblem({ ...base, choices: ["1", "1", "2"], answer: "2" }).answer, "2");
  assert.equal(cleanProblem({ ...base, choices: ["", "1", "1"], answer: "3" }).answer, "2");
});

test("an answer on a blank choice is dropped; other types keep their text", () => {
  assert.equal(cleanProblem({ ...base, choices: ["a", "", "c"], answer: "2" }).answer, "");
  assert.deepEqual(cleanProblem({ ...base, type: "short", choices: ["x"], answer: " 24 " }), { ...base, type: "short", choices: [], answer: "24" });
});
