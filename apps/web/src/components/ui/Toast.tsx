"use client";

import { Icons } from "@/components/common";
import { cn } from "@/lib/utils";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg bg-card animate-in fade-in slide-in-from-top-2",
              toast.variant === "success" ? "border-success/30" : "border-destructive/30"
            )}
          >
            {toast.variant === "success" ? (
              <Icons.CheckCircle2 className="w-4 h-4 shrink-0 text-success mt-0.5" />
            ) : (
              <Icons.AlertTriangle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
            )}
            <p className="text-sm text-foreground flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Schließen"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
