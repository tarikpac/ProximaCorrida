'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, Globe, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => {
        return pathname === path ? "text-lime-400" : "text-zinc-400 hover:text-lime-400";
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

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
                            className={`font-mono text-xs font-bold tracking-widest transition-colors uppercase ${isActive('/calendario')}`}
                        >
                            Calendario
                        </Link>
                        <Link
                            href="/calculadora-pace"
                            className={`font-mono text-xs font-bold tracking-widest transition-colors uppercase ${isActive('/calculadora-pace')}`}
                        >
                            Calculadora de Pace
                        </Link>
                        <Link
                            href="/organizador"
                            className={`font-mono text-xs font-bold tracking-widest transition-colors uppercase ${isActive('/organizador')}`}
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

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white"
                    onClick={toggleMobileMenu}
                    aria-label="Menu mobile"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    data-testid="mobile-menu"
                    className="md:hidden absolute top-16 left-0 w-full bg-zinc-950 border-b border-zinc-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top-5"
                >
                    <Link
                        href="/calendario"
                        className={`font-mono text-sm font-bold tracking-widest uppercase py-2 ${isActive('/calendario')}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Calendario
                    </Link>
                    <Link
                        href="/calculadora-pace"
                        className={`font-mono text-sm font-bold tracking-widest uppercase py-2 ${isActive('/calculadora-pace')}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Calculadora de Pace
                    </Link>
                    <Link
                        href="/organizador"
                        className={`font-mono text-sm font-bold tracking-widest uppercase py-2 ${isActive('/organizador')}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Organizador
                    </Link>
                </div>
            )}
        </nav>
    );
}
