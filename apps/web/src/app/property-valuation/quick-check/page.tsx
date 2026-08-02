"use client";

import type { QuickCheckEntry } from '@/components/features/QuickCheckDisplay';
import { QuickCheckOverviewTable } from '@/components/features/QuickCheckOverviewTable';
import type { MenuItem } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useRouter } from 'next/navigation';

export default function QuickCheckOverviewPage() {
  const router = useRouter();

  // The quick-check is only moved into Detailbewertungen after the first
  // detail-check page was saved successfully.
  const handleStartDetailCheck = (id: number) => {
    router.push(`/property-valuation/detail-check/property-data?quickCheckId=${id}`);
  };

  const openRow = (row: QuickCheckEntry) => {
    router.push(`/property-valuation/quick-check/${row.id}`);
  };

  const buildRowMenuItems = (row: QuickCheckEntry): MenuItem[] => [
    {
      label: BUTTON_DETAILS.StartDetailCheck.label,
      icon: <BUTTON_DETAILS.StartDetailCheck.icon />,
      disabled: row.status !== 'aktiv',
      onClick: () => handleStartDetailCheck(row.id),
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
      onRowClick={openRow}
      emptyTitle="Noch keine Ersteinschätzungen vorhanden"
      emptyMessage="Fügen Sie Ihr erstes Objekt hinzu, um die Übersicht zu befüllen."
    />
  );
}
