import { Logo } from './Logo';

export function LoadingScreen({ message = 'Loading Atlas AI…' }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-paper dark:bg-ink">
      <div className="animate-pulse">
        <Logo size={40} />
      </div>
      <p className="text-sm text-muted-light dark:text-muted-dark">{message}</p>
    </div>
  );
}
