'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { EventCard } from './EventCard';
import { Event } from '@/types/event';
import { Loader2 } from 'lucide-react';

import { getEvents } from '@/lib/api';

// ...

export function EventList() {
    const [page, setPage] = useState(1);
    const limit = 25;

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', page],
        queryFn: () => getEvents(page, limit),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    });

    // ... (loading and error states remain same)

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>Nenhuma corrida encontrada no momento.</p>
                {page > 1 && (
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="mt-4 text-blue-600 hover:underline"
                    >
                        Voltar para página anterior
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 pb-8">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                    Anterior
                </button>
                <span className="text-sm font-medium text-gray-600">
                    Página {page}
                </span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={events.length < limit || isLoading}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                    Próxima
                </button>
            </div>
        </div>
    );
}
