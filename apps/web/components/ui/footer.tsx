import Link from "next/link";
import { Instagram } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-900 bg-black py-12">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-8">
                {/* Logo */}
                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <span className="font-black italic uppercase text-zinc-600 text-sm">PROXIMA</span>
                    <span className="font-black italic uppercase text-zinc-700 text-sm">CORRIDA</span>
                </div>

                {/* Main Links */}
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 max-w-2xl text-center">
                    <Link href="/sobre" className="font-mono text-xs text-zinc-600 hover:text-lime-400 uppercase tracking-widest transition-colors">
                        Sobre
                    </Link>
                    <Link href="/estados" className="font-mono text-xs text-zinc-600 hover:text-lime-400 uppercase tracking-widest transition-colors">
                        Estados
                    </Link>
                    <Link href="/calculadora-pace" className="font-mono text-xs text-zinc-600 hover:text-lime-400 uppercase tracking-widest transition-colors">
                        Calculadora de Pace
                    </Link>
                    <Link href="/organizador" className="font-mono text-xs text-zinc-600 hover:text-lime-400 uppercase tracking-widest transition-colors">
                        Área do Organizador
                    </Link>
                </div>

                {/* Legal Links */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <Link href="/termos" className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 uppercase tracking-widest transition-colors">
                        Termos de Uso
                    </Link>
                    <Link href="/privacidade" className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 uppercase tracking-widest transition-colors">
                        Política de Privacidade
                    </Link>
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-4">
                    <a
                        href="#"
                        className="p-2 rounded-full bg-zinc-900/50 text-zinc-500 hover:text-lime-400 hover:bg-zinc-900 transition-all group"
                        aria-label="Instagram"
                    >
                        <Instagram className="h-5 w-5" />
                    </a>
                </div>

                {/* Copyright */}
                <p className="font-mono text-[10px] text-zinc-800 uppercase tracking-widest">
                    © {new Date().getFullYear()} Proxima Corrida. Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}
