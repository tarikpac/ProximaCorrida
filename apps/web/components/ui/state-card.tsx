import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface StateCardProps {
    stateCode: string;
    name: string;
    count: number;
}

export function StateCard({ stateCode, name, count }: StateCardProps) {
    const isEmpty = count === 0;

    return (
        <Link
            href={`/br/${stateCode.toLowerCase()}`}
            className={`block group relative ${isEmpty ? 'opacity-60 hover:opacity-100' : ''}`}
        >
            <div className="h-full w-full bg-zinc-900 border border-zinc-800 group-hover:border-lime-400 transition-colors duration-200 flex flex-col p-6 min-h-[160px]">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <span className="font-black text-xl text-white uppercase">{stateCode}</span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-lime-400 transition-colors -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>

                <div className="mt-auto">
                    <h3 className="text-lg font-bold text-white uppercase mb-1 truncate">
                        {name}
                    </h3>
                    <p className={`font-mono text-sm ${isEmpty ? 'text-zinc-500' : 'text-lime-400'}`}>
                        {isEmpty ? 'Em breve' : `${count} ${count === 1 ? 'corrida' : 'corridas'}`}
                    </p>
                </div>
            </div>
        </Link>
    );
}
