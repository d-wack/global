import { NextResponse } from "next/server";

import { newViewSchema, parseJsonBody } from "@/lib/schemas";
import { getSessionUser } from "@/server/auth/session";
import { getViewsRepository } from "@/server/repositories/views-index";

// Node runtime: the file-backed views repository uses node:fs.
export const runtime = "nodejs";

/** Hard ceiling on `?limit=` so a caller can't ask for an unbounded page. */
const MAX_RECENT_LIMIT = 200;

/**
 * The caller's own recent views, newest first.
 *
 * Unauthorized → 401. In open mode (no real user) there is nothing to key on,
 * so we return an empty list rather than leaking another anonymous session's
 * rows. `?limit=` is clamped to {@link MAX_RECENT_LIMIT}.
 */
export async function GET(request: Request) {
  const auth = await getSessionUser();
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.userId === undefined) {
    return NextResponse.json({ views: [] });
  }

  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = raw === null ? undefined : Number(raw);
  const limit =
    parsed !== undefined && Number.isFinite(parsed) && parsed > 0
      ? Math.min(Math.floor(parsed), MAX_RECENT_LIMIT)
      : undefined;

  try {
    const views = await getViewsRepository().listRecent(auth.userId, limit);
    return NextResponse.json({ views });
  } catch {
    return NextResponse.json(
      { error: "Failed to load views" },
      { status: 500 },
    );
  }
}

/**
 * Append a settled view for the authenticated caller.
 *
 * `user_id` comes only from the session, never the body. Unauthorized → 401.
 * In open mode (no real user) view-logging is meaningless, so we no-op with a
 * 204 rather than persisting an anonymous row.
 */
export async function POST(request: Request) {
  const auth = await getSessionUser();
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.userId === undefined) {
    // Open mode: nothing to attribute the view to — succeed without writing.
    return new NextResponse(null, { status: 204 });
  }

  const parsed = await parseJsonBody(request, newViewSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const view = await getViewsRepository().append(parsed.data, auth.userId);
    return NextResponse.json({ view }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to log view" }, { status: 500 });
  }
}
