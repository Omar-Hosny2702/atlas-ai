import { useState } from 'react';
import { Landing } from '@/components/landing/Landing';

/**
 * Signed-out screen. This is the public face of Atlas AI: the full landing page, with the same
 * Auth0 login action as before (`onLogin`) wired to every "Log in with Auth0" button.
 */
export function LoginScreen({
  onLogin,
  message = 'Sign in to access your Atlas AI conversations.',
}: {
  onLogin: () => void | Promise<void>;
  message?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await onLogin();
      // Success redirects to Auth0, so the busy state is intentionally left on.
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'Could not start the login. Please try again.');
    }
  };

  return <Landing onLogin={() => void handleLogin()} busy={busy} error={error} message={message} />;
}
