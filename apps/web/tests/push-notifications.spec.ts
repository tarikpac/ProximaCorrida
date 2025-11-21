import { test, expect } from '@playwright/test';

test.describe('Push Notifications UI', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Service Worker registration and PushManager
        await page.addInitScript(() => {
            const mockSubscription = {
                endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                toJSON: () => ({
                    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                    keys: { p256dh: 'test-key', auth: 'test-auth' },
                }),
            };

            // Mock Notification API
            Object.defineProperty(window, 'Notification', {
                value: {
                    permission: 'default',
                    requestPermission: async () => 'granted',
                },
                writable: true,
            });

            // Mock Service Worker
            Object.defineProperty(navigator, 'serviceWorker', {
                value: {
                    register: async () => ({
                        pushManager: {
                            getSubscription: async () => null, // Initially no subscription
                            subscribe: async () => mockSubscription,
                        },
                    }),
                    ready: Promise.resolve({
                        pushManager: {
                            subscribe: async () => mockSubscription,
                        },
                    }),
                },
                writable: true,
            });
        });

        await page.goto('/');
    });

    test('should show explainer modal when clicking bell icon (unsubscribed)', async ({ page }) => {
        // Click the bell icon (filter by visibility to avoid ambiguity)
        await page.getByLabel('Notificações').filter({ visible: true }).click();

        // Check if explainer modal appears
        await expect(page.getByRole('heading', { name: 'Ativar Notificações' })).toBeVisible();
        await expect(page.getByText('Receba alertas de novas corridas')).toBeVisible();
    });

    test('should show preferences modal after enabling notifications', async ({ page }) => {
        await page.getByLabel('Notificações').filter({ visible: true }).click();

        // Click "Ativar Notificações"
        await page.getByRole('button', { name: 'Ativar Notificações' }).click();

        // Should transition to Preferences modal
        await expect(page.getByText('Preferências de Alerta')).toBeVisible();
        await expect(page.getByText('Selecione os estados')).toBeVisible();

        // Select a state (e.g., PB)
        await page.getByRole('button', { name: 'PB', exact: true }).click();

        // Check if it gets highlighted (using class check or style)
        const pbButton = page.getByRole('button', { name: 'PB', exact: true });
        await expect(pbButton).toHaveClass(/bg-lime-400/);

        // Save preferences
        // We need to mock the API call for saving preferences to avoid errors
        await page.route('**/notifications/subscribe', async (route) => {
            await route.fulfill({ status: 201, body: JSON.stringify({ success: true }) });
        });

        await page.getByRole('button', { name: 'Salvar Preferências' }).click();

        // Modal should close
        await expect(page.getByText('Preferências de Alerta')).not.toBeVisible();
    });
});
