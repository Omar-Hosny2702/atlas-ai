import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ToastMessage, ToastVariant } from '@/types';

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (text: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;
function nextId(): string {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, variant: ToastVariant = 'info') => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, text, variant }]);
      const duration = variant === 'error' ? 6000 : 3500;
      window.setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider.');
  return ctx;
}
