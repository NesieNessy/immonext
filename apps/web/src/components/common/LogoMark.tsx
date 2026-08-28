interface LogoMarkProps {
  /** string | number to match lucide's icon prop signature — the iconMap
   *  it's swapped into alongside those icons needs one shared component type. */
  size?: number | string;
  className?: string;
}

/** The ImmoNext monogram (public/logo-mark.svg) — colors are baked into the
 *  artwork itself (brand blue + gold), so unlike the lucide icons it's used
 *  alongside, it doesn't pick up `text-*` color classes via `currentColor`. */
export function LogoMark({ size = 24, className }: LogoMarkProps) {
  const numericSize = typeof size === 'number' ? size : parseFloat(size) || 24;
  const width = numericSize * (1688 / 1024);
  return (
    <img
      src="/logo-mark.svg"
      alt="ImmoNext"
      width={width}
      height={numericSize}
      className={className}
    />
  );
}
