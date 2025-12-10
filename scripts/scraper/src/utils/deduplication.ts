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
 * Deduplicate events by registration URL
 * If two events have the same regUrl, they are definitely the same event
 * regardless of title differences
 * 
 * @param events - Events to deduplicate
 * @returns Deduplicated events
 */
export function deduplicateByRegUrl(events: StandardizedEvent[]): DeduplicationResult {
    const seen = new Map<string, StandardizedEvent>();
    const duplicateMap = new Map<string, DuplicateInfo>();

    for (const event of events) {
        // Normalize regUrl for comparison (remove trailing slashes, query params variations)
        const regUrl = normalizeUrl(event.regUrl || '');

        // Skip if no regUrl
        if (!regUrl) {
            // Keep events without regUrl
            seen.set(event.sourceUrl, event);
            continue;
        }

        if (seen.has(regUrl)) {
            // This is a duplicate by regUrl
            const existing = duplicateMap.get(regUrl);

            if (existing) {
                existing.discardedEvents.push({
                    title: event.title,
                    sourcePlatform: event.sourcePlatform,
                    sourceUrl: event.sourceUrl,
                });
            } else {
                const keptEvent = seen.get(regUrl)!;
                duplicateMap.set(regUrl, {
                    matchKey: `regUrl:${regUrl.substring(0, 50)}...`,
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
            seen.set(regUrl, event);
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
 * Check if a URL is just a listing/category page (not an actual event)
 * These should not be used for deduplication
 */
function isListingPage(url: string): boolean {
    if (!url) return true;

    const listingPatterns = [
        /brasilquecorre\.com\/[a-z]+$/i,  // brasilquecorre.com/riograndedonorte
        /brasilquecorre\.com\/estado\//i,
        /corridasbr\.com\.br\/[a-z]{2}\/calendario/i,  // State calendar pages
        /ticketsports\.com\.br\/eventos$/i,
        /minhasinscricoes\.com\.br\/eventos$/i,
    ];

    return listingPatterns.some(pattern => pattern.test(url));
}

/**
 * Normalize a URL for comparison
 * - Decodes URL encoding (+ and %20 both become space, then normalize)
 * - Lowercase everything
 * - Removes trailing slashes
 * - Removes common tracking params
 * - Extracts event ID for ticketsports URLs
 */
function normalizeUrl(url: string): string {
    if (!url) return '';

    // Skip listing pages
    if (isListingPage(url)) return '';

    try {
        // Decode URL-encoded characters first
        let decoded = url;
        try {
            decoded = decodeURIComponent(url.replace(/\+/g, ' '));
        } catch {
            // If decode fails, continue with original
        }

        const parsed = new URL(decoded);

        // Remove common tracking params
        ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(param => {
            parsed.searchParams.delete(param);
        });

        // For ticketsports, extract just the event ID (number at the end)
        // This handles: CORRIDA+DA+VIRADA++2025-73536 vs corrida-da-virada-2025-73536
        if (parsed.hostname.includes('ticketsports')) {
            const eventIdMatch = parsed.pathname.match(/-(\d+)$/);
            if (eventIdMatch) {
                return `ticketsports:${eventIdMatch[1]}`;
            }
        }

        // Lowercase and normalize the path
        let normalizedPath = parsed.pathname
            .toLowerCase()
            .replace(/\s+/g, '-')  // Spaces to dashes
            .replace(/-+/g, '-')   // Multiple dashes to single
            .replace(/\/$/, '');   // Remove trailing slash

        let normalized = parsed.origin.toLowerCase() + normalizedPath;

        // Add remaining query string if any
        const qs = parsed.searchParams.toString();
        if (qs) {
            normalized += '?' + qs;
        }

        return normalized;
    } catch {
        // If URL is invalid, return as-is (lowercase, no trailing slash)
        return url.toLowerCase().replace(/\/$/, '');
    }
}

/**
 * Calculate Jaccard similarity between two sets of words
 * Returns a value between 0 and 1 (1 = identical)
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Tokenize a normalized title into words
 */
function tokenize(text: string): Set<string> {
    return new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 1));
}

/**
 * Fuzzy deduplicate events - second pass using string similarity
 * Groups events by date + city + state, then checks title similarity
 * 
 * @param events - Events after first pass deduplication
 * @param similarityThreshold - Minimum Jaccard similarity to consider duplicates (default 0.7)
 * @returns Deduplicated events
 */
export function fuzzyDeduplicateEvents(
    events: StandardizedEvent[],
    similarityThreshold: number = 0.7
): DeduplicationResult {
    // Group events by date + city + state (location key)
    const locationGroups = new Map<string, StandardizedEvent[]>();

    for (const event of events) {
        const dateStr = event.date.toISOString().split('T')[0];
        const cityNorm = (event.city || '').toLowerCase().trim();
        const stateNorm = (event.state || '').toUpperCase();
        const locationKey = `${dateStr}|${cityNorm}|${stateNorm}`;

        if (!locationGroups.has(locationKey)) {
            locationGroups.set(locationKey, []);
        }
        locationGroups.get(locationKey)!.push(event);
    }

    const uniqueEvents: StandardizedEvent[] = [];
    const duplicateDetails: DuplicateInfo[] = [];
    let duplicatesRemoved = 0;

    // Process each location group
    for (const [locationKey, group] of locationGroups) {
        if (group.length === 1) {
            uniqueEvents.push(group[0]);
            continue;
        }

        // Compare titles within the group using similarity
        const kept: StandardizedEvent[] = [];
        const processed = new Set<number>();

        for (let i = 0; i < group.length; i++) {
            if (processed.has(i)) continue;

            const event = group[i];
            const eventTokens = tokenize(event.title);
            const duplicatesOfThis: StandardizedEvent[] = [];

            // Check against remaining events in group
            for (let j = i + 1; j < group.length; j++) {
                if (processed.has(j)) continue;

                const other = group[j];
                const otherTokens = tokenize(other.title);
                const similarity = jaccardSimilarity(eventTokens, otherTokens);

                if (similarity >= similarityThreshold) {
                    // This is a fuzzy duplicate
                    duplicatesOfThis.push(other);
                    processed.add(j);
                    duplicatesRemoved++;
                }
            }

            // Keep the first event (first occurrence by provider priority)
            kept.push(event);
            processed.add(i);

            // Log duplicate info if any found
            if (duplicatesOfThis.length > 0) {
                duplicateDetails.push({
                    matchKey: `fuzzy:${locationKey}`,
                    keptEvent: {
                        title: event.title,
                        sourcePlatform: event.sourcePlatform,
                        sourceUrl: event.sourceUrl,
                    },
                    discardedEvents: duplicatesOfThis.map(d => ({
                        title: d.title,
                        sourcePlatform: d.sourcePlatform,
                        sourceUrl: d.sourceUrl,
                    })),
                });
            }
        }

        uniqueEvents.push(...kept);
    }

    return {
        events: uniqueEvents,
        duplicatesRemoved,
        duplicateDetails,
    };
}

/**
 * Log deduplication results for monitoring
 */
export function logDeduplicationSummary(result: DeduplicationResult, phase: string = ''): void {
    const timestamp = new Date().toISOString();
    const phaseLabel = phase ? ` [${phase}]` : '';

    console.log(`[${timestamp}] [DEDUP]${phaseLabel} Deduplication complete:`);
    console.log(`[${timestamp}] [DEDUP]${phaseLabel}   Total input: ${result.events.length + result.duplicatesRemoved}`);
    console.log(`[${timestamp}] [DEDUP]${phaseLabel}   Unique events: ${result.events.length}`);
    console.log(`[${timestamp}] [DEDUP]${phaseLabel}   Duplicates removed: ${result.duplicatesRemoved}`);

    if (result.duplicateDetails.length > 0) {
        console.log(`[${timestamp}] [DEDUP]${phaseLabel} Duplicate groups found: ${result.duplicateDetails.length}`);

        // Log first few duplicates for visibility
        const samplesToLog = Math.min(5, result.duplicateDetails.length);
        for (let i = 0; i < samplesToLog; i++) {
            const dup = result.duplicateDetails[i];
            console.log(`[${timestamp}] [DEDUP]${phaseLabel}   - "${dup.keptEvent.title}" (${dup.keptEvent.sourcePlatform}) had ${dup.discardedEvents.length} duplicate(s)`);
        }

        if (result.duplicateDetails.length > samplesToLog) {
            console.log(`[${timestamp}] [DEDUP]${phaseLabel}   ... and ${result.duplicateDetails.length - samplesToLog} more`);
        }
    }
}

