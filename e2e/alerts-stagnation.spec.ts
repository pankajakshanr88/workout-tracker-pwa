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

test('alerts screen shows stagnation alert for same weights', async ({ page }) => {
  await page.evaluate(() => {
    const ex = (window as any).__e2e.defaults()[0];
    const today = new Date();
    const d = (offset: number) => new Date(today.getTime() - offset * 86400000).toISOString().split('T')[0];
    (window as any).__e2e.seedSameWeightWorkouts(ex.id, [d(5), d(3), d(1)], 135, [ [5,5,5,5,5], [5,5,5,5,5], [5,5,5,5,5] ]);
  });

  // go to alerts
  await page.getByTestId('smart-alerts').click();
  await expect(page).toHaveURL(/\/alerts/);

  // Expect stagnation wording
  await expect(page.getByText(/hasn't progressed|stuck at the same weight/i)).toBeVisible();
});


