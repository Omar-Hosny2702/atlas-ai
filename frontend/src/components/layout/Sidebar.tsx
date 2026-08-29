import { forwardRef, type RefObject } from 'react';
import {
  ChevronDown,
  Search,
  Settings,
  X,
} from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { IconButton } from '@/components/common/IconButton';
import { ConversationList } from '@/components/sidebar/ConversationList';

import { useConversations } from '@/context/ConversationContext';
import { useAuth } from '@/auth/AuthContext';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectConversation: (id: string) => void;
  onOpenSettings: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  function Sidebar(
    {
      isMobileOpen,
      onCloseMobile,
      onSelectConversation,
      onOpenSettings,
      searchInputRef,
    },
    ref
  ) {
    const {
      searchQuery,
      setSearchQuery,
      createNewConversation,
      selectConversation,
    } = useConversations();

    const { session } = useAuth();

    const user = session?.user;

    const displayName =
      user?.name ||
      user?.email?.split('@')[0] ||
      'Account';

    const initials = displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

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
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}

        <aside
          ref={ref}
          aria-label="Conversation history"
          className={`
            fixed inset-y-0 left-0 z-40
            flex w-[300px] shrink-0 flex-col
            border-r border-white/10
            bg-[#080a0f]
            text-white
            transition-transform duration-200 ease-out
            md:static
            ${isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Atlas header */}
          <div className="flex items-center justify-between px-5 pb-4 pt-5">
            <div className="flex min-w-0 items-center gap-3">
              <Logo size={30} />

              <span className="truncate font-display text-lg font-semibold">
                Atlas AI
              </span>
            </div>

            <IconButton
              label="Close sidebar"
              onClick={onCloseMobile}
              className="md:hidden"
            >
              <X size={18} />
            </IconButton>
          </div>

          {/* Search */}
          <div className="px-4">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
              />

              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search chats..."
                className="
                  h-11 w-full
                  rounded-xl
                  border border-white/10
                  bg-white/[0.04]
                  pl-10 pr-4
                  text-sm text-white
                  outline-none
                  placeholder:text-white/35
                  transition
                  focus:border-white/20
                  focus:bg-white/[0.06]
                "
              />
            </div>
          </div>

          {/* New chat */}
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={handleNewChat}
              className="
                flex h-11 w-full
                items-center justify-center gap-2
                rounded-xl
                bg-accent-500
                px-4
                text-sm font-semibold text-white
                transition
                hover:bg-accent-600
                active:scale-[0.99]
              "
            >
              <span className="text-xl font-light leading-none">
                +
              </span>

              New chat
            </button>
          </div>

          {/* Chats */}
          <nav
            className="
              mt-4 grow
              overflow-y-auto
              px-3 pb-4
              scrollbar-thin
            "
          >
            <ConversationList
              onSelect={onSelectConversation}
            />
          </nav>

          {/* Bottom account area */}
          <div className="border-t border-white/10">
            <button
              type="button"
              onClick={onOpenSettings}
              className="
                flex w-full items-center gap-3
                px-5 py-3.5
                text-sm text-white/75
                transition
                hover:bg-white/[0.05]
                hover:text-white
              "
            >
              <Settings size={18} />

              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="
                flex w-full items-center gap-3
                border-t border-white/10
                px-4 py-4
                text-left
                transition
                hover:bg-white/[0.05]
              "
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-accent-500
                    text-sm font-semibold text-white
                  "
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 grow">
                <p className="truncate text-sm font-medium text-white">
                  {displayName}
                </p>

                {user?.email && (
                  <p className="truncate text-xs text-white/45">
                    {user.email}
                  </p>
                )}
              </div>

              <ChevronDown
                size={16}
                className="shrink-0 text-white/45"
              />
            </button>
          </div>
        </aside>
      </>
    );
  }
);