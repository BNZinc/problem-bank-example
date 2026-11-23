import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import * as schema from "./schema.js";

/**
 * SQLite through Node's built-in `node:sqlite` (nothing to compile), with Drizzle for typed queries.
 * The file lives in data/ here, and on Railway in the attached volume (RAILWAY_VOLUME_MOUNT_PATH),
 * so it survives a redeploy.
 */
export const DB = Symbol("DB");
export type Db = SqliteRemoteDatabase<typeof schema>;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function databaseFile(): string {
  const dir = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? join(root, "data");
  return join(dir, "app.db");
}

export async function openDatabase(file = databaseFile()): Promise<{ db: Db; close: () => void }> {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const sqlite = new DatabaseSync(file);
  sqlite.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const db = drizzle(
    async (query, params, method) => {
      const stmt = sqlite.prepare(query);
      const args = params as SQLInputValue[];
      if (method === "run") {
        stmt.run(...args);
        return { rows: [] };
      }
      // Drizzle wants each row as an array of values, in column order.
      stmt.setReturnArrays(true);
      if (method === "get") return { rows: (stmt.get(...args) as unknown as unknown[] | undefined) ?? [] };
      return { rows: stmt.all(...args) as unknown as unknown[][] };
    },
    { schema },
  );
  await migrate(
    db,
    async (queries) => {
      sqlite.exec("BEGIN");
      try {
        for (const q of queries) sqlite.exec(q);
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    { migrationsFolder: join(root, "drizzle") },
  );
  return { db, close: () => sqlite.close() };
}
