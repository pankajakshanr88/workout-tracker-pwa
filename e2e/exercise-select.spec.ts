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

test('exercise select shows already-in-workout badges', async ({ page }) => {
  // Start workout
  const startBtn = page.getByTestId('start-workout');
  await startBtn.click();
  await expect(page).toHaveURL(/\/workout$/);

  // Navigate to exercise select
  await page.goto('/exercise-select');
  await expect(page.getByRole('heading', { name: /choose exercise/i })).toBeVisible();

  // Expect badges
  await expect(page.getByText(/already in today's workout/i)).toBeVisible();
});


