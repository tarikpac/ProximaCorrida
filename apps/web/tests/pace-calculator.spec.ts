import { test, expect } from '@playwright/test';

test.describe('Pace Calculator', () => {
    test('should calculate Pace when Distance and Time are provided', async ({ page }) => {
        await page.goto('/calculadora-pace');

        // Fill Distance (10 km)
        await page.getByLabel('Distância').fill('10');

        // Select Time (00:50:00) -> 0 hours, 50 minutes, 0 seconds
        // We need to target the selects. Since they don't have unique labels, we might need to use layout selectors or add test-ids.
        // Adding test-ids would be best, but for now let's try to select by order or value if possible.
        // The selects are inside the "Tempo" section.

        // Strategy: Use the container to find selects
        const timeContainer = page.locator('div').filter({ hasText: 'Tempo (hh:mm:ss)' }).last();
        const timeSelects = timeContainer.locator('select');

        // Hours (0)
        await timeSelects.nth(0).selectOption('00');
        // Minutes (50)
        await timeSelects.nth(1).selectOption('50');
        // Seconds (0)
        await timeSelects.nth(2).selectOption('00');

        // Click Calculate
        await page.getByRole('button', { name: 'Calcular' }).click();

        // Check Result (Pace should be 05:00 min/km)
        await expect(page.getByText('05:00 min/km')).toBeVisible();

        // Check Prediction Table (Marathon prediction should be visible)
        await expect(page.getByText('42,2 km')).toBeVisible();
    });

    test('should calculate Time when Distance and Pace are provided', async ({ page }) => {
        await page.goto('/calculadora-pace');

        // Fill Distance (10 km)
        await page.getByLabel('Distância').fill('10');

        // Select Pace (05:00 min/km) -> 5 minutes, 0 seconds
        const paceContainer = page.locator('div').filter({ hasText: 'Ritmo (min/km)' }).last();
        const paceSelects = paceContainer.locator('select');

        // Minutes (5)
        await paceSelects.nth(0).selectOption('05');
        // Seconds (0)
        await paceSelects.nth(1).selectOption('00');

        // Click Calculate
        await page.getByRole('button', { name: 'Calcular' }).click();

        // Check Result (Time should be 00:50:00)
        await expect(page.locator('.text-5xl')).toContainText('00:50:00');
        await expect(page.locator('.text-zinc-400.uppercase.tracking-wider')).toContainText('Tempo Estimado');
    });

    test('should calculate Marathon time correctly', async ({ page }) => {
        await page.goto('/calculadora-pace');

        // Fill Distance (42.195 km)
        await page.getByLabel('Distância').fill('42.195');

        // Select Pace (05:00 min/km)
        const paceContainer = page.locator('div').filter({ hasText: 'Ritmo (min/km)' }).last();
        const paceSelects = paceContainer.locator('select');
        await paceSelects.nth(0).selectOption('05');
        await paceSelects.nth(1).selectOption('00');

        // Click Calculate
        await page.getByRole('button', { name: 'Calcular' }).click();

        // Check Result (Time should be approx 03:30:58 or similar depending on precision)
        await expect(page.locator('.text-5xl')).toContainText('03:30:59');
    });

    test('should show error when inputs are missing', async ({ page }) => {
        await page.goto('/calculadora-pace');

        // Click Calculate without inputs (Defaults are 0, so technically inputs are "filled" with 0)
        // But Distance is empty.
        await page.getByRole('button', { name: 'Calcular' }).click();

        // Check Error
        await expect(page.getByText('Por favor, insira uma distância válida.')).toBeVisible();
    });

    test('should clear inputs and results when Clear button is clicked', async ({ page }) => {
        await page.goto('/calculadora-pace');

        // Fill inputs
        await page.getByLabel('Distância').fill('10');

        const timeContainer = page.locator('div').filter({ hasText: 'Tempo (hh:mm:ss)' }).last();
        const timeSelects = timeContainer.locator('select');
        await timeSelects.nth(1).selectOption('50'); // 50 min

        await page.getByRole('button', { name: 'Calcular' }).click();

        // Verify result is visible
        await expect(page.locator('.text-5xl')).toBeVisible();

        // Click Clear
        await page.getByRole('button', { name: 'Limpar' }).click();

        // Verify inputs are empty/reset
        await expect(page.getByLabel('Distância')).toBeEmpty();

        // Verify dropdowns reset to '00'
        await expect(timeSelects.nth(1)).toHaveValue('00');

        // Verify result is hidden
        await expect(page.locator('.text-5xl')).toBeHidden();
    });
});
