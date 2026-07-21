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

export function MessageList({ messages, isStreaming, onRegenerate }: MessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const scrollDep = `${messages.length}:${lastMessage?.content.length ?? 0}`;
  const { containerRef, pinnedToBottom, scrollToBottom } = useAutoScroll<HTMLDivElement>(scrollDep);

  const visibleMessages = messages.filter((m) => m.role !== 'system');
  const lastAssistantId = [...visibleMessages].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin px-3 sm:px-6 py-6 flex flex-col gap-4"
      >
        {visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreamingPlaceholder={message.id === STREAMING_ID}
            showRegenerate={
              message.id === lastAssistantId && !isStreaming && message.id !== STREAMING_ID
            }
            onRegenerate={onRegenerate}
            isStreaming={isStreaming}
          />
        ))}
      </div>

      {!pinnedToBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-ink text-paper dark:bg-paper dark:text-ink px-3.5 py-2 text-xs font-medium shadow-lg hover:opacity-90 transition-opacity animate-fade-in"
        >
          <ArrowDown size={14} />
          Jump to latest
        </button>
      )}
    </div>
  );
}
