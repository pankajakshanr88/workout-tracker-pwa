import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__e2e !== undefined, { timeout: 10000 });
  await page.evaluate(async () => { await (window as any).__e2e.resetDb(); });
  await page.reload();
  await page.waitForFunction(() => (window as any).__e2e !== undefined, { timeout: 10000 });
  await page.waitForFunction(() => {
    return document.querySelector('button') !== null ||
           document.querySelector('[role="button"]') !== null;
  }, { timeout: 10000 });
});

test('alerts screen shows sandbagging alert for flat reps', async ({ page }) => {
  await page.evaluate(() => {
    const ex = (window as any).__e2e.defaults()[1];
    const today = new Date();
    const d = (offset: number) => new Date(today.getTime() - offset * 86400000).toISOString().split('T')[0];
    (window as any).__e2e.seedFlatReps(ex.id, [d(3), d(1)], 95, 8);
  });

  // go to alerts via home button
  await page.getByTestId('smart-alerts').click();
  await expect(page).toHaveURL(/\/alerts/);

  await expect(page.getByText(/consistent reps across sets/i)).toBeVisible();
});


