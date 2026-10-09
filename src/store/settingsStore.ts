import { create } from 'zustand';
import { loadSettings, saveSettings, SettingsState } from '../game/persistence';
import i18n from '../i18n';
import { applyTheme, ThemeMode } from '../utils/theme';

interface SettingsStore extends SettingsState {
  setBilingual: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setLanguage: (language: 'zh-TW' | 'en') => void;
  setTheme: (theme: ThemeMode) => void;
}

const initial = loadSettings();

// Apply stored theme and language on script load
applyTheme(initial.theme);
if (typeof document !== 'undefined') {
  document.documentElement.lang = initial.language || 'zh-TW';
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...initial,
  setBilingual: (bilingual) => {
    set({ bilingual });
    saveSettings({ ...get(), bilingual });
  },
  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled });
    saveSettings({ ...get(), soundEnabled });
  },
  setHapticsEnabled: (hapticsEnabled) => {
    set({ hapticsEnabled });
    saveSettings({ ...get(), hapticsEnabled });
  },
  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion });
    saveSettings({ ...get(), reducedMotion });
  },
  setLanguage: (language) => {
    set({ language });
    i18n.changeLanguage(language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    saveSettings({ ...get(), language });
  },
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    saveSettings({ ...get(), theme });
  },
}));
