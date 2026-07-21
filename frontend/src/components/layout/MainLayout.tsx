import { useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useConversations } from '@/context/ConversationContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function MainLayout() {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { activeId, selectConversation, createNewConversation } = useConversations();

  const handleSelect = (id: string) => {
    selectConversation(id);
    setMobileSidebarOpen(false);
  };

  useKeyboardShortcuts({
    onNewChat: async () => {
      const id = await createNewConversation();
      if (id) handleSelect(id);
    },
    onFocusSearch: () => searchInputRef.current?.focus(),
    onToggleSidebar: () => setMobileSidebarOpen((v) => !v),
    onOpenSettings: () => setSettingsOpen(true),
    onCloseModal: () => {
      setSettingsOpen(false);
      setMobileSidebarOpen(false);
    },
  });

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-paper dark:bg-ink text-ink dark:text-paper">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onSelectConversation={handleSelect}
        onOpenSettings={() => setSettingsOpen(true)}
        searchInputRef={searchInputRef}
      />

      <main className="flex-1 min-w-0">
        <ChatWindow conversationId={activeId} onOpenSidebar={() => setMobileSidebarOpen(true)} />
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
