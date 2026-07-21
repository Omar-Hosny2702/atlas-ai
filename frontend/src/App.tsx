import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ToastContainer } from '@/components/common/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ConversationProvider } from '@/context/ConversationContext';
import { MainLayout } from '@/components/layout/MainLayout';

function AppGate() {
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
          <SettingsProvider>
            <AppGate />
          </SettingsProvider>
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
