/**
 * Notifications Module
 * Triggers push notifications via API endpoint
 */

export interface NotificationPayload {
    eventId: string;
    eventTitle: string;
    eventState: string;
}

/**
 * Trigger push notification for a new event
 * Calls the API endpoint to dispatch notifications
 */
export async function triggerNotification(
    apiBaseUrl: string,
    payload: NotificationPayload
): Promise<boolean> {
    const endpoint = `${apiBaseUrl}/api/notifications/trigger`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.warn(
                `[NOTIFICATION] Failed to trigger notification for ${payload.eventTitle}: ${response.status} ${response.statusText}`
            );
            return false;
        }

        console.log(`[NOTIFICATION] Triggered for: ${payload.eventTitle} (${payload.eventState})`);
        return true;
    } catch (error) {
        console.warn(
            `[NOTIFICATION] Error triggering notification for ${payload.eventTitle}: ${(error as Error).message}`
        );
        return false;
    }
}

/**
 * Batch trigger notifications for multiple new events
 */
export async function triggerNotificationsBatch(
    apiBaseUrl: string,
    payloads: NotificationPayload[]
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const payload of payloads) {
        const result = await triggerNotification(apiBaseUrl, payload);
        if (result) {
            success++;
        } else {
            failed++;
        }
        // Small delay between notifications
        await new Promise((r) => setTimeout(r, 100));
    }

    return { success, failed };
}
