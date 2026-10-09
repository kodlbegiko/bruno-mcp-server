import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useTranslation } from 'react-i18next';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const bilingual = useSettingsStore((s) => s.bilingual);
  const setBilingual = useSettingsStore((s) => s.setBilingual);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')}>
      <div className="space-y-3.5 py-2">
        {/* Language Switcher */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700">
          <span className="text-sm font-medium text-ink-900 dark:text-stone-100">{t('settings.language')}</span>
          <div className="flex rounded-lg bg-paper-200/60 dark:bg-stone-700/60 p-0.5 border border-paper-border dark:border-stone-600">
            <button
              type="button"
              onClick={() => setLanguage('zh-TW')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                language === 'zh-TW'
                  ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                  : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
              }`}
            >
              繁中
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                language === 'en'
                  ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                  : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700">
          <span className="text-sm font-medium text-ink-900 dark:text-stone-100">{t('settings.theme')}</span>
          <div className="flex rounded-lg bg-paper-200/60 dark:bg-stone-700/60 p-0.5 border border-paper-border dark:border-stone-600">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                theme === 'light'
                  ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                  : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
              }`}
            >
              {t('settings.theme_light')}
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                  : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
              }`}
            >
              {t('settings.theme_dark')}
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                theme === 'system'
                  ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                  : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
              }`}
            >
              {t('settings.theme_auto')}
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
          <div>
            <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.bilingual')}</span>
            <span className="text-xs text-ink-500 dark:text-stone-400 block">{t('settings.bilingual_desc')}</span>
          </div>
          <input
            type="checkbox"
            checked={bilingual}
            onChange={(e) => setBilingual(e.target.checked)}
            className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
          <div>
            <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.sound')}</span>
            <span className="text-xs text-ink-500 dark:text-stone-400 block">{t('settings.sound_desc')}</span>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
          <div>
            <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.haptics')}</span>
            <span className="text-xs text-ink-500 dark:text-stone-400 block">{t('settings.haptics_desc')}</span>
          </div>
          <input
            type="checkbox"
            checked={hapticsEnabled}
            onChange={(e) => setHapticsEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
          <div>
            <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.reduced_motion')}</span>
            <span className="text-xs text-ink-500 dark:text-stone-400 block">{t('settings.reduced_motion_desc')}</span>
          </div>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
          />
        </label>

        <div className="pt-2">
          <Button variant="primary" fullWidth onClick={onClose}>
            完成
          </Button>
        </div>
      </div>
    </Modal>
  );
};
