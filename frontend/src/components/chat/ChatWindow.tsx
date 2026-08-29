import { useEffect, useState } from 'react';
import { Menu, Settings2 } from 'lucide-react';

import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/context/ConversationContext';
import { useToast } from '@/context/ToastContext';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyState } from './EmptyState';

import { IconButton } from '@/components/common/IconButton';
import { ConversationSettingsModal } from '@/components/settings/ConversationSettingsModal';

import { generateImage } from '@/api/actionsApi';
import { researchTopic } from '@/api/researchApi';
import { addMemory } from '@/api/settingsApi';

import type { Message } from '@/types';

interface ChatWindowProps {
  conversationId: string | null;
  onOpenSidebar: () => void;
}

export function ChatWindow({
  conversationId,
  onOpenSidebar,
}: ChatWindowProps) {
  const {
    refreshList,
    createNewConversation,
    selectConversation,
  } = useConversations();

  const { showToast } = useToast();

  const [conversationSettingsOpen, setConversationSettingsOpen] =
    useState(false);

  const [actionMessages, setActionMessages] = useState<Message[]>([]);
  const [isRunningAction, setIsRunningAction] = useState(false);

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
    setActionMessages([]);
  }, [conversationId]);

  useEffect(() => {
    if (streamError) {
      showToast(streamError, 'error');
    }
  }, [streamError, showToast]);

  const handleSuggestion = (text: string) => {
    send(text);
  };

  // ==========================
  // IMAGE ACTION
  // ==========================

  const runImageAction = async (
    originalContent: string,
    prompt: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: originalContent,
      createdAt: new Date().toISOString(),
    };

    const assistantId = crypto.randomUUID();

    const generatingMessage: Message = {
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: 'Generating image…',
      createdAt: new Date().toISOString(),
    };

    setActionMessages((current) => [
      ...current,
      userMessage,
      generatingMessage,
    ]);

    setIsRunningAction(true);

    try {
      const result = await generateImage(prompt);

      setActionMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: '',
                image: {
                  mimeType: result.mimeType,
                  data: result.data,
                  alt: prompt,
                },
              }
            : message
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Image generation failed.';

      setActionMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: '',
                error: message,
              }
            : item
        )
      );

      showToast(message, 'error');
    } finally {
      setIsRunningAction(false);
    }
  };

  // ==========================
  // RESEARCH ACTION
  // ==========================

  const runResearchAction = async (
    originalContent: string,
    query: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: originalContent,
      createdAt: new Date().toISOString(),
    };

    const assistantId = crypto.randomUUID();

    const researchingMessage: Message = {
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: 'Researching the web…',
      createdAt: new Date().toISOString(),
    };

    setActionMessages((current) => [
      ...current,
      userMessage,
      researchingMessage,
    ]);

    setIsRunningAction(true);

    try {
      const result = await researchTopic(query);

      let content = result.answer;

      if (result.sources.length > 0) {
        content += '\n\n### Sources\n';

        result.sources.forEach((source, index) => {
          content += `\n${index + 1}. [${source.title}](${source.url})`;
        });
      }

      setActionMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content,
              }
            : message
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Research failed.';

      setActionMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: '',
                error: message,
              }
            : item
        )
      );

      showToast(message, 'error');
    } finally {
      setIsRunningAction(false);
    }
  };

  // ==========================
  // SEND / ATLAS ACTION ROUTER
  // ==========================

  const handleSend = (content: string) => {
    // Remember
    const rememberMatch = content.match(
      /^\/atlas\s+remember\s+(.+)$/i
    );

    if (rememberMatch) {
      const memory = rememberMatch[1].trim();

      if (!memory) return;

      void (async () => {
        try {
          await addMemory(memory, 'general');

          showToast(
            'Saved to Atlas memory.',
            'success'
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Could not save memory.';

          showToast(message, 'error');
        }
      })();

      return;
    }

    // Image
    const imageMatch = content.match(
      /^\/atlas\s+image\s+(.+)$/i
    );

    if (imageMatch) {
      const prompt = imageMatch[1].trim();

      if (!prompt || !conversationId) return;

      void runImageAction(content, prompt);
      return;
    }

    // Research
    const researchMatch = content.match(
      /^\/atlas\s+research\s+(.+)$/i
    );

    if (researchMatch) {
      const query = researchMatch[1].trim();

      if (!query || !conversationId) return;

      void runResearchAction(content, query);
      return;
    }

    // Normal Atlas chat
    send(content);
  };

  const handleNewChat = async () => {
    const id = await createNewConversation();

    if (id) {
      selectConversation(id);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex md:hidden items-center gap-2 border-b border-border-light dark:border-border-dark px-3 py-3 shrink-0">
          <IconButton
            label="Open sidebar"
            onClick={onOpenSidebar}
          >
            <Menu size={18} />
          </IconButton>

          <h2 className="font-display font-semibold text-sm">
            Atlas AI
          </h2>
        </header>

        <EmptyState
          variant="no-conversation"
          onNewChat={handleNewChat}
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-danger-light dark:text-danger-dark">
          {loadError}
        </p>
      </div>
    );
  }

  const visibleMessages = [
    ...messages,
    ...actionMessages,
  ];

  const hasMessages =
    visibleMessages.filter(
      (message) => message.role !== 'system'
    ).length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 border-b border-border-light dark:border-border-dark px-3 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            label="Open sidebar"
            onClick={onOpenSidebar}
            className="md:hidden"
          >
            <Menu size={18} />
          </IconButton>

          <div className="min-w-0">
            <h2 className="font-display font-semibold text-sm truncate">
              {loading
                ? 'Loading…'
                : conversation?.title ?? 'New chat'}
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
          onClick={() =>
            setConversationSettingsOpen(true)
          }
          disabled={!conversation}
        >
          <Settings2 size={17} />
        </IconButton>
      </header>

      {!loading && !hasMessages ? (
        <EmptyState
          variant="new-conversation"
          onSuggestion={handleSuggestion}
        />
      ) : (
        <MessageList
          messages={visibleMessages}
          isStreaming={
            isStreaming || isRunningAction
          }
          onRegenerate={regenerate}
        />
      )}

      <MessageInput
        onSend={handleSend}
        onStop={stop}
        isStreaming={
          isStreaming || isRunningAction
        }
      />

      <ConversationSettingsModal
        open={conversationSettingsOpen}
        onClose={() =>
          setConversationSettingsOpen(false)
        }
        conversation={conversation}
        onSaved={() => {
          reload();
          refreshList();
        }}
      />
    </div>
  );
}