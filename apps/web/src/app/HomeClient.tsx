'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui';

export function HomeClient({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
