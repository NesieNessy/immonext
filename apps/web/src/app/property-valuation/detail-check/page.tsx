"use client";

import type { QuickCheckEntry } from '@/components/features/QuickCheckDisplay';
import { QuickCheckOverviewTable } from '@/components/features/QuickCheckOverviewTable';
import type { MenuItem } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Page — Detailbewertungen overview. Lists quick-checks whose detail check
// has been started (detail_check = true); the counterpart to the
// Ersteinschätzungen overview, which lists detail_check = false rows.
// ---------------------------------------------------------------------------

export default function DetailCheckOverviewPage() {
  const router = useRouter();

  const buildRowMenuItems = (row: QuickCheckEntry): MenuItem[] => [
    {
      label: BUTTON_DETAILS.OpenDetailCheck.label,
      icon: <BUTTON_DETAILS.OpenDetailCheck.icon />,
      onClick: () => router.push(`/property-valuation/detail-check/property-data?quickCheckId=${row.id}`),
    },
  ];

  return (
    <QuickCheckOverviewTable
      detailCheck={true}
      breadcrumbItems={[{ label: 'Objektbewertung' }, { label: 'Detailbewertungen' }]}
      addHref="/property-valuation/detail-check/property-data"
      addLabel={BUTTON_DETAILS.AddDetailCheck.label}
      addIcon={BUTTON_DETAILS.AddDetailCheck.icon}
      buildRowMenuItems={buildRowMenuItems}
      emptyTitle="Noch keine Detailbewertungen vorhanden"
      emptyMessage="Starten Sie eine Detailbewertung aus einer Ersteinschätzung oder legen Sie eine neue an."
    />
  );
}
