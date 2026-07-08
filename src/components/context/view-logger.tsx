"use client";

import { useViewLogger } from "@/hooks/use-view-logger";

/**
 * Headless mount for {@link useViewLogger}: logs settled views to the view-log.
 * Rendered once inside the provider; paints nothing.
 */
export function ViewLogger() {
  useViewLogger();
  return null;
}
