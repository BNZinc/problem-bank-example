import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Which AI the app uses: the first of these whose key is in the 비밀값 tab (or Railway variables).
 * One key is enough. To use another model, change `model` here (keep the provider's exact id).
 * Checked 2026-11: Claude Sonnet 5.5, GPT-6.1 Sol, Gemini 3.8 Flash — all read images and PDFs.
 */
export const PROVIDERS = [
  { id: "anthropic", label: "Claude", model: "claude-sonnet-5-5", key: () => process.env.ANTHROPIC_API_KEY },
  { id: "openai", label: "OpenAI", model: "gpt-6.1-sol", key: () => process.env.OPENAI_API_KEY },
  { id: "google", label: "Gemini", model: "gemini-3.8-flash", key: () => process.env.GEMINI_API_KEY },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

/**
 * Said wherever an AI feature is used without a key. Visitors of the deployed site get plain
 * words; only QuestiVibe's preview (it sets QV_PREVIEW=1) tells the builder where keys go.
 */
export const noKeyMessage = () =>
  process.env.QV_PREVIEW === "1"
    ? "AI 기능을 켜려면 오른쪽 비밀값 탭에 GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY 중 하나만 넣어 주세요. 키가 없어도 나머지 기능은 다 돼요."
    : "사진·PDF에서 문제를 뽑는 AI 기능은 지금 꺼져 있어요. 문제 글을 붙여 넣고 [AI 없이 나누기]를 눌러 보세요.";

export class AiKeyMissing extends Error {
  readonly code = "AI_KEY_MISSING";
  constructor() {
    super(noKeyMessage());
  }
}

/** The provider in use now, or null when no key is set. Read on every call: keys can change. */
export function activeProvider() {
  for (const p of PROVIDERS) {
    const key = p.key()?.trim();
    if (key) return { id: p.id, label: p.label, model: p.model, key };
  }
  return null;
}

/** The language model for the active provider; throws AiKeyMissing without a key. */
export function currentModel() {
  const p = activeProvider();
  if (!p) throw new AiKeyMissing();
  if (p.id === "anthropic") return createAnthropic({ apiKey: p.key })(p.model);
  if (p.id === "openai") return createOpenAI({ apiKey: p.key })(p.model);
  return createGoogleGenerativeAI({ apiKey: p.key })(p.model);
}
