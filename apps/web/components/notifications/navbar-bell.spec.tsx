import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NavbarBell } from './navbar-bell';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useIOSPWA } from '@/hooks/use-ios-pwa';
import '@testing-library/jest-dom';

// Mock hooks
jest.mock('@/hooks/use-push-notifications', () => ({
  usePushNotifications: jest.fn(),
}));

jest.mock('@/hooks/use-ios-pwa', () => ({
  useIOSPWA: jest.fn(),
}));

// Mock Modal and PWAInstallGuide
jest.mock('@/components/ui/modal', () => ({
  Modal: ({ isOpen, children, title }: any) => (
    isOpen ? <div role="dialog" aria-label={title}><h1>{title}</h1>{children}</div> : null
  ),
}));

jest.mock('@/components/pwa/pwa-install-guide', () => ({
  PWAInstallGuide: ({ isOpen }: any) => (
    isOpen ? <div data-testid="pwa-guide">Instale o App para Receber Notificações</div> : null
  ),
}));

describe('NavbarBell Integration', () => {
  const mockSubscribeToPush = jest.fn();
  const mockUpdatePreferences = jest.fn();
  const mockDismissPrompt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (usePushNotifications as jest.Mock).mockImplementation(() => ({
      permission: 'default',
      subscription: null,
      statePreferences: [],
      loading: false,
      subscribeToPush: mockSubscribeToPush,
      updatePreferences: mockUpdatePreferences,
    }));
  });

  it('should show PWA Install Guide when clicking bell on iOS browser', async () => {
    (useIOSPWA as jest.Mock).mockImplementation(() => ({
      isIOS: true,
      isStandalone: false,
      shouldShowPrompt: true,
      dismissPrompt: mockDismissPrompt,
    }));

    render(<NavbarBell />);

    const bellButton = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bellButton);

    expect(await screen.findByTestId('pwa-guide')).toBeInTheDocument();
    expect(screen.queryByText('Ativar Notificações')).not.toBeInTheDocument();
  });

  it('should show standard Explainer when clicking bell on Android or Desktop', async () => {
    (useIOSPWA as jest.Mock).mockImplementation(() => ({
      isIOS: false,
      isStandalone: false,
      shouldShowPrompt: false,
      dismissPrompt: mockDismissPrompt,
    }));

    render(<NavbarBell />);

    const bellButton = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bellButton);

    expect(await screen.findByText('Cancelar')).toBeInTheDocument();
    expect(screen.queryByTestId('pwa-guide')).not.toBeInTheDocument();
  });

  it('should show standard Explainer when clicking bell on iOS Standalone (PWA)', async () => {
    (useIOSPWA as jest.Mock).mockImplementation(() => ({
      isIOS: true,
      isStandalone: true,
      shouldShowPrompt: false,
      dismissPrompt: mockDismissPrompt,
    }));

    render(<NavbarBell />);

    const bellButton = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bellButton);

    expect(await screen.findByText('Cancelar')).toBeInTheDocument();
    expect(screen.queryByTestId('pwa-guide')).not.toBeInTheDocument();
  });

  it('should override cooldown and show Prompt if explicit bell click on iOS browser', async () => {
    (useIOSPWA as jest.Mock).mockImplementation(() => ({
      isIOS: true,
      isStandalone: false,
      shouldShowPrompt: false, // Simulated cooldown
      dismissPrompt: mockDismissPrompt,
    }));

    render(<NavbarBell />);

    const bellButton = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bellButton);

    expect(await screen.findByTestId('pwa-guide')).toBeInTheDocument();
  });
});
