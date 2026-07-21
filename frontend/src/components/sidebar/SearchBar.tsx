import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange }, ref) => {
    return (
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark pointer-events-none"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search chats…"
          aria-label="Search chat history"
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-paper dark:bg-ink-alt pl-8 pr-7 py-2 text-sm outline-none focus:border-accent-500 dark:focus:border-accent-dark transition-colors placeholder:text-muted-light dark:placeholder:text-muted-dark"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark hover:text-ink dark:hover:text-paper"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);
SearchBar.displayName = 'SearchBar';
