"use client";

import type { SortDirection, TableColumn, TagVariant } from '@/components/ui';
import { Button, Header, Icons, Table, Tag } from '@/components/ui';
import { BUTTON_DETAILS, ButtonType } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { PropertyCondition } from '@immonext/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickCheckEntry extends Record<string, unknown> {
  id: number;
  ingestDate: string;
  portalId: string;
  kpfMultiplier: number | null;
  purchasePrice: number;
  postalCode: string;
  constructionYear: number;
  condition: PropertyCondition;
  detailCheck: boolean;
  status: 'aktiv' | 'inaktiv';
}

// ---------------------------------------------------------------------------
// Helpers — condition → Tag variant
// ---------------------------------------------------------------------------

const conditionVariant: Record<PropertyCondition, TagVariant> = {
  [PropertyCondition.Upscale]:            'purple',
  [PropertyCondition.Standard]:           'teal',
  [PropertyCondition.Luxury]:             'violet',
  [PropertyCondition.InNeedOfRenovation]: 'orange',
};

// ---------------------------------------------------------------------------
// KPF badge — coloured pill matching the screenshot
// ---------------------------------------------------------------------------

function KpfBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;

  const color =
    value <= 20
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : value <= 30
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span className={`inline-flex items-center justify-center font-semibold rounded-lg px-2.5 py-1 text-sm min-w-[3rem] ${color}`}>
      {value.toFixed(1).replace(/\.0$/, '')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DATA: QuickCheckEntry[] = [
  { id: 1, ingestDate: '01.08.25', portalId: 'ImmoScout 123', kpfMultiplier: 30,   purchasePrice: 1_000_000, postalCode: '12345', constructionYear: 2010, condition: PropertyCondition.Upscale,            detailCheck: true,  status: 'aktiv'   },
  { id: 2, ingestDate: '09.08.25', portalId: 'ImmoWelt',      kpfMultiplier: 35.6, purchasePrice: 1_000_000, postalCode: '12345', constructionYear: 2008, condition: PropertyCondition.Standard,           detailCheck: false, status: 'inaktiv' },
  { id: 3, ingestDate: '15.08.25', portalId: 'Kleinanzeigen', kpfMultiplier: 28.1, purchasePrice:   800_000, postalCode: '45678', constructionYear: 1986, condition: PropertyCondition.Luxury,             detailCheck: true,  status: 'aktiv'   },
  { id: 4, ingestDate: '01.09.25', portalId: 'ImmoScout 428', kpfMultiplier: 43,   purchasePrice:   500_000, postalCode: '75312', constructionYear: 2015, condition: PropertyCondition.InNeedOfRenovation, detailCheck: false, status: 'aktiv'   },
  { id: 5, ingestDate: '02.09.25', portalId: 'Kleinanzeigen', kpfMultiplier: 27,   purchasePrice:   450_000, postalCode: '75342', constructionYear: 2019, condition: PropertyCondition.Standard,           detailCheck: false, status: 'inaktiv' },
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: TableColumn<QuickCheckEntry>[] = [
  {
    key: 'ingestDate',
    label: FieldLabels.QuickCheck.IngestDate.de,
    sortable: true,
    width: '150px',
  },
  {
    key: 'portalId',
    label: FieldLabels.QuickCheck.PortalId.de,
    sortable: true,
    filterable: true,
  },
  {
    key: 'kpfMultiplier',
    label: FieldLabels.QuickCheck.KpfMultiplier.de,
    sortable: true,
    filterable: true,
    align: 'center',
    width: '110px',
    renderCell: (value) => <KpfBadge value={value as number | null} />,
  },
  {
    key: 'purchasePrice',
    label: FieldLabels.QuickCheck.PurchasePrice.de,
    sortable: true,
    align: 'right',
    width: '140px',
    renderCell: (value) => (
      <span>{(value as number).toLocaleString('de-DE')} €</span>
    ),
  },
  {
    key: 'postalCode',
    label: FieldLabels.QuickCheck.PostalCode.de,
    sortable: true,
    filterable: true,
    width: '110px',
  },
  {
    key: 'constructionYear',
    label: FieldLabels.QuickCheck.ConstructionYear.de,
    sortable: true,
    filterable: true,
    width: '100px',
  },
  {
    key: 'condition',
    label: FieldLabels.QuickCheck.Condition.de,
    sortable: true,
    filterable: true,
    width: '170px',
    renderCell: (value) => {
      const condition = value as PropertyCondition;
      return <Tag label={condition} variant={conditionVariant[condition] ?? 'default'} />;
    },
  },
  {
    key: 'status',
    label: FieldLabels.QuickCheck.Status.de,
    sortable: true,
    filterable: true,
    width: '110px',
    renderCell: (value) => (
      <Tag
        label={value as string}
        variant={value === 'aktiv' ? 'success' : 'muted'}
      />
    ),
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuickCheckOverviewPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('ingestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const hasSelection = selectedIds.size > 0;

  // ── Column filter handler ───────────────────────────────────────────────
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ── Delete handler ──────────────────────────────────────────────────────
  const handleDelete = () => {
    // TODO: call deleteQuickChecks(selectedIds) then refetch
    setSelectedIds(new Set());
  };

  // ── Sort handler ────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // ── Filter + sort ───────────────────────────────────────────────────────
  const MAX_ROWS = 100;

  const { displayedData, totalCount } = useMemo(() => {
    const q = search.toLowerCase();
    let filtered = q
      ? MOCK_DATA.filter(
          (row) =>
            row.portalId.toLowerCase().includes(q) ||
            row.postalCode.includes(q) ||
            row.condition.toLowerCase().includes(q)
        )
      : MOCK_DATA;

    // Apply per-column filters
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val) continue;
      const lower = val.toLowerCase();
      filtered = filtered.filter((row) =>
        String(row[key as keyof QuickCheckEntry] ?? '').toLowerCase().includes(lower)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof QuickCheckEntry];
      const bv = b[sortKey as keyof QuickCheckEntry];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return {
      displayedData: sorted.slice(0, MAX_ROWS),
      totalCount: sorted.length,
    };
  }, [search, columnFilters, sortKey, sortDirection]);

  // ── Selected row (only meaningful when exactly 1 row is selected) ───────
  const selectedRow = useMemo(
    () => (selectedIds.size === 1 ? displayedData.find((r: QuickCheckEntry) => selectedIds.has(r.id)) : undefined),
    [selectedIds, displayedData]
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <Header
          title="Immobilien-Übersicht"
          subtitle="Alle importierten Objekte auf einen Blick"
          actions={
            <Link href="/property-valuation/quick-check/new">
              <Button
                label={BUTTON_DETAILS.AddQuickCheck.label}
                icon={<BUTTON_DETAILS.AddQuickCheck.icon />}
                variant="primary"
              />
            </Link>
          }
        />

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder={FieldLabels.QuickCheck.SearchPlaceholder.de}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-input-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                         transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Context action bar — visible when rows are selected ──────── */}
        {hasSelection && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-muted/50 border border-border rounded-xl">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} {selectedIds.size === 1 ? 'Eintrag' : 'Einträge'} ausgewählt
            </span>

            <div className="flex-1" />

            {/* Delete — always shown when any selection */}
            <Button
              label={`${BUTTON_DETAILS.Delete.label} (${selectedIds.size})`}
              icon={<BUTTON_DETAILS.Delete.icon />}
              iconPosition="left"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
            />

            {/* Start detail check — enabled only when 1 selected + status is aktiv */}
            <Button
              label={BUTTON_DETAILS.StartDetailCheck.label}
              icon={<BUTTON_DETAILS.StartDetailCheck.icon />}
              iconPosition="left"
              variant="outline"
              size="sm"
              disabled={selectedIds.size !== 1 || selectedRow?.status !== 'aktiv'}
              onClick={() => router.push('/property-valuation/detail-check')}
            />

            {/* Open result — enabled only when exactly 1 row selected */}
            <Button
              label={BUTTON_DETAILS[ButtonType.OpenResult].label}
              icon={<Icons.OpenResult className="w-4 h-4" />}
              iconPosition="left"
              variant="outline"
              size="sm"
              disabled={selectedIds.size !== 1}
              onClick={() =>
                router.push(`/property-valuation/quick-check/${selectedRow!.id}`)
              }
            />
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────────── */}
        <div className="mt-4">
          <Table<QuickCheckEntry>
            columns={COLUMNS}
            data={displayedData}
            selectable
            selectedIds={selectedIds}
            getRowId={(row) => row.id}
            onSelectionChange={setSelectedIds}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            getRowClassName={(row) =>
              row.status === 'inaktiv' ? 'opacity-40 grayscale' : undefined
            }
            footerLeft={
              totalCount > MAX_ROWS
                ? `${displayedData.length} von ${totalCount} Einträgen (max. ${MAX_ROWS} angezeigt)`
                : `${totalCount} Einträge`
            }
            footerRight={hasSelection ? `${selectedIds.size} ausgewählt` : undefined}
          />
        </div>

      </main>
    </div>
  );
}
