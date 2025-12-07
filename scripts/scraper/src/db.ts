/**
 * Database Module
 * Handles Prisma Client initialization and event operations
 */

import { PrismaClient } from '@prisma/client';
import { StandardizedEvent } from './interfaces';

let prisma: PrismaClient | null = null;

/**
 * Initialize Prisma Client
 */
export function initDatabase(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient({
            log: process.env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
    }
    return prisma;
}

/**
 * Disconnect Prisma Client
 */
export async function disconnectDatabase(): Promise<void> {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

/**
 * Get Prisma Client instance
 */
export function getDatabase(): PrismaClient {
    if (!prisma) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return prisma;
}

export interface UpsertResult {
    isNew: boolean;
    eventId: string;
}

/**
 * Upsert an event from standardized format
 * Returns whether the event is new (for notification trigger)
 */
export async function upsertEvent(event: StandardizedEvent): Promise<UpsertResult> {
    const db = getDatabase();

    // Check if event exists
    const existing = await db.event.findUnique({
        where: { sourceUrl: event.sourceUrl },
        select: { id: true },
    });

    if (existing) {
        // Update existing event
        await db.event.update({
            where: { sourceUrl: event.sourceUrl },
            data: {
                title: event.title,
                date: event.date,
                city: event.city ?? '',
                state: event.state ?? 'PB',
                distances: event.distances,
                regLink: event.regUrl ?? '',
                imageUrl: event.imageUrl,
                priceText: event.priceText,
                priceMin: event.priceMin,
                rawLocation: event.rawLocation,
                sourcePlatform: event.sourcePlatform,
                sourceEventId: event.sourceEventId,
                scrapedAt: new Date(),
                // updatedAt is automatic via @updatedAt
            },
        });

        return { isNew: false, eventId: existing.id };
    } else {
        // Create new event
        const created = await db.event.create({
            data: {
                title: event.title,
                date: event.date,
                city: event.city ?? '',
                state: event.state ?? 'PB',
                distances: event.distances,
                regLink: event.regUrl ?? '',
                sourceUrl: event.sourceUrl,
                sourcePlatform: event.sourcePlatform,
                sourceEventId: event.sourceEventId,
                imageUrl: event.imageUrl,
                priceText: event.priceText,
                priceMin: event.priceMin,
                rawLocation: event.rawLocation,
                scrapedAt: new Date(),
            },
        });

        return { isNew: true, eventId: created.id };
    }
}

/**
 * Check which source URLs are fresh and should be skipped
 * @param sourceUrls Array of source URLs to check
 * @param stalenessDays Number of days before an event is considered stale
 * @returns Set of fresh URLs that should be skipped
 */
export async function checkEventsFreshness(
    sourceUrls: string[],
    stalenessDays: number
): Promise<Set<string>> {
    if (sourceUrls.length === 0) {
        return new Set();
    }

    const db = getDatabase();

    // Calculate threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - stalenessDays);

    // Query for events that exist and are fresh
    const freshEvents = await db.event.findMany({
        where: {
            sourceUrl: { in: sourceUrls },
            updatedAt: { gte: thresholdDate },
        },
        select: { sourceUrl: true },
    });

    return new Set(freshEvents.map(e => e.sourceUrl));
}
