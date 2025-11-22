import { test, expect } from '@playwright/test';

test.describe('Institutional Pages', () => {

    test('Sobre page renders correctly', async ({ page }) => {
        await page.goto('/sobre');
        await expect(page).toHaveTitle(/Sobre o ProximaCorrida/);
        await expect(page.getByRole('heading', { name: 'Nossa Missão' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Como o ProximaCorrida te ajuda' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Fale com a gente' })).toBeVisible();
    });

    test('Estados page renders grid', async ({ page }) => {
        await page.goto('/estados');
        await expect(page).toHaveTitle(/Corridas por Estado/);
        await expect(page.getByRole('heading', { name: 'Corridas por Estado' })).toBeVisible();

        // Check that we have state cards
        await expect(page.getByText('Paraíba')).toBeVisible();

        // Check that 27 cards exist (one for each state)
        const cards = page.locator('main a[href^="/br/"]');
        await expect(cards).toHaveCount(27);
    });

    test('Navigation from Home to Sobre', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        // Check Footer link
        const footerSobreLink = page.locator('footer').getByRole('link', { name: 'Sobre' });
        // Scroll to footer to ensure visibility
        await footerSobreLink.scrollIntoViewIfNeeded();
        await expect(footerSobreLink).toBeVisible();
        await footerSobreLink.click({ force: true });
        await expect(page).toHaveURL(/.*\/sobre/, { timeout: 10000 });
    });

    test('Navigation from Home to Estados', async ({ page, isMobile }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        if (isMobile) {
            // Open mobile menu
            await page.getByLabel('Menu mobile').click();
            // Click link in mobile menu
            await page.getByTestId('mobile-menu').getByRole('link', { name: 'Estados' }).click();
        } else {
            // Desktop menu
            const navbarEstadosLink = page.locator('nav').getByRole('link', { name: 'Estados' }).first();
            await expect(navbarEstadosLink).toBeVisible();
            await navbarEstadosLink.click({ force: true });
        }

        await expect(page).toHaveURL(/.*\/estados/, { timeout: 10000 });
    });
});
