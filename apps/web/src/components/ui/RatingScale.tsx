import React from 'react';
import { cn } from '@/lib/utils';

interface RatingScaleProps {
  /** 0 = best (green left), 1 = worst (red right) */
  value: number;
  label?: string;
  className?: string;
}

/**
 * A horizontal green→red gradient scale with a tooltip marker
 * positioned at `value` (0 = best / leftmost, 1 = worst / rightmost).
 */
export function RatingScale({ value, label, className }: RatingScaleProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  const percent = clampedValue * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Scale bar */}
      <div className="relative h-8 w-full rounded-full overflow-visible">
        {/* Gradient track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'linear-gradient(to right, var(--success), var(--warning), var(--destructive))',
          }}
        />

        {/* Marker + tooltip */}
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${percent}%` }}
        >
          {/* Tooltip */}
          {label && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded border border-border shadow-md">
                {label}
              </div>
              {/* Arrow */}
              <div className="w-2 h-2 bg-popover border-b border-r border-border rotate-45 mx-auto -mt-[5px]" />
            </div>
          )}
          {/* Marker line */}
          <div className="w-0.5 h-8 bg-white shadow-md" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">Ausgezeichnet</span>
        <span className="text-xs text-muted-foreground">Schlecht</span>
      </div>
    </div>
  );
}
