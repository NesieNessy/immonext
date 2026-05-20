"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function DetailCheckRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const quickCheckId = searchParams.get('quickCheckId');
    const suffix = quickCheckId ? `?quickCheckId=${quickCheckId}` : '';
    router.replace(`/property-valuation/detail-check/property-data${suffix}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Detailbewertung wird geöffnet...</p>
    </div>
  );
}

export default function DetailCheckPage() {
  return (
    <Suspense fallback={null}>
      <DetailCheckRedirect />
    </Suspense>
  );
}
