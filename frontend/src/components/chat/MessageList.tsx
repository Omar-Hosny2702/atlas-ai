import { ArrowDown } from 'lucide-react';

import { useAutoScroll } from '@/hooks/useAutoScroll';
import { MessageBubble } from './MessageBubble';

import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate: () => void;
}

const STREAMING_ID = '__streaming__';

export function MessageList({
  messages,
  isStreaming,
  onRegenerate,
}: MessageListProps) {
  const lastMessage =
    messages[messages.length - 1];

  const scrollDep = [
    messages.length,
    lastMessage?.id ?? '',
    lastMessage?.content.length ?? 0,
    lastMessage?.image
      ? 'image'
      : 'text',
    isStreaming
      ? 'streaming'
      : 'idle',
  ].join(':');

  const {
    containerRef,
    pinnedToBottom,
    scrollToBottom,
  } = useAutoScroll<HTMLDivElement>(
    scrollDep
  );

  const visibleMessages =
    messages.filter(
      (message) =>
        message.role !== 'system'
    );

  const lastAssistantId = [
    ...visibleMessages,
  ]
    .reverse()
    .find(
      (message) =>
        message.role === 'assistant'
    )?.id;

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={containerRef}
        className="
          h-full
          overflow-y-auto
          scrollbar-thin
          px-3
          pb-10
          pt-6
          sm:px-6
          sm:pt-8
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-3xl
            flex-col
            gap-5
          "
        >
          {visibleMessages.map(
            (message) => (
              <MessageBubble
                key={
                  message.id
                }
                message={
                  message
                }
                isStreamingPlaceholder={
                  message.id ===
                  STREAMING_ID
                }
                showRegenerate={
                  message.id ===
                    lastAssistantId &&
                  !isStreaming &&
                  message.id !==
                    STREAMING_ID
                }
                onRegenerate={
                  onRegenerate
                }
                isStreaming={
                  isStreaming
                }
              />
            )
          )}
        </div>
      </div>

      {!pinnedToBottom && (
        <button
          type="button"
          onClick={() =>
            scrollToBottom(
              'smooth'
            )
          }
          className="
            absolute
            bottom-5
            left-1/2
            -translate-x-1/2
            flex
            items-center
            gap-1.5
            rounded-full
            border
            border-black/10
            bg-white
            px-3.5
            py-2
            text-xs
            font-medium
            text-ink
            shadow-lg
            transition
            hover:bg-black/[0.03]
            dark:border-white/10
            dark:bg-[#151820]
            dark:text-paper
            dark:hover:bg-white/[0.08]
          "
        >
          <ArrowDown
            size={14}
          />

          Jump to latest
        </button>
      )}
    </div>
  );
}