"use client";

import { NoResult } from '@/components/common';
import {
  CONDITION_FILTER_OPTIONS,
  CONDITION_PILL_LABEL,
  KpfBadge,
  STATUS_FILTER_OPTIONS,
  conditionVariant,
  getPlaceholderPortalUrl,
  toEntry,
  type QuickCheckEntry,
} from '@/components/features/QuickCheckDisplay';
import type { MenuItem, SortDirection, TableColumn } from '@/components/ui';
import { Button, Header, Icons, Table, Tag } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { useQuickChecks } from '@/hooks/useQuickChecks';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { markDetailCheck } from '@/lib/supabase/quick_check.supabase';
import { cn } from '@/lib/utils';
import { PropertyCondition } from '@immonext/types';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuickCheckOverviewPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const { data: rawData, isLoading, error, deleteSelected } = useQuickChecks(false);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('ingestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const pillScrollRef = useRef<HTMLDivElement>(null);

  // Map DB rows → display entries once per fetch
  const allEntries = useMemo(() => rawData.map(toEntry), [rawData]);

  // ── Column filter handler ───────────────────────────────────────────────
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ── Row actions ──────────────────────────────────────────────────────────
  const handleDeleteRow = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteSelected([id]);
    } finally {
      setDeletingId(null);
    }
  };

  // Starting a detail check moves the row out of this (Ersteinschätzungen)
  // list and into the Detailbewertungen overview — see useQuickChecks'
  // detailCheck filter, which reads this same flag.
  const handleStartDetailCheck = async (id: number) => {
    await markDetailCheck(id);
    router.push(`/property-valuation/detail-check/property-data?quickCheckId=${id}`);
  };

  // Shared by the desktop table's actions column and the mobile card menu.
  const rowMenuItems = (row: QuickCheckEntry): MenuItem[] => [
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
    {
      label: BUTTON_DETAILS.Delete.label,
      icon: <BUTTON_DETAILS.Delete.icon />,
      destructive: true,
      disabled: deletingId === row.id,
      onClick: () => void handleDeleteRow(row.id),
    },
  ];

  const COLUMNS: TableColumn<QuickCheckEntry>[] = [
    {
      key: 'actions',
      label: '',
      width: '48px',
      renderCell: (_value, row) => (
        <Button
          iconOnly
          icon={<MoreVertical className="w-4 h-4" />}
          variant="ghost"
          size="sm"
          menuItems={rowMenuItems(row)}
        />
      ),
    },
    {
      key: 'portalId',
      label: FieldLabels.QuickCheck.PortalId.de,
      sortable: true,
      filterable: true,
      renderCell: (value, row) => {
        const portalId = value as string;
        const url = getPlaceholderPortalUrl(row);
        if (!url) return <span className="text-muted-foreground">{portalId}</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {portalId}
          </a>
        );
      },
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
      filterOptions: CONDITION_FILTER_OPTIONS,
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
      filterOptions: STATUS_FILTER_OPTIONS,
      width: '110px',
      renderCell: (value) => (
        <Tag
          label={value as string}
          variant={value === 'aktiv' ? 'success' : 'muted'}
        />
      ),
    },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <Header
          items={[{ label: 'Objektbewertung' }, { label: 'Ersteinschätzungen' }]}
          actions={
            <Link href="/property-valuation/quick-check/new">
              <Button
                label={BUTTON_DETAILS.AddQuickCheck.label}
                icon={<BUTTON_DETAILS.AddQuickCheck.icon />}
                variant="primary"
                hideLabelOnMobile
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

        {/* ── Status + condition filter pills — mobile only, one scrollable
               row; the desktop table has dropdown filters in the Status and
               Zustand column headers instead ──────────────────────────────── */}
        <div className="mt-4 md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => pillScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
            className="shrink-0 p-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Nach links scrollen"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div ref={pillScrollRef} className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleColumnFilterChange('status', '')}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                !columnFilters.status
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent border border-border text-foreground hover:bg-muted"
              )}
            >
              Alle
            </button>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleColumnFilterChange('status', opt.value)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  columnFilters.status === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent border border-border text-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}

            <div className="shrink-0 w-px h-6 bg-border mx-1" />

            <button
              type="button"
              onClick={() => handleColumnFilterChange('condition', '')}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                !columnFilters.condition
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent border border-border text-foreground hover:bg-muted"
              )}
            >
              Alle
            </button>
            {CONDITION_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleColumnFilterChange('condition', opt.value)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  columnFilters.condition === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent border border-border text-foreground hover:bg-muted"
                )}
              >
                {CONDITION_PILL_LABEL[opt.value]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => pillScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
            className="shrink-0 p-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Nach rechts scrollen"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

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

            {displayedData.length > 0 && (
              <Table<QuickCheckEntry>
                columns={COLUMNS}
                data={displayedData}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                columnFilters={columnFilters}
                onColumnFilterChange={handleColumnFilterChange}
                getRowClassName={(row) =>
                  row.status === 'inaktiv' ? 'opacity-40 grayscale' : undefined
                }
                footerLeft={`${totalCount} Einträge`}
                pageSize={25}
                renderMobileCard={(row) => (
                  <div
                    className={cn(
                      "bg-card border border-border rounded-2xl p-4 flex flex-col gap-3",
                      row.status === 'inaktiv' && 'opacity-40 grayscale'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {(() => {
                        const url = getPlaceholderPortalUrl(row);
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {row.portalId}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{row.portalId}</span>
                        );
                      })()}
                      <Button
                        iconOnly
                        icon={<MoreVertical className="w-4 h-4" />}
                        variant="ghost"
                        size="sm"
                        menuItems={rowMenuItems(row)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {FieldLabels.QuickCheck.PurchasePrice.de}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {row.purchasePrice.toLocaleString('de-DE')} €
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {FieldLabels.QuickCheck.PostalCode.de}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{row.postalCode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {FieldLabels.QuickCheck.ConstructionYear.de}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{row.constructionYear}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Tag label={row.condition} variant={conditionVariant[row.condition] ?? 'default'} />
                      <KpfBadge value={row.kpfMultiplier} />
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}
