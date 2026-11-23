import { defineConfig } from "drizzle-kit";

// `pnpm db:generate` writes a migration into drizzle/ after src/db/schema.ts changes.
// The server applies new migrations by itself when it starts (src/db/client.ts).
export default defineConfig({ dialect: "sqlite", schema: "./src/db/schema.ts", out: "./drizzle" });
