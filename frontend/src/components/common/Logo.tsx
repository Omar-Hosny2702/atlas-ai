import clsx from 'clsx';

interface LogoProps {
  size?: number | string;
  className?: string;
  /** Adds a slow highlight travelling along the orbit (loading states). Static by default. */
  animated?: boolean;
}

const A_PATH = 'M9 54 L28.2 9 H35.8 L55 54 H46.4 L32 20.4 L17.6 54 Z';
const ORBIT_BACK = 'M9.18 47.42 A24 8 -18 0 1 54.82 32.58';
const ORBIT_FRONT = 'M9.18 47.42 A24 8 -18 0 0 54.82 32.58';

// Accent comes from --atlas-accent (set per theme in atlas.css); the fallback keeps the mark
// correct even if the stylesheet is missing. The "A" uses currentColor so it follows text colour.
const ACCENT = 'var(--atlas-accent, #53d3ee)';

/**
 * Atlas mark: an angular "A" whose crossbar is an orbital path with a single node.
 * The orbit's back arc runs behind the letter (dimmed) and its front arc in front of it, which gives
 * depth without gradients or filters and keeps the mark legible at 16px.
 */
export function Logo({ size = 28, className, animated = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={clsx('atlas-mark', className)}
      role="img"
      aria-label="Atlas AI"
    >
      <path d={ORBIT_BACK} fill="none" strokeWidth="2.6" style={{ stroke: ACCENT, strokeOpacity: 0.38 }} />
      <path d={A_PATH} fill="currentColor" />
      <path d={ORBIT_FRONT} fill="none" strokeWidth="2.6" strokeLinecap="round" style={{ stroke: ACCENT }} />
      {animated && (
        <path
          className="atlas-mark__sweep"
          d={ORBIT_FRONT}
          pathLength={100}
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          stroke="currentColor"
          strokeOpacity="0.85"
        />
      )}
      <circle cx="54.82" cy="32.58" r="3.6" style={{ fill: ACCENT }} />
    </svg>
  );
}

/** "Atlas" wordmark. Weight and tone separate "AI" from the name; no extra colour. */
export function AtlasWordmark({ className, withAI = true }: { className?: string; withAI?: boolean }) {
  return (
    <span className={clsx('font-display font-semibold tracking-tight', className)}>
      Atlas
      {withAI && <span className="ml-1 font-medium opacity-65">AI</span>}
    </span>
  );
}
