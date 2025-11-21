import { test, expect } from '@playwright/test';

test('landing loads RO and switches to EN', async ({ page }) => {
  await page.goto('/ro');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Organizează/i);
  await page.getByRole('button', { name: /^EN$/ }).click();
  await expect(page).toHaveURL(/\/en$/);
  // după switch ar trebui să vină textul ENG definit în en.json
  await expect(page.getByRole('button', { name: /Login|Sign in/i })).toBeVisible();
});
