import { test, expect } from '@playwright/test';


test.describe('error and feedback mesages test', () => {
  let inputEl;
  let feedbacEl;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('https://rss-aggregtor-al-shvets.vercel.app/');
    inputEl = await page.locator('#url-input');
    feedbacEl = await page.locator('.feedback');
  });

  test('empty input', async ({ page }) => {
    await page.getByLabel('add').click();
    await expect(feedbacEl).toHaveText('Не должно быть пустым');
  });

  test('doubled channel', async ({ page }) => {
    await inputEl.fill('https://www.votpusk.ru/news.xml');
    await page.getByLabel('add').click();
    await page.waitForTimeout(5000);
    await inputEl.fill('https://www.votpusk.ru/news.xml');
    await page.getByLabel('add').click();
    await page.waitForTimeout(5000);
    await expect(feedbacEl).toHaveText('RSS уже существует');
  });

  test('invalid link', async ({ page }) => {
    await inputEl.fill('dgbd');
    await page.getByLabel('add').click();
    await expect(feedbacEl).toHaveText('Ссылка должна быть валидным URL');
  });

  test('successful download RSS', async ({ page }) => {
    await inputEl.fill('https://www.votpusk.ru/news.xml');
    await page.getByLabel('add').click();
    await expect(feedbacEl).toHaveText('RSS успешно загружен');
  });

  test('notRSS', async ({ page }) => {
    await inputEl.fill('https://www.votpusk.ru/news');
    await page.getByLabel('add').click();
    await page.waitForTimeout(1000);
    await expect(feedbacEl).toHaveText('Ресурс не содержит валидный RSS');
  });

});

