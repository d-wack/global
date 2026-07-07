import { NextResponse } from "next/server";

import { placeInfoQuerySchema, validate } from "@/lib/schemas";
import { getPlaceInfoProvider } from "@/server/placeinfo";

export const runtime = "nodejs";

/** Nearby reference articles for a coordinate (keeps Wikipedia server-side). */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");
  if (lat === null || lng === null) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 },
    );
  }

  const parsed = validate(placeInfoQuerySchema, { lat, lng });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const results = await getPlaceInfoProvider().nearby(
      parsed.data.lat,
      parsed.data.lng,
    );
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Place lookup failed" }, { status: 502 });
  }
}
