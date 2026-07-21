import { useEffect, useState } from 'react';
import { Menu, Settings2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/context/ConversationContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyState } from './EmptyState';
import { IconButton } from '@/components/common/IconButton';
import { ConversationSettingsModal } from '@/components/settings/ConversationSettingsModal';

interface ChatWindowProps {
  conversationId: string | null;
  onOpenSidebar: () => void;
}

export function ChatWindow({ conversationId, onOpenSidebar }: ChatWindowProps) {
  const { refreshList, createNewConversation, selectConversation } = useConversations();
  const { options } = useSettings();
  const { showToast } = useToast();
  const [conversationSettingsOpen, setConversationSettingsOpen] = useState(false);

  const {
    conversation,
    messages,
    loading,
    loadError,
    isStreaming,
    streamError,
    send,
    stop,
    regenerate,
    reload,
  } = useChat(conversationId, refreshList);

  useEffect(() => {
    if (streamError) showToast(streamError, 'error');
  }, [streamError, showToast]);

  const ollamaDown = options !== null && !options.ollama.reachable;

  const handleSuggestion = (text: string) => {
    send(text);
  };

  const handleNewChat = async () => {
    const id = await createNewConversation();
    if (id) selectConversation(id);
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex md:hidden items-center gap-2 border-b border-border-light dark:border-border-dark px-3 py-3 shrink-0">
          <IconButton label="Open sidebar" onClick={onOpenSidebar}>
            <Menu size={18} />
          </IconButton>
          <h2 className="font-display font-semibold text-sm">Atlas AI</h2>
        </header>
        <EmptyState variant="no-conversation" onNewChat={handleNewChat} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-danger-light dark:text-danger-dark">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 border-b border-border-light dark:border-border-dark px-3 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton label="Open sidebar" onClick={onOpenSidebar} className="md:hidden">
            <Menu size={18} />
          </IconButton>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-sm truncate">
              {loading ? 'Loading…' : conversation?.title ?? 'New chat'}
            </h2>
            {conversation && (
              <p className="text-[11px] text-muted-light dark:text-muted-dark truncate">
                {conversation.model}
              </p>
            )}
          </div>
        </div>
        <IconButton
          label="Conversation settings"
          onClick={() => setConversationSettingsOpen(true)}
          disabled={!conversation}
        >
          <Settings2 size={17} />
        </IconButton>
      </header>

      {!loading && messages.filter((m) => m.role !== 'system').length === 0 ? (
        <EmptyState variant="new-conversation" onSuggestion={handleSuggestion} />
      ) : (
        <MessageList messages={messages} isStreaming={isStreaming} onRegenerate={regenerate} />
      )}

      <MessageInput
        onSend={send}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={ollamaDown}
        disabledReason={
          ollamaDown
            ? "Can't reach Ollama. Run \"ollama serve\" and reload the page."
            : undefined
        }
      />

      <ConversationSettingsModal
        open={conversationSettingsOpen}
        onClose={() => setConversationSettingsOpen(false)}
        conversation={conversation}
        onSaved={() => {
          reload();
          refreshList();
        }}
      />
    </div>
  );
}
