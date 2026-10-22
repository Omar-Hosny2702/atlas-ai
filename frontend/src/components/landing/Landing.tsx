import { useRef, type CSSProperties } from 'react';
import { Logo } from '@/components/common/Logo';
import { Bento } from './Bento';
import { HeroVisual } from './HeroVisual';
import { Nav } from './Nav';
import { ArrowUpRight, DevicesIcon, PwaIcon, ThemeIcon } from './icons';
import {
  CREATOR_EMAIL,
  CREATOR_SITE,
  CREATOR_SITE_LABEL,
  DESCRIPTION,
  MARQUEE,
  STEPS,
  SUPPORT_EMAIL,
} from './content';
import { useReveal } from './useReveal';

interface LandingProps {
  onLogin: () => void;
  busy: boolean;
  error: string | null;
  message: string;
}

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export function Landing({ onLogin, busy, error, message }: LandingProps) {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  const login = (
    <button type="button" className="lp-btn lp-btn--primary" onClick={onLogin} disabled={busy}>
      Log in with Auth0 <ArrowUpRight />
    </button>
  );

  return (
    <div className="lp" id="top" ref={root}>
      <Nav onLogin={onLogin} busy={busy} />

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-wrap">
            <span className="lp-eyebrow" data-reveal>
              <span className="lp-ping" aria-hidden="true" />
              Private chat assistant
            </span>
            <h1 className="lp-display lp-h1" data-reveal style={d(80)}>
              What are you <span className="lp-hl">charting</span> today?
            </h1>
            <p className="lp-lead" data-reveal style={d(160)}>
              {DESCRIPTION}
            </p>
            <div className="lp-cta-row" data-reveal style={d(240)}>
              {login}
              <a className="lp-btn lp-btn--ghost" href="#features">
                See what’s inside
              </a>
            </div>
            <p className="lp-note" data-reveal style={d(300)}>
              {message}
            </p>
            {error && (
              <p className="lp-error" role="alert">
                {error}
              </p>
            )}
            <HeroVisual />
          </div>
        </section>

        {/* ── Marquee ────────────────────────────────────────── */}
        <div className="lp-marquee-wrap" aria-hidden="true">
          <div className="lp-marquee">
            <div className="lp-marquee__track">
              {[0, 1].map((g) => (
                <div className="lp-marquee__group" key={g}>
                  {MARQUEE.map((t) => (
                    <span key={t} className="lp-marquee__item">
                      {t}
                      <span className="lp-marquee__sep"> ✦ </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Features ───────────────────────────────────────── */}
        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-head" data-reveal>
              <span className="lp-kicker">Features</span>
              <h2 className="lp-display lp-h2">
                What’s inside <span className="lp-hl">Atlas AI</span>
              </h2>
            </div>
            <Bento />
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section className="lp-section" id="how">
          <div className="lp-wrap">
            <div className="lp-head" data-reveal>
              <span className="lp-kicker">How it works</span>
              <h2 className="lp-display lp-h2">
                Three <span className="lp-hl">steps</span>
              </h2>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="lp-step" data-reveal style={d(i * 100)}>
                  <div className="lp-step__n" aria-hidden="true">
                    {i + 1}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>

            <div className="lp-teasers">
              {[
                { icon: <PwaIcon />, t: 'Installable app', b: 'Installable Progressive Web App with an offline app shell.' },
                { icon: <ThemeIcon />, t: 'Light and dark mode', b: 'Light and dark mode — remembers your choice.' },
                { icon: <DevicesIcon />, t: 'Desktop, tablet and mobile', b: 'A responsive layout for desktop, tablet, and mobile.' },
              ].map((x, i) => (
                <div key={x.t} className="lp-teaser" data-reveal style={d(i * 100)}>
                  <span className="lp-teaser__icon">{x.icon}</span>
                  <div>
                    <h3>{x.t}</h3>
                    <p>{x.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA block ──────────────────────────────────────── */}
        <section className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-wrap">
            <div className="lp-cta" data-reveal>
              <span className="lp-cta__ring lp-cta__ring--1" aria-hidden="true" />
              <span className="lp-cta__ring lp-cta__ring--2" aria-hidden="true" />
              <h2 className="lp-display">
                Where to <span className="lp-hl">next</span>?
              </h2>
              <p>{message}</p>
              <div className="lp-cta-row">
                {login}
                <a className="lp-btn lp-btn--ghost" href={`mailto:${SUPPORT_EMAIL}`}>
                  Support &amp; updates
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Creator ────────────────────────────────────────── */}
        <section className="lp-section" id="about">
          <div className="lp-wrap lp-about">
            <div className="lp-about__art" data-reveal aria-hidden="true">
              <span className="lp-about__ring lp-about__ring--1" />
              <span className="lp-about__ring lp-about__ring--2" />
              <div className="lp-about__card">
                <div className="lp-mark">
                  <Logo size="100%" />
                </div>
              </div>
              <span className="lp-monogram">OH</span>
            </div>
            <div data-reveal style={d(120)}>
              <span className="lp-kicker">Creator</span>
              <h2 className="lp-display lp-h2">
                Made by <span className="lp-hl">Omar Hosny</span>
              </h2>
              <div className="lp-about__links">
                <a className="lp-link" href={CREATOR_SITE} target="_blank" rel="noopener noreferrer">
                  <small>Website</small>
                  <span>{CREATOR_SITE_LABEL}</span>
                </a>
                <a className="lp-link" href={`mailto:${CREATOR_EMAIL}`}>
                  <small>Creator</small>
                  <span>{CREATOR_EMAIL}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="lp-footer" id="contact">
        <div className="lp-wrap">
          <div className="lp-footer__grid">
            <div>
              <a href="#top" className="lp-brand">
                <Logo size={28} />
                Atlas<span>AI</span>
              </a>
              <p className="lp-footer__about">{DESCRIPTION}</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#how">How it works</a>
                </li>
                <li>
                  <a href="#about">Creator</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li>
                  Support &amp; updates
                  <br />
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </li>
                <li>
                  Creator
                  <br />
                  <a href={`mailto:${CREATOR_EMAIL}`}>{CREATOR_EMAIL}</a>
                </li>
                <li>
                  <a href={CREATOR_SITE} target="_blank" rel="noopener noreferrer">
                    {CREATOR_SITE_LABEL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="lp-legal">
            Made by Omar Hosny · © 2026 Omar Hosny. All rights reserved.
          </p>
        </div>
        <div className="lp-wordmark" aria-hidden="true">
          <span>Atlas</span>
        </div>
      </footer>
    </div>
  );
}
