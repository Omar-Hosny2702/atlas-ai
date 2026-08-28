import { useAuth } from '@/auth/AuthContext';

function getProvider(sub?: string): string {
  if (!sub) return 'Unknown';

  if (sub.startsWith('google-oauth2|')) return 'Google';
  if (sub.startsWith('apple|')) return 'Apple';
  if (sub.startsWith('github|')) return 'GitHub';
  if (sub.startsWith('auth0|')) return 'Email / Password';

  return sub.split('|')[0] || 'Unknown';
}

function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || 'A';

  const parts = source.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AccountSettings() {
  const { session, isAuthenticated, logout } = useAuth();

  const user = session?.user;

  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-ink dark:text-paper">
            Account
          </h3>

          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
            You are not currently signed in.
          </p>
        </div>
      </div>
    );
  }

  const provider = getProvider(user.sub);
  const initials = getInitials(user.name, user.email);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Account
        </h3>

        <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
          Manage the account currently being used by Atlas.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border-light dark:border-border-dark p-4">
        {user.picture ? (
          <img
            src={user.picture}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 dark:bg-ink-raised text-sm font-semibold">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink dark:text-paper">
            {user.name || 'Atlas user'}
          </p>

          <p className="truncate text-xs text-muted-light dark:text-muted-dark">
            {user.email || 'No email available'}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border-light dark:divide-border-dark rounded-xl border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">
              Signed in with
            </p>

            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
              Authentication provider
            </p>
          </div>

          <p className="text-sm">
            {provider}
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">
              Account ID
            </p>

            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
              Unique Atlas authentication identity
            </p>
          </div>

          <code className="max-w-[55%] break-all text-right text-xs text-muted-light dark:text-muted-dark">
            {user.sub}
          </code>
        </div>
      </div>

      <div className="rounded-xl border border-border-light dark:border-border-dark">
        <button
          type="button"
          onClick={logout}
          className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/5 rounded-xl transition-colors"
        >
          Log out
        </button>
      </div>

      <p className="text-xs text-muted-light dark:text-muted-dark">
        Chats, memories and personalisation are stored separately for this
        account.
      </p>
    </div>
  );
}