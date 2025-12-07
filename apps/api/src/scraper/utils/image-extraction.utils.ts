/**
 * Image Extraction Utilities
 * Task Group 2: Image extraction with fallback chain
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

// Minimum width to consider an image as a potential banner
const MIN_BANNER_WIDTH = 300;

// Keywords that suggest an image is a banner/poster
const BANNER_KEYWORDS = [
    'banner',
    'cartaz',
    'poster',
    'capa',
    'hero',
    'destaque',
    'principal',
    'evento',
    'corrida',
];

// Class names that often contain event banners
const BANNER_CLASS_PATTERNS = [
    'banner',
    'poster',
    'capa',
    'hero',
    'cover',
    'img-capa-evento',
    'event-image',
    'main-image',
];

/**
 * Extracts image URL from OpenGraph and Twitter meta tags.
 * This is the highest priority source as these are usually the best images.
 * 
 * @param document The page document
 * @returns The image URL or null
 */
export function extractImageFromMetaTags(document: Document): string | null {
    // Try og:image first (most common)
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
        const content = (ogImage as HTMLMetaElement).content;
        if (content && isValidImageUrl(content)) {
            return content;
        }
    }

    // Try twitter:image as fallback
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
 * Extracts banner/poster image by looking for images with relevant keywords
 * in their src, alt, or class attributes.
 * 
 * @param images Array of image info objects
 * @returns The banner image URL or null
 */
export function extractBannerImage(images: ImageInfo[]): string | null {
    for (const img of images) {
        const searchText = [
            img.src,
            img.alt || '',
            img.className || '',
        ].join(' ').toLowerCase();

        // Check for banner keywords
        const hasBannerKeyword = BANNER_KEYWORDS.some(k => searchText.includes(k));

        // Check for banner class patterns
        const hasBannerClass = BANNER_CLASS_PATTERNS.some(p =>
            (img.className || '').toLowerCase().includes(p)
        );

        if (hasBannerKeyword || hasBannerClass) {
            // Validate it's a reasonably sized image
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
 * Filters out small images (tracking pixels, icons).
 * 
 * @param images Array of image info objects
 * @returns The largest image URL or null
 */
export function extractLargestImage(images: ImageInfo[]): string | null {
    // Filter out small images (icons, tracking pixels)
    const validImages = images.filter(img => {
        const width = img.naturalWidth || img.width || 0;
        return width >= MIN_BANNER_WIDTH;
    });

    if (validImages.length === 0) {
        return null;
    }

    // Sort by width descending
    validImages.sort((a, b) => {
        const widthA = a.naturalWidth || a.width || 0;
        const widthB = b.naturalWidth || b.width || 0;
        return widthB - widthA;
    });

    return validImages[0].src;
}

/**
 * Extracts image URL from CSS background-image property.
 * This is the last resort fallback.
 * 
 * @param backgroundStyle The computed background or background-image style
 * @returns The extracted URL or null
 */
export function extractCssBackgroundImage(backgroundStyle: string): string | null {
    if (!backgroundStyle || backgroundStyle === 'none') {
        return null;
    }

    // Match url("...") or url('...') or url(...)
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
 * 
 * @param url The URL to validate
 * @returns True if the URL appears to be a valid image
 */
export function isValidImageUrl(url: string): boolean {
    if (!url || url.trim() === '') {
        return false;
    }

    // Must be http/https or start with /
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        return false;
    }

    // Filter out data URIs that are too small (likely placeholders)
    if (url.startsWith('data:')) {
        return url.length > 200; // Real images in data URI should be larger
    }

    // Filter out common placeholder/tracking patterns
    const invalidPatterns = [
        'pixel',
        'tracking',
        'spacer',
        '1x1',
        'blank',
        'transparent',
        'placeholder',
    ];

    const lowerUrl = url.toLowerCase();
    if (invalidPatterns.some(p => lowerUrl.includes(p))) {
        return false;
    }

    return true;
}

/**
 * Detects the platform from a registration URL.
 * Used to apply platform-specific wait strategies.
 * 
 * @param url The registration link URL
 * @returns The detected platform identifier
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
 * Returns null if no special wait is needed.
 * 
 * @param platform The detected platform
 * @returns Object with selector and timeout, or null
 */
export function getPlatformWaitConfig(platform: Platform): { selector: string; timeout: number } | null {
    switch (platform) {
        case 'ticketsports':
            return {
                selector: '.preco, .valor, [data-price], .price, .ticket-price',
                timeout: 5000,
            };
        case 'doity':
            // Doity doesn't need a specific selector, just extra delay
            return null;
        case 'zenite':
            // Zenite loads fast, no extra wait needed
            return null;
        default:
            return null;
    }
}

/**
 * Gets the additional delay for a given platform.
 * Used for platforms that load content dynamically.
 * 
 * @param platform The detected platform
 * @returns Delay in milliseconds
 */
export function getPlatformDelay(platform: Platform): number {
    switch (platform) {
        case 'doity':
            return 1000; // 1 second extra for dynamic content
        case 'ticketsports':
            return 500; // Small extra delay after selector wait
        default:
            return 0;
    }
}
