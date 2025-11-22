import { test, expect } from '@playwright/test';

test.describe('Organizer Page', () => {
    test('should render the organizer page correctly', async ({ page }) => {
        await page.goto('/organizador');

        // Test Hero Section
        await expect(page.getByRole('heading', { name: /Divulgue sua corrida no ProximaCorrida/i })).toBeVisible();

        // Test Benefits Section (checking for key text)
        await expect(page.getByText(/Divulgação gratuita/i)).toBeVisible();
        await expect(page.getByText(/Alcance mais atletas/i)).toBeVisible();

        // Test How it Works Section
        await expect(page.getByText(/Preencha o formulário/i)).toBeVisible();
        await expect(page.getByText(/Nossa equipe valida/i)).toBeVisible();

        // Test Google Form Iframe OR Fallback Button
        // We check for either the iframe or the button, as implementation might vary slightly on initial load or responsive state
        const iframe = page.locator('iframe[src*="docs.google.com/forms"]');
        const button = page.getByRole('link', { name: /Preencher Formulário/i });

        // At least one of them should be visible. 
        // Note: Iframes can be tricky to test visibility if they load external content, 
        // but checking presence in DOM is a good start.
        const isIframeVisible = await iframe.count() > 0;
        const isButtonVisible = await button.isVisible();

        expect(isIframeVisible || isButtonVisible).toBeTruthy();
    });

    test('should have correct navigation links', async ({ page }) => {
        await page.goto('/');

        // Check Navigation based on viewport
        const isMobile = (page.viewportSize()?.width ?? 0) < 768;

        if (isMobile) {
            // Open Mobile Menu
            await page.getByLabel('Menu mobile').click();
            const mobileLink = page.getByTestId('mobile-menu').getByRole('link', { name: /Organizador/i });
            await expect(mobileLink).toHaveAttribute('href', '/organizador');
        } else {
            // Check Desktop Navbar
            const desktopLink = page.locator('nav').getByRole('link', { name: /Organizador/i }).first();
            await expect(desktopLink).toHaveAttribute('href', '/organizador');
        }

        // Check Footer
        const footerLink = page.locator('footer').getByRole('link', { name: /Área do Organizador/i });
        await expect(footerLink).toHaveAttribute('href', '/organizador');
    });
});
