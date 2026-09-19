import { test, expect } from "@playwright/test";

test("purchase advice acknowledges added units across scenario and SKU planning", async ({
  page,
}) => {
  await page.goto("/scenario");
  await page.getByLabel("Additional purchase quantity (units)").fill("5000");
  await expect(page.locator(".recommendation-panel")).toContainText(
    "5,000 units are already added",
  );
  await expect(page.locator(".recommendation-panel")).toContainText(
    "No further quantity is needed for the lead-time requirement",
  );
  await expect(page.locator(".recommendation-panel")).toContainText(
    "Expedite supply",
  );
  await expect(page.locator(".recommendation-panel")).not.toContainText(
    "630 additional units",
  );
  await page.getByRole("link", { name: "SKU Planning", exact: true }).click();
  await expect(page.locator(".recommendation-panel")).toContainText(
    "5,000 units are already added",
  );
  await expect(
    page.getByText("Available stock", { exact: true }),
  ).toBeVisible();
});

test("brief narrative and Berry exposure follow the active scenario", async ({
  page,
}) => {
  await page.goto("/scenario");
  await page.getByLabel("Portfolio scenario").selectOption("downside");
  await page
    .getByRole("link", { name: "Weekly Planning Brief", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demand is softening." }),
  ).toBeVisible();
  await expect(page.locator(".analyst-note")).toContainText("-7.9%");
  await expect(page.locator(".analyst-note")).not.toContainText(
    "Growth is coming",
  );
  await page
    .getByRole("link", { name: "Scenario Planning", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset to Base Plan", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "26 weeks", exact: true }).click();
  await page
    .getByRole("link", { name: "Weekly Planning Brief", exact: true })
    .click();
  const berry = page.locator(".priority-card").nth(1);
  await expect(berry).toContainText("Protect Berry supply");
  await expect(berry).toContainText("$62,000");
  await expect(berry).toContainText("Berry stock exposed to shortage");
  await expect(berry).not.toContainText("excess stock at cost");
  await expect(
    page.getByText("Berry purchasing needs a pause", { exact: true }),
  ).toHaveCount(0);
});

test("longer Peach lead time moves planned arrivals and introduces a real stockout", async ({
  page,
}) => {
  await page.goto("/scenario");
  await page.getByLabel("Planning SKU").selectOption("peach-6");
  await expect(
    page.getByText("Neither plan projects a stockout within this horizon.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("slider", { name: "Supplier lead time" }).fill("12");
  await expect(
    page.getByText("A stockout appears in the week of", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "SKU Planning", exact: true }).click();
  const order = page.locator("tr").filter({ hasText: "PLAN-8-0" });
  await expect(order).toContainText("Dec 14");
  await expect(order).not.toContainText("Oct 19");
  await expect(page.locator(".sku-title")).toContainText("High risk");
});
