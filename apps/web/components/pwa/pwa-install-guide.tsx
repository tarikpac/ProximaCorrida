import { Share, PlusSquare, Bell } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface PWAInstallGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PWAInstallGuide({ isOpen, onClose }: PWAInstallGuideProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Instale o App para Receber Notificações"
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                            <Share className="w-5 h-5 text-lime-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-200">
                                Toque no ícone de compartilhamento
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Geralmente localizado na barra inferior do Safari.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                            <PlusSquare className="w-5 h-5 text-lime-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-200">
                                Selecione 'Adicionar à Tela de Início'
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Role para baixo nas opções até encontrar.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                            <Bell className="w-5 h-5 text-lime-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-200">
                                Abra o app pela tela inicial e ative as notificações
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                O app funcionará como um aplicativo nativo.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 text-sm font-bold text-zinc-950 bg-lime-400 hover:bg-lime-500 rounded-lg transition-colors"
                >
                    Entendi
                </button>
            </div>
        </Modal>
    );
}
