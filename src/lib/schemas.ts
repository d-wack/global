import { z } from "zod";

import { EVENT_CATEGORIES } from "@/types/event";

/**
 * Zod schemas for all API input. Route handlers validate against these before
 * touching the repository, so the store only ever sees well-formed, in-range
 * data (the "typed boundary" rule).
 */

export const newEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(1000).default(""),
  category: z.enum(EVENT_CATEGORIES),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  // Occurred year (negative = BCE). Required: the store never sees a yearless event.
  year: z.number().int().min(-4000).max(3000),
});

export const voteSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(1, "Query is required").max(200),
});

// Query params arrive as strings, so coerce lat/lng to numbers before validating.
export const placeInfoQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type NewEventBody = z.infer<typeof newEventSchema>;
export type VoteBody = z.infer<typeof voteSchema>;

export type ParseResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

/**
 * Read and validate a JSON request body against a schema. Returns a discriminated
 * result rather than throwing, so handlers can map failures to a 400.
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
  return validate(schema, body);
}

/** Validate an already-parsed value against a schema. */
export function validate<S extends z.ZodType>(
  schema: S,
  value: unknown,
): ParseResult<z.infer<S>> {
  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((issue) => issue.message).join("; "),
    };
  }
  return { ok: true, data: result.data };
}
