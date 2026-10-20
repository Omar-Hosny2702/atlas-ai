import { useRef, useState } from 'react';

import { Sidebar } from './Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { UsersPage } from '@/components/admin/UsersPage';
import { WorkPanel } from './WorkPanel';

import { useConversations } from '@/context/ConversationContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function MainLayout() {
  const [
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [
    adminUsersOpen,
    setAdminUsersOpen,
  ] = useState(false);

  const [workOpen, setWorkOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const {
    activeId,
    selectConversation,
    createNewConversation,
  } = useConversations();

  const handleSelect = (
    id: string
  ) => {
    selectConversation(id);
    setWorkOpen(false);
    setAdminUsersOpen(false);
    setMobileSidebarOpen(false);
  };

  useKeyboardShortcuts({
    onNewChat: async () => {
      const id =
        await createNewConversation();

      if (id) {
        handleSelect(id);
      }
    },

    onFocusSearch: () =>
      searchInputRef.current?.focus(),

    onToggleSidebar: () =>
      setMobileSidebarOpen(
        (open) => !open
      ),

    onOpenSettings: () =>
      setSettingsOpen(true),

    onCloseModal: () => {
      setSettingsOpen(false);
      setMobileSidebarOpen(false);
    },
  });

  return (
    <div
      className="
        relative
        flex
        h-[100dvh]
        w-full
        overflow-hidden
        bg-[#f7f7f8]
        text-ink
        dark:bg-[#090b10]
        dark:text-paper
      "
    >
      {sidebarVisible && <Sidebar
        isMobileOpen={
          isMobileSidebarOpen
        }
        onCloseMobile={() =>
          setMobileSidebarOpen(
            false
          )
        }
        onSelectConversation={
          handleSelect
        }
        onOpenSettings={() =>
          setSettingsOpen(true)
        }
        onOpenAdminUsers={() => {
          setAdminUsersOpen(true);
          setWorkOpen(false);
          setMobileSidebarOpen(false);
        }}
        onOpenWork={() => {
          setWorkOpen(true);
          setSidebarVisible(false);
          setAdminUsersOpen(false);
          setMobileSidebarOpen(false);
        }}
        searchInputRef={
          searchInputRef
        }
      />}

      <main
        className="
          relative
          min-w-0
          min-h-0
          flex-1
          overflow-hidden
        "
      >
        {!sidebarVisible && (
          <button
            type="button"
            onClick={() => setSidebarVisible(true)}
            aria-label="Show sidebar"
            title="Show sidebar"
            className="absolute left-3 top-3 z-30 rounded-lg border border-white/15 bg-[#090b10] p-2 text-white/80 shadow-lg transition hover:bg-white/10 hover:text-white"
          >
            ☰
          </button>
        )}
        {adminUsersOpen ? (
          <UsersPage
            onBack={() =>
              setAdminUsersOpen(false)
            }
          />
        ) : workOpen ? (
          <WorkPanel onBack={() => setWorkOpen(false)} />
        ) : (
          <ChatWindow
            conversationId={
              activeId
            }
            onOpenSidebar={() =>
              setMobileSidebarOpen(
                true
              )
            }
          />
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() =>
          setSettingsOpen(false)
        }
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-1.5
          right-3
          z-20
          hidden
          text-[9px]
          text-black/30
          dark:text-white/25
          sm:block
        "
      >
        Made by Omar Hosny ·{' '}
        <a
          href="https://www.omarhosny.work.gd"
          target="_blank"
          rel="noopener noreferrer"
          className="
            pointer-events-auto
            transition
            hover:text-black/60
            hover:underline
            dark:hover:text-white/60
          "
        >
          www.omarhosny.work.gd
        </a>
      </div>
    </div>
  );
}