import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '@/context/ToastContext';
import type { ToastMessage } from '@/types';

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const VARIANT_CLASSES = {
  info: 'border-border-light dark:border-border-dark text-ink dark:text-paper',
  success: 'border-accent-500/40 text-accent-700 dark:text-accent-200',
  error: 'border-danger-light/40 text-danger-light dark:text-danger-dark',
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { dismissToast } = useToast();
  const Icon = ICONS[toast.variant];

  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-2.5 rounded-xl border bg-paper dark:bg-ink-alt shadow-lg px-4 py-3 pr-2 min-w-[260px] max-w-sm animate-fade-in',
        VARIANT_CLASSES[toast.variant]
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm leading-snug grow">{toast.text}</p>
      <button
        aria-label="Dismiss notification"
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 p-1 rounded hover:bg-paper-alt dark:hover:bg-ink-raised"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
