import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name:'evt_session', value:'devsession', url:'http://localhost:3000', path:'/' }]);
});

test('offers list (provider)', async ({ page }) => {
  await page.goto('/ro/offers');
  await expect(page.getByText(/Offers \(Provider\)/)).toBeVisible();
  // dacă mock returnează items, verifică o celulă:
  // await expect(page.getByText(/Wedding Band/)).toBeVisible();
});

test('events create (client)', async ({ page }) => {
  await page.goto('/ro/events');
  await page.getByLabel(/Title/i).fill('Eveniment Test');
  await page.getByLabel(/^Budget$/i).fill('2500');
  await page.getByRole('button', { name: /Create/i }).click();
  await expect(page.getByText(/Created/i)).toBeVisible();
});
