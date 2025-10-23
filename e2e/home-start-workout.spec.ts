import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for e2e bridge to be available
  await page.waitForFunction(() => (window as any).__e2e !== undefined, { timeout: 10000 });

  // Reset database and reload
  await page.evaluate(async () => {
    await (window as any).__e2e.resetDb();
  });
  await page.reload();

  // Wait for bridge again after reload
  await page.waitForFunction(() => (window as any).__e2e !== undefined, { timeout: 10000 });

  // Wait for any button to be present (don't wait for database to be ready)
  await page.waitForFunction(() => {
    return document.querySelector('button') !== null ||
           document.querySelector('[role="button"]') !== null;
  }, { timeout: 10000 });
});

test('start workout, complete first set, see PR modal then rest', async ({ page }) => {
  // Wait for home to load and button to be enabled
  const startBtn = page.getByTestId('start-workout');
  await expect(startBtn).toBeEnabled();
  await startBtn.click();

  // On workout page, fill inputs
  await expect(page).toHaveURL(/\/workout$/);

  // weight input labeled
  const weightInput = page.getByLabel(/weight \(lbs\)/i);
  const repsInput = page.getByLabel(/reps completed/i);
  await weightInput.fill('95');
  await repsInput.fill('5');

  // select RIR "Yes, maybe"
  const rirBtn = page.getByRole('button', { name: /yes, maybe/i });
  await rirBtn.click();

  const completeBtn = page.getByRole('button', { name: /complete set/i });
  await expect(completeBtn).toBeEnabled();
  await completeBtn.click();

  // PR Celebration may or may not show depending on prior data, but on fresh DB it should
  const prTitle = page.getByRole('heading', { name: /new (weight|volume|rep) pr/i });
  await expect(prTitle).toBeVisible();
  await expect(page.getByText(/lbs × \d+/i)).toBeVisible();

  // Continue
  await page.getByRole('button', { name: /continue workout/i }).click();

  // Should navigate to rest screen
  await expect(page).toHaveURL(/\/workout\/rest$/);
});


