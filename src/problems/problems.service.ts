import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { DB, type Db } from "../db/client.js";
import { problems, worksheets, type Problem } from "../db/schema.js";
import { LIMITS } from "../workspace/workspace.js";
import type { ProblemInput, ProblemQuery } from "./problem.dto.js";

/** "%", "_" and "\" typed in the search box are searched as themselves. */
const likeText = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

@Injectable()
export class ProblemsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  private where(ws: string, f: Partial<ProblemQuery>): SQL | undefined {
    const parts: (SQL | undefined)[] = [eq(problems.workspace, ws)];
    if (f.q) {
      const t = likeText(f.q);
      // Tags and choices are JSON lists: each item is searched, not the list's quotes and commas.
      const inList = (col: typeof problems.tags | typeof problems.choices) => sql`exists (select 1 from json_each(${col}) where value like ${t} escape '\\')`;
      parts.push(or(sql`${problems.stem} like ${t} escape '\\'`, sql`${problems.explanation} like ${t} escape '\\'`, sql`${problems.source} like ${t} escape '\\'`, inList(problems.tags), inList(problems.choices)));
    }
    if (f.subject?.length) parts.push(inArray(problems.subject, f.subject));
    if (f.type?.length) parts.push(inArray(problems.type, f.type));
    if (f.difficulty?.length) parts.push(inArray(problems.difficulty, f.difficulty));
    if (f.ids?.length) parts.push(inArray(problems.id, f.ids));
    if (f.tag) parts.push(sql`exists (select 1 from json_each(${problems.tags}) where value = ${f.tag})`);
    return and(...parts);
  }

  async list(ws: string, f: ProblemQuery) {
    const where = this.where(ws, f);
    const order = { new: [desc(problems.id)], old: [asc(problems.id)], easy: [asc(problems.difficulty), desc(problems.id)], hard: [desc(problems.difficulty), desc(problems.id)] }[f.sort];
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(problems).where(where).orderBy(...order).limit(f.size).offset((f.page - 1) * f.size),
      this.db.select({ total: count() }).from(problems).where(where),
    ]);
    return { items, total, page: f.page, size: f.size };
  }

  /** Several by id, in the order asked (a worksheet's order). Missing ones are left out. */
  async byIds(ws: string, ids: number[]): Promise<Problem[]> {
    if (!ids.length) return [];
    const rows = await this.db.select().from(problems).where(and(eq(problems.workspace, ws), inArray(problems.id, ids)));
    const by = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => by.get(id)).filter((p): p is Problem => Boolean(p));
  }

  /** Counts for the filter rail: every subject, type and difficulty, and the most used tags. */
  async facets(ws: string) {
    const mine = eq(problems.workspace, ws);
    const group = async (col: typeof problems.subject | typeof problems.type | typeof problems.difficulty) =>
      (await this.db.select({ key: col, n: count() }).from(problems).where(mine).groupBy(col)).map((r) => ({ key: String(r.key), n: r.n }));
    const [subject, type, difficulty, tags, [{ total }]] = await Promise.all([
      group(problems.subject),
      group(problems.type),
      group(problems.difficulty),
      this.db.all<[string, number]>(sql`select j.value, count(*) as n from ${problems}, json_each(${problems.tags}) j where ${problems.workspace} = ${ws} group by j.value order by n desc, j.value limit 40`),
      this.db.select({ total: count() }).from(problems).where(mine),
    ]);
    return { total, subject, type, difficulty, tags: tags.map(([key, n]) => ({ key, n: Number(n) })) };
  }

  async get(ws: string, id: number) {
    const [row] = await this.db.select().from(problems).where(and(eq(problems.workspace, ws), eq(problems.id, id)));
    if (!row) throw new NotFoundException({ code: "NOT_FOUND", message: "그 문제를 찾지 못했어요. 지워졌을 수 있어요." });
    return row;
  }

  private async room(ws: string, adding: number) {
    if (ws === "local") return;
    const [{ n }] = await this.db.select({ n: count() }).from(problems).where(eq(problems.workspace, ws));
    if (n + adding > LIMITS.problems) throw new BadRequestException({ code: "LIMIT", message: `체험판에서는 문제를 ${LIMITS.problems}개까지 넣을 수 있어요.` });
  }

  async create(ws: string, input: ProblemInput) {
    await this.room(ws, 1);
    const [row] = await this.db.insert(problems).values({ ...input, workspace: ws }).returning();
    return row;
  }

  async createMany(ws: string, list: ProblemInput[]) {
    await this.room(ws, list.length);
    return this.db.insert(problems).values(list.map((p) => ({ ...p, workspace: ws }))).returning();
  }

  async update(ws: string, id: number, input: ProblemInput) {
    await this.get(ws, id);
    const [row] = await this.db
      .update(problems)
      .set({ ...input, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
      .where(and(eq(problems.workspace, ws), eq(problems.id, id)))
      .returning();
    return row;
  }

  /** Deletes the problem, and takes it out of every worksheet that had it. */
  async remove(ws: string, id: number) {
    await this.get(ws, id);
    const sheets = await this.inSheets(ws, id);
    for (const s of sheets)
      await this.db
        .update(worksheets)
        .set({ problemIds: s.problemIds.filter((x) => x !== id) })
        .where(and(eq(worksheets.workspace, ws), eq(worksheets.id, s.id)));
    await this.db.delete(problems).where(and(eq(problems.workspace, ws), eq(problems.id, id)));
    return { ok: true, sheets: sheets.length };
  }

  /** The worksheets that hold this problem (for "문제지 2개에 들어 있어요"). */
  inSheets(ws: string, id: number) {
    return this.db
      .select({ id: worksheets.id, title: worksheets.title, problemIds: worksheets.problemIds })
      .from(worksheets)
      .where(and(eq(worksheets.workspace, ws), sql`exists (select 1 from json_each(${worksheets.problemIds}) where value = ${id})`));
  }
}
