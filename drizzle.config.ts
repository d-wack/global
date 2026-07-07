import { defineConfig } from "drizzle-kit";

// DATABASE_URL is only needed for `migrate`/`push`/`studio` (not `generate`).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
