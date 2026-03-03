"use client";

import { NoResult } from '@/components/common';
import type { SortDirection, TableColumn, TagVariant } from '@/components/ui';
import { Button, Header, Icons, Table, Tag } from '@/components/ui';
import { BUTTON_DETAILS, ButtonType } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { useQuickChecks } from '@/hooks/useQuickChecks';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { QuickCheckOverview } from '@/lib/supabase/quick_check.supabase';
import { PropertyCondition } from '@immonext/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types — display-layer view model (mapped from QuickCheckOverview)
// ---------------------------------------------------------------------------

interface QuickCheckEntry extends Record<string, unknown> {
  id: number;
  ingestDate: string;          // formatted dd.MM.yy
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
// Mapper — QuickCheckOverview (DB) → QuickCheckEntry (display)
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

function toEntry(row: QuickCheckOverview): QuickCheckEntry {
  return {
    id:               row.quickCheckId,
    ingestDate:       formatDate(row.ingestDate),
    portalId:         row.portalId ?? '—',
    kpfMultiplier:    row.kpfMultiplier,
    purchasePrice:    row.purchasePrice,
    postalCode:       row.postalCode,
    constructionYear: row.yearOfConstruction,
    condition:        row.condition,
    detailCheck:      row.detailCheck,
    status:           row.status === 'ACTIVE' ? 'aktiv' : 'inaktiv',
  };
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
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: TableColumn<QuickCheckEntry>[] = [
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
  const { isLoading: authLoading } = useRequireAuth();
  const { data: rawData, isLoading, error, deleteSelected } = useQuickChecks();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('ingestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Map DB rows → display entries once per fetch
  const allEntries = useMemo(() => rawData.map(toEntry), [rawData]);

  const hasSelection = selectedIds.size > 0;

  // ── Column filter handler ───────────────────────────────────────────────
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ── Delete handler ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    const ids = [...selectedIds] as number[];
    setIsDeleting(true);
    try {
      await deleteSelected(ids);
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
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

  // ── Filter + sort (client-side, data already capped at 100 by the hook) ─
  const { displayedData, totalCount } = useMemo(() => {
    const q = search.toLowerCase();
    let filtered = q
      ? allEntries.filter(
          (row) =>
            row.portalId.toLowerCase().includes(q) ||
            row.postalCode.includes(q) ||
            row.condition.toLowerCase().includes(q)
        )
      : allEntries;

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

    // Data is already limited to 100 by the hook/Supabase query;
    // client-side filtering may reduce it further.
    return {
      displayedData: sorted,
      totalCount: sorted.length,
    };
  }, [allEntries, search, columnFilters, sortKey, sortDirection]);

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
              disabled={isDeleting}
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

        {/* ── Loading / error states ───────────────────────────────────── */}
        {(authLoading || isLoading) && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Daten werden geladen…
          </div>
        )}

        {error && !isLoading && (
          <div className="mt-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            Fehler beim Laden: {error}
          </div>
        )}

        {/* ── Table / empty states ────────────────────────────────────── */}
        {!authLoading && !isLoading && !error && (
          <div className="mt-4">
            {/* No data at all — user hasn't added any quick-checks yet */}
            {allEntries.length === 0 && (
              <NoResult
                title="Noch keine Ersteinschätzungen vorhanden"
                message="Fügen Sie Ihr erstes Objekt hinzu, um die Übersicht zu befüllen."
                className="py-24"
              />
            )}

            {/* Data exists but filters match nothing */}
            {allEntries.length > 0 && displayedData.length === 0 && (
              <NoResult
                title="Keine Treffer"
                message="Kein Eintrag entspricht den aktuellen Suchbegriffen oder Filtern."
                className="py-24"
              />
            )}

            {/* Normal table */}
            {displayedData.length > 0 && (
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
                footerLeft={`${totalCount} Einträge`}
                footerRight={hasSelection ? `${selectedIds.size} ausgewählt` : undefined}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}
