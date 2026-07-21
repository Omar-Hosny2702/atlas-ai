import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSettingsOptions } from '@/api/settingsApi';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from './ToastContext';
import type { SettingsOptions } from '@/types';

export interface NewChatDefaults {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface SettingsContextValue {
  options: SettingsOptions | null;
  loading: boolean;
  loadError: string | null;
  reload: () => void;
  defaults: NewChatDefaults;
  setDefaults: (next: Partial<NewChatDefaults>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const FALLBACK_DEFAULTS: NewChatDefaults = {
  model: 'gemini-2.5-flash',
  systemPrompt: 'You are Atlas AI, a helpful, honest, and direct assistant.',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<SettingsOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [defaults, setDefaultsState] = useLocalStorage<NewChatDefaults>(
    'atlas-ai-new-chat-defaults',
    FALLBACK_DEFAULTS
  );
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSettingsOptions();
      setOptions(data);
      if (!data.ollama.reachable) {
        showToast(
          "Can't reach Ollama. Start it with \"ollama serve\" to send messages.",
          'error'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load settings from the backend.';
      setLoadError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setDefaults = useCallback(
    (next: Partial<NewChatDefaults>) => {
      setDefaultsState((prev) => ({ ...prev, ...next }));
    },
    [setDefaultsState]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ options, loading, loadError, reload: load, defaults, setDefaults }),
    [options, loading, loadError, load, defaults, setDefaults]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider.');
  return ctx;
}
