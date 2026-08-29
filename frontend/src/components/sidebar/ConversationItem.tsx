import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import clsx from 'clsx';

import {
  Check,
  Pencil,
  Pin,
  Trash2,
  X,
} from 'lucide-react';

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
  const [editing, setEditing] =
    useState(false);

  const [draft, setDraft] =
    useState(conversation.title);

  const inputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setDraft(conversation.title);
    }
  }, [conversation.title, editing]);

  const commitRename = () => {
    const trimmed = draft.trim();

    setEditing(false);

    if (
      trimmed &&
      trimmed !== conversation.title
    ) {
      onRename(trimmed);
      return;
    }

    setDraft(conversation.title);
  };

  const cancelRename = () => {
    setDraft(conversation.title);
    setEditing(false);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      commitRename();
    }

    if (event.key === 'Escape') {
      cancelRename();
    }
  };

  if (editing) {
    return (
      <div
        className="
          flex
          items-center
          gap-1
          rounded-xl
          border border-white/[0.08]
          bg-white/[0.06]
          px-2.5
          py-2
        "
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value)
          }
          onKeyDown={handleKeyDown}
          aria-label="Rename chat"
          className="
            min-w-0
            grow
            bg-transparent
            text-sm
            text-white
            outline-none
            placeholder:text-white/30
          "
        />

        <IconButton
          label="Save name"
          size="sm"
          onClick={commitRename}
        >
          <Check size={13} />
        </IconButton>

        <IconButton
          label="Cancel rename"
          size="sm"
          onClick={cancelRename}
        >
          <X size={13} />
        </IconButton>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        `
          group
          flex
          cursor-pointer
          items-center
          gap-1
          rounded-xl
          px-2.5
          py-2.5
          transition
        `,
        active
          ? `
            bg-white/[0.09]
            text-white
          `
          : `
            text-white/72
            hover:bg-white/[0.05]
            hover:text-white
          `
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        aria-current={
          active
            ? 'true'
            : undefined
        }
        className="
          flex
          min-w-0
          grow
          items-center
          gap-2
          text-left
        "
      >
        {conversation.pinned && (
          <Pin
            size={11}
            className="
              shrink-0
              fill-current
              text-accent-500
            "
          />
        )}

        <span
          className={clsx(
            'truncate text-sm',
            active
              ? 'font-medium'
              : 'font-normal'
          )}
        >
          {conversation.title}
        </span>
      </button>

      <div
        className={clsx(
          `
            shrink-0
            items-center
            gap-0.5
          `,
          active
            ? 'flex'
            : 'hidden group-hover:flex'
        )}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <IconButton
          label={
            conversation.pinned
              ? 'Unpin chat'
              : 'Pin chat'
          }
          size="sm"
          onClick={onTogglePin}
        >
          <Pin
            size={13}
            className={
              conversation.pinned
                ? 'fill-current'
                : ''
            }
          />
        </IconButton>

        <IconButton
          label="Rename chat"
          size="sm"
          onClick={() =>
            setEditing(true)
          }
        >
          <Pencil size={13} />
        </IconButton>

        <IconButton
          label="Delete chat"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 size={13} />
        </IconButton>
      </div>
    </div>
  );
}