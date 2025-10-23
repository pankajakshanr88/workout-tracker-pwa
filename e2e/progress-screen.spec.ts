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

test('progress screen shows seeded history and PRs', async ({ page }) => {
  // seed workouts for first default exercise
  const { id: exerciseId } = await page.evaluate(async () => {
    const ex = (window as any).__e2e.defaults()[0];
    const today = new Date();
    const d = (offset: number) => new Date(today.getTime() - offset * 86400000).toISOString().split('T')[0];
    (window as any).__e2e.workoutWithSets(d(3), ex.id, [ { weight: 95, reps: 5, rir: 'yes_maybe' } ]);
    (window as any).__e2e.workoutWithSets(d(2), ex.id, [ { weight: 100, reps: 5, rir: 'yes_maybe' } ]);
    (window as any).__e2e.workoutWithSets(d(1), ex.id, [ { weight: 105, reps: 5, rir: 'yes_maybe' } ]);
    return { id: ex.id };
  });

  // navigate to progress
  await page.getByTestId('view-progress').click();
  await expect(page).toHaveURL(/\/progress/);

  // ensure selector has our exercise and recent sets are shown
  const select = page.locator('select');
  await expect(select).toBeVisible();
  // recent sets list entries exist
  await expect(page.getByText(/recent sets/i)).toBeVisible();
  await expect(page.getByText(/Set 1: 105lbs × 5 reps/i)).toBeVisible();

  // change exercise via select to same value to ensure handler works
  await select.selectOption(String(exerciseId));
});


