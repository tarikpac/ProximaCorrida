export class CreateSubscriptionDto {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    statePreferences: string[];
    userAgent?: string;
}

export class GetPreferencesDto {
    endpoint: string;
}
