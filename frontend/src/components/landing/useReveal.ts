import { useEffect, type RefObject } from 'react';

/**
 * Scroll-reveal: fade + slide up for every [data-reveal] inside `root`.
 * Arms the hidden state only once JS is running (adds `lp--ready`), so a failed script never leaves
 * content invisible. Reduced motion (or no IntersectionObserver) shows everything immediately.
 */
export function useReveal(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    el.classList.add('lp--ready');

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [root]);
}
