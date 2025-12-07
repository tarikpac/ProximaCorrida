/**
 * Price Extraction Utilities
 * Task Group 1: Price extraction with classification heuristics
 * 
 * This module provides intelligent price extraction from HTML pages,
 * correctly classifying prices as "general" (standard public) vs "discounted"
 * (PCD, meia, kids, etc.) to avoid showing special category prices on event cards.
 */

// Keywords that indicate discounted/special category prices
// These prices should NOT be used as the primary price for the event
export const DISCOUNTED_KEYWORDS = [
    'pcd',
    'p.c.d',
    'portador de deficiência',
    'portador de deficiencia',
    'idoso',
    'melhor idade',
    'estudante',
    'meia',
    'meia-entrada',
    'meia entrada',
    'kids',
    'infantil',
    'mirim',
    'criança',
    'crianca',
    'promoção',
    'promocao',
    'promo',
    'cupom',
    'desconto',
] as const;

// Keywords that indicate general/standard public prices
// These are the correct prices to show on event cards
export const GENERAL_KEYWORDS = [
    'lote 1',
    '1º lote',
    '1° lote',
    'primeiro lote',
    'lote promocional',
    'kit básico',
    'kit basico',
    'kit standard',
    'kit corredor',
    'kit atleta',
    '5km',
    '10km',
    '21km',
    '42km',
    'geral',
    'adulto',
    'individual',
] as const;

// Keywords that indicate free events
export const FREE_KEYWORDS = [
    'gratuito',
    'gratuita',
    'grátis',
    'gratis',
    'free',
    'entrada livre',
    'sem custo',
] as const;

export type PriceCategory = 'general' | 'discounted' | 'unknown';

export interface ExtractedPrice {
    value: number;
    context: string;
    rawMatch: string;
}

export interface ClassifiedPrice extends ExtractedPrice {
    category: PriceCategory;
}

export interface PriceResult {
    priceMin: number | null;
    priceText: string | null;
}

/**
 * Extracts all prices from text with their surrounding context.
 * Uses a context window of 40 characters before and after each price.
 * 
 * @param text The full text content from the page
 * @returns Array of extracted prices with their context
 */
export function extractAllPrices(text: string | null | undefined): ExtractedPrice[] {
    if (!text) return [];

    const prices: ExtractedPrice[] = [];

    // Regex to match Brazilian currency format: R$ XX,XX or R$ XXX,XX
    // Also handles R$XX,XX (no space) and various decimal formats
    const priceRegex = /R\$\s?(\d{1,3}(?:\.\d{3})*[.,]\d{2}|\d{2,3}[.,]\d{2})/gi;

    let match: RegExpExecArray | null;
    while ((match = priceRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const valueStr = match[1];
        const startIndex = match.index;

        // Extract context window (40 chars before and after)
        const contextStart = Math.max(0, startIndex - 40);
        const contextEnd = Math.min(text.length, startIndex + fullMatch.length + 40);
        const context = text.slice(contextStart, contextEnd).toLowerCase();

        // Parse the numeric value
        const value = parsePrice(valueStr);

        if (value !== null && value > 0) {
            prices.push({
                value,
                context,
                rawMatch: fullMatch,
            });
        }
    }

    return prices;
}

/**
 * Parses a Brazilian price string to a float number.
 * Handles formats like "89,90", "1.289,90", "89.90"
 * 
 * @param priceStr The price string to parse
 * @returns The numeric value or null if parsing fails
 */
export function parsePrice(priceStr: string): number | null {
    if (!priceStr) return null;

    // Remove R$ and spaces
    let cleaned = priceStr.replace(/R\$\s?/gi, '').trim();

    // Handle Brazilian format: 1.234,56 -> 1234.56
    if (cleaned.includes('.') && cleaned.includes(',')) {
        // Has both separators - assume Brazilian format (. = thousands, , = decimal)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
        // Only comma - assume it's the decimal separator
        cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
}

/**
 * Classifies a price based on its context keywords.
 * 
 * Priority:
 * 1. If discounted keywords found -> 'discounted'
 * 2. If general keywords found (and no discounted) -> 'general'
 * 3. Otherwise -> 'unknown'
 * 
 * @param price The extracted price with context
 * @returns The price category
 */
export function classifyPrice(price: ExtractedPrice): PriceCategory {
    const context = price.context.toLowerCase();

    // Check for discounted keywords first (higher priority)
    for (const keyword of DISCOUNTED_KEYWORDS) {
        if (context.includes(keyword)) {
            return 'discounted';
        }
    }

    // Check for general keywords
    for (const keyword of GENERAL_KEYWORDS) {
        if (context.includes(keyword)) {
            return 'general';
        }
    }

    return 'unknown';
}

/**
 * Checks if the page text indicates a free event.
 * 
 * @param text The full page text
 * @returns True if the event appears to be free
 */
export function detectFreeEvent(text: string | null | undefined): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return FREE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Selects the best price from a list of extracted prices.
 * 
 * Logic:
 * 1. If isFreeEvent is true -> return Gratuito
 * 2. Find all 'general' prices -> select minimum
 * 3. If no 'general' prices but 'unknown' prices exist -> select minimum unknown
 * 4. If only 'discounted' prices -> return null with message
 * 
 * @param prices Array of extracted prices
 * @param isFreeEvent Whether the event was detected as free
 * @returns The selected price result
 */
export function selectBestPrice(
    prices: ExtractedPrice[],
    isFreeEvent: boolean
): PriceResult {
    // Handle free events
    if (isFreeEvent && prices.length === 0) {
        return {
            priceMin: 0,
            priceText: 'Gratuito',
        };
    }

    // Classify all prices
    const classifiedPrices: ClassifiedPrice[] = prices.map(p => ({
        ...p,
        category: classifyPrice(p),
    }));

    // Get general prices
    const generalPrices = classifiedPrices.filter(p => p.category === 'general');

    if (generalPrices.length > 0) {
        const minPrice = Math.min(...generalPrices.map(p => p.value));
        return {
            priceMin: minPrice,
            priceText: formatPriceText(minPrice),
        };
    }

    // Fallback to unknown prices if no general found
    const unknownPrices = classifiedPrices.filter(p => p.category === 'unknown');

    if (unknownPrices.length > 0) {
        const minPrice = Math.min(...unknownPrices.map(p => p.value));
        return {
            priceMin: minPrice,
            priceText: formatPriceText(minPrice),
        };
    }

    // Only discounted prices found or no prices at all
    if (classifiedPrices.length > 0) {
        return {
            priceMin: null,
            priceText: 'Ver valores na página de inscrição',
        };
    }

    // No prices found at all
    return {
        priceMin: null,
        priceText: null,
    };
}

/**
 * Formats a price value as display text.
 * 
 * @param value The numeric price value
 * @returns Formatted string like "A partir de R$ 89,90"
 */
export function formatPriceText(value: number): string {
    const formatted = value.toFixed(2).replace('.', ',');
    return `A partir de R$ ${formatted}`;
}

/**
 * Main function to extract and process prices from page text.
 * This combines all the individual functions into a single call.
 * 
 * @param pageText The full text content from the page
 * @returns The final price result
 */
export function extractPriceWithHeuristics(pageText: string | null | undefined): PriceResult {
    if (!pageText) {
        return { priceMin: null, priceText: null };
    }
    const isFreeEvent = detectFreeEvent(pageText);
    const prices = extractAllPrices(pageText);
    return selectBestPrice(prices, isFreeEvent);
}
