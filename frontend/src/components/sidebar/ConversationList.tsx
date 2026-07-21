import { useMemo, useState } from 'react';
import { useConversations } from '@/context/ConversationContext';
import { ConversationItem } from './ConversationItem';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { dateGroupLabel } from '@/utils/formatDate';
import type { ConversationSummary } from '@/types';

const GROUP_ORDER = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Older'];

function groupConversations(conversations: ConversationSummary[]): Map<string, ConversationSummary[]> {
  const groups = new Map<string, ConversationSummary[]>();
  for (const c of conversations) {
    const label = c.pinned ? 'Pinned' : dateGroupLabel(c.updatedAt);
    const list = groups.get(label) ?? [];
    list.push(c);
    groups.set(label, list);
  }
  return groups;
}

interface ConversationListProps {
  onSelect: (id: string) => void;
}

export function ConversationList({ onSelect }: ConversationListProps) {
  const { conversations, loading, activeId, renameConversation, deleteConversationById, togglePinned } =
    useConversations();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);
  const pendingConversation = conversations.find((c) => c.id === pendingDeleteId);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 px-1 py-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-lg bg-paper-alt dark:bg-ink-raised animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <p className="text-center text-xs text-muted-light dark:text-muted-dark py-8 px-4">
        No chats yet. Start a new one to see it here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {GROUP_ORDER.filter((label) => grouped.has(label)).map((label) => (
        <div key={label}>
          <h3 className="px-2.5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-light dark:text-muted-dark">
            {label}
          </h3>
          <div className="flex flex-col gap-0.5">
            {grouped.get(label)!.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                onSelect={() => onSelect(c.id)}
                onRename={(title) => renameConversation(c.id, title)}
                onDelete={() => setPendingDeleteId(c.id)}
                onTogglePin={() => togglePinned(c.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this chat?"
        message={`"${pendingConversation?.title ?? 'This chat'}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) deleteConversationById(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
