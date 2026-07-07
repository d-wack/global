import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * The Auth0 SDK client (server-only seam).
 *
 * Constructing `Auth0Client` with no options never throws — the SDK reads the
 * `AUTH0_*` env vars lazily and only errors when a method is actually invoked
 * without configuration (it merely logs a warning at construction). So merely
 * importing this module is always safe.
 *
 * In OPEN MODE (Auth0 env unset) callers must not import this module at all:
 * `src/proxy.ts` and `src/server/auth/session.ts` check {@link isAuth0Configured}
 * first and only `await import("@/lib/auth0")` when configured, so the app runs
 * exactly as before and the construction warning is never emitted.
 */
export const auth0 = new Auth0Client();
