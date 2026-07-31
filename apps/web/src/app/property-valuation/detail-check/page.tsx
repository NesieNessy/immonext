"use client";

import { NoResult } from '@/components/common';
import type { MenuItem, SortDirection, TableColumn } from '@/components/ui';
import { Button, Header, Icons, Table, Tag, TextFieldWithIcon } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api/authFetch';
import { ExternalLink, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DetailCheckRow extends Record<string, unknown> {
  workflowId: string;
  quickCheckId: number | null;
  address: string;
  postalCode: string;
  city: string;
  constructionYear: number;
  livingAreaM2: number;
  purchasePrice: number;
  status: 'Abgeschlossen' | 'In Bearbeitung';
  updatedAt: string;
}

const STATUS_FILTER_OPTIONS = [
  { value: 'Abgeschlossen', label: 'Abgeschlossen' },
  { value: 'In Bearbeitung', label: 'In Bearbeitung' },
];

interface DetailCheckApiRow {
  workflow_id: string;
  quick_check_id: number | null;
  street_house_number: string | null;
  postal_code: string | null;
  city: string;
  year_of_construction: number;
  living_area_m2: string | number;
  purchase_price: string | number;
  recommendation_level: string | null;
  updated_at: string;
}

export default function DetailCheckOverviewPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const [rows, setRows] = useState<DetailCheckRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch('/api/detail-checks', { cache: 'no-store' });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json() as DetailCheckApiRow[];
        if (cancelled) return;
        setRows(data.map((row) => ({
          workflowId: row.workflow_id,
          quickCheckId: row.quick_check_id,
          address: row.street_house_number || 'Adresse noch nicht erfasst',
          postalCode: row.postal_code || '',
          city: row.city,
          constructionYear: Number(row.year_of_construction),
          livingAreaM2: Number(row.living_area_m2),
          purchasePrice: Number(row.purchase_price),
          status: row.recommendation_level ? 'Abgeschlossen' : 'In Bearbeitung',
          updatedAt: row.updated_at,
        })));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Detailbewertungen konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  const openRow = useCallback((row: DetailCheckRow) => {
    const suffix = row.quickCheckId
      ? `?quickCheckId=${encodeURIComponent(row.quickCheckId)}`
      : `?workflowId=${encodeURIComponent(row.workflowId)}`;
    router.push(`/property-valuation/detail-check/property-data${suffix}`);
  }, [router]);

  const menuItems = useCallback((row: DetailCheckRow): MenuItem[] => [{
    label: BUTTON_DETAILS.OpenDetailCheck.label,
    icon: <ExternalLink className="h-4 w-4" />,
    onClick: () => openRow(row),
  }], [openRow]);

  const columns: TableColumn<DetailCheckRow>[] = useMemo(() => [
    {
      key: 'actions',
      label: '',
      width: '48px',
      renderCell: (_value, row) => (
        <Button iconOnly icon={<MoreVertical className="h-4 w-4" />} variant="ghost" size="sm" menuItems={menuItems(row)} />
      ),
    },
    { key: 'address', label: 'Objekt', sortable: true, filterable: true },
    { key: 'postalCode', label: 'PLZ', sortable: true, filterable: true, width: '100px' },
    { key: 'city', label: 'Ort', sortable: true, filterable: true },
    { key: 'constructionYear', label: 'Baujahr', sortable: true, filterable: true, width: '100px' },
    {
      key: 'livingAreaM2',
      label: 'Wohnfläche',
      sortable: true,
      filterable: true,
      align: 'right',
      renderCell: (value) => `${Number(value).toLocaleString('de-DE')} m²`,
    },
    {
      key: 'purchasePrice',
      label: 'Kaufpreis',
      sortable: true,
      filterable: true,
      align: 'right',
      renderCell: (value) => Number(value) > 0 ? `${Number(value).toLocaleString('de-DE')} €` : 'Noch nicht erfasst',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: STATUS_FILTER_OPTIONS,
      renderCell: (value) => (
        <Tag label={String(value)} variant={value === 'Abgeschlossen' ? 'success' : 'muted'} />
      ),
    },
    {
      key: 'updatedAt',
      label: 'Zuletzt bearbeitet',
      sortable: true,
      filterable: true,
      renderCell: (value) => new Date(String(value)).toLocaleDateString('de-DE'),
    },
  ], [menuItems]);

  const displayedRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = query
      ? rows.filter((row) => `${row.address} ${row.postalCode} ${row.city}`.toLowerCase().includes(query))
      : rows;

    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val) continue;
      const lower = val.toLowerCase();
      filtered = filtered.filter((row) =>
        String(row[key] ?? '').toLowerCase().includes(lower)
      );
    }

    return [...filtered].sort((a, b) => {
      const left = a[sortKey] as string | number;
      const right = b[sortKey] as string | number;
      const result = left < right ? -1 : left > right ? 1 : 0;
      return sortDirection === 'asc' ? result : -result;
    });
  }, [rows, search, columnFilters, sortDirection, sortKey]);

  const handleSort = (key: string) => {
    if (key === sortKey) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = search.trim() !== '' || Object.values(columnFilters).some((v) => v);
  const handleResetFilters = () => {
    setSearch('');
    setColumnFilters({});
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Header items={[{ label: 'Objektbewertung' }, { label: 'Detailbewertungen' }]} />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1 min-w-[220px]">
            <TextFieldWithIcon type="search" icon={Icons.Search} placeholder="Detailbewertungen durchsuchen" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Link href="/property-valuation/detail-check/property-data?new=true">
            <Button label={BUTTON_DETAILS.AddDetailCheck.label} icon={<BUTTON_DETAILS.AddDetailCheck.icon />} variant="primary" hideLabelOnMobile />
          </Link>
        </div>

        {(authLoading || isLoading) && <p className="mt-8 text-center text-sm text-muted-foreground">Detailbewertungen werden geladen...</p>}
        {error && !isLoading && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">Fehler beim Laden: {error}</div>}

        {!authLoading && !isLoading && !error && (
          <div className="mt-4">
            {rows.length === 0 ? (
              <NoResult title="Noch keine Detailbewertungen vorhanden" message="Legen Sie eine neue Detailbewertung an oder starten Sie eine aus einer Ersteinschätzung." className="py-24" />
            ) : displayedRows.length === 0 ? (
              <NoResult
                title="Keine Treffer"
                message="Kein Eintrag entspricht den aktuellen Suchbegriffen oder Filtern."
                className="py-24"
                action={
                  hasActiveFilters && (
                    <Button
                      label="Filter zurücksetzen"
                      icon={<Icons.Filter className="w-4 h-4" />}
                      variant="outline"
                      type="button"
                      onClick={handleResetFilters}
                    />
                  )
                }
              />
            ) : (
              <Table<DetailCheckRow>
                columns={columns}
                data={displayedRows}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                columnFilters={columnFilters}
                onColumnFilterChange={handleColumnFilterChange}
                onRowClick={openRow}
                footerLeft={`${displayedRows.length} Einträge`}
                pageSize={25}
                renderMobileCard={(row) => (
                  <button type="button" onClick={() => openRow(row)} className="w-full rounded-lg border border-border bg-card p-4 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-medium text-foreground">{row.address}</p><p className="text-sm text-muted-foreground">{row.postalCode} {row.city}</p></div>
                      <Tag label={row.status} variant={row.status === 'Abgeschlossen' ? 'success' : 'muted'} />
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-muted-foreground"><span>{row.livingAreaM2.toLocaleString('de-DE')} m²</span><span>{new Date(row.updatedAt).toLocaleDateString('de-DE')}</span></div>
                  </button>
                )}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
