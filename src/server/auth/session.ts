import { isAuth0Configured } from "@/lib/auth0-config";

/**
 * The current request's authenticated user, resolved from the Auth0 session.
 *
 * - OPEN MODE (Auth0 unconfigured): returns `{ userId: undefined }` — an
 *   anonymous caller. Routes keep working exactly as before.
 * - CONFIGURED but no session: returns the sentinel `"unauthorized"`, which
 *   mutation routes map to a 401. (The proxy normally blocks these first; this
 *   is defence in depth.)
 * - CONFIGURED with a session: returns `{ userId: <Auth0 sub> }`.
 */
export type SessionUser = { userId?: string } | "unauthorized";

export async function getSessionUser(): Promise<SessionUser> {
  if (!isAuth0Configured()) {
    return { userId: undefined };
  }

  // Only load the SDK client when actually configured.
  const { auth0 } = await import("@/lib/auth0");
  const session = await auth0.getSession();
  if (!session) {
    return "unauthorized";
  }
  return { userId: session.user.sub };
}
