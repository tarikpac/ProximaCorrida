/**
 * Image Extraction Utilities
 * Copied from apps/api/src/scraper/utils/image-extraction.utils.ts
 * 
 * This module provides robust image extraction from HTML pages,
 * using a prioritized fallback chain to find the best event banner/poster.
 */

export type Platform = 'ticketsports' | 'doity' | 'zenite' | 'other';

export interface ImageInfo {
    src: string;
    alt?: string;
    width?: number;
    naturalWidth?: number;
    className?: string;
}

export interface RegistrationLinkResult {
    url: string | null;
    platform: Platform;
}

const MIN_BANNER_WIDTH = 300;

const BANNER_KEYWORDS = [
    'banner', 'cartaz', 'poster', 'capa', 'hero', 'destaque', 'principal', 'evento', 'corrida',
];

const BANNER_CLASS_PATTERNS = [
    'banner', 'poster', 'capa', 'hero', 'cover', 'img-capa-evento', 'event-image', 'main-image',
];

/**
 * Extracts image URL from OpenGraph and Twitter meta tags.
 */
export function extractImageFromMetaTags(document: Document): string | null {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
        const content = (ogImage as HTMLMetaElement).content;
        if (content && isValidImageUrl(content)) {
            return content;
        }
    }

    const twitterImage =
        document.querySelector('meta[name="twitter:image"]') ||
        document.querySelector('meta[property="twitter:image"]');
    if (twitterImage) {
        const content = (twitterImage as HTMLMetaElement).content;
        if (content && isValidImageUrl(content)) {
            return content;
        }
    }

    return null;
}

/**
 * Extracts banner/poster image by looking for images with relevant keywords.
 */
export function extractBannerImage(images: ImageInfo[]): string | null {
    for (const img of images) {
        const searchText = [img.src, img.alt || '', img.className || ''].join(' ').toLowerCase();

        const hasBannerKeyword = BANNER_KEYWORDS.some(k => searchText.includes(k));
        const hasBannerClass = BANNER_CLASS_PATTERNS.some(p =>
            (img.className || '').toLowerCase().includes(p)
        );

        if (hasBannerKeyword || hasBannerClass) {
            const width = img.naturalWidth || img.width || 0;
            if (width === 0 || width >= MIN_BANNER_WIDTH) {
                return img.src;
            }
        }
    }

    return null;
}

/**
 * Extracts the largest image from the page.
 */
export function extractLargestImage(images: ImageInfo[]): string | null {
    const validImages = images.filter(img => {
        const width = img.naturalWidth || img.width || 0;
        return width >= MIN_BANNER_WIDTH;
    });

    if (validImages.length === 0) {
        return null;
    }

    validImages.sort((a, b) => {
        const widthA = a.naturalWidth || a.width || 0;
        const widthB = b.naturalWidth || b.width || 0;
        return widthB - widthA;
    });

    return validImages[0].src;
}

/**
 * Extracts image URL from CSS background-image property.
 */
export function extractCssBackgroundImage(backgroundStyle: string): string | null {
    if (!backgroundStyle || backgroundStyle === 'none') {
        return null;
    }

    const urlMatch = backgroundStyle.match(/url\(['"]?([^'"()]+)['"]?\)/i);

    if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        if (isValidImageUrl(url)) {
            return url;
        }
    }

    return null;
}

/**
 * Validates that a URL is a valid image URL.
 */
export function isValidImageUrl(url: string): boolean {
    if (!url || url.trim() === '') {
        return false;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        return false;
    }

    if (url.startsWith('data:')) {
        return url.length > 200;
    }

    const invalidPatterns = ['pixel', 'tracking', 'spacer', '1x1', 'blank', 'transparent', 'placeholder'];
    const lowerUrl = url.toLowerCase();
    if (invalidPatterns.some(p => lowerUrl.includes(p))) {
        return false;
    }

    return true;
}

/**
 * Detects the platform from a registration URL.
 */
export function detectPlatform(url: string | null): Platform {
    if (!url) {
        return 'other';
    }

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('ticketsports')) {
        return 'ticketsports';
    }

    if (lowerUrl.includes('doity')) {
        return 'doity';
    }

    if (lowerUrl.includes('zeniteesportes') || lowerUrl.includes('zenite')) {
        return 'zenite';
    }

    return 'other';
}

/**
 * Gets the appropriate wait selector for a given platform.
 */
export function getPlatformWaitConfig(platform: Platform): { selector: string; timeout: number } | null {
    switch (platform) {
        case 'ticketsports':
            return { selector: '.preco, .valor, [data-price], .price, .ticket-price', timeout: 5000 };
        case 'doity':
        case 'zenite':
        default:
            return null;
    }
}

/**
 * Gets the additional delay for a given platform.
 */
export function getPlatformDelay(platform: Platform): number {
    switch (platform) {
        case 'doity':
            return 1000;
        case 'ticketsports':
            return 500;
        default:
            return 0;
    }
}
