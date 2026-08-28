import { Icons } from "@/components/common";
import { cn } from "@/lib/utils";

interface NotFoundScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/** The app-wide "couldn't find that" state — used when a route's id doesn't
 *  resolve to a real record (deleted, wrong id, no access). */
export function NotFoundScreen({ message = "Objekt nicht gefunden", fullScreen = true, className }: NotFoundScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "min-h-screen bg-background" : "py-16",
        className
      )}
    >
      <Icons.SearchX className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
