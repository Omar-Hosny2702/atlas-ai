import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as conversationApi from '@/api/conversationApi';
import { useToast } from './ToastContext';
import { useSettings } from './SettingsContext';
import type { ConversationSummary } from '@/types';

interface ConversationContextValue {
  conversations: ConversationSummary[];
  loading: boolean;
  activeId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectConversation: (id: string | null) => void;
  createNewConversation: () => Promise<string | null>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversationById: (id: string) => Promise<void>;
  togglePinned: (id: string) => Promise<void>;
  refreshList: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();
  const { defaults } = useSettings();
  const searchDebounceRef = useRef<number | null>(null);

  const refreshList = useCallback(
    async (query?: string) => {
      setLoading(true);
      try {
        const list = await conversationApi.listConversations(query ?? searchQuery);
        setConversations(list);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to load conversations.',
          'error'
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery]
  );

  useEffect(() => {
    refreshList('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetSearchQuery = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = window.setTimeout(() => refreshList(q), 220);
    },
    [refreshList]
  );

  const selectConversation = useCallback((id: string | null) => {
    setActiveId(id);
  }, []);

  const createNewConversation = useCallback(async (): Promise<string | null> => {
    try {
      const conversation = await conversationApi.createConversation({
        model: defaults.model,
        systemPrompt: defaults.systemPrompt,
        temperature: defaults.temperature,
        maxTokens: defaults.maxTokens,
        topP: defaults.topP,
      });
      await refreshList();
      setActiveId(conversation.id);
      return conversation.id;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create a new chat.', 'error');
      return null;
    }
  }, [defaults, refreshList, showToast]);

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c)));
      try {
        await conversationApi.updateConversation(id, { title: trimmed });
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to rename chat.', 'error');
        refreshList();
      }
    },
    [refreshList, showToast]
  );

  const deleteConversationById = useCallback(
    async (id: string) => {
      const previous = conversations;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
      try {
        await conversationApi.deleteConversation(id);
        showToast('Chat deleted.', 'success');
      } catch (err) {
        setConversations(previous);
        showToast(err instanceof Error ? err.message : 'Failed to delete chat.', 'error');
      }
    },
    [conversations, activeId, showToast]
  );

  const togglePinned = useCallback(
    async (id: string) => {
      const target = conversations.find((c) => c.id === id);
      if (!target) return;
      const nextPinned = !target.pinned;
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: nextPinned } : c)));
      try {
        await conversationApi.updateConversation(id, { pinned: nextPinned });
        refreshList();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update chat.', 'error');
        refreshList();
      }
    },
    [conversations, refreshList, showToast]
  );

  const value = useMemo<ConversationContextValue>(
    () => ({
      conversations,
      loading,
      activeId,
      searchQuery,
      setSearchQuery: handleSetSearchQuery,
      selectConversation,
      createNewConversation,
      renameConversation,
      deleteConversationById,
      togglePinned,
      refreshList: () => refreshList(),
    }),
    [
      conversations,
      loading,
      activeId,
      searchQuery,
      handleSetSearchQuery,
      selectConversation,
      createNewConversation,
      renameConversation,
      deleteConversationById,
      togglePinned,
      refreshList,
    ]
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversations(): ConversationContextValue {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversations must be used within a ConversationProvider.');
  return ctx;
}
