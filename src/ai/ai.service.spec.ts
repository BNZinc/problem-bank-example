import { HttpException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AiService } from "./ai.service.js";

const KEYS = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "QV_PREVIEW"] as const;
const AI_KEYS = KEYS.slice(0, 3);

describe("AI without a key", () => {
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

  it("in QuestiVibe's preview: tells the builder which keys turn AI on", () => {
    process.env.QV_PREVIEW = "1";
    const status = new AiService().status();
    expect(status.enabled).toBe(false);
    if (!status.enabled) {
      for (const k of AI_KEYS) expect(status.message).toContain(k);
      expect(status.message).toContain("비밀값 탭");
    }
  });

  it("on the deployed site: plain words for visitors, no builder talk", () => {
    const status = new AiService().status();
    expect(status.enabled).toBe(false);
    if (!status.enabled) {
      expect(status.message).toContain("꺼져 있어요");
      expect(status.message).not.toMatch(/비밀값|API_KEY|QuestiVibe/);
    }
  });

  it("answers 503 AI_KEY_MISSING without calling any provider", async () => {
    let called = false;
    const error = await new AiService()
      .run(async () => {
        called = true;
      })
      .catch((e: unknown) => e);
    expect(called).toBe(false);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(503);
    expect((error as HttpException).getResponse()).toMatchObject({ code: "AI_KEY_MISSING" });
  });

  it("uses the one key that is there", () => {
    process.env.GEMINI_API_KEY = "test-not-a-real-key";
    expect(new AiService().status()).toMatchObject({ enabled: true, provider: "Gemini", model: "gemini-3.8-flash" });
  });
});
