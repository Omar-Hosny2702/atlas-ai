import { useEffect, useState } from 'react';
import {
  Menu,
  Settings2,
  Sparkles,
} from 'lucide-react';

import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/context/ConversationContext';
import { useToast } from '@/context/ToastContext';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

import { IconButton } from '@/components/common/IconButton';
import { Logo } from '@/components/common/Logo';
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

  const [
    conversationSettingsOpen,
    setConversationSettingsOpen,
  ] = useState(false);

  const [actionMessages, setActionMessages] =
    useState<Message[]>([]);

  const [
    isRunningAction,
    setIsRunningAction,
  ] = useState(false);

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
  } = useChat(
    conversationId,
    refreshList
  );

  useEffect(() => {
    setActionMessages([]);
  }, [conversationId]);

  useEffect(() => {
    if (streamError) {
      showToast(
        streamError,
        'error'
      );
    }
  }, [
    streamError,
    showToast,
  ]);

  const createActionMessages = (
    originalContent: string,
    loadingText: string
  ) => {
    if (!conversationId) {
      return null;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: originalContent,
      createdAt:
        new Date().toISOString(),
    };

    const assistantId =
      crypto.randomUUID();

    const assistantMessage: Message = {
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: loadingText,
      createdAt:
        new Date().toISOString(),
    };

    setActionMessages(
      (current) => [
        ...current,
        userMessage,
        assistantMessage,
      ]
    );

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

    setActionMessages(
      (current) =>
        current.map(
          (item) =>
            item.id === assistantId
              ? {
                  ...item,
                  content: '',
                  error: message,
                }
              : item
        )
    );

    showToast(
      message,
      'error'
    );
  };

  const runImageAction = async (
    originalContent: string,
    prompt: string
  ) => {
    if (
      !conversationId ||
      isRunningAction
    ) {
      return;
    }

    const assistantId =
      createActionMessages(
        originalContent,
        'Generating image…'
      );

    if (!assistantId) return;

    setIsRunningAction(true);

    try {
      const result =
        await generateImage(
          prompt
        );

      setActionMessages(
        (current) =>
          current.map(
            (message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: '',
                    image: {
                      mimeType:
                        result.mimeType,
                      data:
                        result.data,
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

  const runResearchAction =
    async (
      originalContent: string,
      query: string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Searching the web and analysing sources…'
        );

      if (!assistantId) return;

      setIsRunningAction(true);

      try {
        await researchTopic(
          query,
          conversationId
        );

        await reload();
        await refreshList();

        setActionMessages([]);
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

  const runExplainAction =
    async (
      originalContent: string,
      topic: string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Building a clear explanation…'
        );

      if (!assistantId) return;

      setIsRunningAction(true);

      try {
        await explainTopic(
          topic,
          conversationId
        );

        await reload();
        await refreshList();

        setActionMessages([]);
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
    if (
      !conversationId ||
      isRunningAction
    ) {
      return;
    }

    const assistantId =
      createActionMessages(
        originalContent,
        'Building your plan…'
      );

    if (!assistantId) return;

    setIsRunningAction(true);

    try {
      await planGoal(
        goal,
        conversationId
      );

      await reload();
      await refreshList();

      setActionMessages([]);
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

  const runRememberAction =
    async (
      originalContent: string,
      memory: string
    ) => {
      if (
        !conversationId ||
        isRunningAction
      ) {
        return;
      }

      const assistantId =
        createActionMessages(
          originalContent,
          'Saving to memory…'
        );

      if (!assistantId) return;

      setIsRunningAction(true);

      try {
        await addMemory(
          memory,
          'general'
        );

        setActionMessages(
          (current) =>
            current.map(
              (message) =>
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

  const handleAttachImage = (
    file: File
  ) => {
    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      showToast(
        'Please choose an image file.',
        'error'
      );

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      showToast(
        'Image must be 10 MB or smaller.',
        'error'
      );

      return;
    }

    showToast(
      `${file.name} selected. Image sending is the next backend step.`,
      'success'
    );
  };

  const handleAttachFile = (
    file: File
  ) => {
    const maxSize =
      20 * 1024 * 1024;

    if (file.size > maxSize) {
      showToast(
        'File must be 20 MB or smaller.',
        'error'
      );

      return;
    }

    showToast(
      `${file.name} selected. File sending is the next backend step.`,
      'success'
    );
  };

  const handleImport = async (
    file: File
  ) => {
    if (
      file.type !==
        'application/json' &&
      !file.name
        .toLowerCase()
        .endsWith('.json')
    ) {
      showToast(
        'Import currently accepts JSON files only.',
        'error'
      );

      return;
    }

    try {
      const text =
        await file.text();

      JSON.parse(text);

      showToast(
        `${file.name} is valid JSON. Import mapping is the next step.`,
        'success'
      );
    } catch {
      showToast(
        'That file is not valid JSON.',
        'error'
      );
    }
  };

  const handleExport = () => {
    if (!conversation) {
      showToast(
        'Open a conversation before exporting.',
        'error'
      );

      return;
    }

    const payload = {
      exportedAt:
        new Date().toISOString(),
      conversation,
      messages,
    };

    const blob = new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2
        ),
      ],
      {
        type: 'application/json',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    const safeTitle =
      conversation.title
        .trim()
        .replace(
          /[^a-z0-9-_]+/gi,
          '-'
        )
        .replace(
          /^-+|-+$/g,
          ''
        )
        .toLowerCase() ||
      'atlas-chat';

    anchor.href = url;
    anchor.download =
      `${safeTitle}.json`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    showToast(
      'Conversation exported.',
      'success'
    );
  };

  const handleSend = (
    content: string
  ) => {
    const rememberMatch =
      content.match(
        /^\/atlas\s+remember\s+(.+)$/i
      );

    if (rememberMatch) {
      const memory =
        rememberMatch[1].trim();

      if (
        !memory ||
        !conversationId
      ) {
        return;
      }

      void runRememberAction(
        content,
        memory
      );

      return;
    }

    const imageMatch =
      content.match(
        /^\/atlas\s+image\s+(.+)$/i
      );

    if (imageMatch) {
      const prompt =
        imageMatch[1].trim();

      if (
        !prompt ||
        !conversationId
      ) {
        return;
      }

      void runImageAction(
        content,
        prompt
      );

      return;
    }

    const researchMatch =
      content.match(
        /^\/atlas\s+research\s+(.+)$/i
      );

    if (researchMatch) {
      const query =
        researchMatch[1].trim();

      if (
        !query ||
        !conversationId
      ) {
        return;
      }

      void runResearchAction(
        content,
        query
      );

      return;
    }

    const explainMatch =
      content.match(
        /^\/atlas\s+explain\s+(.+)$/i
      );

    if (explainMatch) {
      const topic =
        explainMatch[1].trim();

      if (
        !topic ||
        !conversationId
      ) {
        return;
      }

      void runExplainAction(
        content,
        topic
      );

      return;
    }

    const planMatch =
      content.match(
        /^\/atlas\s+plan\s+(.+)$/i
      );

    if (planMatch) {
      const goal =
        planMatch[1].trim();

      if (
        !goal ||
        !conversationId
      ) {
        return;
      }

      void runPlanAction(
        content,
        goal
      );

      return;
    }

    send(content);
  };

  const handleNewChat =
    async () => {
      const id =
        await createNewConversation();

      if (id) {
        selectConversation(id);
      }
    };

  if (!conversationId) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-paper dark:bg-[#090b10]">
        <header
          className="
            flex h-14 shrink-0
            items-center justify-between
            border-b border-black/[0.06]
            px-3
            dark:border-white/[0.07]
            sm:px-5
          "
        >
          <div className="flex items-center gap-2">
            <IconButton
              label="Open sidebar"
              onClick={
                onOpenSidebar
              }
              className="md:hidden"
            >
              <Menu size={18} />
            </IconButton>

            <span className="text-sm font-medium text-muted-light dark:text-muted-dark">
              Atlas AI
            </span>
          </div>
        </header>

        <div className="flex grow items-center justify-center px-6 pb-24">
          <div className="flex max-w-xl flex-col items-center text-center">
            <div
              className="
                mb-5 flex h-16 w-16
                items-center justify-center
                rounded-2xl
                border border-black/[0.06]
                bg-black/[0.03]
                shadow-sm
                dark:border-white/10
                dark:bg-white/[0.05]
              "
            >
              <Logo size={40} />
            </div>

            <h1
              className="
                font-display text-3xl
                font-semibold tracking-tight
                text-ink
                dark:text-paper
                sm:text-4xl
              "
            >
              Hi Omar, what&apos;s
              the plan?
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-light dark:text-muted-dark">
              Ask Atlas anything,
              research a topic,
              create an image, or
              start with an Atlas
              Action.
            </p>

            <button
              type="button"
              onClick={
                handleNewChat
              }
              className="
                mt-7 inline-flex
                items-center gap-2
                rounded-full
                border border-black/10
                bg-white
                px-4 py-2.5
                text-sm font-medium
                text-ink
                shadow-sm
                transition
                hover:bg-black/[0.03]
                dark:border-white/10
                dark:bg-white/[0.05]
                dark:text-paper
                dark:hover:bg-white/[0.08]
              "
            >
              <Sparkles
                size={16}
                className="text-accent-500"
              />
              Start a new chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-paper dark:bg-[#090b10]">
      <header
        className="
          flex h-14 shrink-0
          items-center
          justify-between
          gap-3
          border-b
          border-black/[0.06]
          px-3
          dark:border-white/[0.07]
          sm:px-5
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            label="Open sidebar"
            onClick={
              onOpenSidebar
            }
            className="md:hidden"
          >
            <Menu size={18} />
          </IconButton>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-ink dark:text-paper">
              {loading
                ? 'Loading…'
                : conversation
                    ?.title ??
                  'New chat'}
            </h2>

            {conversation && (
              <p className="truncate text-[10px] text-muted-light dark:text-muted-dark">
                {
                  conversation.model
                }
              </p>
            )}
          </div>
        </div>

        <IconButton
          label="Conversation settings"
          onClick={() =>
            setConversationSettingsOpen(
              true
            )
          }
          disabled={
            !conversation
          }
        >
          <Settings2
            size={17}
          />
        </IconButton>
      </header>

      <div className="relative flex min-h-0 grow flex-col">
        {!loading &&
        !hasMessages ? (
          <div className="flex grow items-center justify-center px-6 pb-10">
            <div className="flex max-w-xl flex-col items-center text-center">
              <div
                className="
                  mb-5 flex h-16 w-16
                  items-center justify-center
                  rounded-2xl
                  border
                  border-black/[0.06]
                  bg-black/[0.03]
                  shadow-sm
                  dark:border-white/10
                  dark:bg-white/[0.05]
                "
              >
                <Logo size={40} />
              </div>

              <h1
                className="
                  font-display text-3xl
                  font-semibold tracking-tight
                  text-ink
                  dark:text-paper
                  sm:text-4xl
                "
              >
                Hi Omar,
                what&apos;s the
                plan?
              </h1>

              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-light dark:text-muted-dark">
                Message Atlas
                below or type
                <span className="mx-1 font-medium text-ink dark:text-paper">
                  /
                </span>
                to use Atlas
                Actions.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 grow">
            <MessageList
              messages={
                visibleMessages
              }
              isStreaming={
                isStreaming ||
                isRunningAction
              }
              onRegenerate={
                regenerate
              }
            />
          </div>
        )}

        <div className="shrink-0 pb-1">
          <MessageInput
            onSend={
              handleSend
            }
            onStop={stop}
            onAttachImage={
              handleAttachImage
            }
            onAttachFile={
              handleAttachFile
            }
            onImport={
              handleImport
            }
            onExport={
              handleExport
            }
            isStreaming={
              isStreaming ||
              isRunningAction
            }
          />
        </div>
      </div>

      <ConversationSettingsModal
        open={
          conversationSettingsOpen
        }
        onClose={() =>
          setConversationSettingsOpen(
            false
          )
        }
        conversation={
          conversation
        }
        onSaved={() => {
          reload();
          refreshList();
        }}
      />
    </div>
  );
}