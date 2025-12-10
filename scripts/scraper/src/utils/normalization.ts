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
 * - Remove location suffixes (e.g., "em martins", "- rn", "/ rn")
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

    // Remove location suffixes that vary between providers
    // e.g., "em martins", "em joão pessoa", "- rn", "/ rn"
    // State codes: AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO
    const states = 'ac|al|am|ap|ba|ce|df|es|go|ma|mg|ms|mt|pa|pb|pe|pi|pr|rj|rn|ro|rr|rs|sc|se|sp|to';

    // Remove "- XX" or "/ XX" at end (state codes)
    normalized = normalized.replace(new RegExp(`\\s*[-/]\\s*(${states})\\s*$`, 'i'), '');

    // Remove "em [cidade]" or "em [cidade] - XX" at end
    // This is tricky - we want to remove location suffixes but not break titles
    // Only remove if it looks like a location suffix at the end
    normalized = normalized.replace(/\s+em\s+[\w\s]+\s*[-/]?\s*\w{0,2}$/i, '');

    // Normalize prepositions - collapse "de de" to "de", remove isolated prepositions
    // This helps match "emancipação de coronel" with "emancipação coronel"
    normalized = normalized.replace(/\b(de|da|do|das|dos)\s+(de|da|do|das|dos)\b/gi, '$1');

    // Remove prepositions before proper nouns at end of titles
    // e.g., "emancipacao de coronel joao" -> would still keep "de" for now

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
 * Clean a city name to extract just the city
 * Handles various formats:
 * - Full addresses: "Av. das Fronteiras, 1251 - Bairro..., Natal, RN, Brasil" -> "Natal"
 * - Venue prefixes: "Estádio Arena das Dunas: Avenida..., Natal, RN" -> "Natal"
 * - Duplications: "NATAL: NATAL,RN,BRASIL" -> "Natal"
 * - Simple: "João Pessoa" -> "João Pessoa"
 * Returns Title Case city name
 */
export function cleanCityName(cityRaw: string | null): string | null {
    if (!cityRaw) return null;

    let city = cityRaw.trim();

    // Skip if too short or looks invalid
    if (city.length < 2) return null;
    if (['DA', 'DE', 'DO', 'E', 'COMBO'].includes(city.toUpperCase())) return null;

    // Pattern 1: "CIDADE: CIDADE,UF,BRASIL" - extract the first CIDADE
    const colonMatch = city.match(/^([^:]+):\s*(.+)/);
    if (colonMatch) {
        const beforeColon = colonMatch[1].trim();
        const afterColon = colonMatch[2].trim();
        // If after colon contains the same city, extract it
        const cityParts = afterColon.split(',');
        if (cityParts.length >= 2) {
            city = cityParts[0].trim();
        } else {
            city = beforeColon;
        }
    }

    // Pattern 2: Full address ending with "City, UF, Brasil"
    // e.g., "Av. das Fronteiras, 1251 - Bairro..., Natal, RN, Brasil"
    const addressMatch = city.match(/,\s*([A-Za-zÀ-ú\s]+),\s*[A-Z]{2},\s*Brasil$/i);
    if (addressMatch) {
        city = addressMatch[1].trim();
    }

    // Pattern 3: "Venue Name: Address, City, UF, Brasil"
    // Already handled by pattern 2 after pattern 1

    // Pattern 4: Address with "City, UF" at the end (no Brasil)
    const simpleAddressMatch = city.match(/,\s*([A-Za-zÀ-ú\s]+),\s*[A-Z]{2}$/i);
    if (simpleAddressMatch && city.includes(',')) {
        city = simpleAddressMatch[1].trim();
    }

    // Pattern 5: If still has numbers and commas, try to extract known city
    if (city.match(/\d/) && city.includes(',')) {
        const parts = city.split(',');
        // Find the last part that looks like a city (no numbers, reasonable length)
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].trim();
            if (part.length >= 3 && part.length <= 50 && !part.match(/\d/) && !part.match(/^[A-Z]{2}$/)) {
                city = part;
                break;
            }
        }
    }

    // Remove any trailing state code (only if clearly separated by comma, dash, or space)
    // Must be preceded by separator to avoid cutting "Natal" -> "Nat"
    city = city.replace(/[,\-]\s*[A-Z]{2}$/i, '').trim();
    city = city.replace(/\s+[A-Z]{2}$/i, '').trim(); // Only if preceded by whitespace
    city = city.replace(/,?\s*Brasil$/i, '').trim();

    // Final validation
    if (city.length < 2) return null;
    if (city.match(/^\d+$/)) return null; // Just numbers
    if (['DA', 'DE', 'DO', 'E', 'COMBO', 'BRASIL'].includes(city.toUpperCase())) return null;

    // Convert to Title Case
    city = toTitleCase(city);

    return city;
}

/**
 * Convert text to Title Case
 * "JOÃO PESSOA" -> "João Pessoa"
 * "são paulo" -> "São Paulo"
 */
export function toTitleCase(text: string): string {
    if (!text) return '';

    // Fix potential encoding issues first
    text = text
        .replace(/Ã§/g, 'ç')
        .replace(/Ã£/g, 'ã')
        .replace(/Ãµ/g, 'õ')
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã¢/g, 'â')
        .replace(/Ãª/g, 'ê')
        .replace(/Ã´/g, 'ô');

    // Words that should stay lowercase
    const lowercase = ['de', 'da', 'do', 'das', 'dos', 'e'];

    return text
        .toLowerCase()
        .split(/\s+/)
        .map((word, index) => {
            if (index > 0 && lowercase.includes(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
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

/**
 * Check if a URL is a valid event page (not a listing/category page)
 * Returns null if the URL is invalid, otherwise returns the cleaned URL
 */
export function validateEventUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Patterns for listing/category pages that should be rejected
    const listingPatterns = [
        /brasilquecorre\.com\/[a-z]+$/i,  // brasilquecorre.com/riograndedonorte
        /brasilquecorre\.com\/estado\//i,
        /corridasbr\.com\.br\/[a-z]{2}\/calendario/i,  // State calendar pages
        /ticketsports\.com\.br\/eventos$/i,
        /minhasinscricoes\.com\.br\/eventos$/i,
        /correparaiba\.com\.br\/?$/i,  // Homepage
        /race83\.com\.br\/?$/i,         // Homepage
    ];

    if (listingPatterns.some(pattern => pattern.test(url))) {
        return null;
    }

    return url;
}
