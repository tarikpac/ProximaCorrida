"use client";

import { X, Check } from "lucide-react";
import { useEventFilters } from "@/hooks/use-event-filters";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { CityAutocomplete } from "./city-autocomplete";

// Mock data for now - eventually could come from API
const DISTANCES = [
    { label: "5K", value: "5km" },
    { label: "10K", value: "10km" },
    { label: "15K", value: "15km" },
    { label: "21K", value: "21km" },
    { label: "42K", value: "42km" }
];
const TYPES = ["RUA", "TRAIL", "CAMINHADA", "ULTRAMARATONA"];
const DATE_PRESETS = [
    { label: "Este fim de semana", value: "weekend" },
    { label: "Próximos 7 dias", value: "7days" },
    { label: "Este mês", value: "month" },
];

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FilterDrawer({ isOpen, onClose }: FilterDrawerProps) {
    const { filters, setFilters } = useEventFilters();
    const [localFilters, setLocalFilters] = useState(filters);

    // Sync local state when drawer opens
    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen]); // Only sync when drawer opens, ignore filter updates while open to prevent overwriting

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
    };

    const toggleDistance = (distValue: string) => {
        const current = localFilters.distances;
        const next = current.includes(distValue)
            ? current.filter(d => d !== distValue)
            : [...current, distValue];
        setLocalFilters({ ...localFilters, distances: next });
    };

    const toggleType = (type: string) => {
        const current = localFilters.types;
        const next = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        setLocalFilters({ ...localFilters, types: next });
    };

    const applyDatePreset = (preset: string) => {
        const today = new Date();
        let from = "";
        let to = "";

        if (preset === "weekend") {
            const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
            // If today is Sunday (0), next Saturday is +6 days. If Sat (6), +0 days.
            const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;

            const nextSaturday = new Date(today);
            nextSaturday.setDate(today.getDate() + daysUntilSaturday);

            const nextSunday = new Date(nextSaturday);
            nextSunday.setDate(nextSaturday.getDate() + 1);

            from = nextSaturday.toISOString().split('T')[0];
            to = nextSunday.toISOString().split('T')[0];
        } else if (preset === "7days") {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            from = today.toISOString().split('T')[0];
            to = nextWeek.toISOString().split('T')[0];
        } else if (preset === "month") {
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            from = today.toISOString().split('T')[0];
            to = lastDay.toISOString().split('T')[0];
        }

        setLocalFilters(prev => ({ ...prev, from, to }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                data-testid="filter-drawer-panel"
                className="relative w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-black italic uppercase text-white">Filtros</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Location Section */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-sm text-lime-400 uppercase tracking-widest">Localização</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Estado</label>
                                <select
                                    value={localFilters.state || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, state: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 rounded-none focus:border-lime-400 focus:ring-0 outline-none uppercase font-bold"
                                >
                                    <option value="">Todos</option>
                                    <option value="PB">Paraíba</option>
                                    <option value="PE">Pernambuco</option>
                                    <option value="RN">Rio Grande do Norte</option>
                                    {/* Add more states as needed */}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Cidade</label>
                                <CityAutocomplete
                                    key={localFilters.state}
                                    value={localFilters.city || ''}
                                    onChange={(value) => setLocalFilters({ ...localFilters, city: value || undefined })}
                                    state={localFilters.state}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date Section */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-sm text-lime-400 uppercase tracking-widest">Data</h3>
                        <div className="flex flex-wrap gap-2">
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => applyDatePreset(preset.value)}
                                    className="px-3 py-1 border border-zinc-800 text-zinc-400 text-xs uppercase hover:border-lime-400 hover:text-lime-400 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">De</label>
                                <input
                                    type="date"
                                    value={localFilters.from || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, from: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2 rounded-none focus:border-lime-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Até</label>
                                <input
                                    type="date"
                                    value={localFilters.to || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, to: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2 rounded-none focus:border-lime-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Distances Section */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-sm text-lime-400 uppercase tracking-widest">Distância</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {DISTANCES.map(dist => {
                                const isSelected = localFilters.distances.includes(dist.value);
                                return (
                                    <button
                                        key={dist.value}
                                        onClick={() => toggleDistance(dist.value)}
                                        className={cn(
                                            "flex items-center justify-between p-3 border transition-all",
                                            isSelected
                                                ? "border-lime-400 bg-lime-400/10 text-white"
                                                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                                        )}
                                    >
                                        <span className="font-bold">{dist.label}</span>
                                        {isSelected && <Check className="w-4 h-4 text-lime-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Types Section */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-sm text-lime-400 uppercase tracking-widest">Tipo</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {TYPES.map(type => {
                                const isSelected = localFilters.types.includes(type);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => toggleType(type)}
                                        className={cn(
                                            "flex items-center justify-between p-3 border transition-all",
                                            isSelected
                                                ? "border-lime-400 bg-lime-400/10 text-white"
                                                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                                        )}
                                    >
                                        <span className="font-bold">{type}</span>
                                        {isSelected && <Check className="w-4 h-4 text-lime-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950 relative z-[60]">
                    <button
                        onClick={handleApply}
                        className="w-full bg-lime-400 text-black font-black uppercase py-4 hover:bg-lime-300 transition-colors text-lg tracking-tight"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        </div>
    );
}
