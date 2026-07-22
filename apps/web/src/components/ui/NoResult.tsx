import { BarChart2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface NoResultProps {
  title?: string;
  message?: string;
  className?: string;
  /** Optional action rendered below the message, e.g. a "reset filters" button. */
  action?: ReactNode;
}

/**
 * Placeholder shown in the result column / panel before a calculation has
 * been triggered. Reusable across any page that has a "result not yet
 * available" state.
 */
export function NoResult({
  title = 'Kein Ergebnis vorhanden',
  message = 'Füllen Sie alle Pflichtfelder aus, um die Ersteinschätzung automatisch zu erhalten.',
  className = '',
  action,
}: NoResultProps) {
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <BarChart2 className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{message}</p>
      </div>
      {action}
    </div>
  );
}
