import { Logo } from '@/components/common/Logo';

interface EmptyStateProps {
  variant: 'no-conversation' | 'new-conversation';
  onNewChat?: () => void;
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  'Explain how transformers work, simply',
  'Draft a polite email declining a meeting',
  'Write a Python script to rename files in bulk',
  "What's a good structure for a weekly status report?",
];

export function EmptyState({ variant, onNewChat, onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="mb-5 opacity-90">
        <Logo size={44} />
      </div>
      {variant === 'no-conversation' ? (
        <>
          <h1 className="font-display text-xl font-semibold mb-2">Where to next?</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark max-w-sm mb-6">
            Pick a conversation from the sidebar, or start a new one — Atlas AI keeps every chat
            on your own machine.
          </p>
          <button
            onClick={onNewChat}
            className="rounded-lg bg-accent-500 dark:bg-accent-dark text-white dark:text-ink px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start a new chat
          </button>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-semibold mb-2">What are you charting today?</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark max-w-sm mb-6">
            Ask anything — code, writing, research, or just a question you're curious about.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion?.(s)}
                className="text-left text-sm rounded-xl border border-border-light dark:border-border-dark px-3.5 py-2.5 hover:border-accent-500 dark:hover:border-accent-dark hover:bg-paper-alt dark:hover:bg-ink-raised transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
