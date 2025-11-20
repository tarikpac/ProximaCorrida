import Link from "next/link";

export function OrganizerCTA() {
    return (
        <section className="w-full bg-zinc-950 py-16 px-4">
            <div className="container mx-auto">
                <div className="relative w-full bg-zinc-900 border border-zinc-800 overflow-hidden p-8 md:p-16 flex flex-col items-center text-center">

                    {/* Glow Effect */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-lime-400/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-2xl space-y-6">
                        <h2 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
                            Organiza Corridas?
                        </h2>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto">
                            Cadastre seu evento em nossa plataforma e alcance milhares de corredores apaixonados.
                        </p>

                        <div className="pt-4">
                            <Link
                                href="/organizador"
                                className="inline-flex items-center justify-center px-8 py-4 border border-zinc-600 hover:border-lime-400 text-white hover:text-lime-400 font-mono font-bold uppercase tracking-widest transition-all hover:bg-zinc-800/50"
                            >
                                Area do Organizador
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
