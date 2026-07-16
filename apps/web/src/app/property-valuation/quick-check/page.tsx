"use client";

import type { QuickCheckEntry } from '@/components/features/QuickCheckDisplay';
import { QuickCheckOverviewTable } from '@/components/features/QuickCheckOverviewTable';
import type { MenuItem } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { markDetailCheck } from '@/lib/supabase/quick_check.supabase';
import { useRouter } from 'next/navigation';

export default function QuickCheckOverviewPage() {
  const router = useRouter();

  // Starting a detail check moves the row out of this (Ersteinschätzungen)
  // list and into the Detailbewertungen overview — see useQuickChecks'
  // detailCheck filter, which reads this same flag.
  const handleStartDetailCheck = async (id: number) => {
    await markDetailCheck(id);
    router.push(`/property-valuation/detail-check/property-data?quickCheckId=${id}`);
  };

  const buildRowMenuItems = (row: QuickCheckEntry): MenuItem[] => [
    {
      label: BUTTON_DETAILS.OpenResult.label,
      icon: <BUTTON_DETAILS.OpenResult.icon />,
      onClick: () => router.push(`/property-valuation/quick-check/${row.id}`),
    },
    {
      label: BUTTON_DETAILS.StartDetailCheck.label,
      icon: <BUTTON_DETAILS.StartDetailCheck.icon />,
      disabled: row.status !== 'aktiv',
      onClick: () => void handleStartDetailCheck(row.id),
    },
  ];

  return (
    <QuickCheckOverviewTable
      detailCheck={false}
      breadcrumbItems={[{ label: 'Objektbewertung' }, { label: 'Ersteinschätzungen' }]}
      addHref="/property-valuation/quick-check/new"
      addLabel={BUTTON_DETAILS.AddQuickCheck.label}
      addIcon={BUTTON_DETAILS.AddQuickCheck.icon}
      buildRowMenuItems={buildRowMenuItems}
      emptyTitle="Noch keine Ersteinschätzungen vorhanden"
      emptyMessage="Fügen Sie Ihr erstes Objekt hinzu, um die Übersicht zu befüllen."
    />
  );
}
