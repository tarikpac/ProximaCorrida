export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-900 bg-black py-8">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2 opacity-50">
                    <span className="font-black italic uppercase text-zinc-600 text-sm">PROXIMA</span>
                    <span className="font-black italic uppercase text-zinc-700 text-sm">CORRIDA</span>
                </div>
                <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest">
                    © {new Date().getFullYear()} Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}
