/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { useWakeLock } from '../src/hooks/useWakeLock';
import { renderHook, act } from '@testing-library/react';
import { useMultiplayerStore } from '../src/store/multiplayerStore';

// Component that throws to test ErrorBoundary
const ThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test Explosion');
  }
  return <div>Normal Content</div>;
};

describe('Optimization Enhancements Test Suite', () => {
  describe('ErrorBoundary', () => {
    // Suppress console.error during expected throw
    const originalConsoleError = console.error;
    beforeEach(() => {
      console.error = vi.fn();
    });
    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Safe Content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Safe Content')).toBeDefined();
    });

    it('renders graceful fallback when a child crashes', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('對話桌面稍作休息')).toBeDefined();
      expect(screen.getByText('重新整理並恢復桌面')).toBeDefined();
      expect(screen.getByText('重設狀態並返回首頁')).toBeDefined();
    });
  });

  describe('useWakeLock Hook', () => {
    it('gracefully degrades when navigator.wakeLock is undefined', () => {
      const { result } = renderHook(() => useWakeLock(true));
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isActive).toBe(false);
    });

    it('requests wakeLock when supported', async () => {
      const mockSentinel = {
        release: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      const requestMock = vi.fn().mockResolvedValue(mockSentinel);

      // Mock navigator.wakeLock
      Object.defineProperty(navigator, 'wakeLock', {
        value: { request: requestMock },
        writable: true,
        configurable: true,
      });

      const { result, unmount } = renderHook(() => useWakeLock(true));

      // Wait for effect
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isActive).toBe(true);
      expect(requestMock).toHaveBeenCalledWith('screen');

      // Cleanup
      unmount();
      expect(mockSentinel.release).toHaveBeenCalled();

      // Clean up mock
      delete (navigator as any).wakeLock;
    });
  });

  describe('multiplayerStore Reconnection Capabilities', () => {
    beforeEach(() => {
      useMultiplayerStore.getState().leaveRoom();
    });

    it('initializes reconnection state cleanly', () => {
      const state = useMultiplayerStore.getState();
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempt).toBe(0);
      expect(typeof state.reconnect).toBe('function');
    });

    it('clears reconnection state upon leaving room', () => {
      useMultiplayerStore.setState({
        isReconnecting: true,
        reconnectAttempt: 2,
        isOnlineMode: true,
      });

      act(() => {
        useMultiplayerStore.getState().leaveRoom();
      });

      const state = useMultiplayerStore.getState();
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempt).toBe(0);
      expect(state.isOnlineMode).toBe(false);
    });
  });
});
