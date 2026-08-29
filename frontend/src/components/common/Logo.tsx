interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({
  size = 28,
  className,
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Atlas AI"
    >
      <defs>
        <linearGradient
          id="atlas-gradient"
          x1="10"
          y1="8"
          x2="54"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#38BDF8"
          />

          <stop
            offset="48%"
            stopColor="#6366F1"
          />

          <stop
            offset="100%"
            stopColor="#A855F7"
          />
        </linearGradient>

        <filter
          id="atlas-glow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur
            stdDeviation="2.5"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer diamond */}
      <path
        d="
          M32 5
          L57 32
          L32 59
          L7 32
          Z
        "
        fill="none"
        stroke="url(#atlas-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
        filter="url(#atlas-glow)"
      />

      {/* Inner Atlas mark */}
      <path
        d="
          M32 17
          L44 43
          L32 36
          L20 43
          Z
        "
        fill="none"
        stroke="url(#atlas-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Centre point */}
      <circle
        cx="32"
        cy="32"
        r="3"
        fill="#E0F2FE"
      />
    </svg>
  );
}