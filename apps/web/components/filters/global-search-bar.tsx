"use client";

import { Search } from "lucide-react";
import { useEventFilters } from "@/hooks/use-event-filters";
import { useState, useEffect } from "react";

export function GlobalSearchBar() {
    const { filters, setFilters } = useEventFilters();
    const [value, setValue] = useState(filters.query || "");

    // Debounce update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (value !== (filters.query || "")) {
                setFilters({ query: value || undefined });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value, filters.query, setFilters]);

    // Sync from URL if changed externally
    useEffect(() => {
        if (filters.query !== value) {
            setValue(filters.query || "");
        }
    }, [filters.query]);

    return (
        <div className="relative w-full max-w-md mx-auto mt-8">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-lime-400 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full p-4 pl-10 text-sm text-white bg-zinc-950 border border-zinc-800 focus:border-lime-400 focus:ring-0 outline-none placeholder-zinc-600 uppercase font-bold tracking-wider transition-all"
                    placeholder="Buscar por nome, cidade, organizador..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    );
}
