import { randomBytes } from "node:crypto";
import { Inject, Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from "@nestjs/common";
import { and, asc, count, eq, inArray, lt, notInArray, sql } from "drizzle-orm";
import { DB, type Db } from "../db/client.js";
import { problems, workspaces, worksheets } from "../db/schema.js";
import { SAMPLE_PROBLEMS, SAMPLE_WORKSHEETS } from "../seed/samples.js";
import { DEMO_AI_OFF, demoMode, LIMITS, SAMPLE_SPACE } from "./workspace.js";

const today = () => new Date().toISOString().slice(0, 10);
const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;
/** Never cleared. */
const KEEP = ["local", SAMPLE_SPACE];

@Injectable()
export class WorkspaceService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer?: NodeJS.Timeout;
  /** AI uses today across the whole demo (AI_DAILY_LIMIT). Kept in memory: a restart starts the day again. */
  private aiToday = { day: "", n: 0 };
  /** New demo spaces per address in the last hour. */
  private made = new Map<string, number[]>();

  constructor(@Inject(DB) private readonly db: Db) {}

  async onApplicationBootstrap() {
    if (!demoMode()) {
      // Your own bank starts with the samples once; deleting them later does not bring them back.
      await this.ensure("local");
      return;
    }
    await this.ensure(SAMPLE_SPACE);
    await this.clearOld();
    this.timer = setInterval(() => void this.clearOld().catch(() => {}), 60 * 60 * 1000);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Makes the space on first use (with the samples). */
  async ensure(id: string): Promise<void> {
    if (await this.touch(id)) return;
    await this.db.insert(workspaces).values({ id }).onConflictDoNothing();
    const made = await this.db
      .insert(problems)
      .values(SAMPLE_PROBLEMS.map((p) => ({ ...p, workspace: id })))
      .returning({ id: problems.id });
    const ids = made.map((m) => m.id);
    if (ids.length === SAMPLE_PROBLEMS.length) await this.db.insert(worksheets).values(SAMPLE_WORKSHEETS.map((w) => ({ ...w, problemIds: w.picks.map((i) => ids[i]), workspace: id })));
  }

  /** The space exists: marks it used now. */
  async touch(id: string): Promise<boolean> {
    const [row] = await this.db.update(workspaces).set({ seenAt: now }).where(eq(workspaces.id, id)).returning({ id: workspaces.id });
    return Boolean(row);
  }

  /** A new demo space for a visitor, or null when this address made too many or the demo is full. */
  async create(ip: string): Promise<string | null> {
    const hourAgo = Date.now() - 3_600_000;
    const recent = (this.made.get(ip) ?? []).filter((t) => t > hourAgo);
    if (recent.length >= LIMITS.newPerIpPerHour) return null;
    if (!(await this.makeRoom())) return null;
    const id = randomBytes(16).toString("base64url");
    await this.ensure(id);
    this.made.set(ip, [...recent, Date.now()]);
    if (this.made.size > 10_000) this.made.clear();
    return id;
  }

  /** Spaces nobody used for a few days go, with everything in them. */
  async clearOld() {
    const before = new Date(Date.now() - LIMITS.idleDays * 86_400_000).toISOString();
    const old = await this.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(lt(workspaces.seenAt, before), notInArray(workspaces.id, KEEP)));
    await this.drop(old.map((o) => o.id));
  }

  /** Room for one more: when full, the least recently used tenth goes — but never a space used in the last day. */
  private async makeRoom(): Promise<boolean> {
    const [{ n }] = await this.db.select({ n: count() }).from(workspaces);
    if (n < LIMITS.spaces) return true;
    const protect = new Date(Date.now() - LIMITS.protectHours * 3_600_000).toISOString();
    const old = await this.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(lt(workspaces.seenAt, protect), notInArray(workspaces.id, KEEP)))
      .orderBy(asc(workspaces.seenAt))
      .limit(Math.ceil(LIMITS.spaces / 10));
    await this.drop(old.map((o) => o.id));
    return old.length > 0;
  }

  private async drop(ids: string[]) {
    for (let i = 0; i < ids.length; i += 200) {
      const part = ids.slice(i, i + 200);
      await this.db.delete(problems).where(inArray(problems.workspace, part));
      await this.db.delete(worksheets).where(inArray(worksheets.workspace, part));
      await this.db.delete(workspaces).where(inArray(workspaces.id, part));
    }
  }

  /**
   * One AI use, if the demo's limits allow it (your own computer: always). A visitor gets
   * LIMITS.aiPerVisitorPerDay a day; AI_DAILY_LIMIT caps the whole demo (unset: no AI on the demo).
   * Returns why not, or null.
   */
  async takeAi(ws: string): Promise<string | null> {
    if (!demoMode()) return null;
    const cap = Number(process.env.AI_DAILY_LIMIT ?? 0);
    if (!Number.isFinite(cap) || cap <= 0) return DEMO_AI_OFF;
    const day = today();
    if (this.aiToday.day !== day) this.aiToday = { day, n: 0 };
    if (this.aiToday.n >= cap) return "오늘 체험판의 AI 사용량을 다 썼어요. 내일 다시 해 보거나 [AI 없이 나누기]를 써 주세요.";
    const mine = await this.aiUsed(ws, day);
    if (mine >= LIMITS.aiPerVisitorPerDay) return `체험판에서는 하루 ${LIMITS.aiPerVisitorPerDay}번까지 AI로 뽑을 수 있어요.`;
    this.aiToday.n++;
    await this.db.update(workspaces).set({ aiDay: `${day}:${mine + 1}` }).where(eq(workspaces.id, ws));
    return null;
  }

  /** The AI call failed: that use does not count. */
  async giveBackAi(ws: string) {
    if (!demoMode()) return;
    const day = today();
    if (this.aiToday.day === day && this.aiToday.n > 0) this.aiToday.n--;
    const mine = await this.aiUsed(ws, day);
    if (mine > 0) await this.db.update(workspaces).set({ aiDay: `${day}:${mine - 1}` }).where(eq(workspaces.id, ws));
  }

  private async aiUsed(ws: string, day: string): Promise<number> {
    const [row] = await this.db.select({ aiDay: workspaces.aiDay }).from(workspaces).where(eq(workspaces.id, ws));
    const [d, used] = (row?.aiDay ?? "").split(":");
    return d === day ? Number(used) || 0 : 0;
  }
}
