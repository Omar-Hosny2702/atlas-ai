import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TypingIndicator } from './TypingIndicator';
import { MessageActions } from './MessageActions';
import { formatTime } from '@/utils/formatDate';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isStreamingPlaceholder: boolean;
  showRegenerate: boolean;
  onRegenerate: () => void;
  isStreaming: boolean;
}

export function MessageBubble({
  message,
  isStreamingPlaceholder,
  showRegenerate,
  onRegenerate,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isEmpty = isStreamingPlaceholder && message.content.length === 0 && !message.error;

  return (
    <div
      className={clsx('group flex w-full gap-3 px-1', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className={clsx('flex flex-col max-w-[min(680px,88%)]', isUser && 'items-end')}>
        <div
          className={clsx(
            'rounded-2xl px-4 py-2.5 text-[0.95rem]',
            isUser
              ? 'bg-accent-500 text-white dark:bg-accent-600 dark:text-white rounded-br-md'
              : 'bg-paper-alt dark:bg-ink-raised text-ink dark:text-paper rounded-bl-md'
          )}
        >
          {isEmpty ? (
            <TypingIndicator />
          ) : message.error ? (
            <div className="flex items-start gap-2 text-danger-light dark:text-danger-dark">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm">{message.error}</span>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {message.stopped && (
            <p className="mt-1.5 text-xs italic opacity-70">Generation stopped.</p>
          )}
        </div>

        <div
          className={clsx(
            'flex items-center gap-2 mt-1 px-1',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-[11px] text-muted-light dark:text-muted-dark">
            {formatTime(message.createdAt)}
          </span>
          {!isEmpty && !message.error && (
            <MessageActions
              content={message.content}
              showRegenerate={!isUser && showRegenerate}
              onRegenerate={onRegenerate}
              disabled={isStreaming}
            />
          )}
        </div>
      </div>
    </div>
  );
}
