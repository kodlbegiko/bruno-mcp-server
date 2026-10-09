import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Screen Wake Lock hook
 * Keeps the device screen awake during conversation game sessions so users don't have to unlock
 * the phone during deep face-to-face dialogue.
 */
export function useWakeLock(enabled: boolean = true) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'wakeLock' in navigator &&
      typeof (navigator as any).wakeLock?.request === 'function'
    ) {
      setIsSupported(true);
    }
  }, []);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    if (!enabled || document.visibilityState !== 'visible') return;

    try {
      if (!wakeLockRef.current) {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = sentinel;
        setIsActive(true);

        sentinel.addEventListener('release', () => {
          wakeLockRef.current = null;
          setIsActive(false);
        });
      }
    } catch {
      // Wake lock can be denied under low-power mode or tab switching
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, [enabled]);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Graceful cleanup
      } finally {
        wakeLockRef.current = null;
        setIsActive(false);
      }
    }
  }, []);

  useEffect(() => {
    if (enabled && isSupported) {
      requestLock();

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          requestLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        releaseLock();
      };
    } else {
      releaseLock();
    }
  }, [enabled, isSupported, requestLock, releaseLock]);

  return { isSupported, isActive };
}
