import { afterEach, describe, expect, it, vi } from "vitest";

// The dynamically-imported Auth0 SDK client. Hoisted so the mock factory below
// can reference it; session.ts only `await import`s this when configured.
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth0", () => ({ auth0: { getSession } }));

import { getSessionUser } from "@/server/auth/session";

/** Put the three Auth0 vars into the "configured" state. */
function configure() {
  vi.stubEnv("AUTH0_DOMAIN", "tenant.us.auth0.com");
  vi.stubEnv("AUTH0_CLIENT_ID", "client-id");
  vi.stubEnv("AUTH0_SECRET", "secret");
}

afterEach(() => {
  vi.unstubAllEnvs();
  getSession.mockReset();
});

describe("getSessionUser", () => {
  it("open mode (unconfigured) → anonymous user, never calls the SDK", async () => {
    vi.stubEnv("AUTH0_DOMAIN", "");
    vi.stubEnv("AUTH0_CLIENT_ID", "");
    vi.stubEnv("AUTH0_SECRET", "");

    expect(await getSessionUser()).toEqual({ userId: undefined });
    expect(getSession).not.toHaveBeenCalled();
  });

  it("configured but no session → 'unauthorized' sentinel", async () => {
    configure();
    getSession.mockResolvedValue(null);

    expect(await getSessionUser()).toBe("unauthorized");
    expect(getSession).toHaveBeenCalledOnce();
  });

  it("configured with a session → userId from the Auth0 sub", async () => {
    configure();
    getSession.mockResolvedValue({ user: { sub: "auth0|abc123" } });

    expect(await getSessionUser()).toEqual({ userId: "auth0|abc123" });
  });
});
