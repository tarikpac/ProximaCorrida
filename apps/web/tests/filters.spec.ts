import { test, expect } from '@playwright/test';

test.describe('Advanced Search & Filters', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should open filter drawer when clicking "Onde"', async ({ page }) => {
        await page.getByTestId('filter-location-trigger').click();
        await expect(page.getByTestId('filter-drawer-panel')).toBeVisible();
        await expect(page.locator('text=Localização')).toBeVisible();
    });

    test('should update URL when selecting a state', async ({ page }) => {
        await page.getByTestId('filter-location-trigger').click();
        const drawer = page.getByTestId('filter-drawer-panel');
        await expect(drawer).toBeVisible();
        await page.waitForTimeout(1000);

        // Use evaluate to set select value
        await page.evaluate(() => {
            const drawer = document.querySelector('[data-testid="filter-drawer-panel"]');
            const select = drawer?.querySelector('select');
            if (select) {
                select.value = 'PE';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await page.waitForTimeout(500);

        // Verify UI
        await expect(drawer.locator('select')).toHaveValue('PE');

        await drawer.locator('button:has-text("Aplicar Filtros")').click({ force: true });

        await expect(page).toHaveURL(/.*\/br\/pe/);
        await expect(page.getByTestId('filter-location-trigger')).toContainText('PE', { ignoreCase: true });
    });

    test('should update URL when selecting distances', async ({ page }) => {
        await page.getByTestId('filter-distance-trigger').click();
        const drawer = page.getByTestId('filter-drawer-panel');
        await expect(drawer).toBeVisible();
        await page.waitForTimeout(1000);

        // Use evaluate to click 5K button inside drawer
        await page.evaluate(() => {
            const drawer = document.querySelector('[data-testid="filter-drawer-panel"]');
            const buttons = Array.from(drawer?.querySelectorAll('button') || []);
            const btn5k = buttons.find(b => b.textContent?.trim() === '5K');
            if (btn5k) (btn5k as HTMLElement).click();
            else console.error('5K button not found in drawer');
        });
        await page.waitForTimeout(500);

        await drawer.locator('button:has-text("Aplicar Filtros")').click({ force: true });

        await expect(page).toHaveURL(/.*distances=5km/);
        await expect(page.getByTestId('filter-distance-trigger')).toContainText('1 Selecionada(s)');
    });

    test('should show active filter chips', async ({ page }) => {
        await page.getByTestId('filter-location-trigger').click();
        const drawer = page.getByTestId('filter-drawer-panel');
        await expect(drawer).toBeVisible();

        await drawer.locator('input[placeholder="Todas as cidades"]').fill('Recife');
        await page.waitForTimeout(500);
        await drawer.locator('button:has-text("Aplicar Filtros")').click({ force: true });

        await expect(page).toHaveURL(/.*city=Recife/);
        // Wait for chip to appear
        await expect(page.locator('div').filter({ hasText: 'Recife' }).first()).toBeVisible();
    });

    test('should update URL on global search', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Buscar por nome, cidade, organizador..."]');
        await searchInput.fill('Maratona');

        // Wait for debounce
        await page.waitForTimeout(600);

        await expect(page).toHaveURL(/.*query=Maratona/);
        await expect(page.locator('div').filter({ hasText: 'Maratona' }).first()).toBeVisible();
    });
});
