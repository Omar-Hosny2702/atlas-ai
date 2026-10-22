import type { CSSProperties, ReactNode } from 'react';
import { MODELS, PRESETS, SHORTCUTS, SUGGESTIONS } from './content';
import { LockIcon, PinIcon, SearchIcon } from './icons';

function Card({
  cls,
  delay,
  title,
  children,
  mock,
}: {
  cls: string;
  delay: number;
  title: string;
  children: ReactNode;
  mock: ReactNode;
}) {
  return (
    <article className={`lp-card ${cls}`} data-reveal style={{ '--d': `${delay}ms` } as CSSProperties}>
      <div className="lp-mock" aria-hidden="true">
        {mock}
      </div>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  );
}

/** Bento feature cards. Each carries a small mock UI that mirrors a real, existing feature. */
export function Bento() {
  return (
    <div className="lp-bento">
      <Card
        cls="lp-card--s7 lp-card--wide"
        delay={0}
        title="Token-by-token streaming"
        mock={
          <>
            <div className="lp-bub lp-bub--me">{SUGGESTIONS[0]}</div>
            <div className="lp-bub">
              <span className="lp-typing">
                <b />
                <b />
                <b />
              </span>
            </div>
            <div className="lp-stop">Stop generating</div>
          </>
        }
      >
        Multi-turn conversations with full context retained per chat, plus stop-generation and regenerate-response
        controls.
      </Card>

      <Card
        cls="lp-card--s5"
        delay={80}
        title="Stays on your own machine"
        mock={
          <>
            <div className="lp-lockbadge">
              <LockIcon />
            </div>
            <div className="lp-lockline">On your own machine</div>
          </>
        }
      >
        Atlas AI keeps every chat on your own machine.
      </Card>

      <Card
        cls="lp-card--s4"
        delay={0}
        title="Searchable history"
        mock={
          <>
            <div className="lp-search">
              <SearchIcon /> Search
            </div>
            <div className="lp-group">Pinned</div>
            <div className="lp-row lp-row--on">
              <PinIcon /> {SUGGESTIONS[2]}
            </div>
            <div className="lp-group">Today</div>
            <div className="lp-row">
              <span className="lp-dot" /> {SUGGESTIONS[3]}
            </div>
          </>
        }
      >
        Sidebar with searchable conversation history, grouped by date, with pinning. Rename and delete conversations.
      </Card>

      <Card
        cls="lp-card--s4"
        delay={80}
        title="Markdown & code"
        mock={
          <div className="lp-code">
            <span className="lp-copy">Copy</span>
            <em>import</em> os{'\n'}
            {'\n'}
            <em>for</em> name <em>in</em> os.listdir(<u>"."</u>):{'\n'}
            {'    '}os.rename(name, <s>new_name</s>)
          </div>
        }
      >
        Markdown rendering with GFM (tables, task lists, etc.) and syntax-highlighted code blocks with a one-click copy
        button.
      </Card>

      <Card
        cls="lp-card--s4"
        delay={160}
        title="Tune every chat"
        mock={
          <>
            <div className="lp-chips">
              {PRESETS.map((p, i) => (
                <span key={p} className={`lp-pill${i === 1 ? ' lp-pill--on' : ''}`}>
                  {p}
                </span>
              ))}
            </div>
            {[
              ['Temperature', '58%'],
              ['Top-p', '82%'],
              ['Max tokens', '36%'],
            ].map(([label, v]) => (
              <div key={label} className="lp-slider" style={{ '--v': v } as CSSProperties}>
                <span>{label}</span>
                <i />
              </div>
            ))}
          </>
        }
      >
        Per-conversation system prompt, temperature, top-p, and max-token controls, plus a small library of system
        prompt presets.
      </Card>

      <Card
        cls="lp-card--s4"
        delay={0}
        title="Open-source models"
        mock={
          <>
            {MODELS.map((m, i) => (
              <div key={m} className={`lp-row${i === 0 ? ' lp-row--on' : ''}`}>
                <span className="lp-dot" /> {m} <small>Ollama</small>
              </div>
            ))}
          </>
        }
      >
        Any model served by Ollama (Llama 3.1, Mistral, Qwen 2.5, Gemma 2, Phi-3, …).
      </Card>

      <Card
        cls="lp-card--s4"
        delay={80}
        title="Export & import"
        mock={
          <>
            {[
              ['MD', 'Markdown'],
              ['TXT', 'Plain text'],
              ['JSON', 'JSON'],
            ].map(([ext, label]) => (
              <div key={ext} className="lp-file">
                <b>{ext}</b> {label} <small>Export</small>
              </div>
            ))}
          </>
        }
      >
        Export any conversation as Markdown, plain text, or JSON. Import conversations from a previously exported JSON
        file.
      </Card>

      <Card
        cls="lp-card--s4 lp-card--wide"
        delay={160}
        title="Keyboard shortcuts"
        mock={
          <>
            {SHORTCUTS.map(([label, keys]) => (
              <div key={label} className="lp-kbdrow">
                <span>{label}</span>
                <kbd className="lp-kbd">{keys}</kbd>
              </div>
            ))}
          </>
        }
      >
        New chat, focus search, toggle sidebar, open settings.
      </Card>
    </div>
  );
}
