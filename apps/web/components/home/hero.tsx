"use client";

import { Search, MapPin, Calendar, Activity } from "lucide-react";
import { useState } from "react";
import { useEventFilters } from "@/hooks/use-event-filters";
import { FilterDrawer } from "@/components/filters/filter-drawer";
import { ActiveFilterChips } from "@/components/filters/active-filter-chips";
import { GlobalSearchBar } from "@/components/filters/global-search-bar";

export function Hero() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { filters } = useEventFilters();

    // Helper to format display values
    const getLocationDisplay = () => {
        if (filters.city) return `${filters.city}, ${filters.state}`;
        return filters.state === 'PB' ? 'Paraíba' : filters.state; // Default or current state
    };

    const getDateDisplay = () => {
        if (filters.from && filters.to) return "Periodo Definido";
        if (filters.from) return "A partir de...";
        return "Qualquer Data";
    };

    const getDistanceDisplay = () => {
        if (filters.distances.length > 0) return `${filters.distances.length} Selecionada(s)`;
        return "Qualquer";
    };

    return (
        <section className="relative w-full bg-zinc-950 py-20 lg:py-32 overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <div className="container relative mx-auto px-4 flex flex-col items-center z-10">
                {/* Title */}
                <div className="text-center mb-12 space-y-4">
                    <p className="font-mono text-zinc-500 text-sm tracking-widest uppercase">
                        Base de dados atualizada
                    </p>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[0.9]">
                        <span className="text-white block md:inline mr-4">Encontre sua</span>
                        <span className="text-lime-400 block md:inline">Proxima Corrida</span>
                    </h1>
                </div>

                {/* Search Dashboard */}
                <div className="w-full max-w-5xl bg-zinc-950 border border-zinc-700 shadow-2xl shadow-black/50 p-1">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
                        {/* Input: Onde */}
                        <div
                            onClick={() => setIsDrawerOpen(true)}
                            data-testid="filter-location-trigger"
                            className="md:col-span-4 bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-lime-400" />
                                <span className="font-mono text-xs text-lime-400 uppercase">Onde?</span>
                            </div>
                            <div className="text-2xl font-bold text-white uppercase truncate">{getLocationDisplay()}</div>
                        </div>

                        {/* Input: Quando */}
                        <div
                            onClick={() => setIsDrawerOpen(true)}
                            data-testid="filter-date-trigger"
                            className="md:col-span-3 bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-lime-400" />
                                <span className="font-mono text-xs text-lime-400 uppercase">Quando?</span>
                            </div>
                            <div className="text-2xl font-bold text-white uppercase truncate">{getDateDisplay()}</div>
                        </div>

                        {/* Input: Distancia */}
                        <div
                            onClick={() => setIsDrawerOpen(true)}
                            data-testid="filter-distance-trigger"
                            className="md:col-span-3 bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-4 h-4 text-lime-400" />
                                <span className="font-mono text-xs text-lime-400 uppercase">Distância</span>
                            </div>
                            <div className="text-2xl font-bold text-white uppercase truncate">{getDistanceDisplay()}</div>
                        </div>

                        {/* Search Button */}
                        <div className="md:col-span-2">
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="w-full h-full bg-lime-400 hover:bg-lime-300 transition-colors flex items-center justify-center group min-h-[80px]"
                            >
                                <Search className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Global Search & Chips */}
                <div className="w-full max-w-3xl mt-8 space-y-4">
                    <GlobalSearchBar />
                    <ActiveFilterChips />
                </div>

                {/* Quick Filters (Static for now, could be dynamic) */}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {["João Pessoa", "Campina Grande", "5K", "10K", "Meia Maratona", "Trail Run"].map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setIsDrawerOpen(true)} // For now just open drawer, ideally sets filter directly
                            className="px-4 py-2 border border-zinc-800 hover:border-lime-400 hover:text-lime-400 text-zinc-400 font-mono text-xs uppercase transition-colors bg-zinc-950/50"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <FilterDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </section>
    );
}
