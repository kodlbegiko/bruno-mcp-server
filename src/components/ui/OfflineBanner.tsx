import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
      setDismissed(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (dismissed || (!isOffline && !justReconnected)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        aria-live="polite"
        role="status"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md px-4 py-2.5 rounded-xl shadow-lg border backdrop-blur-md flex items-center justify-between gap-3 text-xs md:text-sm font-sans"
        style={{
          backgroundColor: isOffline ? 'rgba(254, 243, 199, 0.95)' : 'rgba(236, 253, 245, 0.95)',
          borderColor: isOffline ? '#FDE68A' : '#A7F3D0',
          color: isOffline ? '#92400E' : '#065F46',
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span className="truncate">
            {isOffline ? t('app.offline_banner') : t('app.online_restored')}
          </span>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-black/5 active:scale-95 transition-all text-stone-500 hover:text-stone-800 shrink-0"
          title={t('app.close_notice')}
          aria-label={t('app.close_notice')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.aside>
    </AnimatePresence>
  );
};
