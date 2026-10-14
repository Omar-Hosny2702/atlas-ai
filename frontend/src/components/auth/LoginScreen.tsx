import { Button } from '@/components/common/Button';
import { AtlasField } from '@/components/common/AtlasField';
import { AtlasWordmark } from '@/components/common/Logo';

export function LoginScreen({
  onLogin,
  message = 'Sign in to access your Atlas AI conversations.',
}: {
  onLogin: () => void;
  message?: string;
}) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-paper px-6 py-10 text-ink dark:bg-ink dark:text-paper">
      <div className="atlas-backdrop" aria-hidden="true" />

      <main className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <AtlasField size="clamp(190px, 34vh, 300px)" className="-mb-6" />

        <div className="w-full rounded-xl border border-border-light bg-white/80 p-7 shadow-atlas-md backdrop-blur-md dark:border-border-dark dark:bg-ink-alt/80 dark:shadow-atlas-lg">
          <h1 className="text-center text-2xl">
            <AtlasWordmark />
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-light dark:text-muted-dark">{message}</p>

          <Button variant="primary" className="mt-6 w-full" onClick={onLogin}>
            Log in with Auth0
          </Button>
        </div>
      </main>

      <div className="absolute bottom-4 right-5 text-xs text-muted-light dark:text-muted-dark">
        Made by Omar Hosny ·{' '}
        <a
          href="https://www.omarhosny.work.gd"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto underline-offset-2 hover:text-accent-500 hover:underline dark:hover:text-accent-dark"
        >
          www.omarhosny.work.gd
        </a>
      </div>
    </div>
  );
}
