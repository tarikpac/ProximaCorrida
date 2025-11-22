import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test.slow(); // Mark these tests as slow to increase timeout
    test('should navigate to Pace Calculator from Desktop Navbar', async ({ page }) => {
        // Use a larger viewport for desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check if link exists and is visible
        const calculatorLink = page.getByRole('link', { name: 'Calculadora de Pace' }).first();
        await expect(calculatorLink).toBeVisible();

        // Click link
        await calculatorLink.click({ force: true });

        // Verify URL
        await expect(page).toHaveURL(/.*\/calculadora-pace/);

        // Verify Page Title/Header
        await expect(page.getByRole('heading', { name: 'Calculadora de Pace' })).toBeVisible();
    });

    test('should navigate to Pace Calculator from Mobile Navbar', async ({ page }) => {
        // Use a mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open Mobile Menu
        await page.getByRole('button', { name: 'Menu mobile' }).click();

        // Check if link exists in mobile menu
        const mobileMenu = page.getByTestId('mobile-menu');
        const calculatorLink = mobileMenu.getByRole('link', { name: 'Calculadora de Pace' });
        await expect(calculatorLink).toBeVisible();

        // Click link
        await calculatorLink.click({ force: true });

        // Verify URL
        await expect(page).toHaveURL(/.*\/calculadora-pace/);
    });

    test('should navigate to Pace Calculator from Footer', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check if link exists in footer (might need scrolling, but Playwright auto-scrolls)
        // We use 'last' because the desktop navbar link might be found first if we just search by text
        // Ideally we'd target the footer specifically.
        const footer = page.locator('footer');
        const calculatorLink = footer.getByRole('link', { name: 'Calculadora de Pace' });

        await expect(calculatorLink).toBeVisible();

        // Click link
        await calculatorLink.click({ force: true });

        // Verify URL
        await expect(page).toHaveURL(/.*\/calculadora-pace/);
    });
});
