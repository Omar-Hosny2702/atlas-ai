import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * Keeps the conversation following the newest
 * content while the user is near the bottom.
 *
 * If the user manually scrolls upward, Atlas
 * stops following until they return to the
 * bottom or press "Jump to latest".
 *
 * ResizeObserver is important for images:
 * an image can increase the message height
 * after it finishes loading without React
 * changing the message itself.
 */
export function useAutoScroll<
  T extends HTMLElement
>(
  dep: unknown
) {
  const containerRef =
    useRef<T | null>(
      null
    );

  const [
    pinnedToBottom,
    setPinnedToBottom,
  ] =
    useState(true);

  const userScrolledRef =
    useRef(false);

  const scrollToBottom =
    useCallback(
      (
        behavior:
          ScrollBehavior =
          'auto'
      ) => {
        const el =
          containerRef.current;

        if (!el) {
          return;
        }

        userScrolledRef.current =
          false;

        setPinnedToBottom(
          true
        );

        el.scrollTo({
          top:
            el.scrollHeight,
          behavior,
        });
      },
      []
    );

  /*
   * Detect manual scrolling.
   */
  useEffect(
    () => {
      const el =
        containerRef.current;

      if (!el) {
        return;
      }

      const handleScroll =
        () => {
          const distanceFromBottom =
            el.scrollHeight -
            el.scrollTop -
            el.clientHeight;

          const atBottom =
            distanceFromBottom <
            80;

          userScrolledRef.current =
            !atBottom;

          setPinnedToBottom(
            atBottom
          );
        };

      el.addEventListener(
        'scroll',
        handleScroll,
        {
          passive: true,
        }
      );

      handleScroll();

      return () => {
        el.removeEventListener(
          'scroll',
          handleScroll
        );
      };
    },
    []
  );

  /*
   * Follow React message updates such as
   * new messages and streamed text.
   */
  useEffect(
    () => {
      if (
        userScrolledRef.current
      ) {
        return;
      }

      const frame =
        requestAnimationFrame(
          () => {
            const el =
              containerRef.current;

            if (!el) {
              return;
            }

            el.scrollTo({
              top:
                el.scrollHeight,
              behavior:
                'auto',
            });
          }
        );

      return () =>
        cancelAnimationFrame(
          frame
        );
    },
    [
      dep,
    ]
  );

  /*
   * Follow layout changes that happen without
   * a React message update — especially images
   * finishing loading and expanding in height.
   */
  useEffect(
    () => {
      const el =
        containerRef.current;

      if (
        !el ||
        typeof ResizeObserver ===
          'undefined'
      ) {
        return;
      }

      const content =
        el.firstElementChild;

      if (!content) {
        return;
      }

      const observer =
        new ResizeObserver(
          () => {
            if (
              userScrolledRef.current
            ) {
              return;
            }

            el.scrollTo({
              top:
                el.scrollHeight,
              behavior:
                'auto',
            });
          }
        );

      observer.observe(
        content
      );

      return () => {
        observer.disconnect();
      };
    },
    []
  );

  return {
    containerRef,
    pinnedToBottom,
    scrollToBottom,
  };
}
