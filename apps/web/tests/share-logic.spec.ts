import { test, expect } from '@playwright/test';

test.describe('Social Sharing', () => {
    test('should open share modal on desktop when share button is clicked', async ({ page }) => {
        // We can use the /test-ui page if we add a ShareButton there, OR we can test on the real pages if we implement them.
        // Since Task 2.4/2.5 is integration, I should probably test the integration.
        // But for now, I haven't integrated it yet.
        // I'll add a ShareButton to /test-ui for testing the component in isolation first.

        await page.goto('/test-ui');

        // Click Share Button (we need to add it to test-ui first)
        await page.getByRole('button', { name: 'Share' }).click();

        // Expect Modal to appear
        await expect(page.getByText('Compartilhar corrida')).toBeVisible();

        // Check for options
        await expect(page.getByText('Copiar link')).toBeVisible();
        await expect(page.getByText('WhatsApp')).toBeVisible();
    });

    test('should copy link and show toast', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/test-ui');

        await page.getByRole('button', { name: 'Share' }).click();
        await page.getByText('Copiar link').click();

        // Check Toast
        await expect(page.getByText('Link copiado!')).toBeVisible();
    });
});
