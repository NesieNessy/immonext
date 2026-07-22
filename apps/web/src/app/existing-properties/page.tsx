"use client";

import { NoResult } from '@/components/common';
import type { MenuItem } from '@/components/ui';
import { Button, Header, Icons, TextFieldWithIcon, TileWithImage } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useProperties } from '@/hooks/useProperties';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { base64ToDataUri } from '@/lib/utils';
import type { Property } from '@immonext/types';
import { MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function ExistingPropertiesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data: properties, isLoading, error, deleteSelected } = useProperties(user?.id);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handlePropertyClick = (propertyId: number) => {
    router.push(`/existing-properties/${propertyId}/property-data`);
  };

  const handleCreateProperty = () => {
    // TODO: no standalone "create property" flow exists yet — properties
    // are currently only created by accepting a quick-check into the
    // portfolio (finalize_quick_check RPC).
    console.log('Create new property');
  };

  const handleDeleteProperty = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteSelected(id);
    } finally {
      setDeletingId(null);
    }
  };

  const buildMenuItems = (property: Property): MenuItem[] => [
    {
      label: BUTTON_DETAILS.Open.label,
      icon: <BUTTON_DETAILS.Open.icon />,
      onClick: () => handlePropertyClick(property.propertyId),
    },
    {
      label: BUTTON_DETAILS.Delete.label,
      icon: <BUTTON_DETAILS.Delete.icon />,
      destructive: true,
      disabled: deletingId === property.propertyId,
      onClick: () => void handleDeleteProperty(property.propertyId),
    },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) =>
      `${p.street} ${p.houseNumber} ${p.city} ${p.postalCode} ${p.propertyAbbreviation}`
        .toLowerCase()
        .includes(q)
    );
  }, [properties, search]);

  // A new filtered result set (or a page-size change) always starts back at
  // page 1 — an out-of-range page would otherwise render nothing.
  useEffect(() => {
    setPage(1);
  }, [filtered, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <Header
          items={[{ label: 'Bestandsobjekte' }]}
          actions={
            <Button
              label={BUTTON_DETAILS.AddProperty.label}
              icon={<BUTTON_DETAILS.AddProperty.icon />}
              variant="primary"
              hideLabelOnMobile
              onClick={handleCreateProperty}
            />
          }
        />

        <div className="mt-6 max-w-sm">
          <TextFieldWithIcon
            type="search"
            icon={Icons.Search}
            placeholder="Objekte durchsuchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        {!authLoading && !isLoading && !error && (
          <div className="mt-6">
            {properties.length === 0 && (
              <NoResult
                title="Noch keine Objekte vorhanden"
                message="Übernehmen Sie eine Ersteinschätzung in Ihr Portfolio, um hier Objekte zu sehen."
                className="py-24"
              />
            )}

            {properties.length > 0 && filtered.length === 0 && (
              <NoResult
                title="Keine Treffer"
                message="Kein Objekt entspricht dem Suchbegriff."
                className="py-24"
                action={
                  <Button
                    label="Filter zurücksetzen"
                    icon={<Icons.Filter className="w-4 h-4" />}
                    variant="outline"
                    type="button"
                    onClick={() => setSearch('')}
                  />
                }
              />
            )}

            {filtered.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pageItems.map((property) => (
                    <TileWithImage
                      key={property.propertyId}
                      image={base64ToDataUri(property.imageUrl) ?? ""}
                      imageAlt={`${property.street} ${property.houseNumber}`}
                      title={`${property.street} ${property.houseNumber}`}
                      description={`${property.postalCode} ${property.city}`}
                      className="h-full"
                      onClick={() => handlePropertyClick(property.propertyId)}
                      actions={
                        <div className="w-full flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            iconOnly
                            icon={<MoreVertical className="w-4 h-4" />}
                            variant="ghost"
                            size="sm"
                            menuItems={buildMenuItems(property)}
                          />
                        </div>
                      }
                    />
                  ))}
                </div>

                {/* ── Pagination footer ──────────────────────────────────── */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{filtered.length} Objekte</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5">
                      Objekte pro Seite
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="px-1.5 py-1 bg-background border border-border rounded-md cursor-pointer
                                   focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary
                                   text-foreground transition-colors"
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </label>

                    <span>Seite {currentPage} von {totalPages}</span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        aria-label="Vorherige Seite"
                        className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Icons.ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        aria-label="Nächste Seite"
                        className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Icons.ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
