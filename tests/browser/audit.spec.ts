import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/forecast",
  "/inventory",
  "/scenario",
  "/customer-growth",
  "/managed-intelligence",
  "/partnership",
];
for (const route of routes)
  test(`audit contrast and loaded Inter: ${route}`, async ({ page }, info) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() =>
        Array.from(document.fonts).some(
          (f) => f.family === "Inter" && f.status === "loaded",
        ),
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    await info.attach("axe-results", {
      body: JSON.stringify(result.violations, null, 2),
      contentType: "application/json",
    });
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
test("actual forecast markers and toggles are keyboard-operable", async ({
  page,
}) => {
  await page.goto("/forecast");
  const actual = page.getByRole("button", {
    name: "Historical actual",
    exact: false,
  });
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  const before = await page.locator(".recharts-line-curve").count();
  await actual.focus();
  await page.keyboard.press("Enter");
  await expect(actual).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator(".recharts-line-curve").count()).toBe(before - 1);
  const base = page.getByRole("button", { name: "Updated base", exact: false });
  await base.click();
  expect(await page.locator(".recharts-line-curve").count()).toBe(before - 2);
  await actual.click();
  await base.click();
  await page
    .getByRole("button", { name: "Event 1: Promotion", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".chart-event-detail")).toContainText("Promotion");
  await expect(page.locator(".chart-event-detail")).toContainText("2026-08-24");
  await expect(page.locator(".chart-event-detail")).toContainText(
    "Unconfirmed",
  );
  await expect(page.locator(".chart-event-detail")).toContainText("8%");
  await page
    .getByRole("button", { name: "Event 2: Paid campaign", exact: true })
    .hover();
  await expect(page.locator(".chart-event-detail")).toContainText(
    "Paid campaign",
  );
});
test("all four shared filters survive routes and reload; new session is clean", async ({
  page,
  browser,
}) => {
  await page.goto("/forecast");
  await page.getByLabel("SKU", { exact: true }).selectOption("SKU-031");
  await page.getByLabel("Category", { exact: true }).selectOption("Belts");
  await page
    .getByLabel("Channel", { exact: true })
    .selectOption("Online Store");
  await page.getByLabel("Horizon", { exact: true }).selectOption("26");
  for (const route of ["/inventory", "/scenario"]) {
    await page.goto(route);
    await expect(page.getByLabel("SKU", { exact: true })).toHaveValue(
      "SKU-031",
    );
    await expect(page.getByLabel("Category", { exact: true })).toHaveValue(
      "Belts",
    );
    await expect(page.getByLabel("Channel", { exact: true })).toHaveValue(
      "Online Store",
    );
    await expect(page.getByLabel("Horizon", { exact: true })).toHaveValue("26");
  }
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await fresh.goto("http://127.0.0.1:3100/scenario");
  await expect(fresh.getByLabel("SKU", { exact: true })).toHaveValue("SKU-104");
  expect(await fresh.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await context.close();
});
test("computed typography, shell dimensions and chart legend at zoom stress", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const css = await page.evaluate(() => {
    const style = (s: string) => getComputedStyle(document.querySelector(s)!);
    return {
      sidebar: style(".sidebar").width,
      header: style(".topbar").height,
      max: style(".main-content").maxWidth,
      h1: style("h1").fontSize,
      h2: style("h2").fontSize,
      body: style("body").fontSize,
      label: style(".metric-label").fontSize,
      radius: style(".metric-card").borderRadius,
    };
  });
  expect(css).toEqual({
    sidebar: "240px",
    header: "68px",
    max: "1280px",
    h1: "32px",
    h2: "24px",
    body: "14px",
    label: "12px",
    radius: "14px",
  });
  await page.setViewportSize({ width: 1023, height: 800 });
  await expect(page.locator(".sidebar")).not.toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/forecast");
  await page.evaluate(() => (document.documentElement.style.zoom = "1.25"));
  await page
    .getByRole("button", { name: "Event 5: Product launch", exact: true })
    .focus();
  await expect(page.locator(".chart-event-detail")).toContainText(
    "New color release",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("mobile visits every route and analyst drawer has accessible semantics", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    await page
      .getByRole("button", { name: "Ask ScaleSight Analyst", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toBeFocused();
    expect(await dialog.getByRole("button").count()).toBe(7);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Atlas Carryall SKU-104" }).focus();
  await page.keyboard.press("Enter");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});
