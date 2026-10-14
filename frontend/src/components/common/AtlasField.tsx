import { useEffect, useRef, type CSSProperties } from 'react';
import { Logo } from './Logo';

interface AtlasFieldProps {
  /** px number or any CSS length, e.g. "clamp(140px, 22vh, 220px)" */
  size?: number | string;
  className?: string;
}

const RINGS = [
  { d: '100%', z: '-22px', t: '46s', dir: 'normal' },
  { d: '72%', z: '0px', t: '30s', dir: 'reverse' },
  { d: '46%', z: '22px', t: '19s', dir: 'normal' },
] as const;

/**
 * Decorative CSS-3D centrepiece: three tilted orbit rings at different depths around the Atlas mark.
 *  - transform-only animation (no WebGL, no new dependencies)
 *  - subtle pointer parallax, only on fine-pointer devices
 *  - paused when off-screen or the tab is hidden
 *  - fully static under prefers-reduced-motion (see atlas.css)
 * Purely decorative: aria-hidden, no pointer events.
 */
export function AtlasField({ size = 260, className }: AtlasFieldProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    let raf = 0;
    let nx = 0;
    let ny = 0;
    let visible = true;

    const applyTilt = () => {
      raf = 0;
      el.style.setProperty('--af-ry', `${(nx * 7).toFixed(2)}deg`);
      el.style.setProperty('--af-rx', `${(-ny * 5).toFixed(2)}deg`);
    };
    const onMove = (e: PointerEvent) => {
      nx = (e.clientX / window.innerWidth - 0.5) * 2;
      ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(applyTilt);
    };
    const syncActive = () => {
      el.dataset.active = String(visible && !document.hidden && !reduce.matches);
    };
    const bindPointer = () => {
      window.removeEventListener('pointermove', onMove);
      if (!reduce.matches && finePointer.matches) {
        window.addEventListener('pointermove', onMove, { passive: true });
      } else {
        el.style.removeProperty('--af-ry');
        el.style.removeProperty('--af-rx');
      }
      syncActive();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncActive();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', syncActive);
    reduce.addEventListener('change', bindPointer);
    finePointer.addEventListener('change', bindPointer);
    bindPointer();

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', syncActive);
      reduce.removeEventListener('change', bindPointer);
      finePointer.removeEventListener('change', bindPointer);
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const style = { '--af-size': typeof size === 'number' ? `${size}px` : size } as CSSProperties;

  return (
    <div ref={ref} className={`atlas-field ${className ?? ''}`} style={style} aria-hidden="true" data-active="false">
      <div className="atlas-field__scene">
        <div className="atlas-field__plane">
          {RINGS.map((r) => (
            <div
              key={r.d}
              className="atlas-field__ring"
              style={{ '--d': r.d, '--z': r.z, '--t': r.t, '--dir': r.dir } as CSSProperties}
            >
              <span className="atlas-field__node" />
            </div>
          ))}
        </div>
        <div className="atlas-field__core text-ink dark:text-paper">
          <Logo size="38%" className="block" />
        </div>
      </div>
    </div>
  );
}
