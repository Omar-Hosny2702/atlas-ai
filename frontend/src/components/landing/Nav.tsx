import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/common/Logo';
import { NAV_LINKS } from './content';
import { ArrowUpRight } from './icons';

interface NavProps {
  onLogin: () => void;
  busy: boolean;
}

/** Fixed floating pill nav. Mobile: hamburger → stacked menu (aria-expanded; Esc / link click close). */
export function Nav({ onLogin, busy }: NavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) burger.current?.focus();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    const onResize = () => {
      if (window.innerWidth > 860) close();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  return (
    <header className={`lp-nav${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="lp-nav__bar" aria-label="Primary">
        <a href="#top" className="lp-brand" aria-label="Atlas AI — top of page">
          <Logo size={28} />
          Atlas<span>AI</span>
        </a>

        <div className="lp-nav__links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <button type="button" className="lp-btn lp-btn--primary lp-btn--sm lp-nav__cta" onClick={onLogin} disabled={busy}>
          Log in with Auth0 <ArrowUpRight />
        </button>

        <button
          ref={burger}
          type="button"
          className="lp-burger"
          aria-expanded={open}
          aria-controls="lp-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <i />
        </button>
      </nav>

      <div id="lp-menu" className={`lp-menu${open ? ' is-open' : ''}`}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => close()}>
            {l.label}
          </a>
        ))}
        <button
          type="button"
          className="lp-btn lp-btn--primary"
          onClick={() => {
            close();
            onLogin();
          }}
          disabled={busy}
        >
          Log in with Auth0 <ArrowUpRight />
        </button>
      </div>
    </header>
  );
}
