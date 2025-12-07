/**
 * Scraper Configuration Module
 * Reads environment variables with sensible defaults
 */

export interface ScraperConfig {
    // Database
    databaseUrl: string;
    directUrl: string;

    // API
    apiBaseUrl: string;

    // Scraper Options
    detailTimeoutMs: number;
    regTimeoutMs: number;
    eventDelayMs: number;
    stalenessDays: number;

    // Logging
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    shouldLogDebug: boolean;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] ?? defaultValue;
}

function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export function loadConfig(): ScraperConfig {
    const logLevel = getEnvOrDefault('LOG_LEVEL', 'info') as ScraperConfig['logLevel'];
    const nodeEnv = process.env.NODE_ENV ?? 'production';

    const config: ScraperConfig = {
        // Database (required)
        databaseUrl: getEnvOrThrow('DATABASE_URL'),
        directUrl: getEnvOrDefault('DIRECT_URL', getEnvOrThrow('DATABASE_URL')),

        // API
        apiBaseUrl: getEnvOrDefault('API_BASE_URL', 'http://localhost:3000'),

        // Scraper Options (with defaults)
        detailTimeoutMs: parseInt(getEnvOrDefault('DETAIL_TIMEOUT_MS', '15000'), 10),
        regTimeoutMs: parseInt(getEnvOrDefault('REG_TIMEOUT_MS', '20000'), 10),
        eventDelayMs: parseInt(getEnvOrDefault('SCRAPER_EVENT_DELAY_MS', '500'), 10),
        stalenessDays: parseInt(getEnvOrDefault('SCRAPER_STALENESS_DAYS', '7'), 10),

        // Logging
        logLevel,
        shouldLogDebug: logLevel === 'debug' || nodeEnv === 'development',
    };

    return config;
}

export function logConfigSummary(config: ScraperConfig): void {
    console.log('=== Scraper Configuration ===');
    console.log(`  API Base URL: ${config.apiBaseUrl}`);
    console.log(`  Detail Timeout: ${config.detailTimeoutMs}ms`);
    console.log(`  Reg Timeout: ${config.regTimeoutMs}ms`);
    console.log(`  Event Delay: ${config.eventDelayMs}ms`);
    console.log(`  Staleness Days: ${config.stalenessDays}`);
    console.log(`  Log Level: ${config.logLevel}`);
    console.log('=============================');
}
