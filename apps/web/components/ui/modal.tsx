'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                data-testid="modal-content"
            >
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
