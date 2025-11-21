import { useState, useEffect } from 'react';
import { urlBase64ToUint8Array } from '../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// Fallback key for development/testing
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BN0NI3i3loBxt9PicVqQ8Il-2uoagwLGUTUWldJxwqZc1EifMqeqgnfv7ChXeT0rQ1WCnsglZTDmwj31qkvuUwo';

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [statePreferences, setStatePreferences] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission);
            registerServiceWorker();
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);

            if (sub) {
                // Fetch preferences if subscription exists
                fetchPreferences(sub.endpoint);
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    const fetchPreferences = async (endpoint: string) => {
        try {
            const response = await fetch(`${API_URL}/notifications/preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint }),
            });
            if (response.ok) {
                const prefs = await response.json();
                setStatePreferences(prefs);
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        }
    };

    const subscribeToPush = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID public key not found');
            return;
        }

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            setSubscription(sub);
            setPermission('granted');

            // Initial save with empty preferences or default
            await saveSubscription(sub, []);
            return sub;
        } catch (error) {
            console.error('Failed to subscribe:', error);
            setPermission('denied');
        } finally {
            setLoading(false);
        }
    };

    const saveSubscription = async (sub: PushSubscription, preferences: string[]) => {
        try {
            await fetch(`${API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: sub.toJSON().keys,
                    statePreferences: preferences,
                    userAgent: navigator.userAgent,
                }),
            });
            setStatePreferences(preferences);
        } catch (error) {
            console.error('Failed to save subscription:', error);
        }
    };

    const updatePreferences = async (preferences: string[]) => {
        if (subscription) {
            setLoading(true);
            await saveSubscription(subscription, preferences);
            setLoading(false);
        }
    };

    return {
        permission,
        subscription,
        statePreferences,
        loading,
        subscribeToPush,
        updatePreferences,
    };
}
