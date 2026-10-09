/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PeerConnectionManager } from '../src/store/multiplayer/peerManager';
import { ICE_SERVERS } from '../src/game/multiplayer/peerConfig';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { useSettingsStore } from '../src/store/settingsStore';
import i18n from '../src/i18n';

describe('Advanced Optimizations Suite (Architecture, WebRTC STUN/Heartbeat, Offline & i18n)', () => {
  describe('STUN Configuration', () => {
    it('configures multiple reliable public STUN servers for NAT traversal', () => {
      expect(ICE_SERVERS.length).toBeGreaterThanOrEqual(5);
      const urls = ICE_SERVERS.map((s) => (typeof s.urls === 'string' ? s.urls : s.urls[0]));
      expect(urls.some((u) => u.includes('google.com'))).toBe(true);
      expect(urls.some((u) => u.includes('cloudflare.com'))).toBe(true);
      expect(urls.some((u) => u.includes('openrelay.metered.ca'))).toBe(true);
    });
  });

  describe('PeerConnectionManager Heartbeat & Lifecycle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('triggers ping function on configured interval', () => {
      const manager = new PeerConnectionManager();
      const sendPingMock = vi.fn();
      const timeoutMock = vi.fn();

      manager.startHeartbeat(sendPingMock, timeoutMock, 1000, 3000);
      expect(sendPingMock).not.toHaveBeenCalled();

      // Fast forward 1s
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(sendPingMock).toHaveBeenCalledTimes(1);

      // Fast forward another 1s
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(sendPingMock).toHaveBeenCalledTimes(2);

      manager.cleanup();
    });

    it('triggers timeout callback when heartbeat watchdog detects stalled connection', () => {
      const manager = new PeerConnectionManager();
      const sendPingMock = vi.fn();
      const timeoutMock = vi.fn();

      manager.startHeartbeat(sendPingMock, timeoutMock, 1000, 3000);

      // Advance by 4500ms without recording heartbeat (timeout is 3000ms)
      act(() => {
        vi.advanceTimersByTime(4500);
      });

      expect(timeoutMock).toHaveBeenCalledTimes(1);
      manager.cleanup();
    });

    it('does not trigger timeout if heartbeat is actively recorded', () => {
      const manager = new PeerConnectionManager();
      const sendPingMock = vi.fn();
      const timeoutMock = vi.fn();

      manager.startHeartbeat(sendPingMock, timeoutMock, 1000, 3000);

      // Advance 2s, record heartbeat, advance another 2s
      act(() => {
        vi.advanceTimersByTime(2000);
        manager.recordHeartbeat();
        vi.advanceTimersByTime(2000);
      });

      expect(timeoutMock).not.toHaveBeenCalled();
      manager.cleanup();
    });
  });

  describe('OfflineBanner Component', () => {
    let originalOnLine: boolean;

    beforeEach(() => {
      originalOnLine = navigator.onLine;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: originalOnLine,
        configurable: true,
      });
    });

    it('renders offline warning banner when browser goes offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      render(<OfflineBanner />);

      expect(
        screen.getByText(/目前處於離線狀態|Currently offline/i)
      ).toBeDefined();
    });

    it('allows user to dismiss the banner manually', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      render(<OfflineBanner />);

      const closeButton = screen.getByRole('button', { name: /關閉提示|Close notice/i });
      fireEvent.click(closeButton);

      expect(
        screen.queryByText(/目前處於離線狀態|Currently offline/i)
      ).toBeNull();
    });
  });

  describe('i18n & Settings Integration', () => {
    it('supports switching between zh-TW and en languages', () => {
      const store = useSettingsStore.getState();

      act(() => {
        store.setLanguage('en');
      });

      expect(useSettingsStore.getState().language).toBe('en');
      expect(i18n.language).toBe('en');

      act(() => {
        store.setLanguage('zh-TW');
      });

      expect(useSettingsStore.getState().language).toBe('zh-TW');
      expect(i18n.language).toBe('zh-TW');
    });

    it('provides valid translations for all key UI namespaces', () => {
      expect(i18n.t('app.title', { lng: 'zh-TW' })).toBe('深刻認識一個人');
      expect(i18n.t('app.title', { lng: 'en' })).toBe('Deeply Know Someone');

      expect(i18n.t('levels.icebreaker', { lng: 'zh-TW' })).toBe('破冰');
      expect(i18n.t('levels.icebreaker', { lng: 'en' })).toBe('Break the Ice');
    });
  });
});
