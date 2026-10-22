import { useEffect, useRef } from 'react';
import { CHIPS } from './content';

/**
 * Hero stage: an original glass planet-bot character, three tilted orbit rings with
 * glowing satellites, and four floating glass chips. SVG + CSS only.
 * Eyes follow the mouse pointer (mouse only, clamped); touch and pen input are ignored.
 */
export function HeroVisual() {
  const charRef = useRef<HTMLDivElement>(null);
  const pupilL = useRef<SVGGElement>(null);
  const pupilR = useRef<SVGGElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const MAX_X = 6;
    const MAX_Y = 7;
    let raf = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      raf = 0;
      const t = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      if (pupilL.current) pupilL.current.style.transform = t;
      if (pupilR.current) pupilR.current.style.transform = t;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reduce.matches || !charRef.current) return;
      const r = charRef.current.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.5);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 280); // clamp: full deflection at 280px or more
      tx = (dx / dist) * k * MAX_X;
      ty = (dy / dist) * k * MAX_Y;
      schedule();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      schedule();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lp-stage" data-reveal style={{ ['--d' as string]: '150ms' }}>
      {/* orbit rings: wrapper = tilt (rotate + scaleY), inner = spin */}
      <div className="lp-ring lp-ring--a" aria-hidden="true">
        <div className="lp-ring__spin">
          <span className="lp-ring__dot" />
        </div>
      </div>
      <div className="lp-ring lp-ring--b" aria-hidden="true">
        <div className="lp-ring__spin">
          <span className="lp-ring__dot" />
        </div>
      </div>
      <div className="lp-ring lp-ring--c" aria-hidden="true">
        <div className="lp-ring__spin">
          <span className="lp-ring__dot" />
        </div>
      </div>

      <div className="lp-hero__char" ref={charRef}>
        <svg className="lp-char" viewBox="0 0 400 400" role="img" aria-label="Atlas AI mascot, a friendly glass planet-bot">
          <defs>
            <radialGradient id="lp-body" cx="34%" cy="26%" r="85%">
              <stop offset="0" stopColor="#24527a" />
              <stop offset="0.55" stopColor="#12294a" />
              <stop offset="1" stopColor="#0a1627" />
            </radialGradient>
            <radialGradient id="lp-cheek" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#67e8f9" stopOpacity="0.45" />
              <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
            </radialGradient>
            <clipPath id="lp-visor-clip">
              <rect x="108" y="168" width="184" height="104" rx="52" />
            </clipPath>
          </defs>

          {/* ground shadow */}
          <ellipse cx="200" cy="372" rx="104" ry="14" fill="#000" opacity="0.55" />

          {/* antenna */}
          <path d="M200 84V54" stroke="#22b8cf" strokeWidth="6" strokeLinecap="round" />
          <circle className="lp-char__sun" cx="200" cy="46" r="11" fill="#ffd98a" />
          <circle cx="200" cy="46" r="18" fill="#ffd98a" opacity="0.22" />

          {/* side nubs */}
          <rect x="50" y="196" width="26" height="62" rx="13" fill="#22b8cf" />
          <rect x="324" y="196" width="26" height="62" rx="13" fill="#22b8cf" />

          {/* body */}
          <circle cx="200" cy="222" r="138" fill="url(#lp-body)" stroke="#67e8f9" strokeOpacity="0.55" strokeWidth="3" />
          <ellipse cx="146" cy="130" rx="54" ry="26" fill="#fff" opacity="0.09" transform="rotate(-24 146 130)" />

          {/* orbit band across the belly (echoes the Atlas mark) */}
          <path d="M72 292A132 34 -10 0 0 328 306" fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          <circle cx="328" cy="306" r="7" fill="#67e8f9" />

          {/* visor */}
          <rect x="108" y="168" width="184" height="104" rx="52" fill="#050a13" stroke="#67e8f9" strokeOpacity="0.4" strokeWidth="2" />
          <g clipPath="url(#lp-visor-clip)">
            <circle cx="130" cy="246" r="26" fill="url(#lp-cheek)" />
            <circle cx="270" cy="246" r="26" fill="url(#lp-cheek)" />
          </g>

          {/* eyes: socket blinks, pupil follows the pointer */}
          <g className="lp-char__eye">
            <ellipse cx="162" cy="214" rx="19" ry="24" fill="#0f2236" />
            <g className="lp-char__pupil" ref={pupilL}>
              <circle cx="162" cy="214" r="11" fill="#67e8f9" />
              <circle cx="158" cy="209" r="3.6" fill="#f2f7ff" />
            </g>
          </g>
          <g className="lp-char__eye lp-char__eye--r">
            <ellipse cx="238" cy="214" rx="19" ry="24" fill="#0f2236" />
            <g className="lp-char__pupil" ref={pupilR}>
              <circle cx="238" cy="214" r="11" fill="#67e8f9" />
              <circle cx="234" cy="209" r="3.6" fill="#f2f7ff" />
            </g>
          </g>

          {/* smile */}
          <path d="M184 252Q200 264 216 252" fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {CHIPS.map((text, i) => (
        <div key={text} className={`lp-chip lp-chip--${i + 1}`}>
          <i aria-hidden="true" />
          {text}
        </div>
      ))}
    </div>
  );
}
