import { test, expect } from '@playwright/test';

test.describe('UI Foundation Components', () => {
    test('should open and close modal', async ({ page }) => {
        await page.goto('/test-ui');

        // Open Modal
        await page.getByRole('button', { name: 'Open Modal' }).click();

        // Check visibility
        const modal = page.getByTestId('modal-content');
        await expect(modal).toBeVisible();
        await expect(page.getByText('Test Modal Title')).toBeVisible();

        // Close Modal
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(modal).toBeHidden();
    });

    test('should show toast notification', async ({ page }) => {
        await page.goto('/test-ui');

        // Trigger Toast
        await page.getByRole('button', { name: 'Show Toast' }).click();

        // Check visibility
        const toast = page.getByText('This is a test toast');
        await expect(toast).toBeVisible();

        // Wait for auto-dismiss (assuming 3s, we wait slightly longer or check if it disappears)
        // For speed, we might just check it appears. The auto-dismiss is harder to test quickly without waiting.
        // We can check if it disappears after some time.
        await expect(toast).toBeHidden({ timeout: 5000 });
    });
});
