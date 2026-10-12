/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { extractRoomCode } from '../src/components/multiplayer/QrScannerModal';
import { GameCard } from '../src/components/card/GameCard';
import { LiveAnnouncer } from '../src/components/ui/LiveAnnouncer';
import { useGameStore } from '../src/store/gameStore';
import { useMultiplayerStore } from '../src/store/multiplayerStore';
import { Card } from '../src/types/card';

describe('Wave 5 Micro-Interactions & Accessibility Suite', () => {
  describe('QR Code Parsing Utility (extractRoomCode)', () => {
    it('extracts room code from full app URL with query parameter', () => {
      expect(extractRoomCode('https://deeply-know-someone.vercel.app/?room=B8K2X9')).toBe('B8K2X9');
      expect(extractRoomCode('http://localhost:5173/?room=xyz123')).toBe('XYZ123');
    });

    it('extracts room code from partial query string', () => {
      expect(extractRoomCode('?room=AB99CD')).toBe('AB99CD');
    });

    it('cleans raw room code text without query string', () => {
      expect(extractRoomCode('  c8d9e0  ')).toBe('C8D9E0');
    });
  });

  describe('GameCard Swipe Props & Touch Accessibility', () => {
    const mockCard: Card = {
      id: 'test_card_1',
      level: 'one-star',
      stars: 1,
      zh: '你最近一次感到由衷開心的時刻是什麼？',
      interaction: 'single',
      responderRule: 'drawer',
      targetRule: 'none',
    };

    it('renders card with accessible swipe role and controls', () => {
      const handleFlip = vi.fn();
      const handleSwipeLeft = vi.fn();
      const handleSwipeRight = vi.fn();

      render(
        <GameCard
          card={mockCard}
          isFlipped={true}
          onFlip={handleFlip}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          canSwipe={true}
        />
      );

      const cardElement = screen.getByRole('button', { name: /卡片內容：你最近一次感到由衷開心的時刻是什麼？/i });
      expect(cardElement).toBeDefined();
      expect(screen.getByText('下一張')).toBeDefined();
      expect(screen.getByText('換一題')).toBeDefined();
    });
  });

  describe('LiveAnnouncer Screen Reader Announcements', () => {
    it('dynamically announces active drawer turn and level to screen readers', () => {
      act(() => {
        useGameStore.setState({
          gameState: {
            version: 1,
            threeStarConsentSeen: false,
            gameId: 'g1',
            mode: 'guided',
            sessionGoalMinutes: 30,
            status: 'playing',
            startedAt: Date.now(),
            currentLevel: 'icebreaker',
            currentCardId: 'ice_01',
            cardsDrawnCount: 1,
            players: [
              { id: 'p1', name: '小美' },
              { id: 'p2', name: '阿哲' },
            ],
            drawerIndex: 0,
            decks: {
              icebreaker: { shuffledIds: ['ice_01'], cursor: 1, usedIds: [] },
              'one-star': { shuffledIds: ['one_01'], cursor: 0, usedIds: [] },
              'two-star': { shuffledIds: ['two_01'], cursor: 0, usedIds: [] },
              'three-star': { shuffledIds: ['three_01'], cursor: 0, usedIds: [] },
            },
            activeFollowUpCardId: null,
          },
        });
      });

      render(<LiveAnnouncer />);

      const announcer = screen.getByRole('status');
      expect(announcer.textContent).toContain('目前輪到 小美 主持對話');
      expect(announcer.textContent).toContain('暖身破冰');
    });

    it('announces new multiplayer player joining', () => {
      act(() => {
        useMultiplayerStore.setState({
          isOnlineMode: true,
          players: [
            { id: 'h1', name: '房主', isHost: true, peerId: 'peer_h1' },
            { id: 'g1', name: '新朋友', isHost: false, peerId: 'peer_g1' },
          ],
        });
      });

      render(<LiveAnnouncer />);

      const announcer = screen.getByRole('status');
      expect(announcer.textContent).toContain('玩家 新朋友 已加入房間');
    });
  });
});
