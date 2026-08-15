import { Button } from '@/components/common/Button';

export function LoginScreen({
  onLogin,
  message = 'Sign in to access your Atlas AI conversations.',
}: {
  onLogin: () => void;
  message?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper dark:bg-ink px-6">
      <div className="w-full max-w-md rounded-2xl border border-border-light bg-white p-8 shadow-lg dark:border-border-dark dark:bg-ink-raised">
        <div className="mb-6 text-center">
          <div className="text-3xl font-semibold text-ink dark:text-paper">Atlas AI</div>
          <p className="mt-2 text-sm text-muted-light dark:text-muted-dark">{message}</p>
        </div>

        <Button variant="primary" className="w-full" onClick={onLogin}>
          Log in with Auth0
        </Button>
      </div>

      <div className="absolute bottom-4 right-5 text-xs text-muted-light dark:text-muted-dark">
        Made by Omar Hosny · <a href="https://www.omarhosny.work.gd" target="_blank" rel="noopener noreferrer" className="pointer-events-auto hover:underline">www.omarhosny.work.gd</a>
      </div>
    </div>
  );
}
