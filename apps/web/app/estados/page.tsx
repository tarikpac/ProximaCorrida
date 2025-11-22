import { StateCard } from "@/components/ui/state-card";
import { Metadata } from "next";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
    title: "Corridas por Estado - ProximaCorrida",
    description: "Encontre corridas de rua em todo o Brasil. Calendário completo de eventos por estado.",
};

const BRAZIL_STATES = [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' },
];

interface StateCount {
    state: string;
    count: number;
}

async function getEventCounts(): Promise<StateCount[]> {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/events/stats/by-state`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch state counts", error);
        return [];
    }
}

export default async function EstadosPage() {
    const countsData = await getEventCounts();
    const countsMap = new Map(countsData.map((item) => [item.state, item.count]));

    return (
        <section className="pt-32 pb-16 px-4">
            <div className="container mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-8 bg-lime-400 -skew-x-12" />
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
                        Corridas por Estado
                    </h1>
                </div>

                <p className="text-zinc-400 max-w-2xl mb-12 text-lg">
                    Encontre corridas de rua em todo o Brasil. Selecione seu estado para ver o calendário completo de eventos confirmados.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {BRAZIL_STATES.map((state) => (
                        <StateCard
                            key={state.code}
                            stateCode={state.code}
                            name={state.name}
                            count={countsMap.get(state.code) || 0}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
