import { test, expect } from "@playwright/test";
const routes = [
  ["/", "Executive Intelligence Brief"],
  ["/forecast", "Demand Forecast"],
  ["/inventory", "Inventory & Purchasing"],
  ["/scenario", "Scenario Planning"],
  ["/customer-growth", "Customer & Growth Intelligence"],
  ["/managed-intelligence", "Managed Intelligence"],
  ["/partnership", "Blockify x ScaleSight Partnership"],
];
for (const [route, title] of routes) {
  test(`direct refresh, content and overflow: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      "href",
      route,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    expect(await page.locator("body").innerText()).not.toMatch(
      /Alias|Harbor Coast|vodka|beverages/i,
    );
    expect(errors).toEqual([]);
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 1024, height: 576 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `overflow ${route} at ${size.width}`,
      ).toBe(true);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => (document.documentElement.style.zoom = "1.25"));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "125% zoom",
    ).toBe(true);
    await page.evaluate(() => (document.documentElement.style.zoom = "1"));
    await page.screenshot({
      path: `test-results/${route === "/" ? "executive" : route.slice(1)}-1280.png`,
      fullPage: true,
    });
  });
}
test("forecast fixture, shared selection and explicit empty state", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Review forecast", exact: true })
    .click();
  await expect(page.getByLabel("SKU", { exact: true })).toHaveValue("SKU-104");
  await expect(page.getByText("9,420", { exact: true })).toBeVisible();
  await expect(page.getByText("18.4%", { exact: true })).toBeVisible();
  await page.getByLabel("Category", { exact: true }).selectOption("Belts");
  await expect(
    page.getByRole("heading", { name: "No committed demo series" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset to Atlas Carryall" }).click();
  await expect(page.getByText("9,420", { exact: true })).toBeVisible();
  await page.getByLabel("SKU", { exact: true }).selectOption("SKU-031");
  await page
    .getByRole("link", { name: "Scenario Planning", exact: true })
    .click();
  await expect(page.getByLabel("SKU", { exact: true })).toHaveValue("SKU-031");
});
test("inventory drawer calculation, focus trap, Escape and focus return", async ({
  page,
}) => {
  await page.goto("/inventory");
  const row = page.getByRole("button", { name: "Atlas Carryall SKU-104" });
  await row.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("3,879 units", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(row).toBeFocused();
  await row.click();
  await dialog.getByRole("link", { name: "Test scenario" }).click();
  await expect(page.getByLabel("SKU", { exact: true })).toHaveValue("SKU-104");
});
test("scenario live math, temporary analyst, session persistence and reset", async ({
  page,
}) => {
  await page.goto("/scenario");
  const demand = page.getByRole("slider", { name: /Demand change/ });
  await demand.fill("25");
  await expect(demand).toHaveValue("25");
  await page
    .getByRole("button", { name: "Apply to brief", exact: true })
    .click();
  await page.getByRole("link", { name: "View brief" }).click();
  await expect(
    page.getByText("Session scenario note", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Session scenario note", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Scenario Planning", exact: true })
    .click();
  await expect(demand).toHaveValue("25");
  await page
    .getByRole("button", { name: "Ask ScaleSight Analyst", exact: true })
    .click();
  await page
    .getByRole("button", { name: "What happens if demand increases 20%?" })
    .click();
  await expect(page.locator('[aria-live="polite"]').last()).toContainText(
    "Saved scenario inputs have not changed",
  );
  await page.keyboard.press("Escape");
  await expect(demand).toHaveValue("25");
  await page.getByRole("button", { name: "Reset scenario" }).click();
  await expect(demand).toHaveValue("0");
  await expect(page.getByText("$27,000", { exact: true })).toBeVisible();
});
test("analyst questions, fallback and keyboard close", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Ask ScaleSight Analyst",
    exact: true,
  });
  await trigger.click();
  await expect(page.getByRole("dialog").getByRole("heading")).toBeFocused();
  const questions = [
    "Why is SKU-104 at risk?",
    "What happens if demand increases 20%?",
    "Which SKUs tie up the most working capital?",
    "What changed since last week?",
    "Which purchasing decisions require attention?",
  ];
  for (const q of questions) {
    await page.getByRole("button", { name: q, exact: true }).click();
    await expect(page.locator(".analyst-answer p")).not.toBeEmpty();
  }
  await page.getByLabel("Find a supported question").fill("unmatched");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.locator(".analyst-answer")).toContainText(
    "This prototype supports the suggested demo questions.",
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
test("mobile menu and proposed partnership preserve truthful framing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Partnership & Pilot" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Blockify x ScaleSight Partnership",
      exact: true,
    }),
  ).toBeVisible();
  const content = await page.locator("main").innerText();
  expect(content).toContain("PROPOSED PARTNERSHIP MODEL");
  expect(content).not.toMatch(/\$|\d\s*%/);
  await page.getByRole("link", { name: "Discuss structure" }).first().click();
  await expect(page).toHaveURL(/#pilot$/);
});
