import { expect, test } from "@playwright/test";

// Smoke test for the atlas shell. It deliberately asserts the non-WebGL UI
// (panel, readout, controls) — headless WebGL is unreliable, and the panel
// renders seeded events regardless of whether the globe paints.
test("atlas shell renders the panel, readout, and controls", async ({
  page,
}) => {
  await page.goto("/");

  // Master widget header.
  await expect(page.getByText("PLANET ATLAS")).toBeVisible();

  // Viewport-ranked panel: live count + a high-importance seeded event.
  await expect(page.getByText(/events in view/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Great Pyramid of Giza" }),
  ).toBeVisible();

  // Layer toggles (in the master widget).
  const news = page.getByRole("button", { name: "News", exact: true });
  await expect(news).toHaveAttribute("aria-pressed", "true");
  await news.click();
  await expect(news).toHaveAttribute("aria-pressed", "false");

  // Search inputs and the toolbar tools are present. The tools are a radiogroup
  // (explore/add/inspect), so they expose the `radio` role, not `button`.
  await expect(page.getByLabel("Search events")).toBeVisible();
  await expect(page.getByLabel("Search for a place")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Explore" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Inspect" })).toBeVisible();

  // The immersive-mode toggle lives on the same toolbar as the restore control.
  await expect(
    page.getByRole("button", { name: "Hide interface" }),
  ).toBeVisible();
});
