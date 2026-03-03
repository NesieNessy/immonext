"use client";

import type { SortDirection, TableColumn, TagVariant } from '@/components/ui';
import { Button, Header, Table, Tag } from '@/components/ui';
import { PropertyCondition } from '@immonext/types';
import { CheckCircle2, Filter, Plus, Search, Trash2 } from 'lucide-react';
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
  faktor: number | null;
  kaufpreis: number;
  plz: string;
  baujahr: number;
  zustand: PropertyCondition;
  detailCheck: boolean;
  status: 'aktiv' | 'inaktiv';
}

// ---------------------------------------------------------------------------
// Helpers — condition → Tag variant
// ---------------------------------------------------------------------------

const conditionVariant: Record<PropertyCondition, TagVariant> = {
  [PropertyCondition.Upscale]:            'purple',
  [PropertyCondition.Standard]:           'muted',
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
  { id: 1, ingestDate: '01.08.25', portalId: 'ImmoScout 123', faktor: 30,   kaufpreis: 1_000_000, plz: '12345', baujahr: 2010, zustand: PropertyCondition.Upscale,            detailCheck: true,  status: 'aktiv'   },
  { id: 2, ingestDate: '09.08.25', portalId: 'ImmoWelt',      faktor: 35.6, kaufpreis: 1_000_000, plz: '12345', baujahr: 2008, zustand: PropertyCondition.Standard,           detailCheck: false, status: 'inaktiv' },
  { id: 3, ingestDate: '15.08.25', portalId: 'Kleinanzeigen', faktor: 28.1, kaufpreis:   800_000, plz: '45678', baujahr: 1986, zustand: PropertyCondition.Luxury,             detailCheck: true,  status: 'aktiv'   },
  { id: 4, ingestDate: '01.09.25', portalId: 'ImmoScout 428', faktor: 43,   kaufpreis:   500_000, plz: '75312', baujahr: 2015, zustand: PropertyCondition.InNeedOfRenovation, detailCheck: false, status: 'aktiv'   },
  { id: 5, ingestDate: '02.09.25', portalId: 'Kleinanzeigen', faktor: 27,   kaufpreis:   450_000, plz: '75342', baujahr: 2019, zustand: PropertyCondition.Standard,           detailCheck: false, status: 'inaktiv' },
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: TableColumn<QuickCheckEntry>[] = [
  {
    key: 'ingestDate',
    label: 'Ingest Date',
    sortable: true,
    width: '120px',
  },
  {
    key: 'portalId',
    label: 'Portal ID',
    sortable: true,
  },
  {
    key: 'faktor',
    label: 'Faktor',
    sortable: true,
    align: 'center',
    width: '100px',
    renderCell: (value) => <KpfBadge value={value as number | null} />,
  },
  {
    key: 'kaufpreis',
    label: 'Kaufpreis',
    sortable: true,
    align: 'right',
    width: '140px',
    renderCell: (value) => (
      <span>{(value as number).toLocaleString('de-DE')} €</span>
    ),
  },
  {
    key: 'plz',
    label: 'PLZ (Adresse)',
    sortable: true,
    width: '130px',
  },
  {
    key: 'baujahr',
    label: 'Baujahr',
    sortable: true,
    width: '100px',
  },
  {
    key: 'zustand',
    label: 'Zustand',
    sortable: true,
    width: '160px',
    renderCell: (value) => {
      const condition = value as PropertyCondition;
      return <Tag label={condition} variant={conditionVariant[condition] ?? 'default'} />;
    },
  },
  {
    key: 'detailCheck',
    label: 'Detailbewertung',
    sortable: true,
    align: 'center',
    width: '140px',
    renderCell: (value) =>
      value ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '100px',
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

  const hasSelection = selectedIds.size > 0;

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
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? MOCK_DATA.filter(
          (row) =>
            row.portalId.toLowerCase().includes(q) ||
            row.plz.includes(q) ||
            row.zustand.toLowerCase().includes(q)
        )
      : MOCK_DATA;

    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof QuickCheckEntry];
      const bv = b[sortKey as keyof QuickCheckEntry];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [search, sortKey, sortDirection]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <Header
          title="Immobilien-Übersicht"
          subtitle="Alle importierten Objekte auf einen Blick"
          actions={
            <Link href="/property-valuation/quick-check/new">
              <Button
                label="Objekt hinzufügen"
                icon={<Plus className="w-4 h-4" />}
                variant="primary"
              />
            </Link>
          }
        />

        {/* ── Search + filter bar ──────────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Suche nach Portal, PLZ, Zustand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-input-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                         transition-all duration-200"
            />
          </div>
          <Button
            label="Filter"
            icon={<Filter className="w-4 h-4" />}
            iconPosition="left"
            variant="outline"
          />
          {/* Delete — only enabled when rows are selected */}
          <Button
            label={hasSelection ? `Löschen (${selectedIds.size})` : 'Löschen'}
            icon={<Trash2 className="w-4 h-4" />}
            iconPosition="left"
            variant="outline"
            disabled={!hasSelection}
            onClick={handleDelete}
            className="text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40"
          />
        </div>

        {/* ── Table ───────────────────────────────────────────────────── */}
        <div className="mt-6">
          <Table<QuickCheckEntry>
            columns={COLUMNS}
            data={filteredData}
            selectable
            selectedIds={selectedIds}
            getRowId={(row) => row.id}
            onSelectionChange={setSelectedIds}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={(row) => router.push(`/property-valuation/quick-check/${row.id}`)}
            footerLeft={`${filteredData.length} Einträge`}
            footerRight="Klicken zum Auswählen"
          />
        </div>

      </main>
    </div>
  );
}
