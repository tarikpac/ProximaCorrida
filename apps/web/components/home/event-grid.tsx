"use client";

import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/ui/event-card";
import { ArrowRight, Loader2, FilterX } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useEventFilters } from "@/hooks/use-event-filters";

export function EventGrid() {
    const [isMounted, setIsMounted] = useState(false);
    const { data: response, isLoading, error } = useEvents();
    const { clearFilters, setFilters } = useEventFilters();
    const events = response?.data || [];

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-zinc-950 text-zinc-500">
                Erro ao carregar eventos.
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <section className="w-full bg-zinc-950 py-16 border-t border-zinc-900">
                <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center space-y-4">
                    <FilterX className="w-12 h-12 text-zinc-700" />
                    <h3 className="text-xl font-bold text-white uppercase">Nenhum evento encontrado</h3>
                    <p className="text-zinc-500 max-w-md">
                        Tente ajustar seus filtros ou buscar por outros termos.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-lime-400 hover:text-lime-300 font-mono text-sm uppercase underline underline-offset-4"
                    >
                        Limpar todos os filtros
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full bg-zinc-950 py-16 border-t border-zinc-900">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-8 bg-lime-400 -skew-x-12" />
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter">
                            Próximos Eventos
                        </h2>
                    </div>

                    <Link
                        href="/calendario"
                        className="group flex items-center gap-2 text-zinc-400 hover:text-lime-400 transition-colors"
                    >
                        <span className="font-mono text-sm font-bold uppercase tracking-widest">
                            Ver Todos
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {events.map((event) => {
                        let day = '??';
                        let month = '???';

                        try {
                            const dateObj = new Date(event.date);
                            if (!isNaN(dateObj.getTime())) {
                                day = format(dateObj, 'dd');
                                month = format(dateObj, 'MMM', { locale: ptBR }).toUpperCase().replace('.', '');
                            }
                        } catch (e) {
                            console.error("Date parsing error", e);
                        }

                        return (
                            <EventCard
                                key={event.id}
                                title={event.title}
                                date={{ day, month }}
                                location={event.city}
                                distances={Array.isArray(event.distances) ? event.distances : []}
                                price={event.price || "Sob Consulta"}
                                category="RUA"
                                slug={event.id}
                                imageUrl={event.imageUrl || undefined}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Pagination */}
            {response?.meta && response.meta.totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setFilters({ page: (response.meta.page || 1) - 1 })}
                        disabled={response.meta.page <= 1}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono text-sm uppercase"
                    >
                        Anterior
                    </button>

                    <span className="text-zinc-500 font-mono text-sm">
                        Página <span className="text-white">{response.meta.page}</span> de <span className="text-white">{response.meta.totalPages}</span>
                    </span>

                    <button
                        onClick={() => setFilters({ page: (response.meta.page || 1) + 1 })}
                        disabled={response.meta.page >= response.meta.totalPages}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono text-sm uppercase"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </section>
    );
}
