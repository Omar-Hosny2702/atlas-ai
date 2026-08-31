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

interface ActiveStream {
  conversationId: string;
  controller: AbortController;
}

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

  /*
   * The currently selected conversation.
   *
   * Stream callbacks use this ref so an
   * old conversation can keep generating
   * without modifying whichever chat the
   * user is currently viewing.
   */
  const selectedConversationRef =
    useRef<
      string | null
    >(conversationId);

  /*
   * Streams are keyed by conversation.
   *
   * Switching chats must NOT abort a
   * generation. Only Stop should abort it.
   */
  const activeStreamsRef =
    useRef<
      Map<
        string,
        ActiveStream
      >
    >(
      new Map()
    );

  useEffect(
    () => {
      selectedConversationRef.current =
        conversationId;
    },
    [
      conversationId,
    ]
  );

  const load =
    useCallback(
      async () => {
        const targetConversationId =
          conversationId;

        if (
          !targetConversationId
        ) {
          setConversation(
            null
          );

          setMessages(
            []
          );

          setLoading(
            false
          );

          return;
        }

        setLoading(
          true
        );

        setLoadError(
          null
        );

        try {
          const data =
            await conversationApi
              .getConversation(
                targetConversationId
              );

          /*
           * The user may have switched
           * conversations while this request
           * was in flight.
           *
           * Never let an old request replace
           * the newly selected chat.
           */
          if (
            selectedConversationRef.current !==
            targetConversationId
          ) {
            return;
          }

          setConversation(
            data
          );

          setMessages(
            data.messages
          );
        } catch (
          err
        ) {
          if (
            selectedConversationRef.current !==
            targetConversationId
          ) {
            return;
          }

          setLoadError(
            err instanceof Error
              ? err.message
              : 'Failed to load this conversation.'
          );
        } finally {
          if (
            selectedConversationRef.current ===
            targetConversationId
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        conversationId,
      ]
    );

  useEffect(
    () => {
      /*
       * IMPORTANT:
       *
       * Do not abort an active stream here.
       * This effect runs whenever the user
       * switches conversations.
       */
      void load();

      setStreamError(
        null
      );

      const targetConversationId =
        conversationId;

      setIsStreaming(
        targetConversationId
          ? activeStreamsRef.current.has(
              targetConversationId
            )
          : false
      );
    },
    [
      conversationId,
      load,
    ]
  );

  /*
   * Only abort streams when this hook is
   * actually removed from the application,
   * not when conversationId changes.
   */
  useEffect(
    () => {
      return () => {
        for (
          const stream
          of activeStreamsRef.current.values()
        ) {
          stream.controller.abort();
        }

        activeStreamsRef.current.clear();
      };
    },
    []
  );

  const runStream =
    useCallback(
      (
        targetConversationId:
          string,

        starter: (
          handlers:
            chatApi.StreamHandlers,
          signal:
            AbortSignal
        ) => Promise<void>,

        optimisticUserMessage?:
          Message
      ) => {
        /*
         * Prevent two simultaneous streams
         * inside the same conversation.
         */
        if (
          activeStreamsRef.current.has(
            targetConversationId
          )
        ) {
          return Promise.resolve();
        }

        const controller =
          new AbortController();

        activeStreamsRef.current.set(
          targetConversationId,
          {
            conversationId:
              targetConversationId,

            controller,
          }
        );

        if (
          selectedConversationRef.current ===
          targetConversationId
        ) {
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
              (
                previous
              ) => [
                ...previous,
                optimisticUserMessage,
              ]
            );
          }

          const placeholder:
            Message = {
              id:
                STREAMING_ID,

              conversationId:
                targetConversationId,

              role:
                'assistant',

              content:
                '',

              createdAt:
                new Date()
                  .toISOString(),
            };

          setMessages(
            (
              previous
            ) => [
              ...previous,
              placeholder,
            ]
          );
        }

        return starter(
          {
            onToken:
              (
                token
              ) => {
                /*
                 * The stream may still be
                 * running after the user
                 * switches chats.
                 *
                 * Keep consuming the SSE
                 * connection, but only paint
                 * tokens if its conversation
                 * is currently visible.
                 */
                if (
                  selectedConversationRef.current !==
                  targetConversationId
                ) {
                  return;
                }

                setMessages(
                  (
                    previous
                  ) =>
                    previous.map(
                      (
                        message
                      ) =>
                        message.id ===
                          STREAMING_ID &&
                        message.conversationId ===
                          targetConversationId
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
              (
                saved
              ) => {
                if (
                  selectedConversationRef.current !==
                  targetConversationId
                ) {
                  return;
                }

                setMessages(
                  (
                    previous
                  ) =>
                    previous.map(
                      (
                        message
                      ) =>
                        message.id ===
                          STREAMING_ID &&
                        message.conversationId ===
                          targetConversationId
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
                if (
                  selectedConversationRef.current !==
                  targetConversationId
                ) {
                  return;
                }

                setStreamError(
                  message
                );

                setMessages(
                  (
                    previous
                  ) =>
                    previous.map(
                      (
                        item
                      ) =>
                        item.id ===
                          STREAMING_ID &&
                        item.conversationId ===
                          targetConversationId
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
            const activeStream =
              activeStreamsRef.current.get(
                targetConversationId
              );

            /*
             * Only delete this entry if it
             * still belongs to this exact
             * controller.
             */
            if (
              activeStream?.controller ===
              controller
            ) {
              activeStreamsRef.current.delete(
                targetConversationId
              );
            }

            if (
              selectedConversationRef.current ===
              targetConversationId
            ) {
              setIsStreaming(
                false
              );

              /*
               * Reload from the database.
               *
               * This guarantees the visible
               * conversation reflects the
               * backend's saved version even
               * if some UI tokens were missed
               * during a conversation switch.
               */
              void conversationApi
                .getConversation(
                  targetConversationId
                )
                .then(
                  (
                    data
                  ) => {
                    if (
                      selectedConversationRef.current !==
                      targetConversationId
                    ) {
                      return;
                    }

                    setConversation(
                      data
                    );

                    setMessages(
                      data.messages
                    );
                  }
                )
                .catch(
                  () => {
                    /*
                     * The stream itself already
                     * handled errors. A refresh
                     * failure should not replace
                     * that result.
                     */
                  }
                );
            }

            onSettled?.();
          }
        );
      },
      [
        onSettled,
      ]
    );

  const send =
    useCallback(
      async (
        content:
          string,

        attachments:
          MessageAttachment[] =
            []
      ) => {
        const targetConversationId =
          conversationId;

        if (
          !targetConversationId
        ) {
          return;
        }

        const optimisticUser:
          Message = {
            id:
              `temp-${Date.now()}`,

            conversationId:
              targetConversationId,

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
          targetConversationId,

          (
            handlers,
            signal
          ) =>
            chatApi.sendMessage(
              targetConversationId,

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
        const targetConversationId =
          conversationId;

        if (
          !targetConversationId
        ) {
          return;
        }

        setMessages(
          (
            previous
          ) => {
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
          targetConversationId,

          (
            handlers,
            signal
          ) =>
            chatApi
              .regenerateMessage(
                targetConversationId,
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
        const targetConversationId =
          conversationId;

        if (
          !targetConversationId
        ) {
          return;
        }

        const activeStream =
          activeStreamsRef.current.get(
            targetConversationId
          );

        activeStream
          ?.controller
          .abort();

        activeStreamsRef.current.delete(
          targetConversationId
        );

        void chatApi
          .stopGeneration(
            targetConversationId
          );

        setIsStreaming(
          false
        );
      },
      [
        conversationId,
      ]
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
    reload:
      load,
  };
}