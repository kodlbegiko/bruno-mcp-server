import { GameState } from '../types/game';

export const GAME_STORAGE_KEY = 'deeply-know-game:v1';
export const SETTINGS_STORAGE_KEY = 'deeply-know-settings:v1';

export interface SettingsState {
  bilingual: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  language: 'zh-TW' | 'en';
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: SettingsState = {
  bilingual: false,
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  language: 'zh-TW',
  theme: 'system',
};

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save game state to localStorage:', err);
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.gameId === 'string' && Array.isArray(parsed.players)) {
      return parsed as GameState;
    }
  } catch (err) {
    console.error('Failed to parse saved game state:', err);
  }
  return null;
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}

export function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (err) {
    console.error('Failed to parse settings:', err);
    return DEFAULT_SETTINGS;
  }
}
