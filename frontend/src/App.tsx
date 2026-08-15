import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ToastContainer } from '@/components/common/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ConversationProvider } from '@/context/ConversationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { LoginScreen } from '@/components/auth/LoginScreen';

function AuthGate() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Connecting to Atlas AI…" />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <SettingsProvider>
      <AuthenticatedApp />
    </SettingsProvider>
  );
}

function AuthenticatedApp() {
  const { loading } = useSettings();

  if (loading) {
    return <LoadingScreen message="Connecting to Atlas AI…" />;
  }

  return (
    <ConversationProvider>
      <MainLayout />
    </ConversationProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
