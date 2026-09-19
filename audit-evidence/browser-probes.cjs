/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const out = { routes: [], checks: [], events: [] };
const check = (name, passed, evidence) => out.checks.push({ name, status: passed ? 'pass' : 'fail', evidence });
const root = __dirname;
const routes = ['/', '/revenue-forecast', '/demand-forecast', '/inventory', '/sku-planning', '/scenario', '/intelligence', '/managed-intelligence', '/assumptions'];
async function main() {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const visit = async route => { await page.goto('http://127.0.0.1:3101' + route); await page.locator('h1').waitFor(); await page.waitForTimeout(400); };
  for (const route of routes) {
    await visit(route);
    for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(size);
      const immediate = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
      await page.waitForTimeout(450);
      const layout = await page.evaluate(() => {
        const outside = [...document.querySelectorAll('.recharts-surface text')].flatMap(el => {
          const svg = el.closest('svg'), b = el.getBoundingClientRect(), s = svg.getBoundingClientRect();
          return b.left < s.left - 1 || b.right > s.right + 1 || b.top < s.top - 1 || b.bottom > s.bottom + 1 ? [{ text: el.textContent, left: b.left, right: b.right, svgLeft: s.left, svgRight: s.right }] : [];
        });
        return { width: document.documentElement.scrollWidth, viewport: innerWidth, chartTextOutsideSvg: outside };
      });
      const file = `${route === '/' ? 'brief' : route.slice(1)}-${size.width}.png`;
      await page.screenshot({ path: path.join(root, file), fullPage: true });
      out.routes.push({ route, size, immediate, settled: layout, screenshot: file, heading: await page.locator('h1').innerText() });
      if (route === '/') {
        const folds = await page.locator('.priority-card').evaluateAll(cards => cards.map(el => ({
          title: el.querySelector('h3').textContent,
          titleTop: el.querySelector('h3').getBoundingClientRect().top,
          actionTop: el.querySelector('.action-copy').getBoundingClientRect().top,
          actionBottom: el.querySelector('.action-copy').getBoundingClientRect().bottom,
          ctaTop: el.querySelector('.priority-link').getBoundingClientRect().top,
          ctaBottom: el.querySelector('.priority-link').getBoundingClientRect().bottom,
        })));
        check(`Priority actions and CTAs above fold at ${size.width}x${size.height}`, folds.every(x => x.actionBottom <= size.height && x.ctaBottom <= size.height), folds);
      }
    }
  }
  check('All nine routes have no settled desktop horizontal overflow', out.routes.every(r => r.settled.width <= r.size.width), out.routes.filter(r => r.settled.width > r.size.width));
  check('All desktop chart text lies inside chart SVG bounds', out.routes.every(r => !r.settled.chartTextOutsideSvg.length), out.routes.filter(r => r.settled.chartTextOutsideSvg.length).map(r => ({ route: r.route, width: r.size.width, labels: r.settled.chartTextOutsideSvg })));
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit('/scenario');
  await page.getByRole('slider', { name: 'Additional demand uplift' }).fill('20');
  out.scenario = { table: await page.locator('table').innerText() };
  await page.getByRole('link', { name: 'SKU Planning', exact: true }).click();
  out.scenario.skuMetrics = await page.locator('.metrics').innerText();
  out.scenario.skuRecommendation = await page.locator('.recommendation-panel').innerText();
  await page.getByRole('link', { name: 'Inventory Health', exact: true }).click();
  out.scenario.inventoryRow = await page.locator('tr').filter({ hasText: 'Mango Hydration 12-Pack' }).innerText();
  await page.getByRole('link', { name: 'Weekly Planning Brief', exact: true }).click();
  out.scenario.briefPriority = await page.locator('.priority-card').first().innerText();
  out.scenario.briefMetrics = await page.locator('.metrics').innerText();
  check('Mango +20% persists and reconciles across four screens', /2\.8/.test(out.scenario.skuMetrics) && /2\.8/.test(out.scenario.inventoryRow) && /2\.8/.test(out.scenario.briefPriority) && /332,213/.test(out.scenario.briefMetrics), out.scenario);
  await page.getByRole('link', { name: 'Review inventory decision', exact: true }).click();
  await page.getByRole('link', { name: 'Scenario Planning', exact: true }).click();
  out.selection = { selected: await page.getByLabel('Planning SKU').inputValue(), uplift: await page.getByRole('slider', { name: 'Additional demand uplift' }).inputValue() };
  await page.getByLabel('Planning SKU').selectOption('mango-12');
  out.selection.returnedMangoUplift = await page.getByRole('slider', { name: 'Additional demand uplift' }).inputValue();
  check('SKU context navigation retains prior Mango override', out.selection.returnedMangoUplift === '20', out.selection);
  await visit('/inventory');
  const berryLink = page.getByRole('link', { name: 'Berry Hydration 6-Pack', exact: true });
  const href = await berryLink.getAttribute('href');
  const fresh = await browser.newPage();
  await fresh.goto('http://127.0.0.1:3101' + href);
  await fresh.getByLabel('Planning SKU').waitFor();
  const freshSku = await fresh.getByLabel('Planning SKU').inputValue();
  check('Berry link retains SKU context when opened directly', freshSku === 'berry-6', { href, actualSku: freshSku });
  await fresh.close();
  await visit('/scenario');
  await page.getByLabel('Portfolio scenario').selectOption('downside');
  await page.getByRole('link', { name: 'Weekly Planning Brief', exact: true }).click();
  const downside = { metrics: await page.locator('.metrics').innerText(), headings: await page.locator('h2').allTextContents() };
  check('Weekly analyst conclusion follows negative-growth scenario', !downside.headings.some(s => s.includes('Growth is coming')), downside);
  await visit('/revenue-forecast');
  const legends = await page.locator('.chart-legend button').allTextContents();
  check('Revenue chart provides historical/current/previous/base/upside/downside', ['Actual', 'Current forecast', 'Previous forecast', 'Base', 'Upside', 'Downside'].every(x => legends.includes(x)), legends);
  await visit('/demand-forecast');
  for (const sku of ['starter-kit', 'citrus-12', 'peach-6', 'orange-12', 'passion-12']) {
    await page.getByLabel('Planning SKU').selectOption(sku);
    await page.getByRole('button', { name: '13 weeks', exact: true }).click();
    await page.waitForTimeout(200);
    out.events.push({ sku, markers: await page.locator('.recharts-surface text.recharts-label').allTextContents() });
  }
  await page.getByLabel('Planning SKU').selectOption('peach-6');
  await page.screenshot({ path: path.join(root, 'peach-launch-marker.png'), fullPage: true });
  await visit('/sku-planning');
  out.inventoryMarkers = await page.locator('.recharts-surface text.recharts-label').allTextContents();
  check('Inventory trajectory names the stockout marker on the plot', out.inventoryMarkers.some(s => /stockout/i.test(s)), out.inventoryMarkers);
  await visit('/intelligence');
  const headings = await page.locator('h2').allTextContents();
  check('Intelligence page supplies all five required sections', ['Needs Attention', 'Opportunities', 'Changes Since Last Week', 'Upcoming Risks', 'Recommended Actions'].every(x => headings.includes(x)), headings);
  check('Human override is visible in the rendered intelligence page', (await page.locator('.judgment-banner').innerText()).includes('confirmed BFCM campaign'));
  await visit('/managed-intelligence');
  const steps = [];
  for (const label of ['Monitor', 'Analyze', 'Prioritize', 'Recommend', 'Review']) {
    await page.getByRole('tab', { name: new RegExp(label) }).click();
    steps.push({ label, content: await page.getByRole('tabpanel').innerText() });
  }
  check('All five managed workflow steps expose substantive output', steps.every(x => x.content.length > 100) && new Set(steps.map(x => x.content)).size === 5, steps);
  await page.getByText('Book A Strategy Call', { exact: false }).click();
  const booking = await page.locator('details').innerText();
  check('Strategy CTA reaches a booking destination', !(booking.includes('not connected') || booking.includes('does not submit')), booking);
  await visit('/scenario');
  const focus = page.getByRole('slider', { name: 'Additional demand uplift' });
  await focus.focus();
  out.focus = await focus.evaluate(el => ({ outline: getComputedStyle(el).outline, label: el.closest('label').innerText }));
  check('Scenario slider has a visible focus outline and label', !out.focus.outline.includes('none') && out.focus.label.includes('Additional demand uplift'), out.focus);
  out.runtimeErrors = errors;
  check('No uncaught browser runtime errors during audit', errors.length === 0, errors);
  out.summary = { pass: out.checks.filter(x => x.status === 'pass').length, fail: out.checks.filter(x => x.status === 'fail').length };
  await browser.close();
}
main().catch(error => { out.fatalError = error.stack; process.exitCode = 1; }).finally(() => { fs.writeFileSync(path.join(root, 'browser-probes.json'), JSON.stringify(out, null, 2) + '\n'); console.log(JSON.stringify({ summary: out.summary, fatalError: out.fatalError, checks: out.checks.map(({ name, status }) => ({ name, status })) }, null, 2)); });
