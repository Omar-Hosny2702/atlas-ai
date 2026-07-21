import { useCallback, useEffect, useRef, useState } from 'react';
import * as conversationApi from '@/api/conversationApi';
import * as chatApi from '@/api/chatApi';
import type { ConversationWithMessages, Message } from '@/types';

const STREAMING_ID = '__streaming__';

interface UseChatResult {
  conversation: ConversationWithMessages | null;
  messages: Message[];
  loading: boolean;
  loadError: string | null;
  isStreaming: boolean;
  streamError: string | null;
  send: (content: string) => Promise<void>;
  stop: () => void;
  regenerate: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useChat(conversationId: string | null, onSettled?: () => void): UseChatResult {
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await conversationApi.getConversation(conversationId);
      setConversation(data);
      setMessages(data.messages);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load this conversation.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
    setStreamError(null);
    // Abort any in-flight stream from a previously selected conversation.
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const runStream = useCallback(
    (
      starter: (handlers: chatApi.StreamHandlers, signal: AbortSignal) => Promise<void>,
      optimisticUserMessage?: Message
    ) => {
      if (!conversationId) return Promise.resolve();

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setStreamError(null);

      if (optimisticUserMessage) {
        setMessages((prev) => [...prev, optimisticUserMessage]);
      }

      const placeholder: Message = {
        id: STREAMING_ID,
        conversationId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, placeholder]);

      return starter(
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === STREAMING_ID ? { ...m, content: m.content + token } : m))
            );
          },
          onDone: (saved) => {
            setMessages((prev) => prev.map((m) => (m.id === STREAMING_ID ? saved : m)));
          },
          onError: (message, savedMessage) => {
            setStreamError(message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_ID
                  ? savedMessage ?? { ...m, error: message }
                  : m
              )
            );
          },
        },
        controller.signal
      ).finally(() => {
        setIsStreaming(false);
        abortRef.current = null;
        onSettled?.();
      });
    },
    [conversationId, onSettled]
  );

  const send = useCallback(
    async (content: string) => {
      if (!conversationId) return;
      const optimisticUser: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      await runStream(
        (handlers, signal) => chatApi.sendMessage(conversationId, { content }, handlers, signal),
        optimisticUser
      );
    },
    [conversationId, runStream]
  );

  const regenerate = useCallback(async () => {
    if (!conversationId) return;
    // Drop the last assistant message locally (mirrors what the backend does).
    setMessages((prev) => {
      const lastAssistantIndex = [...prev].reverse().findIndex((m) => m.role === 'assistant');
      if (lastAssistantIndex === -1) return prev;
      const cutIndex = prev.length - 1 - lastAssistantIndex;
      return prev.slice(0, cutIndex);
    });
    await runStream((handlers, signal) => chatApi.regenerateMessage(conversationId, handlers, signal));
  }, [conversationId, runStream]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (conversationId) chatApi.stopGeneration(conversationId);
    setIsStreaming(false);
  }, [conversationId]);

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
