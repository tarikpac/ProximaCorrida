"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEventFilters } from "./use-event-filters";

export interface Event {
    id: string;
    title: string;
    date: string;
    city: string;
    state: string;
    distances: string[];
    price: string | null;
    imageUrl: string | null;
    regLink: string;
    organizer: string | null;
}

interface EventsResponse {
    data: Event[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

async function fetchEvents(filters: ReturnType<typeof useEventFilters>['filters']) {
    const params = new URLSearchParams();

    if (filters.state) params.append("state", filters.state);
    if (filters.city) params.append("city", filters.city);
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.distances.length > 0) params.append("distances", filters.distances.join(","));
    if (filters.types.length > 0) params.append("types", filters.types.join(","));
    if (filters.query) params.append("query", filters.query);

    // Default params
    params.append("limit", "12");
    params.append("page", filters.page.toString());

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    const res = await fetch(`${API_URL}/events?${params.toString()}`);

    if (!res.ok) {
        throw new Error('Failed to fetch events');
    }

    return res.json();
}

export function useEvents() {
    const { filters } = useEventFilters();

    return useQuery<EventsResponse>({
        queryKey: ['events', filters],
        queryFn: () => fetchEvents(filters),
        placeholderData: keepPreviousData,
    });
}
