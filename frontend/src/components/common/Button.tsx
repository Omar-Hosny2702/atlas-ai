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
    'bg-accent-500 text-white hover:bg-accent-600 dark:bg-accent-dark dark:text-ink dark:hover:bg-accent-300',
  secondary:
    'bg-paper-alt text-ink hover:bg-border-light dark:bg-ink-raised dark:text-paper dark:hover:bg-ink-alt',
  ghost:
    'bg-transparent text-ink hover:bg-paper-alt dark:text-paper dark:hover:bg-ink-raised',
  danger: 'bg-danger-light text-white hover:opacity-90 dark:bg-danger-dark',
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
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
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
