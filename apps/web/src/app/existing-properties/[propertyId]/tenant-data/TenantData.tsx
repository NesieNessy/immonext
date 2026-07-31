"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildPropertyUseCaseBreadcrumb, PropertyLoadingPage, PropertyNotFoundPage } from '@/components/features/PropertyDisplay';
import { Button, Header, Table, Tag, type SortDirection, type TableColumn } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { createPropertyUnit, getPropertyUnitsByProperty } from '@/lib/supabase/property_unit.supabase';
import { getCurrentTenancyByUnit } from '@/lib/supabase/tenancy.supabase';
import { getTenancyPersonsByTenancy } from '@/lib/supabase/tenancy_person.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri, deCurrencyFormatter, formatDeDate } from '@/lib/utils';
import type { Property, PropertyUnit } from '@immonext/types';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { TenantUnitDetail } from './TenantUnitDetail';

type UnitStatus = 'Vermietet' | 'Unvermietet';

interface UnitRow {
    unit: PropertyUnit;
    tenantName: string;
    moveInDate: string | null;
    coldRent: number | null;
    status: UnitStatus;
}

const STATUS_FILTER_OPTIONS = [
    { value: 'Vermietet', label: 'Vermietet' },
    { value: 'Unvermietet', label: 'Unvermietet' },
];

async function loadUnitRow(unit: PropertyUnit): Promise<UnitRow> {
    const tenancy = await getCurrentTenancyByUnit(unit.propertyUnitId);
    if (!tenancy) {
        return { unit, tenantName: '–', moveInDate: null, coldRent: null, status: 'Unvermietet' };
    }

    const persons = await getTenancyPersonsByTenancy(tenancy.tenancyId);
    const primary = persons.find((p) => p.isPrimary) ?? persons[0];
    const others = persons.filter((p) => p !== primary);
    const tenantName = primary
        ? `${primary.lastName ?? ''}, ${[primary.firstName, ...others.map((p) => p.firstName)].filter(Boolean).join(' & ')}`.trim()
        : '–';

    return {
        unit,
        tenantName: tenantName || '–',
        moveInDate: tenancy.tenancyStartDate,
        coldRent: tenancy.coldRent,
        status: 'Vermietet',
    };
}

export default function TenantData({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [units, setUnits] = useState<PropertyUnit[]>([]);
    const [unitRows, setUnitRows] = useState<UnitRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingUnit, setIsAddingUnit] = useState(false);
    const [sortKey, setSortKey] = useState<string>('unitLabel');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        const id = parseInt(propertyId, 10);
        const [foundProperty, foundUnits] = await Promise.all([
            getPropertyById(id),
            getPropertyUnitsByProperty(id),
        ]);
        setProperty(foundProperty);
        setUnits(foundUnits);

        if (foundUnits.length > 1) {
            const rows = await Promise.all(foundUnits.map(loadUnitRow));
            setUnitRows(rows);
        }
        setIsLoading(false);
    }, [propertyId]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleAddUnit = async () => {
        setIsAddingUnit(true);
        await createPropertyUnit({
            propertyId: parseInt(propertyId, 10),
            unitLabel: `Whg. ${units.length + 1}`,
            sortOrder: units.length,
        });
        await load();
        setIsAddingUnit(false);
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handleColumnFilterChange = (key: string, value: string) => {
        setColumnFilters((prev) => ({ ...prev, [key]: value }));
    };

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'TenantData', (route) => {
        router.push(route);
    });

    const tableData = useMemo(() => {
        const raw = unitRows.map((row) => ({
            propertyUnitId: row.unit.propertyUnitId,
            unitLabel: row.unit.unitLabel,
            tenantName: row.tenantName,
            moveInDate: row.moveInDate,
            coldRent: row.coldRent,
            status: row.status,
        }));

        let filtered = raw;
        for (const [key, val] of Object.entries(columnFilters)) {
            if (!val) continue;
            const lower = val.toLowerCase();
            filtered = filtered.filter((row) =>
                String(row[key as keyof typeof row] ?? '').toLowerCase().includes(lower)
            );
        }

        return [...filtered].sort((a, b) => {
            const av = a[sortKey as keyof typeof a];
            const bv = b[sortKey as keyof typeof a];
            if (av === null || av === undefined) return 1;
            if (bv === null || bv === undefined) return -1;
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return sortDirection === 'asc' ? cmp : -cmp;
        });
    }, [unitRows, columnFilters, sortKey, sortDirection]);

    if (isLoading) return <PropertyLoadingPage />;

    if (!property) return <PropertyNotFoundPage />;

    // Exactly one Wohneinheit — skip the overview and go straight to it.
    if (units.length <= 1) {
        const unit = units[0];
        if (!unit) return <PropertyNotFoundPage />;
        return <TenantUnitDetail propertyId={propertyId} property={property} unit={unit} hasMultipleUnits={false} />;
    }

    const columns: TableColumn<Record<string, unknown>>[] = [
        {
            key: 'unitLabel',
            label: 'Einheit',
            sortable: true,
            renderCell: (v) => <span className="font-medium text-foreground">{String(v)}</span>,
        },
        {
            key: 'tenantName',
            label: 'Aktueller Mieter',
            sortable: true,
            filterable: true,
        },
        {
            key: 'moveInDate',
            label: 'Einzug',
            sortable: true,
            renderCell: (v) => formatDeDate(v as string | null),
        },
        {
            key: 'coldRent',
            label: 'Nettomiete',
            sortable: true,
            renderCell: (v) => v != null ? `${deCurrencyFormatter.format(v as number)} €` : '–',
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            filterable: true,
            filterOptions: STATUS_FILTER_OPTIONS,
            renderCell: (v) => {
                const status = v as UnitStatus;
                return <Tag label={status} variant={status === 'Vermietet' ? 'success' : 'muted'} />;
            },
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-12">
            <main className="container mx-auto px-4 py-8">
                <Header
                    items={buildPropertyUseCaseBreadcrumb(property, propertyId, ExistingPropertiesUseCases.TenantData)}
                    image={property.imageUrl ? <img src={base64ToDataUri(property.imageUrl)!} alt={`${property.street} ${property.houseNumber}`} className="w-10 h-10 object-cover rounded-lg" /> : undefined}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button
                                label={BUTTON_DETAILS.UseCases.label}
                                icon={<BUTTON_DETAILS.UseCases.icon />}
                                variant="outline"
                                hideLabelOnMobile
                                menuItems={useCaseMenuItems}
                            />
                            <Button
                                label="Einheit hinzufügen"
                                icon={<Plus className="w-4 h-4" />}
                                variant="primary"
                                hideLabelOnMobile
                                disabled={isAddingUnit}
                                onClick={() => void handleAddUnit()}
                            />
                        </div>
                    }
                />

                <div className="mt-8 mx-auto max-w-5xl space-y-3">
                    <Table
                        columns={columns}
                        data={tableData}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        columnFilters={columnFilters}
                        onColumnFilterChange={handleColumnFilterChange}
                        onRowClick={(row) => router.push(`/existing-properties/${propertyId}/tenant-data/${row.propertyUnitId}`)}
                        footerLeft={`${tableData.length} Einträge`}
                        pageSize={25}
                    />
                </div>
            </main>
        </div>
    );
}
