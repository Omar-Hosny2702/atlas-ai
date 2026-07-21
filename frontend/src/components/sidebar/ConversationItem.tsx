import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import { Check, Pencil, Pin, Trash2, X } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';
import type { ConversationSummary } from '@/types';

interface ConversationItemProps {
  conversation: ConversationSummary;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
}: ConversationItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== conversation.title) onRename(trimmed);
    else setDraft(conversation.title);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setDraft(conversation.title);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg px-2.5 py-2 bg-paper-alt dark:bg-ink-raised">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Rename chat"
          className="grow bg-transparent text-sm outline-none min-w-0"
        />
        <IconButton label="Save name" size="sm" onClick={commitRename}>
          <Check size={13} />
        </IconButton>
        <IconButton
          label="Cancel rename"
          size="sm"
          onClick={() => {
            setDraft(conversation.title);
            setEditing(false);
          }}
        >
          <X size={13} />
        </IconButton>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'group flex items-center gap-1 rounded-lg px-2.5 py-2 cursor-pointer transition-colors',
        active
          ? 'bg-accent-100 dark:bg-ink-raised text-accent-800 dark:text-paper'
          : 'hover:bg-paper-alt dark:hover:bg-ink-raised'
      )}
      onClick={onSelect}
    >
      <button
        className="grow min-w-0 text-left flex items-center gap-1.5"
        aria-current={active ? 'true' : undefined}
      >
        {conversation.pinned && (
          <Pin size={11} className="shrink-0 fill-current text-accent-500 dark:text-accent-dark" />
        )}
        <span className="truncate text-sm">{conversation.title}</span>
      </button>

      <div
        className="hidden group-hover:flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton label={conversation.pinned ? 'Unpin chat' : 'Pin chat'} size="sm" onClick={onTogglePin}>
          <Pin size={13} className={conversation.pinned ? 'fill-current' : ''} />
        </IconButton>
        <IconButton label="Rename chat" size="sm" onClick={() => setEditing(true)}>
          <Pencil size={13} />
        </IconButton>
        <IconButton label="Delete chat" size="sm" onClick={onDelete}>
          <Trash2 size={13} />
        </IconButton>
      </div>
    </div>
  );
}
