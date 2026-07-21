import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps a scroll container pinned to the bottom while `dep` changes (e.g. on
 * every streamed token), but stops auto-scrolling the moment the user
 * manually scrolls up — so they can read earlier text without the view
 * yanking back down. Returns a ref for the container and whether we're
 * currently pinned to the bottom (used to show a "jump to latest" button).
 */
export function useAutoScroll<T extends HTMLElement>(dep: unknown) {
  const containerRef = useRef<T | null>(null);
  const [pinnedToBottom, setPinnedToBottom] = useState(true);
  const userScrolledRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    userScrolledRef.current = false;
    setPinnedToBottom(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distanceFromBottom < 48;
      userScrolledRef.current = !atBottom;
      setPinnedToBottom(atBottom);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledRef.current) {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);

  return { containerRef, pinnedToBottom, scrollToBottom };
}
