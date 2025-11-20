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
}

export function useEventFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Parse current filters from URL
    const filters: EventFilters = useMemo(() => {
        const stateFromPath = pathname.startsWith('/br/') ? pathname.split('/br/')[1].split('/')[0] : 'pb'; // Default to PB if not in path, or handle logic

        return {
            state: stateFromPath.toUpperCase(),
            city: searchParams.get("city") || undefined,
            from: searchParams.get("from") || undefined,
            to: searchParams.get("to") || undefined,
            distances: searchParams.get("distances")?.split(",") || [],
            types: searchParams.get("types")?.split(",") || [],
            query: searchParams.get("query") || undefined,
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

        // Handle other params
        if (newFilters.city !== undefined) {
            if (newFilters.city) params.set("city", newFilters.city);
            else params.delete("city");
        }

        if (newFilters.from !== undefined) {
            if (newFilters.from) params.set("from", newFilters.from);
            else params.delete("from");
        }

        if (newFilters.to !== undefined) {
            if (newFilters.to) params.set("to", newFilters.to);
            else params.delete("to");
        }

        if (newFilters.distances !== undefined) {
            if (newFilters.distances.length > 0) params.set("distances", newFilters.distances.join(","));
            else params.delete("distances");
        }

        if (newFilters.types !== undefined) {
            if (newFilters.types.length > 0) params.set("types", newFilters.types.join(","));
            else params.delete("types");
        }

        if (newFilters.query !== undefined) {
            if (newFilters.query) params.set("query", newFilters.query);
            else params.delete("query");
        }

        // Reset page on filter change (optional but good UX)
        // params.delete("page"); 

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
