import { expect, test } from "@playwright/test";

test("home page loads and shows the project heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Global" }),
  ).toBeVisible();
});
