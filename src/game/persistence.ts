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

export const GAME_STATE_VERSION = 2;

export function migrateGameState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const source = raw as Partial<GameState>;
  if (typeof source.gameId !== 'string' || !Array.isArray(source.players)) {
    return null;
  }
  return {
    ...(source as GameState),
    version: GAME_STATE_VERSION,
    /**
     * 舊版遊戲預設一定是原版 70 題 (classic)
     */
    questionSetId: source.questionSetId ?? 'classic',
    revealedCardIds: Array.isArray(source.revealedCardIds) ? source.revealedCardIds : [],
    skippedCardIds: Array.isArray(source.skippedCardIds) ? source.skippedCardIds : [],
    followUpOpenedCardIds: Array.isArray(source.followUpOpenedCardIds)
      ? source.followUpOpenedCardIds
      : [],
    activeFollowUpCardId:
      typeof source.activeFollowUpCardId === 'string' ? source.activeFollowUpCardId : null,
    inactivePlayerIds: Array.isArray(source.inactivePlayerIds) ? source.inactivePlayerIds : [],
  };
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateGameState(parsed);
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
