import { useState, useEffect } from 'react';

export function useIOSPWA() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [hasDismissedRecently, setHasDismissedRecently] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.navigator) {
            const userAgent = window.navigator.userAgent.toLowerCase();
            const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
            setIsIOS(isIosDevice);

            const isStandaloneMode =
                (window.navigator as any).standalone === true ||
                (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
            setIsStandalone(!!isStandaloneMode);

            const dismissedAt = localStorage.getItem('ios_pwa_prompt_dismissed_at');
            if (dismissedAt) {
                const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
                if (daysSinceDismissal < 7) {
                    setHasDismissedRecently(true);
                }
            }
        }
    }, []);

    const dismissPrompt = () => {
        localStorage.setItem('ios_pwa_prompt_dismissed_at', Date.now().toString());
        setHasDismissedRecently(true);
    };

    const shouldShowPrompt = isIOS && !isStandalone && !hasDismissedRecently;

    return {
        isIOS,
        isStandalone,
        shouldShowPrompt,
        dismissPrompt,
    };
}
