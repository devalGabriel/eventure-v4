import { test, expect } from '@playwright/test';
import path from 'path';

test.beforeEach(async ({ context }) => {
  // injectează o sesiune falsă înainte de fiecare test
  await context.addCookies([{ name:'evt_session', value:'devsession', url:'http://localhost:3000', path:'/' }]);
});

test('profile update + avatar upload (mock direct)', async ({ page }) => {
  await page.goto('/ro/profile');
  await page.getByLabel(/Nume/i).fill('Gabriel Test');
  await page.getByRole('button', { name: /Salvează/i }).click();
  await expect(page.getByText(/Profil salvat/i)).toBeVisible();

  const file = path.resolve(__dirname, '../assets/avatar.jpg');
  // găsește input[type=file] din butonul "Încarcă"
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(file);
  // cropper -> dacă ai dialog, simulează confirmarea:
  // await page.getByRole('button', { name: /Salvează/i }).click();
  await expect(page.getByText(/Avatar/i)).toBeVisible();
});
