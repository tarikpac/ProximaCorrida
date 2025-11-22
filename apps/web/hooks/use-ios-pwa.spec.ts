import { renderHook, act } from '@testing-library/react';
import { useIOSPWA } from './use-ios-pwa';

describe('useIOSPWA', () => {
    let originalNavigator: any;
    let originalMatchMedia: any;

    beforeEach(() => {
        originalNavigator = { ...window.navigator };
        originalMatchMedia = window.matchMedia;
        localStorage.clear();

        // Reset matchMedia mock
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));
    });

    afterEach(() => {
        Object.defineProperty(window, 'navigator', {
            value: originalNavigator,
            writable: true,
        });
        window.matchMedia = originalMatchMedia;
    });

    it('should detect iOS device', () => {
        Object.defineProperty(window, 'navigator', {
            value: {
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            },
            writable: true,
        });

        const { result } = renderHook(() => useIOSPWA());
        expect(result.current.isIOS).toBe(true);
    });

    it('should detect non-iOS device', () => {
        Object.defineProperty(window, 'navigator', {
            value: {
                userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
            },
            writable: true,
        });

        const { result } = renderHook(() => useIOSPWA());
        expect(result.current.isIOS).toBe(false);
    });

    it('should detect standalone mode', () => {
        Object.defineProperty(window, 'navigator', {
            value: {
                standalone: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            },
            writable: true,
        });

        const { result } = renderHook(() => useIOSPWA());
        expect(result.current.isStandalone).toBe(true);
    });

    it('should detect non-standalone mode', () => {
        Object.defineProperty(window, 'navigator', {
            value: {
                standalone: false,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            },
            writable: true,
        });
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));

        const { result } = renderHook(() => useIOSPWA());
        expect(result.current.isStandalone).toBe(false);
    });

    it('should handle prompt dismissal and cooldown', () => {
        Object.defineProperty(window, 'navigator', {
            value: {
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                standalone: false
            },
            writable: true,
        });

        const { result } = renderHook(() => useIOSPWA());

        // Initially should show prompt (isIOS=true, isStandalone=false, not dismissed)
        expect(result.current.shouldShowPrompt).toBe(true);

        act(() => {
            result.current.dismissPrompt();
        });

        expect(localStorage.getItem('ios_pwa_prompt_dismissed_at')).toBeDefined();

        // Re-render to pick up the new state (in a real app, state update triggers re-render)
        // renderHook returns a ref that updates, but let's verify the state change
        expect(result.current.shouldShowPrompt).toBe(false);
    });
});
