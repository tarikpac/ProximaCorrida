'use client';

import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { usePaceCalculator } from '@/hooks/use-pace-calculator';
import { Calculator, Timer, Gauge, AlertCircle } from 'lucide-react';

export default function PaceCalculatorPage() {
    const {
        distance,
        setDistance,
        timeHours,
        setTimeHours,
        timeMinutes,
        setTimeMinutes,
        timeSeconds,
        setTimeSeconds,
        paceMinutes,
        setPaceMinutes,
        paceSeconds,
        setPaceSeconds,
        result,
        predictions,
        error,
        handleCalculate,
        clearAll,
    } = usePaceCalculator();

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <Navbar />

            <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                {/* Header Section */}
                <div className="mb-8 space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                        <Calculator className="w-8 h-8 text-lime-400" />
                        Calculadora de Pace
                    </h1>
                    <div className="space-y-2 text-zinc-400">
                        <p>
                            Use a calculadora de ritmo para descobrir em quanto tempo você completa diferentes distâncias de corrida com base no seu pace.
                        </p>
                        <p>
                            Basta informar seu ritmo ou o tempo de uma prova e a distância desejada para ver o tempo estimado de chegada e uma tabela com previsões para provas populares como 5 km, 10 km, meia maratona, maratona e 50 km.
                        </p>
                    </div>
                </div>

                {/* Calculator Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl">

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Distance Input */}
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="distance" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-lime-400" />
                                Distância (km)
                            </label>
                            <input
                                id="distance"
                                type="number"
                                inputMode="decimal"
                                placeholder="Ex: 10"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-2xl font-semibold text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                            />
                        </div>

                        {/* Time Input (Dropdowns) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Timer className="w-4 h-4 text-lime-400" />
                                Tempo (hh:mm:ss)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Hours */}
                                <div className="relative">
                                    <select
                                        value={timeHours}
                                        onChange={(e) => setTimeHours(e.target.value)}
                                        className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-lg font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    >
                                        {Array.from({ length: 11 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i} {i === 1 ? 'hora' : 'horas'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                {/* Minutes */}
                                <div className="relative">
                                    <select
                                        value={timeMinutes}
                                        onChange={(e) => setTimeMinutes(e.target.value)}
                                        className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-lg font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i} min
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                {/* Seconds */}
                                <div className="relative">
                                    <select
                                        value={timeSeconds}
                                        onChange={(e) => setTimeSeconds(e.target.value)}
                                        className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-lg font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i} s
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pace Input (Dropdowns) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-lime-400" />
                                Ritmo (min/km)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Minutes */}
                                <div className="relative">
                                    <select
                                        value={paceMinutes}
                                        onChange={(e) => setPaceMinutes(e.target.value)}
                                        className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-lg font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    >
                                        {Array.from({ length: 21 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i} min
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                {/* Seconds */}
                                <div className="relative">
                                    <select
                                        value={paceSeconds}
                                        onChange={(e) => setPaceSeconds(e.target.value)}
                                        className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-lg font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i} s
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleCalculate}
                            className="flex-1 bg-lime-400 hover:bg-lime-500 text-zinc-950 font-bold text-lg py-4 rounded-xl transition-colors active:scale-[0.98]"
                        >
                            Calcular
                        </button>
                        <button
                            onClick={clearAll}
                            className="px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
                        >
                            Limpar
                        </button>
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8 pt-4 border-t border-zinc-800">

                            {/* Main Result */}
                            <div className="text-center space-y-2">
                                <p className="text-zinc-400 text-sm uppercase tracking-wider font-medium">{result.label}</p>
                                <p className="text-5xl md:text-6xl font-bold text-lime-400 font-mono tracking-tight">
                                    {result.value} <span className="text-lg md:text-xl text-zinc-500 font-sans font-normal">{result.type === 'pace' ? 'min/km' : ''}</span>
                                </p>
                            </div>

                            {/* Prediction Table */}
                            {predictions.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-zinc-100">Estimativas de Tempo</h3>
                                    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-900 text-zinc-400">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Distância</th>
                                                    <th className="px-4 py-3 font-medium text-right">Tempo Estimado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                {predictions.map((pred) => (
                                                    <tr key={pred.label} className="hover:bg-zinc-900/50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-zinc-200">{pred.label}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-lime-400">{pred.time}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
