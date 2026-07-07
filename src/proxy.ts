import { NextResponse, type NextRequest } from "next/server";

import { isAuth0Configured } from "@/lib/auth0-config";

/**
 * Whole-app auth gate (Next 16 proxy).
 *
 * OPEN MODE: when Auth0 is not configured this is a no-op — every request passes
 * straight through, exactly as the app behaved before auth existed. We never
 * construct or touch the Auth0 client in this path.
 *
 * CONFIGURED: the SDK's own auth routes (`/auth/*`) are handled by its
 * middleware; every other route requires a session — unauthenticated page
 * requests redirect to `/auth/login`, unauthenticated `/api/*` requests get a
 * 401 JSON body.
 */
export async function proxy(request: NextRequest) {
  if (!isAuth0Configured()) {
    return NextResponse.next();
  }

  // Only load the SDK client when actually configured (keeps open mode silent).
  const { auth0 } = await import("@/lib/auth0");

  const res = await auth0.middleware(request);

  // Let the SDK own its mounted auth routes.
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return res;
  }

  const session = await auth0.getSession(request);
  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api")) {
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
