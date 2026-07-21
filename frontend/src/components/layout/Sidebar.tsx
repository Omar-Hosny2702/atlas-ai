import { forwardRef, type RefObject } from 'react';
import { Moon, Settings, Sun, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { IconButton } from '@/components/common/IconButton';
import { NewChatButton } from '@/components/sidebar/NewChatButton';
import { SearchBar } from '@/components/sidebar/SearchBar';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { useConversations } from '@/context/ConversationContext';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectConversation: (id: string) => void;
  onOpenSettings: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { isMobileOpen, onCloseMobile, onSelectConversation, onOpenSettings, searchInputRef },
  ref
) {
  const { searchQuery, setSearchQuery, createNewConversation, selectConversation } =
    useConversations();
  const { theme, toggleTheme } = useTheme();

  const handleNewChat = async () => {
    const id = await createNewConversation();
    if (id) {
      onSelectConversation(id);
      selectConversation(id);
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-30 md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        ref={ref}
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-72 shrink-0
          flex flex-col border-r border-border-light dark:border-border-dark
          bg-paper dark:bg-ink
          transition-transform duration-200 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="Conversation history"
      >
        <div className="flex items-center justify-between gap-2 px-3.5 pt-4 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Logo size={26} />
            <span className="font-display font-semibold text-sm truncate">Atlas AI</span>
          </div>
          <IconButton label="Close sidebar" onClick={onCloseMobile} className="md:hidden">
            <X size={16} />
          </IconButton>
        </div>

        <div className="px-3 flex flex-col gap-2.5">
          <NewChatButton onClick={handleNewChat} />
          <SearchBar ref={searchInputRef} value={searchQuery} onChange={setSearchQuery} />
        </div>

        <nav className="grow overflow-y-auto scrollbar-thin px-3 mt-4 pb-3">
          <ConversationList onSelect={onSelectConversation} />
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-border-light dark:border-border-dark px-3.5 py-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-sm font-medium text-muted-light dark:text-muted-dark hover:text-ink dark:hover:text-paper transition-colors"
          >
            <Settings size={16} />
            Settings
          </button>
          <IconButton
            label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            size="sm"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </IconButton>
        </div>
      </aside>
    </>
  );
});
