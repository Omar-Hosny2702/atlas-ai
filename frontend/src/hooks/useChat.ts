import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import * as conversationApi
  from '@/api/conversationApi';

import * as chatApi
  from '@/api/chatApi';

import type {
  ConversationWithMessages,
  Message,
  MessageAttachment,
} from '@/types';

const STREAMING_ID =
  '__streaming__';

interface UseChatResult {
  conversation:
    ConversationWithMessages | null;

  messages: Message[];
  loading: boolean;
  loadError: string | null;
  isStreaming: boolean;
  streamError: string | null;

  send: (
    content: string,
    attachments?: MessageAttachment[]
  ) => Promise<void>;

  stop: () => void;
  regenerate:
    () => Promise<void>;

  reload:
    () => Promise<void>;
}

export function useChat(
  conversationId:
    string | null,

  onSettled?: () => void
): UseChatResult {
  const [
    conversation,
    setConversation,
  ] =
    useState<
      ConversationWithMessages | null
    >(null);

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadError,
    setLoadError,
  ] =
    useState<
      string | null
    >(null);

  const [
    isStreaming,
    setIsStreaming,
  ] =
    useState(false);

  const [
    streamError,
    setStreamError,
  ] =
    useState<
      string | null
    >(null);

  const abortRef =
    useRef<
      AbortController | null
    >(null);

  const load =
    useCallback(
      async () => {
        if (
          !conversationId
        ) {
          setConversation(
            null
          );

          setMessages([]);

          return;
        }

        setLoading(true);
        setLoadError(null);

        try {
          const data =
            await conversationApi
              .getConversation(
                conversationId
              );

          setConversation(
            data
          );

          setMessages(
            data.messages
          );
        } catch (err) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Failed to load this conversation.'
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [conversationId]
    );

  useEffect(() => {
    void load();

    setStreamError(
      null
    );

    return () => {
      abortRef.current
        ?.abort();
    };
  }, [load]);

  const runStream =
    useCallback(
      (
        starter: (
          handlers:
            chatApi.StreamHandlers,
          signal:
            AbortSignal
        ) => Promise<void>,

        optimisticUserMessage?:
          Message
      ) => {
        if (
          !conversationId
        ) {
          return Promise.resolve();
        }

        const controller =
          new AbortController();

        abortRef.current =
          controller;

        setIsStreaming(
          true
        );

        setStreamError(
          null
        );

        if (
          optimisticUserMessage
        ) {
          setMessages(
            (previous) => [
              ...previous,
              optimisticUserMessage,
            ]
          );
        }

        const placeholder:
          Message = {
            id:
              STREAMING_ID,

            conversationId,

            role:
              'assistant',

            content: '',

            createdAt:
              new Date()
                .toISOString(),
          };

        setMessages(
          (previous) => [
            ...previous,
            placeholder,
          ]
        );

        return starter(
          {
            onToken:
              (token) => {
                setMessages(
                  (previous) =>
                    previous.map(
                      (
                        message
                      ) =>
                        message.id ===
                        STREAMING_ID
                          ? {
                              ...message,

                              content:
                                message.content +
                                token,
                            }
                          : message
                    )
                );
              },

            onDone:
              (saved) => {
                setMessages(
                  (previous) =>
                    previous.map(
                      (
                        message
                      ) =>
                        message.id ===
                        STREAMING_ID
                          ? saved
                          : message
                    )
                );
              },

            onError:
              (
                message,
                savedMessage
              ) => {
                setStreamError(
                  message
                );

                setMessages(
                  (previous) =>
                    previous.map(
                      (
                        item
                      ) =>
                        item.id ===
                        STREAMING_ID
                          ? (
                              savedMessage ??
                              {
                                ...item,
                                error:
                                  message,
                              }
                            )
                          : item
                    )
                );
              },
          },

          controller.signal
        ).finally(
          () => {
            setIsStreaming(
              false
            );

            abortRef.current =
              null;

            onSettled?.();
          }
        );
      },
      [
        conversationId,
        onSettled,
      ]
    );

  const send =
    useCallback(
      async (
        content: string,
        attachments:
          MessageAttachment[] =
            []
      ) => {
        if (
          !conversationId
        ) {
          return;
        }

        const optimisticUser:
          Message = {
            id:
              `temp-${Date.now()}`,

            conversationId,

            role:
              'user',

            content,

            createdAt:
              new Date()
                .toISOString(),

            metadata:
              attachments.length
                ? {
                    attachments,
                  }
                : {},
          };

        await runStream(
          (
            handlers,
            signal
          ) =>
            chatApi.sendMessage(
              conversationId,

              {
                content,

                attachmentIds:
                  attachments.map(
                    (
                      attachment
                    ) =>
                      attachment.id
                  ),
              },

              handlers,
              signal
            ),

          optimisticUser
        );
      },
      [
        conversationId,
        runStream,
      ]
    );

  const regenerate =
    useCallback(
      async () => {
        if (
          !conversationId
        ) {
          return;
        }

        setMessages(
          (previous) => {
            const
              lastAssistantIndex =
                [
                  ...previous,
                ]
                  .reverse()
                  .findIndex(
                    (
                      message
                    ) =>
                      message.role ===
                      'assistant'
                  );

            if (
              lastAssistantIndex ===
              -1
            ) {
              return previous;
            }

            const cutIndex =
              previous.length -
              1 -
              lastAssistantIndex;

            return previous.slice(
              0,
              cutIndex
            );
          }
        );

        await runStream(
          (
            handlers,
            signal
          ) =>
            chatApi
              .regenerateMessage(
                conversationId,
                handlers,
                signal
              )
        );
      },
      [
        conversationId,
        runStream,
      ]
    );

  const stop =
    useCallback(
      () => {
        abortRef.current
          ?.abort();

        if (
          conversationId
        ) {
          void chatApi
            .stopGeneration(
              conversationId
            );
        }

        setIsStreaming(
          false
        );
      },
      [conversationId]
    );

  return {
    conversation,
    messages,
    loading,
    loadError,
    isStreaming,
    streamError,
    send,
    stop,
    regenerate,
    reload: load,
  };
}