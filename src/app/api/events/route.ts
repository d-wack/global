import { NextResponse } from "next/server";

import { newEventSchema, parseJsonBody } from "@/lib/schemas";
import { getEventsRepository } from "@/server/repositories";

// Node runtime: the file-backed repository uses node:fs.
export const runtime = "nodejs";

/** List all events. Viewport filtering is done client-side in Phase 1. */
export async function GET() {
  try {
    const events = await getEventsRepository().list();
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 },
    );
  }
}

/** Create an event. */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, newEventSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const event = await getEventsRepository().add(parsed.data);
    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
