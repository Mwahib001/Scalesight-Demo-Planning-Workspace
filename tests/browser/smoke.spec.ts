import { test, expect } from "@playwright/test";
const routes = [
  ["/", "Weekly Planning Brief"],
  ["/revenue-forecast", "Revenue Forecast"],
  ["/demand-forecast", "Demand Forecast"],
  ["/inventory", "Inventory Health"],
  ["/sku-planning", "SKU Planning"],
  ["/scenario", "Scenario Planning"],
  ["/intelligence", "Intelligence Center"],
  ["/managed-intelligence", "Managed Intelligence"],
  ["/assumptions", "Planning Assumptions"],
];
for (const [route, title] of routes)
  test(`route, refresh, responsive layout: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      "href",
      route,
    );
    expect(await page.locator("body").innerText()).not.toMatch(
      /NaN|Infinity|Northstar|Blockify|AI accuracy/,
    );
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size);
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          { message: `${route} at ${size.width}` },
        )
        .toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: `test-results/${route === "/" ? "brief" : route.slice(1)}-1440.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
test("canonical executive fixtures and exact priority context", async ({
  page,
}) => {
  await page.goto("/");
  for (const value of ["$318,000", "$42,000", "+8.4% vs previous 30 days"])
    await expect(page.getByText(value, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Review Mango plan" }).click();
  await expect(page.getByLabel("Planning SKU")).toHaveValue("mango-12");
  await expect(page.getByText("3.4 wks", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Weekly Planning Brief", exact: true })
    .click();
  await page.getByRole("link", { name: "Review inventory decision" }).click();
  await page
    .getByRole("link", { name: "Berry Hydration 6-Pack", exact: true })
    .click();
  await expect(page.getByLabel("Planning SKU")).toHaveValue("berry-6");
  await expect(page.getByText("13.1 wks", { exact: true })).toBeVisible();
});
test("scenario flows across routes and reset restores every input atomically", async ({
  page,
}) => {
  await page.goto("/scenario");
  await page
    .getByRole("slider", { name: "Additional demand uplift" })
    .fill("50");
  await page
    .getByRole("slider", { name: "Paid media spend change" })
    .fill("25");
  await page.getByLabel("Enable promotion").check();
  await page.getByRole("slider", { name: "Promotion discount" }).fill("20");
  await page.getByRole("slider", { name: "Supplier lead time" }).fill("7");
  await page.getByLabel("Incoming inventory (units)").fill("700");
  await page.getByLabel("Additional purchase quantity (units)").fill("2500");
  await page.getByLabel("Portfolio scenario").selectOption("upside");
  const weekly = await page
    .locator(".comparison-table tbody tr")
    .first()
    .locator("td")
    .last()
    .innerText();
  await page
    .getByRole("link", { name: "Demand Forecast", exact: true })
    .click();
  await expect(
    page.locator(".metric-card").first().locator("strong"),
  ).toHaveText(weekly);
  await page.getByRole("button", { name: "26 weeks", exact: true }).click();
  await page
    .getByRole("link", { name: "Weekly Planning Brief", exact: true })
    .click();
  await expect(page.getByText("$318,000", { exact: true })).toHaveCount(0);
  await expect(page.locator(".scenario-banner")).toBeVisible();
  await page
    .getByRole("link", { name: "Scenario Planning", exact: true })
    .click();
  await expect(
    page.getByRole("slider", { name: "Additional demand uplift" }),
  ).toHaveValue("50");
  await expect(
    page.getByRole("button", { name: "26 weeks", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Reset to Base Plan", exact: true })
    .last()
    .click();
  for (const name of [
    "Additional demand uplift",
    "Paid media spend change",
    "Promotion discount",
  ])
    await expect(page.getByRole("slider", { name })).toHaveValue("0");
  await expect(
    page.getByRole("slider", { name: "Supplier lead time" }),
  ).toHaveValue("5");
  await expect(page.getByLabel("Incoming inventory (units)")).toHaveValue(
    "1200",
  );
  await expect(
    page.getByLabel("Additional purchase quantity (units)"),
  ).toHaveValue("0");
  await expect(page.getByLabel("Enable promotion")).not.toBeChecked();
  await expect(page.getByLabel("Portfolio scenario")).toHaveValue("base");
  await expect(
    page.getByRole("button", { name: "13 weeks", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".scenario-banner")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Weekly Planning Brief", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Weekly Planning Brief", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$318,000", { exact: true })).toBeVisible();
});
test("inventory filters, keyboard drill-down, and recommendations", async ({
  page,
}) => {
  await page.goto("/inventory");
  await page.getByLabel("Risk filter").selectOption("High risk");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Search SKUs").fill("Orange");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("link", { name: "Blood Orange Hydration 12-Pack", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Planning SKU")).toHaveValue("orange-12");
  for (const text of [
    "What Changed",
    "Why It Matters",
    "Recommended Action",
    "Decision Required",
  ])
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(
    page.getByText("Previously Sep 28", { exact: true }),
  ).toBeVisible();
});
test("intelligence judgment, workflow keyboard tabs, assumptions, and pilot", async ({
  page,
}) => {
  await page.goto("/intelligence");
  await page.getByRole("button", { name: "opportunity", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Business context changes the decision",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/do not automatically cut purchasing/),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Managed Intelligence", exact: true })
    .click();
  await page.getByRole("tab", { name: /Monitor/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Analyze/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Turn a change into an explanation.",
  );
  await expect(
    page.getByRole("link", { name: "Book A Strategy Call" }),
  ).toHaveAttribute("href", "mailto:arman@scalesight.org");
  await page
    .getByRole("link", { name: "Planning Assumptions", exact: true })
    .click();
  await page.getByLabel("Source type").selectOption("confirmed_business_event");
  await expect(page.locator("tbody")).toContainText("Confirmed campaign");
});
test("chart toggles, demo tooltip, mobile navigation", async ({ page }) => {
  await page.goto("/demand-forecast");
  const actual = page.getByRole("button", { name: "Actual", exact: true });
  await actual.focus();
  await page.keyboard.press("Enter");
  await expect(actual).toHaveAttribute("aria-pressed", "false");
  await actual.click();
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  await page.locator(".demo-badge").focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "Inventory Health", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inventory Health", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".sidebar")).not.toBeVisible();
});

test("revenue period and forecast horizon stay connected", async ({ page }) => {
  await page.goto("/revenue-forecast");
  await page.getByRole("button", { name: "30 days", exact: true }).click();
  await expect(
    page.locator(".metric-card").first().locator("strong"),
  ).toHaveText("$318,000");
  await page
    .getByRole("link", { name: "Demand Forecast", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "4 weeks", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("link", { name: "Revenue Forecast", exact: true })
    .click();
  await page.getByRole("button", { name: "6 months", exact: true }).click();
  await page
    .getByRole("link", { name: "Demand Forecast", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "26 weeks", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
