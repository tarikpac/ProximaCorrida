import { render, screen, fireEvent } from '@testing-library/react';
import { PWAInstallGuide } from './pwa-install-guide';
import '@testing-library/jest-dom';

describe('PWAInstallGuide', () => {
    it('should render correctly', () => {
        render(<PWAInstallGuide isOpen={true} onClose={() => { }} />);
        expect(screen.getByText('Instale o App para Receber Notificações')).toBeInTheDocument();
        expect(screen.getByText('Toque no ícone de compartilhamento')).toBeInTheDocument();
        expect(screen.getByText("Selecione 'Adicionar à Tela de Início'")).toBeInTheDocument();
        expect(screen.getByText('Abra o app pela tela inicial e ative as notificações')).toBeInTheDocument();
    });

    it('should call onClose when "Entendi" button is clicked', () => {
        const onClose = jest.fn();
        render(<PWAInstallGuide isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByText('Entendi'));
        expect(onClose).toHaveBeenCalled();
    });

    it('should not render when isOpen is false', () => {
        render(<PWAInstallGuide isOpen={false} onClose={() => { }} />);
        expect(screen.queryByText('Instale o App para Receber Notificações')).not.toBeInTheDocument();
    });
});
