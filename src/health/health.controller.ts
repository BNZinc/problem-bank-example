import { Controller, Get, Inject } from "@nestjs/common";
import { DB, type Db } from "../db/client.js";
import { sql } from "drizzle-orm";

@Controller("health")
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Railway waits for this before switching to a new deploy; it also checks the database answers. */
  @Get()
  async health() {
    await this.db.run(sql`select 1`);
    return { ok: true };
  }
}
