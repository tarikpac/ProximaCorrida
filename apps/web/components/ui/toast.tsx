'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-xs px-4 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg text-sm text-white animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto"
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-lime-400" />}
                        {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
