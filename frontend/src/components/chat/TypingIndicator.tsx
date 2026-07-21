export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" role="status" aria-label="Atlas AI is typing">
      <span className="h-2 w-2 rounded-full bg-accent-500 dark:bg-accent-dark animate-pulse-dot [animation-delay:-0.24s]" />
      <span className="h-2 w-2 rounded-full bg-accent-500 dark:bg-accent-dark animate-pulse-dot [animation-delay:-0.12s]" />
      <span className="h-2 w-2 rounded-full bg-accent-500 dark:bg-accent-dark animate-pulse-dot" />
    </div>
  );
}
