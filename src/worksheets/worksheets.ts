import { BadRequestException, Body, Controller, Delete, Get, Inject, Injectable, Module, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { IdPipe } from "../common/id.pipe.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { DB, type Db } from "../db/client.js";
import { worksheets } from "../db/schema.js";
import { ProblemsModule } from "../problems/problems.module.js";
import { ProblemsService } from "../problems/problems.service.js";
import { LIMITS, Ws } from "../workspace/workspace.js";

export const WorksheetInput = z.object({
  title: z.string().trim().min(1, "문제지 제목을 적어 주세요").max(80),
  subtitle: z.string().trim().max(120).default(""),
  problemIds: z.array(z.number().int().positive()).max(100).default([]),
  withAnswers: z.boolean().default(true),
  columns: z.union([z.literal(1), z.literal(2)]).default(2),
});
export type WorksheetInput = z.infer<typeof WorksheetInput>;

@Injectable()
export class WorksheetsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly problems: ProblemsService,
  ) {}

  list(ws: string) {
    return this.db.select().from(worksheets).where(eq(worksheets.workspace, ws)).orderBy(desc(worksheets.updatedAt)).limit(200);
  }

  /** The worksheet with its problems in order (deleted problems drop out). */
  async get(ws: string, id: number) {
    const [row] = await this.db.select().from(worksheets).where(and(eq(worksheets.workspace, ws), eq(worksheets.id, id)));
    if (!row) throw new NotFoundException({ code: "NOT_FOUND", message: "그 문제지를 찾지 못했어요." });
    return { ...row, problems: await this.problems.byIds(ws, row.problemIds) };
  }

  /** Only this space's problems, each once, in the order given. */
  private async clean(ws: string, ids: number[]) {
    return (await this.problems.byIds(ws, [...new Set(ids)])).map((p) => p.id);
  }

  async create(ws: string, input: WorksheetInput) {
    if (ws !== "local") {
      const [{ n }] = await this.db.select({ n: count() }).from(worksheets).where(eq(worksheets.workspace, ws));
      if (n >= LIMITS.worksheets) throw new BadRequestException({ code: "LIMIT", message: `체험판에서는 문제지를 ${LIMITS.worksheets}개까지 만들 수 있어요.` });
    }
    const [row] = await this.db
      .insert(worksheets)
      .values({ ...input, problemIds: await this.clean(ws, input.problemIds), workspace: ws })
      .returning();
    return row;
  }

  async update(ws: string, id: number, input: WorksheetInput) {
    await this.get(ws, id);
    const [row] = await this.db
      .update(worksheets)
      .set({ ...input, problemIds: await this.clean(ws, input.problemIds), updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
      .where(and(eq(worksheets.workspace, ws), eq(worksheets.id, id)))
      .returning();
    return row;
  }

  async remove(ws: string, id: number) {
    await this.get(ws, id);
    await this.db.delete(worksheets).where(and(eq(worksheets.workspace, ws), eq(worksheets.id, id)));
    return { ok: true };
  }
}

@Controller("worksheets")
export class WorksheetsController {
  constructor(private readonly sheets: WorksheetsService) {}

  @Get()
  list(@Ws() ws: string) {
    return this.sheets.list(ws);
  }

  @Get(":id")
  get(@Ws() ws: string, @Param("id", IdPipe) id: number) {
    return this.sheets.get(ws, id);
  }

  @Post()
  create(@Ws() ws: string, @Body(new ZodPipe(WorksheetInput)) body: WorksheetInput) {
    return this.sheets.create(ws, body);
  }

  @Put(":id")
  update(@Ws() ws: string, @Param("id", IdPipe) id: number, @Body(new ZodPipe(WorksheetInput)) body: WorksheetInput) {
    return this.sheets.update(ws, id, body);
  }

  @Delete(":id")
  remove(@Ws() ws: string, @Param("id", IdPipe) id: number) {
    return this.sheets.remove(ws, id);
  }
}

@Module({ imports: [ProblemsModule], controllers: [WorksheetsController], providers: [WorksheetsService] })
export class WorksheetsModule {}
