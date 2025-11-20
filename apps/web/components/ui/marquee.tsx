export function Marquee() {
    return (
        <div className="w-full bg-zinc-900 border-y border-zinc-800 overflow-hidden py-3">
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-8">
                            <span className="text-zinc-400 font-mono text-sm font-bold uppercase tracking-widest">
                                CALENDARIO OFICIAL ATUALIZADO
                            </span>
                            <div className="w-2 h-2 bg-lime-400 rounded-full" />
                            <span className="text-zinc-400 font-mono text-sm font-bold uppercase tracking-widest">
                                NOVAS PROVAS TODOS OS DIAS
                            </span>
                            <div className="w-2 h-2 bg-lime-400 rounded-full" />
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center gap-8 ml-8">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={`clone-${i}`} className="flex items-center gap-8">
                            <span className="text-zinc-400 font-mono text-sm font-bold uppercase tracking-widest">
                                CALENDARIO OFICIAL ATUALIZADO
                            </span>
                            <div className="w-2 h-2 bg-lime-400 rounded-full" />
                            <span className="text-zinc-400 font-mono text-sm font-bold uppercase tracking-widest">
                                NOVAS PROVAS TODOS OS DIAS
                            </span>
                            <div className="w-2 h-2 bg-lime-400 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
