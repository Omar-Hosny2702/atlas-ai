import { PenSquare } from 'lucide-react';

interface NewChatButtonProps {
  onClick: () => void;
  collapsed?: boolean;
}

export function NewChatButton({ onClick, collapsed }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-border-light dark:border-border-dark px-3 py-2.5 text-sm font-medium hover:bg-paper-alt dark:hover:bg-ink-raised transition-colors w-full"
      title="New chat (Ctrl/Cmd+K)"
    >
      <PenSquare size={16} className="shrink-0" />
      {!collapsed && <span>New chat</span>}
    </button>
  );
}
