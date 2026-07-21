import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, active, size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg transition-colors duration-150',
          'text-muted-light hover:text-ink hover:bg-paper-alt',
          'dark:text-muted-dark dark:hover:text-paper dark:hover:bg-ink-raised',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          active && 'text-accent-500 dark:text-accent-dark bg-paper-alt dark:bg-ink-raised',
          size === 'md' ? 'h-9 w-9' : 'h-7 w-7',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
