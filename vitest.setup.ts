import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount React trees after each test to keep the DOM isolated.
afterEach(() => {
  cleanup();
});
