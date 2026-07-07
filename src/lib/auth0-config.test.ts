import { afterEach, describe, expect, it, vi } from "vitest";

import { isAuth0Configured } from "@/lib/auth0-config";

// The trio that must all be present for Auth0 to count as configured.
const KEYS = ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_SECRET"] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Stub all three vars, then blank the ones not in `present`. */
function withEnv(present: readonly (typeof KEYS)[number][]) {
  for (const key of KEYS) {
    vi.stubEnv(key, present.includes(key) ? "value" : "");
  }
}

describe("isAuth0Configured", () => {
  it("is true only when domain, client id, and secret are all set", () => {
    withEnv(KEYS);
    expect(isAuth0Configured()).toBe(true);
  });

  it("is false when the whole trio is unset (open mode)", () => {
    withEnv([]);
    expect(isAuth0Configured()).toBe(false);
  });

  it("is false when any single var is missing", () => {
    for (const missing of KEYS) {
      withEnv(KEYS.filter((k) => k !== missing));
      expect(isAuth0Configured(), `missing ${missing}`).toBe(false);
    }
  });

  it("treats an empty string as unset", () => {
    vi.stubEnv("AUTH0_DOMAIN", "d");
    vi.stubEnv("AUTH0_CLIENT_ID", "c");
    vi.stubEnv("AUTH0_SECRET", "");
    expect(isAuth0Configured()).toBe(false);
  });
});
