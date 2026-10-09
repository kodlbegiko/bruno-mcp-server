export type ThemeMode = 'light' | 'dark' | 'system';

let systemMediaListener: ((e: MediaQueryListEvent) => void) | null = null;

function updateThemeColorMeta(isDark: boolean): void {
  const metaTags = document.querySelectorAll('meta[name="theme-color"]');
  const targetColor = isDark ? '#1C1917' : '#FBF9F5';

  if (metaTags.length > 0) {
    metaTags.forEach((meta) => {
      meta.setAttribute('content', targetColor);
    });
  } else {
    const newMeta = document.createElement('meta');
    newMeta.setAttribute('name', 'theme-color');
    newMeta.setAttribute('content', targetColor);
    document.head.appendChild(newMeta);
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const hasMatchMedia = typeof window.matchMedia === 'function';
  const systemPrefersDark = hasMatchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update all theme-color meta tags
  updateThemeColorMeta(isDark);

  // Manage system media query change listener safely
  if (hasMatchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (systemMediaListener) {
      mediaQuery.removeEventListener('change', systemMediaListener);
      systemMediaListener = null;
    }

    if (theme === 'system') {
      systemMediaListener = (e: MediaQueryListEvent) => {
        const darkActive = e.matches;
        if (darkActive) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        updateThemeColorMeta(darkActive);
      };
      mediaQuery.addEventListener('change', systemMediaListener);
    }
  }
}
