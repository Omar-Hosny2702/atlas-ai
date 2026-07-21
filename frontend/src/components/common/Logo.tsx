interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * The signature element referenced throughout the UI: concentric contour
 * lines around a summit marker, echoing a topographic map — "Atlas" charting
 * a conversation the way a map charts unfamiliar terrain.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Atlas AI"
    >
      <rect width="64" height="64" rx="14" className="fill-ink dark:fill-ink-raised" />
      <path
        d="M 20 30 A 12 10 0 0 1 44 30"
        fill="none"
        className="stroke-accent-500 dark:stroke-accent-600"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M 16 34 A 16 14 0 0 1 48 34"
        fill="none"
        stroke="#2DD4A8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 12 38 A 20 17 0 0 1 52 38"
        fill="none"
        stroke="#2DD4A8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polygon points="32,20 38,33 32,37 26,33" fill="#D8B54C" />
    </svg>
  );
}
