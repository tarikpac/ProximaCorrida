'use client';

import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useIOSPWA } from '@/hooks/use-ios-pwa';
import { Modal } from '@/components/ui/modal';
import { PWAInstallGuide } from '@/components/pwa/pwa-install-guide';
import { BRAZIL_STATES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function NavbarBell() {
    const { permission, subscription, statePreferences, loading, subscribeToPush, updatePreferences } = usePushNotifications();
    const { isIOS, isStandalone, dismissPrompt } = useIOSPWA();

    const [showExplainer, setShowExplainer] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showPWAInstall, setShowPWAInstall] = useState(false);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);

    // Sync selected states with preferences when modal opens or preferences change
    useEffect(() => {
        if (showPreferences) {
            setSelectedStates(statePreferences);
        }
    }, [showPreferences, statePreferences]);

    const handleBellClick = () => {
        if (isIOS && !isStandalone) {
            setShowPWAInstall(true);
            return;
        }

        if (permission === 'granted' && subscription) {
            setShowPreferences(true);
        } else {
            setShowExplainer(true);
        }
    };

    const handleEnable = async () => {
        setShowExplainer(false);
        const sub = await subscribeToPush();
        if (sub) {
            setShowPreferences(true);
        }
    };

    const handleSavePreferences = async () => {
        await updatePreferences(selectedStates);
        setShowPreferences(false);
    };

    const toggleState = (code: string) => {
        setSelectedStates(prev =>
            prev.includes(code)
                ? prev.filter(s => s !== code)
                : [...prev, code]
        );
    };

    const handleDismissPWA = () => {
        setShowPWAInstall(false);
        dismissPrompt();
    };

    return (
        <>
            <button
                onClick={handleBellClick}
                className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Notificações"
            >
                <Bell className="w-5 h-5" />
                {permission === 'granted' && subscription && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-lime-400 rounded-full" />
                )}
            </button>

            <PWAInstallGuide
                isOpen={showPWAInstall}
                onClose={handleDismissPWA}
            />

            <Modal
                isOpen={showExplainer}
                onClose={() => setShowExplainer(false)}
                title="Ativar Notificações"
            >
                <div className="space-y-4">
                    <p className="text-zinc-300">
                        Receba alertas de novas corridas no seu estado. Fique por dentro dos eventos assim que eles forem lançados.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowExplainer(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-bold text-zinc-950 bg-lime-400 hover:bg-lime-500 rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Ativando...' : 'Ativar Notificações'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
                title="Preferências de Alerta"
            >
                <div className="space-y-6">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Selecione os estados dos quais você deseja receber notificações sobre novas corridas:
                    </p>

                    <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {BRAZIL_STATES.map((state) => (
                            <button
                                key={state.code}
                                onClick={() => toggleState(state.code)}
                                className={cn(
                                    "h-10 text-sm font-bold rounded-md border transition-all duration-200 flex items-center justify-center",
                                    selectedStates.includes(state.code)
                                        ? "bg-lime-400 text-zinc-950 border-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.3)]"
                                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                                )}
                                title={state.name}
                            >
                                {state.code}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button
                            onClick={() => setShowPreferences(false)}
                            className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSavePreferences}
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-bold text-zinc-950 bg-lime-400 hover:bg-lime-500 rounded-md transition-all shadow-lg shadow-lime-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : 'Salvar Preferências'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
