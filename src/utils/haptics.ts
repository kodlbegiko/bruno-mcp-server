export function triggerHaptic(type: 'light' | 'medium' = 'light', enabled: boolean = true) {
  if (!enabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'light') {
        navigator.vibrate(15);
      } else {
        navigator.vibrate(28);
      }
    } catch {
      // Graceful no-op on platforms restricting vibration
    }
  }
}
