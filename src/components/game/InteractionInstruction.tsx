import React from 'react';

interface InteractionInstructionProps {
  instruction: string;
  className?: string;
}

export const InteractionInstruction: React.FC<InteractionInstructionProps> = ({
  instruction,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-paper-100 dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-xs sm:text-sm font-medium text-ink-800 dark:text-stone-200 shadow-sm transition-all ${className}`}
    >
      <span className="text-ink-400 dark:text-stone-400 mr-1.5">●</span>
      <span>{instruction}</span>
    </div>
  );
};
