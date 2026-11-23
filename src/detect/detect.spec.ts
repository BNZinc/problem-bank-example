import { HttpException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AiService } from "../ai/ai.service.js";
import { WorkspaceService } from "../workspace/workspace.service.js";
import { DetectController } from "./detect.js";

const KEYS = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "QV_PREVIEW"] as const;

describe("AI 문제 인식 without a key", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  });

  it("asks for a key in the 비밀값 tab (preview), and the no-AI split still works", async () => {
    process.env.QV_PREVIEW = "1";
    const spaces = { takeAi: async () => null } as unknown as WorkspaceService;
    const c = new DetectController(new AiService(), spaces);
    const error = await c.detect("local", { text: "1. 1+1=?", subject: "수학" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(503);
    expect(JSON.stringify((error as HttpException).getResponse())).toContain("비밀값 탭");
    expect(c.plain({ text: "1. 1+1=?\n정답: 2", subject: "수학" }).drafts[0]).toMatchObject({ stem: "1+1=?", answer: "2" });
  });
});
