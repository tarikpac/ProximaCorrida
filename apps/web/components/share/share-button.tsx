'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './share-modal';

interface ShareButtonProps {
    eventData: {
        title: string;
        date: string;
        city: string;
        url: string;
    };
    variant?: 'default' | 'card';
    className?: string;
    children?: React.ReactNode;
}

export function ShareButton({ eventData, variant = 'default', className = '', children }: ShareButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fullUrl = typeof window !== 'undefined' && eventData.url.startsWith('/')
        ? `${window.location.origin}${eventData.url}`
        : eventData.url;

    const shareData = {
        title: eventData.title,
        text: `Confira este evento no ProximaCorrida: ${eventData.title} em ${eventData.city} no dia ${eventData.date}.`,
        url: fullUrl
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent triggering card click

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <button
                onClick={handleShare}
                className={`
                    flex items-center justify-center transition-colors
                    ${variant === 'default'
                        ? 'p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg'
                        : 'p-2 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-full'
                    }
                    ${className}
                `}
                aria-label="Share"
            >
                {children || <Share2 className={variant === 'default' ? 'w-5 h-5' : 'w-4 h-4'} />}
            </button>

            <ShareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={shareData}
            />
        </>
    );
}
