import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { activeProvider, AiKeyMissing, noKeyMessage } from "../mastra/models.js";

export type AiStatus = { enabled: true; provider: string; model: string } | { enabled: false; message: string };

/** A file given to an agent: a picture (PNG, JPG, WebP) or a PDF. */
export type AiFile = { data: Buffer; mediaType: string; name?: string };

export const AI_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/** The AI's state for the screen, and the one place AI errors become plain Korean. */
@Injectable()
export class AiService {
  status(): AiStatus {
    const p = activeProvider();
    return p ? { enabled: true, provider: p.label, model: p.model } : { enabled: false, message: noKeyMessage() };
  }

  /** Content for agent.generate(): the text first, then each file. */
  content(text: string, files: AiFile[] = []) {
    return [
      { type: "text" as const, text },
      ...files.map((f) =>
        f.mediaType.startsWith("image/")
          ? { type: "image" as const, image: f.data, mediaType: f.mediaType }
          : { type: "file" as const, data: f.data, mediaType: f.mediaType, ...(f.name ? { filename: f.name } : {}) },
      ),
    ];
  }

  /** Runs `work`, turning a missing key or a provider error into an HTTP answer the screen can show. */
  async run<T>(work: () => Promise<T>): Promise<T> {
    if (!activeProvider()) throw new HttpException({ code: "AI_KEY_MISSING", message: noKeyMessage() }, HttpStatus.SERVICE_UNAVAILABLE);
    try {
      return await work();
    } catch (error) {
      throw toHttp(error);
    }
  }
}

function toHttp(error: unknown): HttpException {
  if (error instanceof HttpException) return error;
  if (error instanceof AiKeyMissing) return new HttpException({ code: "AI_KEY_MISSING", message: noKeyMessage() }, HttpStatus.SERVICE_UNAVAILABLE);
  const status = statusOf(error);
  const said =
    status === 401 || status === 403
      ? { code: "AI_KEY_REJECTED", message: "AI 키가 맞지 않거나 쓸 수 없는 키예요. 비밀값 탭에서 키를 다시 넣어 주세요." }
      : status === 429
        ? { code: "AI_BUSY", message: "AI 사용 한도에 걸렸어요. 잠시 뒤 다시 해 보거나 요금제·한도를 확인해 주세요." }
        : status === 400 || status === 413
          ? { code: "AI_BAD_INPUT", message: "AI가 이 내용을 읽지 못했어요. 파일이 너무 크거나 지원하지 않는 형식일 수 있어요." }
          : { code: "AI_FAILED", message: "AI 응답을 받지 못했어요. 잠시 뒤 다시 해 주세요." };
  // Only the kind of failure goes to the log: a provider's own message can quote part of the key
  // or of the user's file.
  console.warn(`[ai] ${said.code}${status ? ` (${status})` : ""}${error instanceof Error ? ` ${error.name}` : ""}`);
  return new HttpException(said, HttpStatus.BAD_GATEWAY);
}

function statusOf(error: unknown): number | undefined {
  for (let e: any = error, i = 0; e && i < 4; e = e.cause, i++) {
    if (typeof e.statusCode === "number") return e.statusCode;
    if (typeof e.status === "number") return e.status;
  }
  return undefined;
}
