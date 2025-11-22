'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, Globe, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { NavbarBell } from "@/components/notifications/navbar-bell";

export function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const isActive = (path: string) => {
        return pathname === path
            ? "text-lime-400 border-b-2 border-lime-400"
            : "text-zinc-400 hover:text-lime-400 border-b-2 border-transparent hover:border-lime-400/50";
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
                            className={`font-mono text-xs font-bold tracking-widest transition-all uppercase py-1 ${isActive('/calendario')}`}
                        >
                            Calendario
                        </Link>
                        <Link
                            href="/estados"
                            className={`font-mono text-xs font-bold tracking-widest transition-all uppercase py-1 ${isActive('/estados')}`}
                        >
                            Estados
                        </Link>
                        <Link
                            href="/calculadora-pace"
                            className={`font-mono text-xs font-bold tracking-widest transition-all uppercase py-1 ${isActive('/calculadora-pace')}`}
                        >
                            Calculadora de Pace
                        </Link>
                        <Link
                            href="/organizador"
                            className={`font-mono text-xs font-bold tracking-widest transition-all uppercase py-1 ${isActive('/organizador')}`}
                        >
                            Organizador
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-zinc-800" />

                    <div className="flex items-center gap-4">
                        <NavbarBell />

                        {/* Language Selector */}
                        <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                            <Globe className="h-4 w-4" />
                            <span className="font-mono text-xs font-bold">PT</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center gap-2 md:hidden">
                    <NavbarBell />
                    {/* Mobile Menu Button */}
                    <button
                        className="p-2 text-zinc-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Menu mobile"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay & Drawer */}
            {isMobileMenuOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div
                        data-testid="mobile-menu"
                        className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-zinc-950 border-l border-zinc-800 z-50 md:hidden shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <span className="font-black italic uppercase text-white text-lg tracking-tighter">
                                MENU
                            </span>
                            <button
                                className="p-2 text-zinc-400 hover:text-white"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Fechar menu"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex flex-col p-4 gap-2">
                            <Link
                                href="/"
                                className={`font-mono text-sm font-bold tracking-widest uppercase py-3 px-2 ${pathname === '/' ? 'text-lime-400 bg-zinc-900/50' : 'text-zinc-400'}`}
                            >
                                Home
                            </Link>
                            <Link
                                href="/calendario"
                                className={`font-mono text-sm font-bold tracking-widest uppercase py-3 px-2 ${isActive('/calendario').includes('text-lime-400') ? 'text-lime-400 bg-zinc-900/50' : 'text-zinc-400'}`}
                            >
                                Calendario
                            </Link>
                            <Link
                                href="/estados"
                                className={`font-mono text-sm font-bold tracking-widest uppercase py-3 px-2 ${isActive('/estados').includes('text-lime-400') ? 'text-lime-400 bg-zinc-900/50' : 'text-zinc-400'}`}
                            >
                                Estados
                            </Link>
                            <Link
                                href="/calculadora-pace"
                                className={`font-mono text-sm font-bold tracking-widest uppercase py-3 px-2 ${isActive('/calculadora-pace').includes('text-lime-400') ? 'text-lime-400 bg-zinc-900/50' : 'text-zinc-400'}`}
                            >
                                Calculadora de Pace
                            </Link>
                            <Link
                                href="/organizador"
                                className={`font-mono text-sm font-bold tracking-widest uppercase py-3 px-2 ${isActive('/organizador').includes('text-lime-400') ? 'text-lime-400 bg-zinc-900/50' : 'text-zinc-400'}`}
                            >
                                Organizador
                            </Link>
                        </div>

                        <div className="mt-auto p-4 border-t border-zinc-800">
                            <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-full py-2">
                                <Globe className="h-4 w-4" />
                                <span className="font-mono text-xs font-bold">PORTUGUÊS (BR)</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
