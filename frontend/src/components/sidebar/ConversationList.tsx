import { useMemo, useState } from 'react';

import { useConversations } from '@/context/ConversationContext';

import { ConversationItem } from './ConversationItem';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

import { dateGroupLabel } from '@/utils/formatDate';

import type { ConversationSummary } from '@/types';

const GROUP_ORDER = [
  'Pinned',
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days',
  'Older',
];

function groupConversations(
  conversations: ConversationSummary[]
): Map<string, ConversationSummary[]> {
  const groups = new Map<
    string,
    ConversationSummary[]
  >();

  for (const conversation of conversations) {
    const label =
      conversation.pinned
        ? 'Pinned'
        : dateGroupLabel(
            conversation.updatedAt
          );

    const list =
      groups.get(label) ?? [];

    list.push(conversation);

    groups.set(label, list);
  }

  return groups;
}

interface ConversationListProps {
  onSelect: (id: string) => void;
}

export function ConversationList({
  onSelect,
}: ConversationListProps) {
  const {
    conversations,
    loading,
    activeId,
    renameConversation,
    deleteConversationById,
    togglePinned,
  } = useConversations();

  const [
    pendingDeleteId,
    setPendingDeleteId,
  ] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      groupConversations(
        conversations
      ),
    [conversations]
  );

  const pendingConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        pendingDeleteId
    );

  if (
    loading &&
    conversations.length === 0
  ) {
    return (
      <div className="flex flex-col gap-2 px-1 py-2">
        {[...Array(6)].map(
          (_, index) => (
            <div
              key={index}
              className="
                h-10
                animate-pulse
                rounded-xl
                bg-white/[0.05]
              "
              style={{
                animationDelay: `${index * 60}ms`,
              }}
            />
          )
        )}
      </div>
    );
  }

  if (
    conversations.length === 0
  ) {
    return (
      <div
        className="
          px-4
          py-10
          text-center
        "
      >
        <p className="text-xs leading-relaxed text-white/35">
          No chats yet.
          <br />
          Start a new one and it’ll
          appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {GROUP_ORDER.filter(
          (label) =>
            grouped.has(label)
        ).map((label) => (
          <section key={label}>
            <h3
              className="
                mb-1.5
                px-2.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white/30
              "
            >
              {label}
            </h3>

            <div className="flex flex-col gap-0.5">
              {grouped
                .get(label)!
                .map(
                  (
                    conversation
                  ) => (
                    <ConversationItem
                      key={
                        conversation.id
                      }
                      conversation={
                        conversation
                      }
                      active={
                        conversation.id ===
                        activeId
                      }
                      onSelect={() =>
                        onSelect(
                          conversation.id
                        )
                      }
                      onRename={(
                        title
                      ) =>
                        renameConversation(
                          conversation.id,
                          title
                        )
                      }
                      onDelete={() =>
                        setPendingDeleteId(
                          conversation.id
                        )
                      }
                      onTogglePin={() =>
                        togglePinned(
                          conversation.id
                        )
                      }
                    />
                  )
                )}
            </div>
          </section>
        ))}
      </div>

      <ConfirmDialog
        open={
          pendingDeleteId !== null
        }
        title="Delete this chat?"
        message={`"${
          pendingConversation?.title ??
          'This chat'
        }" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onCancel={() =>
          setPendingDeleteId(null)
        }
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteConversationById(
              pendingDeleteId
            );
          }

          setPendingDeleteId(null);
        }}
      />
    </>
  );
}