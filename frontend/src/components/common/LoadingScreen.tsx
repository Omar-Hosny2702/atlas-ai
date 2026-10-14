import { Logo } from './Logo';

export function LoadingScreen({ message = 'Loading Atlas AI…' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-paper text-ink dark:bg-ink dark:text-paper"
      role="status"
      aria-live="polite"
    >
      <Logo size={48} animated />
      <p className="text-sm text-muted-light dark:text-muted-dark">{message}</p>
    </div>
  );
}
