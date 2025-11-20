import Link from "next/link";
import { Timer, Globe } from "lucide-react";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center bg-lime-400 rounded-sm transition-transform group-hover:rotate-12">
                        <Timer className="h-5 w-5 text-black" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-black italic uppercase text-white text-lg tracking-tighter">
                            PROXIMA
                        </span>
                        <span className="font-black italic uppercase text-lime-400 text-lg tracking-tighter -mt-1">
                            CORRIDA
                        </span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/calendario"
                            className="font-mono text-xs font-bold tracking-widest text-zinc-400 hover:text-lime-400 transition-colors uppercase"
                        >
                            Calendario
                        </Link>
                        <Link
                            href="/organizador"
                            className="font-mono text-xs font-bold tracking-widest text-zinc-400 hover:text-lime-400 transition-colors uppercase"
                        >
                            Organizador
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-zinc-800" />

                    {/* Language Selector */}
                    <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                        <Globe className="h-4 w-4" />
                        <span className="font-mono text-xs font-bold">PT</span>
                    </button>
                </div>

                {/* Mobile Menu Button (Placeholder) */}
                <div className="md:hidden">
                    <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-white mb-1"></div>
                        <div className="w-4 h-0.5 bg-white"></div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
