import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation & Layout', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Desktop: Full navigation links are visible', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        const nav = page.locator('nav');

        // Check if desktop menu items are visible
        await expect(nav.getByRole('link', { name: 'Calendario' })).toBeVisible();
        await expect(nav.getByRole('link', { name: 'Estados' })).toBeVisible();
        await expect(nav.getByRole('link', { name: 'Calculadora de Pace' })).toBeVisible();
        await expect(nav.getByRole('link', { name: 'Organizador' })).toBeVisible();

        // Check if hamburger menu is hidden
        await expect(nav.getByLabel('Menu mobile')).toBeHidden();
    });

    test('Mobile: Hamburger menu works correctly', async ({ page }) => {
        // Set viewport to mobile size
        await page.setViewportSize({ width: 375, height: 667 });

        const nav = page.locator('nav');

        // Check if hamburger menu is visible
        const menuButton = nav.getByLabel('Menu mobile');
        await expect(menuButton).toBeVisible();

        // Check if desktop links are hidden
        await expect(nav.getByRole('link', { name: 'Calendario' })).toBeHidden();

        // Open mobile menu
        await menuButton.click();

        // Check if mobile menu items are visible
        const mobileMenu = page.getByTestId('mobile-menu');
        await expect(mobileMenu).toBeVisible();
        await expect(mobileMenu.getByRole('link', { name: 'Calendario' })).toBeVisible();
        await expect(mobileMenu.getByRole('link', { name: 'Estados' })).toBeVisible();

        // Close mobile menu
        await page.getByLabel('Fechar menu').click();
        await expect(mobileMenu).toBeHidden();
    });

    test('Active link styling', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });

        // Navigate to a page
        await page.goto('/estados');
        await page.waitForURL('**/estados');

        const nav = page.locator('nav');

        // Check if the link has the active class (lime-400 and border-b-2)
        const estadosLink = nav.getByRole('link', { name: 'Estados' });
        await expect(estadosLink).toBeVisible();
        await expect(estadosLink).toHaveClass(/text-lime-400/);
        await expect(estadosLink).toHaveClass(/border-b-2/);
        await expect(estadosLink).toHaveClass(/border-lime-400/);
    });
});
