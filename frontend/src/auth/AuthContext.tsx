import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAuthSession,
  handleAuthCallback,
  isAuthConfigured,
  loginWithRedirect,
  logoutFromAuth,
  readAuthSession,
  type AuthSession,
} from './authClient';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const callbackSession = await handleAuthCallback();
        const resolved = callbackSession ?? readAuthSession();
        if (mounted) setSession(resolved);
      } catch (error) {
        if (mounted) {
          clearAuthSession();
          setSession(null);
          console.error('Auth initialization failed:', error);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async () => {
    await loginWithRedirect();
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    logoutFromAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session) && isAuthConfigured(),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
}
