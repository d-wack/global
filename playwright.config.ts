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
  // Build, then serve the standalone output — the exact artifact the Docker
  // image runs. next build does not copy static assets into standalone, so we
  // stage them the same way the Dockerfile does before starting the server.
  webServer: {
    command:
      "pnpm build" +
      " && cp -r public .next/standalone/public" +
      " && cp -r .next/static .next/standalone/.next/static" +
      " && node .next/standalone/server.js",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: { PORT: String(PORT), HOSTNAME: "127.0.0.1" },
  },
});
