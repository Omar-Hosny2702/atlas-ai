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
import {
  explainTopic,
  planGoal,
} from '@/api/textActionsApi';
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

  const [actionMessages, setActionMessages] =
    useState<Message[]>([]);

  const [isRunningAction, setIsRunningAction] =
    useState(false);

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

  const createActionMessages = (
    originalContent: string,
    loadingText: string
  ) => {
    if (!conversationId) return null;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: originalContent,
      createdAt: new Date().toISOString(),
    };

    const assistantId = crypto.randomUUID();

    const assistantMessage: Message = {
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: loadingText,
      createdAt: new Date().toISOString(),
    };

    setActionMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    return assistantId;
  };

  const setActionError = (
    assistantId: string,
    error: unknown,
    fallback: string
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : fallback;

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
  };

  const runImageAction = async (
    originalContent: string,
    prompt: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const assistantId = createActionMessages(
      originalContent,
      'Generating image…'
    );

    if (!assistantId) return;

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
      setActionError(
        assistantId,
        error,
        'Image generation failed.'
      );
    } finally {
      setIsRunningAction(false);
    }
  };

  const runResearchAction = async (
    originalContent: string,
    query: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const assistantId = createActionMessages(
      originalContent,
      'Searching the web and analysing sources…'
    );

    if (!assistantId) return;

    setIsRunningAction(true);

    try {
      const result = await researchTopic(query);

      setActionMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: result.answer,
                research: {
                  sources: result.sources,
                  searchQueries: result.searchQueries,
                },
              }
            : message
        )
      );
    } catch (error) {
      setActionError(
        assistantId,
        error,
        'Research failed.'
      );
    } finally {
      setIsRunningAction(false);
    }
  };

  const runExplainAction = async (
    originalContent: string,
    topic: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const assistantId = createActionMessages(
      originalContent,
      'Building a clear explanation…'
    );

    if (!assistantId) return;

    setIsRunningAction(true);

    try {
      const result = await explainTopic(topic);

      setActionMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: result.answer,
              }
            : message
        )
      );
    } catch (error) {
      setActionError(
        assistantId,
        error,
        'Explanation failed.'
      );
    } finally {
      setIsRunningAction(false);
    }
  };

  const runPlanAction = async (
    originalContent: string,
    goal: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const assistantId = createActionMessages(
      originalContent,
      'Building your plan…'
    );

    if (!assistantId) return;

    setIsRunningAction(true);

    try {
      const result = await planGoal(goal);

      setActionMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: result.answer,
              }
            : message
        )
      );
    } catch (error) {
      setActionError(
        assistantId,
        error,
        'Planning failed.'
      );
    } finally {
      setIsRunningAction(false);
    }
  };

  const runRememberAction = async (
    originalContent: string,
    memory: string
  ) => {
    if (!conversationId || isRunningAction) return;

    const assistantId = createActionMessages(
      originalContent,
      'Saving to memory…'
    );

    if (!assistantId) return;

    setIsRunningAction(true);

    try {
      await addMemory(memory, 'general');

      setActionMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: `✓ Saved to memory: **${memory}**`,
              }
            : message
        )
      );

      showToast(
        'Saved to Atlas memory.',
        'success'
      );
    } catch (error) {
      setActionError(
        assistantId,
        error,
        'Could not save memory.'
      );
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleSend = (content: string) => {
    const rememberMatch = content.match(
      /^\/atlas\s+remember\s+(.+)$/i
    );

    if (rememberMatch) {
      const memory = rememberMatch[1].trim();

      if (!memory || !conversationId) return;

      void runRememberAction(
        content,
        memory
      );

      return;
    }

    const imageMatch = content.match(
      /^\/atlas\s+image\s+(.+)$/i
    );

    if (imageMatch) {
      const prompt = imageMatch[1].trim();

      if (!prompt || !conversationId) return;

      void runImageAction(
        content,
        prompt
      );

      return;
    }

    const researchMatch = content.match(
      /^\/atlas\s+research\s+(.+)$/i
    );

    if (researchMatch) {
      const query = researchMatch[1].trim();

      if (!query || !conversationId) return;

      void runResearchAction(
        content,
        query
      );

      return;
    }

    const explainMatch = content.match(
      /^\/atlas\s+explain\s+(.+)$/i
    );

    if (explainMatch) {
      const topic = explainMatch[1].trim();

      if (!topic || !conversationId) return;

      void runExplainAction(
        content,
        topic
      );

      return;
    }

    const planMatch = content.match(
      /^\/atlas\s+plan\s+(.+)$/i
    );

    if (planMatch) {
      const goal = planMatch[1].trim();

      if (!goal || !conversationId) return;

      void runPlanAction(
        content,
        goal
      );

      return;
    }

    send(content);
  };

  const handleNewChat = async () => {
    const id =
      await createNewConversation();

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
      (message) =>
        message.role !== 'system'
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
                : conversation?.title ??
                  'New chat'}
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
            isStreaming ||
            isRunningAction
          }
          onRegenerate={regenerate}
        />
      )}

      <MessageInput
        onSend={handleSend}
        onStop={stop}
        isStreaming={
          isStreaming ||
          isRunningAction
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