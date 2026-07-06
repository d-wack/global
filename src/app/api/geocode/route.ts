import { NextResponse } from "next/server";

import { geocodeQuerySchema, validate } from "@/lib/schemas";
import { getGeocoder } from "@/server/geocode";

export const runtime = "nodejs";

/** Geocode a free-text place query (keeps Nominatim server-side). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q");
  const parsed = validate(geocodeQuerySchema, { q });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const results = await getGeocoder().search(parsed.data.q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
