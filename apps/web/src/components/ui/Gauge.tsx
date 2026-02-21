import { cn } from "@/lib/utils";

interface GaugeProps {
  title?: string;
  value: number;
  min: number;
  max: number;
  showLabels?: boolean;
  className?: string;
  height?: number;
}

export function Gauge({ 
  title, 
  value, 
  min, 
  max, 
  showLabels = true,
  className,
  height = 16
}: GaugeProps) {
  // Calculate position percentage
  const range = max - min;
  const position = ((value - min) / range) * 100;
  
  // Clamp position between 0 and 100
  const clampedPosition = Math.max(0, Math.min(100, position));
  
  // Removed unused getColorAtPosition function

  return (
    <div className={cn("p-6 bg-card border border-border rounded-lg", className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      
      <div className="relative">
        {/* Main gauge bar with gradient */}
        <div 
          className="relative rounded-full overflow-hidden"
          style={{ height: `${height}px` }}
        >
          {/* Three-color gradient background */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-[#2d7a4f]" style={{ width: '33.33%' }} />
            <div className="flex-1 bg-[#d4a574]" style={{ width: '33.33%' }} />
            <div className="flex-1 bg-[#ef4444]" style={{ width: '33.34%' }} />
          </div>
        </div>
        
        {/* Current value indicator (arrow) */}
        <div 
          className="absolute transition-all duration-300"
          style={{ 
            left: `${clampedPosition}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Arrow pointing down */}
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold text-foreground mb-1 bg-background px-2 py-0.5 rounded shadow-sm border border-border">
              {value}
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" className="drop-shadow">
              <path d="M6 0 L6 8 M6 8 L3 5 M6 8 L9 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
              />
            </svg>
          </div>
        </div>
        
        {/* Min and Max labels */}
        {showLabels && (
          <div className="flex justify-between mt-8 text-xs text-muted-foreground font-medium">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    </div>
  );
}
