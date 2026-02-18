import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface DiagramProps {
  title?: string;
  data: DataPoint[];
  type?: "bar" | "pie";
  className?: string;
}

export function Diagram({ title, data, type = "bar", className }: DiagramProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const defaultColors = ["#0f4c81", "#2d7a4f", "#d4a574", "#60a5fa", "#34d399"];

  if (type === "bar") {
    return (
      <div className={cn("p-6 bg-card border border-border rounded-lg", className)}>
        {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = item.color || defaultColors[index % defaultColors.length];
            
            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Pie chart (simplified representation)
  return (
    <div className={cn("p-6 bg-card border border-border rounded-lg", className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      <div className="flex items-center justify-center">
        <div className="w-48 h-48 relative">
          {/* Simple pie representation using grid */}
          <div className="grid grid-cols-2 gap-2 w-full h-full">
            {data.map((item, index) => {
              const color = item.color || defaultColors[index % defaultColors.length];
              const percentage = ((item.value / total) * 100).toFixed(1);
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-center rounded-lg p-3"
                  style={{ backgroundColor: color + "20", borderLeft: `4px solid ${color}` }}
                >
                  <div className="text-center">
                    <div className="text-xs text-foreground mb-1">{item.label}</div>
                    <div className="text-sm font-semibold" style={{ color }}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
