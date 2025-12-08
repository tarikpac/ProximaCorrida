/**
 * Standardized Event Interface
 * Copied from apps/api/src/scraper/interfaces/standardized-event.interface.ts
 */
export interface StandardizedEvent {
    title: string;
    date: Date;
    city: string | null;
    state: string | null;
    distances: string[];
    regUrl: string | null;
    sourceUrl: string;
    sourcePlatform: string;
    sourceEventId?: string | null;
    imageUrl?: string | null;
    priceText?: string | null;
    priceMin?: number | null;
    organizerName?: string | null;
    rawLocation?: string | null;
}

/**
 * Scraper Options Interface
 */
export interface ScraperOptions {
    detailTimeoutMs: number;
    regTimeoutMs: number;
    eventDelayMs: number;
    stalenessDays: number;
    shouldLogDebug: boolean;
}

// Re-export provider interfaces
export * from './provider';
