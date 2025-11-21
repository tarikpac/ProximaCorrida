'use client';

import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Link as LinkIcon, MessageCircle, Send, Twitter, Facebook } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: {
        title: string;
        text: string;
        url: string;
    };
}

export function ShareModal({ isOpen, onClose, eventData }: ShareModalProps) {
    const { showToast } = useToast();
    const { title, text, url } = eventData;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copiado!');
            onClose();
        } catch (err) {
            console.error('Failed to copy:', err);
            showToast('Erro ao copiar link', 'error');
        }
    };

    const socialLinks = [
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-600 hover:bg-green-700',
            href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
        },
        {
            name: 'Telegram',
            icon: Send,
            color: 'bg-blue-500 hover:bg-blue-600',
            href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        },
        {
            name: 'X / Twitter',
            icon: Twitter,
            color: 'bg-black hover:bg-zinc-800 border border-zinc-700',
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-700 hover:bg-blue-800',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compartilhar corrida">
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-3 p-3 w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors group"
                >
                    <div className="p-2 bg-zinc-700 group-hover:bg-zinc-600 rounded-full">
                        <LinkIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-white">Copiar link</span>
                </button>

                <div className="h-px bg-zinc-800 my-1" />

                <div className="grid grid-cols-2 gap-3">
                    {socialLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${link.color}`}
                            onClick={onClose}
                        >
                            <link.icon className="w-4 h-4 text-white" />
                            <span className="text-sm font-medium text-white">{link.name}</span>
                        </a>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
