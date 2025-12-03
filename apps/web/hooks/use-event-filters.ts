"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface EventFilters {
    state: string;
    city?: string;
    from?: string;
    to?: string;
    distances: string[];
    types: string[];
    query?: string;
    page: number;
}

export function useEventFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Parse current filters from URL
    const filters: EventFilters = useMemo(() => {
        const stateFromPath = pathname.startsWith('/br/') ? pathname.split('/br/')[1].split('/')[0] : 'pb'; // Default to PB if not in path, or handle logic
        const pageParam = searchParams.get("page");

        return {
            state: stateFromPath.toUpperCase(),
            city: searchParams.get("city") || undefined,
            from: searchParams.get("from") || undefined,
            to: searchParams.get("to") || undefined,
            distances: searchParams.get("distances")?.split(",") || [],
            types: searchParams.get("types")?.split(",") || [],
            query: searchParams.get("query") || undefined,
            page: pageParam ? parseInt(pageParam) : 1,
        };
    }, [pathname, searchParams]);

    // Update filters
    const setFilters = useCallback((newFilters: Partial<EventFilters>) => {
        const params = new URLSearchParams(searchParams.toString());

        // Handle State Change (Path update)
        let newPath = pathname;
        if (newFilters.state && newFilters.state !== filters.state) {
            // If currently at /br/[state], replace it
            if (pathname.startsWith('/br/')) {
                newPath = pathname.replace(/\/br\/[^/]+/, `/br/${newFilters.state.toLowerCase()}`);
            } else {
                // If at root or elsewhere, go to /br/[state]
                newPath = `/br/${newFilters.state.toLowerCase()}`;
            }
        }

        // Helper to set or delete param
        const updateParam = (key: string, value: string | undefined) => {
            if (value) params.set(key, value);
            else params.delete(key);
        };

        if (newFilters.city !== undefined) updateParam("city", newFilters.city);
        if (newFilters.from !== undefined) updateParam("from", newFilters.from);
        if (newFilters.to !== undefined) updateParam("to", newFilters.to);
        if (newFilters.query !== undefined) updateParam("query", newFilters.query);

        if (newFilters.distances !== undefined) {
            if (newFilters.distances.length > 0) params.set("distances", newFilters.distances.join(","));
            else params.delete("distances");
        }

        if (newFilters.types !== undefined) {
            if (newFilters.types.length > 0) params.set("types", newFilters.types.join(","));
            else params.delete("types");
        }

        // Pagination Logic
        if (newFilters.page !== undefined) {
            // Explicit page change
            if (newFilters.page > 1) params.set("page", newFilters.page.toString());
            else params.delete("page");
        } else {
            // Filter change - reset to page 1
            // We only reset page if we are NOT explicitly changing the page
            // and if we are changing other filters that affect results
            const isPaginationOnly = Object.keys(newFilters).length === 1 && 'page' in newFilters;
            if (!isPaginationOnly) {
                params.delete("page");
            }
        }

        const finalUrl = `${newPath}?${params.toString()}`;
        router.push(finalUrl, { scroll: false });
    }, [filters, pathname, router, searchParams]);

    const clearFilters = useCallback(() => {
        // Keep state, clear everything else
        const params = new URLSearchParams();
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router]);

    return {
        filters,
        setFilters,
        clearFilters
    };
}
