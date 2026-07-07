import { NextResponse } from "next/server";

import { parseJsonBody, voteSchema } from "@/lib/schemas";
import { getEventsRepository } from "@/server/repositories";

export const runtime = "nodejs";

/** Apply an up/down vote to one event. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = await parseJsonBody(request, voteSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { id } = await params;
  try {
    const event = await getEventsRepository().vote(id, parsed.data.direction);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 },
    );
  }
}
