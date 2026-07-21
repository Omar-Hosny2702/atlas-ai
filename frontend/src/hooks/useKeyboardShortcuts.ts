import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewChat?: () => void;
  onFocusSearch?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onCloseModal?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Global keyboard shortcuts:
 *  - Cmd/Ctrl+K — new chat
 *  - Cmd/Ctrl+/ — focus search
 *  - Cmd/Ctrl+B — toggle sidebar
 *  - Cmd/Ctrl+, — open settings
 *  - Escape     — close whatever modal/panel is open
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') {
        handlers.onCloseModal?.();
        return;
      }

      if (!meta) return;

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onNewChat?.();
      } else if (e.key === '/') {
        e.preventDefault();
        handlers.onFocusSearch?.();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handlers.onToggleSidebar?.();
      } else if (e.key === ',') {
        e.preventDefault();
        handlers.onOpenSettings?.();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}

export { isTypingTarget };
