interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** The ImmoNext monogram — colors are baked into the artwork itself (brand
 *  blue + gold), so unlike the lucide icons it's used alongside, it doesn't
 *  pick up `text-*` color classes via `currentColor`. */
export function LogoMark({ size = 24, className }: LogoMarkProps) {
  const width = size * (422 / 256);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={size}
      viewBox="8 8 422 256"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="ImmoNext"
      className={className}
    >
      <rect x="22" y="90" width="36" height="161" fill="#224b96" />
      <circle cx="40" cy="45" r="20" fill="#224b96" />
      <path
        d="M93 251V165C93 120 119 92 153 92S214 120 214 165V251"
        fill="none"
        stroke="#daaa64"
        strokeWidth="35"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      <rect x="249.5" y="21" width="35" height="148" fill="#224b96" />
      <path
        fill="#224b96"
        fillRule="evenodd"
        d="M333 85.5 A83.5 83.5 0 1 1 332.999 252.5 A83.5 83.5 0 1 1 333 85.5 Z M333 120.5 A48.5 48.5 0 1 0 333.001 217.5 A48.5 48.5 0 1 0 333 120.5 Z"
      />
    </svg>
  );
}
