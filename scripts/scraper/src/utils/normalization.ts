/**
 * Normalization Utilities
 * Functions to normalize text for cross-provider deduplication
 */

/**
 * Remove accents/diacritics from text
 */
export function removeAccents(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize a title for matching
 * - Lowercase
 * - Remove accents
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Remove common prefixes/suffixes that vary between providers
 */
export function normalizeTitle(title: string): string {
    if (!title) return '';

    let normalized = title
        .toLowerCase()
        .trim();

    // Remove accents
    normalized = removeAccents(normalized);

    // Remove common prefixes that vary
    normalized = normalized
        .replace(/^(corrida\s+)?/i, '')
        .replace(/^(\d+[ªºa]?\s+)?(edicao|edição)\s+/i, '');

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized.trim();
}

/**
 * Normalize a city name for matching
 * - Lowercase
 * - Remove accents
 * - Trim whitespace
 * - Remove common suffixes like "- XX" (state)
 */
export function normalizeCity(city: string | null): string {
    if (!city) return '';

    let normalized = city
        .toLowerCase()
        .trim();

    // Remove accents
    normalized = removeAccents(normalized);

    // Remove state suffix (e.g., "João Pessoa - PB" -> "joao pessoa")
    normalized = normalized.replace(/\s*-\s*[a-z]{2}$/i, '');

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized.trim();
}

/**
 * Normalize a state code
 * - Uppercase
 * - Trim
 */
export function normalizeState(state: string | null): string {
    if (!state) return '';
    return state.toUpperCase().trim();
}

/**
 * Format a date as YYYY-MM-DD for consistent matching
 */
export function formatDateForMatching(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Generate a match key for an event
 * Used to detect duplicates across providers
 */
export function generateMatchKey(
    title: string,
    date: Date,
    city: string | null,
    state: string | null
): string {
    const normalizedTitle = normalizeTitle(title);
    const normalizedCity = normalizeCity(city);
    const normalizedState = normalizeState(state);
    const dateStr = formatDateForMatching(date);

    return `${normalizedTitle}|${dateStr}|${normalizedCity}|${normalizedState}`;
}
