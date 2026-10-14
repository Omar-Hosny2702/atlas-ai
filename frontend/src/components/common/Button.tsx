import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 dark:bg-accent-dark dark:text-ink dark:hover:bg-accent-300 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]',
  secondary:
    'border border-border-light bg-paper-alt/60 text-ink hover:bg-paper-alt dark:border-border-dark dark:bg-ink-raised dark:text-paper dark:hover:border-accent-dark/40',
  ghost:
    'bg-transparent text-ink hover:bg-paper-alt dark:text-paper dark:hover:bg-ink-raised',
  danger:
    'bg-danger-light text-white hover:opacity-90 dark:bg-danger-dark dark:text-ink',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-[background-color,border-color,transform] duration-150',
          'active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
