/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { applyTheme } from '../src/utils/theme';
import { useSettingsStore } from '../src/store/settingsStore';
import { prefetchCardAssets } from '../src/utils/prefetch';
import { Ending } from '../src/pages/Ending';
import { useGameStore } from '../src/store/gameStore';

describe('Wave 4 Optimizations Suite (Dark Mode, Web Share & Prefetching)', () => {
  describe('Dark Mode & Theme Manager', () => {
    beforeEach(() => {
      document.documentElement.className = '';
      // Create mock theme-color meta tag if not present
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
    });

    it('adds dark class to html root and updates theme-color in dark mode', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      const meta = document.querySelector('meta[name="theme-color"]');
      expect(meta?.getAttribute('content')).toBe('#1C1917');
    });

    it('removes dark class from html root and updates theme-color in light mode', () => {
      applyTheme('dark');
      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      const meta = document.querySelector('meta[name="theme-color"]');
      expect(meta?.getAttribute('content')).toBe('#FBF9F5');
    });

    it('persists theme selection via useSettingsStore', () => {
      const store = useSettingsStore.getState();
      act(() => {
        store.setTheme('dark');
      });
      expect(useSettingsStore.getState().theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        store.setTheme('light');
      });
      expect(useSettingsStore.getState().theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Card Prefetching Utility', () => {
    it('executes prefetchCardAssets gracefully without error', () => {
      expect(() => prefetchCardAssets()).not.toThrow();
    });
  });

  describe('Ending Web Share API & Clipboard Fallback', () => {
    const mockOnPlayAgain = vi.fn();
    const mockOnBackToHome = vi.fn();

    beforeEach(() => {
      // Mock game state in store
      useGameStore.setState({
        gameState: {
          version: 1,
          threeStarConsentSeen: true,
          gameId: 'test-game',
          mode: 'guided',
          sessionGoalMinutes: 30,
          status: 'ended',
          startedAt: Date.now() - 30 * 60 * 1000,
          endedAt: Date.now(),
          currentLevel: 'three-star',
          currentCardId: 'three_01',
          cardsDrawnCount: 15,
          players: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
          ],
          drawerIndex: 0,
          decks: {
            icebreaker: { shuffledIds: ['ice_01'], cursor: 1, usedIds: [] },
            'one-star': { shuffledIds: ['one_01'], cursor: 1, usedIds: [] },
            'two-star': { shuffledIds: ['two_01'], cursor: 1, usedIds: [] },
            'three-star': { shuffledIds: ['three_01'], cursor: 1, usedIds: [] },
          },
          historyCardIds: ['ice_01', 'one_01', 'two_01', 'three_01'],
          activeFollowUpCardId: null,
        },
      });
    });

    it('calls navigator.share when available', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      render(
        <Ending
          onPlayAgain={mockOnPlayAgain}
          onBackToHome={mockOnBackToHome}
        />
      );

      const shareButton = screen.getByRole('button', { name: /分享對話紀錄|Share Session Summary/i });
      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(shareMock).toHaveBeenCalled();

      delete (navigator as any).share;
    });

    it('falls back to navigator.clipboard.writeText when navigator.share is unavailable', async () => {
      const clipboardMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardMock },
        writable: true,
        configurable: true,
      });

      render(
        <Ending
          onPlayAgain={mockOnPlayAgain}
          onBackToHome={mockOnBackToHome}
        />
      );

      const shareButton = screen.getByRole('button', { name: /分享對話紀錄|Share Session Summary/i });
      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(clipboardMock).toHaveBeenCalledWith(expect.stringContaining('深刻認識一個人'));
      expect(screen.getByText(/已複製對話紀錄|Copied/i)).toBeDefined();

      delete (navigator as any).clipboard;
    });
  });
});
