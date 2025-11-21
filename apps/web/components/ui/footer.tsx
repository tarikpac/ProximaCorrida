import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-900 bg-black py-8">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2 opacity-50">
                    <span className="font-black italic uppercase text-zinc-600 text-sm">PROXIMA</span>
                    <span className="font-black italic uppercase text-zinc-700 text-sm">CORRIDA</span>
                </div>

                <div className="flex gap-6">
                    <Link href="/sobre" className="font-mono text-xs text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">
                        Sobre
                    </Link>
                    <Link href="/estados" className="font-mono text-xs text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">
                        Estados
                    </Link>
                    <Link href="/calculadora-pace" className="font-mono text-xs text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">
                        Calculadora de Pace
                    </Link>
                </div>

                <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest">
                    © {new Date().getFullYear()} Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}
