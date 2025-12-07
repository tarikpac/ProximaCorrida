/**
 * Price Extraction Utilities
 * Copied from apps/api/src/scraper/utils/price-extraction.utils.ts
 * 
 * This module provides intelligent price extraction from HTML pages,
 * correctly classifying prices as "general" (standard public) vs "discounted"
 * (PCD, meia, kids, etc.) to avoid showing special category prices on event cards.
 */

// Keywords that indicate discounted/special category prices
export const DISCOUNTED_KEYWORDS = [
    'pcd', 'p.c.d', 'portador de deficiência', 'portador de deficiencia',
    'idoso', 'melhor idade', 'estudante', 'meia', 'meia-entrada', 'meia entrada',
    'kids', 'infantil', 'mirim', 'criança', 'crianca',
    'promoção', 'promocao', 'promo', 'cupom', 'desconto',
] as const;

// Keywords that indicate general/standard public prices
export const GENERAL_KEYWORDS = [
    'lote 1', '1º lote', '1° lote', 'primeiro lote', 'lote promocional',
    'kit básico', 'kit basico', 'kit standard', 'kit corredor', 'kit atleta',
    '5km', '10km', '21km', '42km', 'geral', 'adulto', 'individual',
] as const;

// Keywords that indicate free events
export const FREE_KEYWORDS = [
    'gratuito', 'gratuita', 'grátis', 'gratis', 'free', 'entrada livre', 'sem custo',
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
 */
export function extractAllPrices(text: string | null | undefined): ExtractedPrice[] {
    if (!text) return [];

    const prices: ExtractedPrice[] = [];
    const priceRegex = /R\$\s?(\d{1,3}(?:\.\d{3})*[.,]\d{2}|\d{2,3}[.,]\d{2})/gi;

    let match: RegExpExecArray | null;
    while ((match = priceRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const valueStr = match[1];
        const startIndex = match.index;

        const contextStart = Math.max(0, startIndex - 40);
        const contextEnd = Math.min(text.length, startIndex + fullMatch.length + 40);
        const context = text.slice(contextStart, contextEnd).toLowerCase();

        const value = parsePrice(valueStr);

        if (value !== null && value > 0) {
            prices.push({ value, context, rawMatch: fullMatch });
        }
    }

    return prices;
}

/**
 * Parses a Brazilian price string to a float number.
 */
export function parsePrice(priceStr: string): number | null {
    if (!priceStr) return null;

    let cleaned = priceStr.replace(/R\$\s?/gi, '').trim();

    if (cleaned.includes('.') && cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
        cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
}

/**
 * Classifies a price based on its context keywords.
 */
export function classifyPrice(price: ExtractedPrice): PriceCategory {
    const context = price.context.toLowerCase();

    for (const keyword of DISCOUNTED_KEYWORDS) {
        if (context.includes(keyword)) {
            return 'discounted';
        }
    }

    for (const keyword of GENERAL_KEYWORDS) {
        if (context.includes(keyword)) {
            return 'general';
        }
    }

    return 'unknown';
}

/**
 * Checks if the page text indicates a free event.
 */
export function detectFreeEvent(text: string | null | undefined): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return FREE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Selects the best price from a list of extracted prices.
 */
export function selectBestPrice(prices: ExtractedPrice[], isFreeEvent: boolean): PriceResult {
    if (isFreeEvent && prices.length === 0) {
        return { priceMin: 0, priceText: 'Gratuito' };
    }

    const classifiedPrices: ClassifiedPrice[] = prices.map(p => ({
        ...p,
        category: classifyPrice(p),
    }));

    const generalPrices = classifiedPrices.filter(p => p.category === 'general');

    if (generalPrices.length > 0) {
        const minPrice = Math.min(...generalPrices.map(p => p.value));
        return { priceMin: minPrice, priceText: formatPriceText(minPrice) };
    }

    const unknownPrices = classifiedPrices.filter(p => p.category === 'unknown');

    if (unknownPrices.length > 0) {
        const minPrice = Math.min(...unknownPrices.map(p => p.value));
        return { priceMin: minPrice, priceText: formatPriceText(minPrice) };
    }

    if (classifiedPrices.length > 0) {
        return { priceMin: null, priceText: 'Ver valores na página de inscrição' };
    }

    return { priceMin: null, priceText: null };
}

/**
 * Formats a price value as display text.
 */
export function formatPriceText(value: number): string {
    const formatted = value.toFixed(2).replace('.', ',');
    return `A partir de R$ ${formatted}`;
}

/**
 * Main function to extract and process prices from page text.
 */
export function extractPriceWithHeuristics(pageText: string | null | undefined): PriceResult {
    if (!pageText) {
        return { priceMin: null, priceText: null };
    }
    const isFreeEvent = detectFreeEvent(pageText);
    const prices = extractAllPrices(pageText);
    return selectBestPrice(prices, isFreeEvent);
}
