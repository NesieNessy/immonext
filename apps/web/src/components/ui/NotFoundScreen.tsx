import { LogoMark } from "@/components/common/LogoMark";
import { cn } from "@/lib/utils";

interface NotFoundScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/** The app-wide "couldn't find that" state — used when a route's id doesn't
 *  resolve to a real record (deleted, wrong id, no access). Uses the same
 *  mark as LoadingScreen, recolored red so the two states read as clearly
 *  distinct at a glance. */
export function NotFoundScreen({ message = "Objekt nicht gefunden", fullScreen = true, className }: NotFoundScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "min-h-screen bg-background" : "py-16",
        className
      )}
    >
      <LogoMark size={48} tone="currentColor" className="text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
