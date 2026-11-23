import { BadRequestException, Body, Controller, HttpException, HttpStatus, Module, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { z } from "zod";
import { AI_FILE_TYPES, AiService } from "../ai/ai.service.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { SUBJECTS } from "../db/schema.js";
import { mastra } from "../mastra/index.js";
import { DetectedProblems } from "../mastra/agents/problem-detector.js";
import { activeProvider } from "../mastra/models.js";
import { Ws } from "../workspace/workspace.js";
import { WorkspaceService } from "../workspace/workspace.service.js";
import { toDraft } from "./draft.js";
import { MAX_DRAFTS, splitProblems } from "./split.js";

const DetectBody = z.object({
  text: z.string().max(20_000, "글은 2만 자까지 넣을 수 있어요").default(""),
  subject: z.enum(SUBJECTS).default("기타"),
});
type DetectBody = z.infer<typeof DetectBody>;

const MAX_FILE = 10 * 1024 * 1024;

@Controller("detect")
export class DetectController {
  constructor(
    private readonly ai: AiService,
    private readonly spaces: WorkspaceService,
  ) {}

  /** AI 문제 인식: a photo or PDF (field "file") and/or text → drafts to check, nothing saved yet. */
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_FILE, files: 1 } }))
  async detect(@Ws() ws: string, @Body(new ZodPipe(DetectBody)) body: DetectBody, @UploadedFile() file?: Express.Multer.File) {
    if (file && !AI_FILE_TYPES.includes(file.mimetype)) throw new BadRequestException({ code: "BAD_FILE", message: "사진(PNG·JPG·WebP)이나 PDF만 올릴 수 있어요. 아이폰 사진(HEIC)은 JPG로 바꿔 올려 주세요." });
    if (!file && !body.text.trim()) throw new BadRequestException({ code: "EMPTY", message: "사진·PDF를 올리거나 문제 글을 붙여 넣어 주세요." });
    return this.ai.run(async () => {
      const refused = await this.spaces.takeAi(ws);
      if (refused) throw new HttpException({ code: "AI_LIMIT", message: refused }, HttpStatus.TOO_MANY_REQUESTS);
      const files = file ? [{ data: file.buffer, mediaType: file.mimetype, name: file.originalname }] : [];
      try {
        return await this.detectWith(ws, body, files, file?.originalname);
      } catch (error) {
        await this.spaces.giveBackAi(ws);
        throw error;
      }
    });
  }

  /** One AI pass over the text and file; nothing is saved. */
  private async detectWith(_ws: string, body: DetectBody, files: { data: Buffer; mediaType: string; name: string }[], fileName?: string) {
    const ask = [`이 자료에서 문제를 모두 뽑아 줘.${body.subject !== "기타" ? ` 과목은 ${body.subject}일 가능성이 높아.` : ""}`, body.text.trim() && `\n\n[붙여 넣은 글]\n${body.text.trim()}`].filter(Boolean).join("");
    const result = await mastra.getAgent("problemDetector").generate([{ role: "user", content: this.ai.content(ask, files) }], { structuredOutput: { schema: DetectedProblems } });
    const all = DetectedProblems.parse(result.object).problems;
    const found = all.slice(0, MAX_DRAFTS);
    const source = fileName ? `AI 인식 · ${fileName}`.slice(0, 100) : "AI 인식 · 붙여 넣은 글";
    const p = activeProvider();
    return { drafts: found.map((f) => toDraft(f, body.subject, source)), more: all.length - found.length, by: p ? `${p.label} (${p.model})` : "" };
  }

  /** "AI 없이 나누기": numbering-based split of pasted text (works with no key, also on the demo). */
  @Post("plain")
  plain(@Body(new ZodPipe(DetectBody)) body: DetectBody) {
    if (!body.text.trim()) throw new BadRequestException({ code: "EMPTY", message: "문제 글을 붙여 넣어 주세요." });
    const all = splitProblems(body.text, body.subject);
    return { drafts: all.slice(0, MAX_DRAFTS), more: Math.max(0, all.length - MAX_DRAFTS), by: "" };
  }
}

@Module({ controllers: [DetectController] })
export class DetectModule {}
