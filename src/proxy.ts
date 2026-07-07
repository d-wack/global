import { NextResponse, type NextRequest } from "next/server";

import { isAuth0Configured } from "@/lib/auth0-config";

/**
 * Whole-app auth gate (Next 16 proxy).
 *
 * OPEN MODE: when Auth0 is not configured this is a no-op — every request passes
 * straight through, exactly as the app behaved before auth existed. We never
 * construct or touch the Auth0 client in this path.
 *
 * FAIL CLOSED: open mode is fine for local/CI/preview, but a *production* deploy
 * that is missing an `AUTH0_*` var must never silently go public. In that case
 * we return a hard 503 instead of serving open, so a misconfigured prod fails
 * loudly rather than exposing the app.
 *
 * CONFIGURED: the SDK's own auth routes (`/auth/*`) are handled by its
 * middleware; every other route requires a session — unauthenticated page
 * requests redirect to `/auth/login`, unauthenticated `/api/*` requests get a
 * 401 JSON body.
 */
export async function proxy(request: NextRequest) {
  if (!isAuth0Configured()) {
    // Production must be configured; a missing AUTH0_* var there is a fail-open
    // hazard, so refuse to serve rather than exposing every route. Previews,
    // local dev, and CI intentionally keep running open for testing.
    if (process.env.VERCEL_ENV === "production") {
      return new NextResponse("Authentication is not configured", {
        status: 503,
      });
    }
    return NextResponse.next();
  }

  // Only load the SDK client when actually configured (keeps open mode silent).
  const { auth0 } = await import("@/lib/auth0");

  const res = await auth0.middleware(request);

  // Let the SDK own its mounted auth routes. Match the `/auth` segment exactly
  // so sibling paths like `/authors` still fall through to the session gate.
  const { pathname } = request.nextUrl;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    return res;
  }

  const session = await auth0.getSession(request);
  if (!session) {
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
