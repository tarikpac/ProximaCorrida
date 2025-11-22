import { test, expect } from '@playwright/test';

test.describe('Footer Expansion', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Footer contains all required links', async ({ page }) => {
        // Check for main links
        await expect(page.getByRole('link', { name: 'Sobre' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Estados' }).last()).toBeVisible(); // .last() because it's also in navbar
        await expect(page.getByRole('link', { name: 'Calculadora de Pace' }).last()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Área do Organizador' }).last()).toBeVisible();

        // Check for legal links
        await expect(page.getByRole('link', { name: 'Termos de Uso' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Política de Privacidade' })).toBeVisible();
    });

    test('Footer contains social icons', async ({ page }) => {
        await expect(page.getByLabel('Instagram')).toBeVisible();
    });

    test('Footer has correct styling structure', async ({ page }) => {
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
        await expect(footer).toHaveClass(/bg-black/);
        await expect(footer).toHaveClass(/border-t/);
    });
});
