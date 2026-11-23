import { expect, test } from '@playwright/test';

test('user generates and downloads a synchronous report', async ({ page, request }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '同步报表导出' })).toBeVisible();
  await page.getByTestId('report-name').fill('quarterly-sales');
  await page.getByTestId('export-button').click();

  const status = page.getByTestId('status');
  await expect(status).toHaveAttribute('data-state', 'ready');
  await expect(status).toContainText('报表已生成');

  const download = page.getByTestId('download-link');
  await expect(download).toBeVisible();
  const href = await download.getAttribute('href');
  expect(href).toMatch(/^http:\/\/127\.0\.0\.1:8080\/downloads\/report-.*\.csv$/);

  const response = await request.get(href);
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('quarterly-sales,42');
});
