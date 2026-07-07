import { afterEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

/**
 * These cover only the *unconfigured* branches, which return before the Auth0
 * SDK client is ever imported — so no SDK mocking is required. A minimal object
 * shaped like NextRequest is enough for this path (pathname is never read).
 */
const request = { nextUrl: { pathname: "/" }, url: "http://localhost/" };

function clearAuth0Env() {
  vi.stubEnv("AUTH0_DOMAIN", "");
  vi.stubEnv("AUTH0_CLIENT_ID", "");
  vi.stubEnv("AUTH0_SECRET", "");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy open-mode gate", () => {
  it("serves open (200 next) when unconfigured outside production", async () => {
    clearAuth0Env();
    vi.stubEnv("VERCEL_ENV", "preview");
    const res = await proxy(request as never);
    // NextResponse.next() carries the internal rewrite header, not a 503.
    expect(res.status).not.toBe(503);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails closed with 503 when unconfigured in production", async () => {
    clearAuth0Env();
    vi.stubEnv("VERCEL_ENV", "production");
    const res = await proxy(request as never);
    expect(res.status).toBe(503);
    await expect(res.text()).resolves.toBe("Authentication is not configured");
  });
});
