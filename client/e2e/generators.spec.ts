import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2f1sAAAAASUVORK5CYII=',
  'base64',
);

test('i tre generatori restano utilizzabili con una sola navigazione', async ({ page }, testInfo) => {
  await page.route('https://e2e.invalid/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: tinyPng });
  });
  await page.goto('/');

  const visibleNavigation = page.locator('nav:visible');
  await expect(visibleNavigation).toHaveCount(1);
  if (testInfo.project.name.startsWith('mobile')) {
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await expect(page.locator('.header-navigation')).toBeHidden();
  } else {
    await expect(page.locator('.header-navigation')).toBeVisible();
    await expect(page.locator('.bottom-nav')).toBeHidden();
  }

  const lineupPlayers = page.locator('select[id^="lineup-player-"]');
  await expect(lineupPlayers).toHaveCount(11);
  for (let index = 0; index < 11; index += 1) {
    await lineupPlayers.nth(index).selectOption({ index: index + 1 });
  }
  await page.getByLabel('⚽ Squadra avversaria').fill('Amatori Club');
  await page.getByRole('button', { name: /Genera formazione/ }).click();
  await expect(page.getByRole('img', { name: 'Formazione titolare generata' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pubblica su Instagram$/ })).toBeVisible();

  await visibleNavigation.getByRole('button', { name: /Goal/ }).click();
  await page.getByLabel('Giocatore').selectOption('davide_fava');
  await page.getByLabel('Squadra casa').fill('Casalpoglio');
  await page.getByLabel('Squadra ospite').fill('Amatori Club');
  await page.getByLabel('Parziale casa').fill('1');
  await page.getByLabel('Minuto del gol').fill('21');
  await page.getByRole('button', { name: /Genera goal/ }).click();
  await expect(page.getByRole('img', { name: 'Grafica goal generata' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pubblica su Instagram$/ })).toBeVisible();

  await visibleNavigation.getByRole('button', { name: /Risultato/ }).click();
  await page.getByLabel('Squadra casa').fill('Casalpoglio');
  await page.getByLabel('Squadra ospite').fill('Amatori Club');
  await expect(page.getByText('Marcatori extra')).toHaveCount(0);
  await page.getByRole('button', { name: /Genera immagine/ }).click();
  await expect(page.getByRole('img', { name: 'Grafica del risultato finale' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pubblica su Instagram$/ })).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
});
