import { defineConfig, devices } from "@playwright/test";

// Uncommon port so the smoke test never collides with a stray dev server on 3000.
const PORT = Number(process.env.PORT ?? 3210);
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build, then serve with `next start` (Vercel builds natively — no standalone).
  // next start honors the PORT/HOSTNAME env vars set below.
  //
  // The smoke test is a UI test and must be hermetic against the file store.
  // `next start` loads `.env.local`, which locally sets DATABASE_URL and would
  // route the app at the (CI/sandbox-unreachable) Neon/Drizzle repo — GET
  // /api/events would 500. Explicitly blanking DATABASE_URL forces the seed-
  // backed FileEventsRepository; blanking the AUTH0_* trio forces open mode so
  // mutations aren't gated. Env vars already present in process.env win over
  // `.env*` files in Next's loader, so these overrides hold. CI has no
  // `.env.local`, so this only makes local match CI.
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: "",
      AUTH0_DOMAIN: "",
      AUTH0_CLIENT_ID: "",
      AUTH0_SECRET: "",
    },
  },
});
