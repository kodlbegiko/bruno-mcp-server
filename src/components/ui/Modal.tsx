import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save active element for focus restoration on close
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // Focus initial element in modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      // Trap focus within modal on Tab / Shift+Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableNodes = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((node) => node.offsetParent !== null); // only visible elements

        if (focusableNodes.length === 0) {
          e.preventDefault();
          return;
        }

        const firstNode = focusableNodes[0];
        const lastNode = focusableNodes[focusableNodes.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstNode || document.activeElement === modalRef.current) {
            e.preventDefault();
            lastNode.focus();
          }
        } else {
          if (document.activeElement === lastNode) {
            e.preventDefault();
            firstNode.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original trigger element
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-dialog-title' : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidth} bg-paper-50 dark:bg-stone-900 rounded-2xl border border-paper-border dark:border-stone-700 shadow-2xl p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col focus:outline-none`}
          >
            {title && (
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-border dark:border-stone-700">
                <h3 id="modal-dialog-title" className="text-lg font-serif font-medium text-ink-900 dark:text-stone-100">{title}</h3>
                {showCloseButton && onClose && (
                  <button
                    onClick={onClose}
                    className="text-ink-400 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200 p-1.5 rounded-lg active:bg-paper-200 dark:active:bg-stone-800 transition-colors"
                    aria-label="關閉"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
