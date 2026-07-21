import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="presentation"
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} max-h-[85vh] flex flex-col rounded-2xl border border-border-light dark:border-border-dark bg-paper dark:bg-ink-alt shadow-2xl animate-fade-in`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark shrink-0">
          <h2 id="modal-title" className="font-display font-semibold text-base">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} size="sm">
            <X size={16} />
          </IconButton>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-5 py-4 grow">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-border-light dark:border-border-dark shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
