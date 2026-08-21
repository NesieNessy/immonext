'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Icons } from '@/components/ui';

export function HomeClient({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icons.Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
