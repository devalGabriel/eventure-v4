import { test, expect } from '@playwright/test';

test('landing loads in Romanian', async ({ page }) => {
  await page.goto('/ro');
  await expect(page.getByText('Organizează evenimente. Mai rapid.')).toBeVisible();
});

test('protected redirects to login', async ({ page }) => {
  await page.goto('/ro/(protected)/dashboard');
  await expect(page).toHaveURL(/\/ro\/login/);
});
