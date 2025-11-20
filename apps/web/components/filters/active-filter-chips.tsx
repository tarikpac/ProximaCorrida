"use client";

import { X } from "lucide-react";
import { useEventFilters } from "@/hooks/use-event-filters";

export function ActiveFilterChips() {
    const { filters, setFilters, clearFilters } = useEventFilters();

    const hasFilters =
        filters.city ||
        filters.from ||
        filters.to ||
        filters.distances.length > 0 ||
        filters.types.length > 0 ||
        filters.query;

    if (!hasFilters) return null;

    const removeFilter = (key: keyof typeof filters, value?: string) => {
        if (key === 'distances' && value) {
            setFilters({ distances: filters.distances.filter(d => d !== value) });
        } else if (key === 'types' && value) {
            setFilters({ types: filters.types.filter(t => t !== value) });
        } else {
            setFilters({ [key]: undefined });
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mt-4 justify-center">
            {/* City */}
            {filters.city && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-white uppercase font-bold">
                    <span>{filters.city}</span>
                    <button onClick={() => removeFilter('city')} className="hover:text-lime-400">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Date Range */}
            {(filters.from || filters.to) && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-white uppercase font-bold">
                    <span>{filters.from ? new Date(filters.from).toLocaleDateString('pt-BR') : '...'} - {filters.to ? new Date(filters.to).toLocaleDateString('pt-BR') : '...'}</span>
                    <button onClick={() => setFilters({ from: undefined, to: undefined })} className="hover:text-lime-400">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Distances */}
            {filters.distances.map(dist => (
                <div key={dist} className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-white uppercase font-bold">
                    <span>{dist}</span>
                    <button onClick={() => removeFilter('distances', dist)} className="hover:text-lime-400">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}

            {/* Types */}
            {filters.types.map(type => (
                <div key={type} className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-white uppercase font-bold">
                    <span>{type}</span>
                    <button onClick={() => removeFilter('types', type)} className="hover:text-lime-400">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}

            {/* Query */}
            {filters.query && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-white uppercase font-bold">
                    <span>&quot;{filters.query}&quot;</span>
                    <button onClick={() => removeFilter('query')} className="hover:text-lime-400">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Clear All */}
            <button
                onClick={clearFilters}
                className="text-xs text-zinc-500 hover:text-white uppercase font-bold underline underline-offset-4"
            >
                Limpar Filtros
            </button>
        </div>
    );
}
