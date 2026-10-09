import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 rounded-xl';

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 min-h-[36px]',
    md: 'text-sm px-5 py-3 min-h-[46px]',
    lg: 'text-base px-6 py-4 min-h-[54px]',
  }[size];

  const variantStyles = {
    primary: 'bg-ink-900 text-paper-50 shadow-sm hover:bg-ink-800 active:bg-ink-950 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 dark:active:bg-stone-300',
    secondary: 'bg-paper-100 text-ink-900 border border-paper-border hover:bg-paper-200 shadow-sm dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700 dark:hover:bg-stone-700',
    subtle: 'bg-paper-200/70 text-ink-800 hover:bg-paper-200 active:bg-paper-300 dark:bg-stone-800/80 dark:text-stone-200 dark:hover:bg-stone-750',
    outline: 'border border-paper-border text-ink-700 hover:bg-paper-100 hover:text-ink-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100',
    ghost: 'text-ink-500 hover:text-ink-900 hover:bg-paper-200/50 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800/60',
  }[variant];

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
