'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error Boundary caught:', error);
    }, [error]);

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-4">
                    Algo deu errado!
                </h2>
                <p className="text-zinc-400 mb-8 max-w-md">
                    Encontramos um problema inesperado. Tente recarregar a página.
                </p>
                <Button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="bg-lime-400 text-black hover:bg-lime-500 font-bold uppercase tracking-wider"
                >
                    Tentar novamente
                </Button>
            </div>

            <div className="mt-auto">
                <Footer />
            </div>
        </main>
    );
}
