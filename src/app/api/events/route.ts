import { NextResponse } from "next/server";

import { newEventSchema, parseJsonBody } from "@/lib/schemas";
import { getSessionUser } from "@/server/auth/session";
import { getEventsRepository } from "@/server/repositories";

// Node runtime: the file-backed repository uses node:fs.
export const runtime = "nodejs";

/**
 * List all events. Viewport filtering is done client-side in Phase 1.
 *
 * Never 401s: in open mode the user is anonymous; when authenticated the
 * session's `userId` is threaded through so each event carries the caller's own
 * `userVote`.
 */
export async function GET() {
  const auth = await getSessionUser();
  const userId = auth === "unauthorized" ? undefined : auth.userId;
  try {
    const events = await getEventsRepository().list(userId);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 },
    );
  }
}

/** Create an event. Attribution (`created_by`) comes only from the session. */
export async function POST(request: Request) {
  const auth = await getSessionUser();
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(request, newEventSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const event = await getEventsRepository().add(parsed.data, auth.userId);
    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
