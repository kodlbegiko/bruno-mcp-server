import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '../../types/card';
import { CardBack } from './CardBack';
import { CardFront } from './CardFront';
import { useSettingsStore } from '../../store/settingsStore';
import { playFlipSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';

interface GameCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  canSwipe?: boolean;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  card,
  isFlipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  canSwipe = true,
  className = '',
}) => {
  const reducedMotionSetting = useSettingsStore((s) => s.reducedMotion);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  // Check system prefers-reduced-motion
  const systemReducedMotion =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  const shouldReduceMotion = reducedMotionSetting || systemReducedMotion;

  // Swipe gesture motion values
  const dragX = useMotionValue(0);
  const rotateZ = useTransform(dragX, [-200, 200], [-8, 8]);
  const swipeNextOpacity = useTransform(dragX, [30, 90], [0, 1]);
  const swipeSkipOpacity = useTransform(dragX, [-30, -90], [0, 1]);

  const handleClick = () => {
    if (!isFlipped) {
      playFlipSound(soundEnabled);
      triggerHaptic('light', hapticsEnabled);
      onFlip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !isFlipped) {
      e.preventDefault();
      handleClick();
    }
  };

  if (shouldReduceMotion) {
    return (
      <div
        className={`w-full max-w-[340px] sm:max-w-[380px] cursor-pointer select-none ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? `卡片內容：${card.zh}` : '點擊翻開卡牌'}
      >
        {isFlipped ? <CardFront card={card} /> : <CardBack level={card.level} />}
      </div>
    );
  }

  const isDraggable = isFlipped && canSwipe && (!!onSwipeLeft || !!onSwipeRight);

  return (
    <div className={`relative w-full max-w-[340px] sm:max-w-[380px] perspective-1000 select-none ${className}`}>
      {/* Swipe Feedback Hints */}
      {isDraggable && (
        <>
          <motion.div
            style={{ opacity: swipeNextOpacity }}
            className="absolute -top-3 right-4 z-20 pointer-events-none px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-1"
          >
            <span>下一張</span>
            <span>👉</span>
          </motion.div>
          <motion.div
            style={{ opacity: swipeSkipOpacity }}
            className="absolute -top-3 left-4 z-20 pointer-events-none px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-md flex items-center gap-1"
          >
            <span>👈</span>
            <span>換一題</span>
          </motion.div>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={!isFlipped ? { scale: 1.02 } : undefined}
          whileTap={!isFlipped ? { scale: 0.99 } : undefined}
          drag={isDraggable ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          style={{ x: dragX, rotate: rotateZ }}
          onDragEnd={(_e, info) => {
            if (info.offset.x > 85 && onSwipeRight) {
              triggerHaptic('medium', hapticsEnabled);
              onSwipeRight();
            } else if (info.offset.x < -85 && onSwipeLeft) {
              triggerHaptic('light', hapticsEnabled);
              onSwipeLeft();
            }
          }}
          className={`w-full ${isFlipped ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={isFlipped ? `卡片內容：${card.zh}` : '點擊翻開卡牌'}
        >
          <motion.div
            className="relative w-full preserve-3d"
            style={{ aspectRatio: '2.5 / 3.7' }}
            animate={{
              rotateY: isFlipped ? 180 : 0,
            }}
            transition={{
              duration: 0.6,
              ease: [0.25, 1, 0.5, 1], // Natural cubic bezier easing
            }}
          >
            {/* Card Back (Visible when not flipped) */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <CardBack level={card.level} />
            </div>

            {/* Card Front (Visible when flipped, rotated 180deg) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
              <CardFront card={card} />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
