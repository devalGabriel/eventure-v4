import { test, expect } from '@playwright/test';

test('register (mock) redirects to dashboard', async ({ page }) => {
  await page.goto('/ro/register');
  await page.getByLabel(/Email/i).fill('new@example.com');
  await page.getByLabel(/Parol/).fill('123456');
  await page.getByRole('button', { name: /Creează cont/i }).click();
  await expect(page).toHaveURL(/\/ro\/dashboard/);
});

test('guard redirects to login when no session', async ({ page }) => {
  await page.goto('/ro/dashboard');
  await expect(page).toHaveURL(/\/ro\/login\?next=/);
});

test('login (mock) sets cookie and goes dashboard', async ({ page, context }) => {
  await page.goto('/ro/login');
  await page.getByLabel(/Email/i).fill('gabriel@example.com');
  await page.getByLabel(/Parol/).fill('123456');
  await page.getByRole('button', { name: /Intră/i }).click();
  // cookie set by mock sign-in
  const cookies = await context.cookies();
  const has = cookies.some(c => c.name === 'evt_session');
  expect(has).toBeTruthy();
  await expect(page).toHaveURL(/\/ro\/dashboard/);
});
