/**
 * Deduplication Module
 * Removes duplicate events across multiple providers
 */

import { StandardizedEvent } from '../interfaces';
import { generateMatchKey } from './normalization';

export interface DeduplicationResult {
    /** Deduplicated events */
    events: StandardizedEvent[];
    /** Number of duplicates removed */
    duplicatesRemoved: number;
    /** Details of duplicates for logging */
    duplicateDetails: DuplicateInfo[];
}

export interface DuplicateInfo {
    /** The match key that was duplicated */
    matchKey: string;
    /** The event that was kept (first occurrence) */
    keptEvent: {
        title: string;
        sourcePlatform: string;
        sourceUrl: string;
    };
    /** Events that were discarded as duplicates */
    discardedEvents: {
        title: string;
        sourcePlatform: string;
        sourceUrl: string;
    }[];
}

/**
 * Deduplicate events from multiple providers
 * 
 * Strategy:
 * - First event wins (based on array order, which respects provider priority)
 * - Match key: normalized_title + date + normalized_city + state
 * - Logs duplicates for monitoring
 * 
 * @param events - Events from all providers (should be ordered by provider priority)
 * @returns Deduplicated events with statistics
 */
export function deduplicateEvents(events: StandardizedEvent[]): DeduplicationResult {
    const seen = new Map<string, StandardizedEvent>();
    const duplicateMap = new Map<string, DuplicateInfo>();

    for (const event of events) {
        const matchKey = generateMatchKey(
            event.title,
            event.date,
            event.city,
            event.state
        );

        if (seen.has(matchKey)) {
            // This is a duplicate
            const existing = duplicateMap.get(matchKey);

            if (existing) {
                // Add to existing duplicate group
                existing.discardedEvents.push({
                    title: event.title,
                    sourcePlatform: event.sourcePlatform,
                    sourceUrl: event.sourceUrl,
                });
            } else {
                // First duplicate found for this key
                const keptEvent = seen.get(matchKey)!;
                duplicateMap.set(matchKey, {
                    matchKey,
                    keptEvent: {
                        title: keptEvent.title,
                        sourcePlatform: keptEvent.sourcePlatform,
                        sourceUrl: keptEvent.sourceUrl,
                    },
                    discardedEvents: [{
                        title: event.title,
                        sourcePlatform: event.sourcePlatform,
                        sourceUrl: event.sourceUrl,
                    }],
                });
            }
        } else {
            // First occurrence - keep it
            seen.set(matchKey, event);
        }
    }

    const duplicatesRemoved = events.length - seen.size;

    return {
        events: Array.from(seen.values()),
        duplicatesRemoved,
        duplicateDetails: Array.from(duplicateMap.values()),
    };
}

/**
 * Log deduplication results for monitoring
 */
export function logDeduplicationSummary(result: DeduplicationResult): void {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [DEDUP] Deduplication complete:`);
    console.log(`[${timestamp}] [DEDUP]   Total input: ${result.events.length + result.duplicatesRemoved}`);
    console.log(`[${timestamp}] [DEDUP]   Unique events: ${result.events.length}`);
    console.log(`[${timestamp}] [DEDUP]   Duplicates removed: ${result.duplicatesRemoved}`);

    if (result.duplicateDetails.length > 0) {
        console.log(`[${timestamp}] [DEDUP] Duplicate groups found: ${result.duplicateDetails.length}`);

        // Log first few duplicates for visibility
        const samplesToLog = Math.min(5, result.duplicateDetails.length);
        for (let i = 0; i < samplesToLog; i++) {
            const dup = result.duplicateDetails[i];
            console.log(`[${timestamp}] [DEDUP]   - "${dup.keptEvent.title}" (${dup.keptEvent.sourcePlatform}) had ${dup.discardedEvents.length} duplicate(s)`);
        }

        if (result.duplicateDetails.length > samplesToLog) {
            console.log(`[${timestamp}] [DEDUP]   ... and ${result.duplicateDetails.length - samplesToLog} more`);
        }
    }
}
