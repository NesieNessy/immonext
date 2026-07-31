"use client";

import { buildPropertyUseCaseBreadcrumb } from '@/components/features/PropertyDisplay';
import { Button, ComingSoonButton, Header, NumberField, SectionLabel, StickyActionBar, Table, Tag, TextField, type SortDirection, type TableColumn } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { createTenancy, getCurrentTenancyByUnit, updateTenancy } from '@/lib/supabase/tenancy.supabase';
import {
    createTenancyPerson,
    deleteTenancyPerson,
    getTenancyPersonsByTenancy,
    updateTenancyPerson,
} from '@/lib/supabase/tenancy_person.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri, formatDeDate } from '@/lib/utils';
import type { Property, PropertyUnit, Tenancy } from '@immonext/types';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Plus, RefreshCw, Trash2, Upload, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface PersonForm {
    id: number | null;
    lastName: string;
    firstName: string;
    taxId: string;
    isPrimary: boolean;
}

const EMPTY_PRIMARY_PERSON: PersonForm = { id: null, lastName: '', firstName: '', taxId: '', isPrimary: true };

/** Ausweis/Schufa/Bürgschaft are collected per person; Mietvertrag applies to the whole tenancy. */
const PER_PERSON_DOCUMENTS = ['Ausweis', 'Schufa', 'Bürgschaft'];
const SHARED_DOCUMENTS = ['Mietvertrag'];

function personDisplayName(person: PersonForm, index: number): string {
    const name = `${person.firstName} ${person.lastName}`.trim();
    return name || `Person ${index + 1}`;
}

interface TenantUnitDetailProps {
    propertyId: string;
    property: Property;
    unit: PropertyUnit;
    hasMultipleUnits: boolean;
}

export function TenantUnitDetail({ propertyId, property, unit, hasMultipleUnits }: TenantUnitDetailProps) {
    const router = useRouter();

    const [tenancy, setTenancy] = useState<Tenancy | null>(null);
    const [persons, setPersons] = useState<PersonForm[]>([EMPTY_PRIMARY_PERSON]);
    const [deletedPersonIds, setDeletedPersonIds] = useState<number[]>([]);
    const [deposit, setDeposit] = useState('');
    const [startFreshTenancy, setStartFreshTenancy] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [docSortKey, setDocSortKey] = useState<string>('document');
    const [docSortDirection, setDocSortDirection] = useState<SortDirection>('asc');
    const [docColumnFilters, setDocColumnFilters] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;
        getCurrentTenancyByUnit(unit.propertyUnitId).then(async (found) => {
            if (cancelled) return;
            setTenancy(found);
            setDeposit(found?.deposit != null ? String(found.deposit) : '');
            if (found) {
                const loadedPersons = await getTenancyPersonsByTenancy(found.tenancyId);
                if (cancelled) return;
                setPersons(
                    loadedPersons.length > 0
                        ? loadedPersons.map((p) => ({
                            id: p.tenancyPersonId,
                            lastName: p.lastName ?? '',
                            firstName: p.firstName ?? '',
                            taxId: p.taxId ?? '',
                            isPrimary: p.isPrimary,
                        }))
                        : [EMPTY_PRIMARY_PERSON]
                );
            } else {
                setPersons([EMPTY_PRIMARY_PERSON]);
            }
        });
        return () => { cancelled = true; };
    }, [unit.propertyUnitId]);

    const status = useMemo(() => {
        if (!tenancy || startFreshTenancy) return 'Unvermietet' as const;
        return 'Vermietet' as const;
    }, [tenancy, startFreshTenancy]);

    const documentRows = useMemo(() => [
        ...persons.flatMap((person, personIndex) =>
            PER_PERSON_DOCUMENTS.map((document) => ({
                key: `${document}-${personIndex}`,
                document,
                tenant: personDisplayName(person, personIndex),
            }))
        ),
        ...SHARED_DOCUMENTS.map((document) => ({ key: document, document, tenant: 'Alle Mieter' })),
    ], [persons]);

    const documentFilterOptions = useMemo(
        () => [...PER_PERSON_DOCUMENTS, ...SHARED_DOCUMENTS].map((value) => ({ value, label: value })),
        []
    );

    const tenantFilterOptions = useMemo(() => {
        const names = Array.from(new Set(documentRows.map((row) => row.tenant)));
        return names.map((value) => ({ value, label: value }));
    }, [documentRows]);

    const handleDocSort = (key: string) => {
        if (docSortKey === key) {
            setDocSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setDocSortKey(key);
            setDocSortDirection('asc');
        }
    };

    const handleDocColumnFilterChange = (key: string, value: string) => {
        setDocColumnFilters((prev) => ({ ...prev, [key]: value }));
    };

    const documentTableData = useMemo(() => {
        let filtered = documentRows;
        for (const [key, val] of Object.entries(docColumnFilters)) {
            if (!val) continue;
            filtered = filtered.filter((row) => row[key as keyof typeof row] === val);
        }

        return [...filtered].sort((a, b) => {
            const av = a[docSortKey as keyof typeof a];
            const bv = b[docSortKey as keyof typeof a];
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return docSortDirection === 'asc' ? cmp : -cmp;
        });
    }, [documentRows, docColumnFilters, docSortKey, docSortDirection]);

    const useCaseMenuItems = useMemo(() =>
        createUseCaseMenuItems(propertyId, 'TenantData', (route) => {
            router.push(route);
        }),
        [propertyId, router]
    );

    // With multiple Wohneinheiten, "Mieterdaten" links back to the units
    // overview and the unit label becomes the current breadcrumb segment.
    const breadcrumbItems = hasMultipleUnits
        ? [
            ...buildPropertyUseCaseBreadcrumb(property, propertyId, ExistingPropertiesUseCases.TenantData).slice(0, 2),
            { label: ExistingPropertiesUseCases.TenantData, href: `/existing-properties/${propertyId}/tenant-data` },
            { label: unit.unitLabel },
        ]
        : buildPropertyUseCaseBreadcrumb(property, propertyId, ExistingPropertiesUseCases.TenantData);

    const updatePerson = (index: number, patch: Partial<PersonForm>) => {
        setPersons((prev) => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
    };

    const addPerson = () => {
        setPersons((prev) => [...prev, { id: null, lastName: '', firstName: '', taxId: '', isPrimary: false }]);
    };

    const removePerson = (index: number) => {
        if (index === 0) return;
        setPersons((prev) => {
            const removed = prev[index];
            if (removed.id) setDeletedPersonIds((ids) => [...ids, removed.id!]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleMieterwechsel = () => {
        setStartFreshTenancy(true);
        setPersons([EMPTY_PRIMARY_PERSON]);
        setDeposit('');
        setDeletedPersonIds([]);
    };

    const backHref = hasMultipleUnits
        ? `/existing-properties/${propertyId}/tenant-data`
        : `/existing-properties/${propertyId}`;

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            let activeTenancyId = tenancy?.tenancyId ?? null;
            const depositValue = deposit !== '' ? Number(deposit) : null;
            const hasAnyPersonData = persons.some((p) => p.lastName.trim() !== '' || p.firstName.trim() !== '');

            if (startFreshTenancy) {
                if (tenancy) {
                    await updateTenancy(tenancy.tenancyId, {
                        tenancyEndDate: format(new Date(), 'yyyy-MM-dd'),
                    });
                }
                if (hasAnyPersonData) {
                    const created = await createTenancy({
                        propertyId: property.propertyId,
                        propertyUnitId: unit.propertyUnitId,
                        maintenanceCostsId: null,
                        parkingSpaceId: null,
                        isRented: true,
                        tenancyStartDate: format(new Date(), 'yyyy-MM-dd'),
                        tenancyEndDate: null,
                        tenancyType: null,
                        tenancyUnits: null,
                        tenancyUnitsPrice: null,
                        parkingSpaceRent: null,
                        miscRent: null,
                        warmRent: null,
                        coldRent: null,
                        tenantFirstName: '',
                        tenantLastName: '',
                        deposit: depositValue,
                    });
                    activeTenancyId = created?.tenancyId ?? null;
                } else {
                    activeTenancyId = null;
                }
            } else if (!tenancy && hasAnyPersonData) {
                const created = await createTenancy({
                    propertyId: property.propertyId,
                    propertyUnitId: unit.propertyUnitId,
                    maintenanceCostsId: null,
                    parkingSpaceId: null,
                    isRented: true,
                    tenancyStartDate: format(new Date(), 'yyyy-MM-dd'),
                    tenancyEndDate: null,
                    tenancyType: null,
                    tenancyUnits: null,
                    tenancyUnitsPrice: null,
                    parkingSpaceRent: null,
                    miscRent: null,
                    warmRent: null,
                    coldRent: null,
                    tenantFirstName: '',
                    tenantLastName: '',
                    deposit: depositValue,
                });
                activeTenancyId = created?.tenancyId ?? null;
            } else if (tenancy) {
                await updateTenancy(tenancy.tenancyId, { deposit: depositValue });
            }

            if (activeTenancyId) {
                for (let i = 0; i < persons.length; i++) {
                    const p = persons[i];
                    if (p.id) {
                        await updateTenancyPerson(p.id, {
                            lastName: p.lastName || null,
                            firstName: p.firstName || null,
                            taxId: p.taxId || null,
                        });
                    } else if (p.lastName.trim() !== '' || p.firstName.trim() !== '') {
                        await createTenancyPerson({
                            tenancyId: activeTenancyId,
                            lastName: p.lastName || null,
                            firstName: p.firstName || null,
                            taxId: p.taxId || null,
                            isPrimary: p.isPrimary,
                            sortOrder: i,
                        });
                    }
                }
            }

            for (const id of deletedPersonIds) {
                await deleteTenancyPerson(id);
            }

            router.push(backHref);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setIsSaving(false);
        }
    };

    const documentColumns: TableColumn<Record<string, unknown>>[] = [
        {
            key: 'document',
            label: 'Dokument',
            sortable: true,
            filterable: true,
            filterOptions: documentFilterOptions,
        },
        {
            key: 'tenant',
            label: 'Mieter',
            sortable: true,
            filterable: true,
            filterOptions: tenantFilterOptions,
        },
        { key: 'file', label: 'Datei', renderCell: () => '–' },
        {
            key: 'action',
            label: 'Aktion',
            align: 'right',
            renderCell: (_v, row) => (
                <ComingSoonButton
                    iconOnly
                    icon={<Upload className="w-4 h-4" />}
                    variant="outline"
                    size="sm"
                    aria-label={`${row.document} für ${row.tenant} hochladen`}
                />
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    items={breadcrumbItems}
                    image={property.imageUrl ? <img src={base64ToDataUri(property.imageUrl)!} alt={`${property.street} ${property.houseNumber}`} className="w-10 h-10 object-cover rounded-lg" /> : undefined}
                    actions={
                        <Button
                            label={BUTTON_DETAILS.UseCases.label}
                            icon={<BUTTON_DETAILS.UseCases.icon />}
                            variant="outline"
                            hideLabelOnMobile
                            menuItems={useCaseMenuItems}
                        />
                    }
                />

                <div className="mt-8 mx-auto max-w-4xl space-y-6">
                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Tag label={status} variant={status === 'Vermietet' ? 'success' : 'muted'} />
                                    {tenancy?.tenancyStartDate && !startFreshTenancy && (
                                        <span className="text-sm text-muted-foreground">Einzug: {formatDeDate(tenancy.tenancyStartDate)}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        label="Mieterwechsel"
                                        icon={<RefreshCw className="w-4 h-4" />}
                                        variant="outline"
                                        onClick={handleMieterwechsel}
                                    />
                                    <Button
                                        label="Person hinzufügen"
                                        icon={<Plus className="w-4 h-4" />}
                                        variant="primary"
                                        onClick={addPerson}
                                    />
                                </div>
                            </div>

                            {/* Person cards */}
                            <div className="flex flex-col gap-4">
                                {persons.map((person, index) => (
                                    <div key={index} className="p-4 rounded-lg border border-border bg-card">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-semibold text-foreground">Person {index + 1}</span>
                                                {person.isPrimary && <Tag label="Hauptmieter" variant="primary" />}
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePerson(index)}
                                                    aria-label="Person entfernen"
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <TextField
                                                label={person.isPrimary ? 'Nachname *' : 'Nachname (opt.)'}
                                                value={person.lastName}
                                                onChange={(e) => updatePerson(index, { lastName: e.target.value })}
                                            />
                                            <TextField
                                                label={person.isPrimary ? 'Vorname *' : 'Vorname (opt.)'}
                                                value={person.firstName}
                                                onChange={(e) => updatePerson(index, { firstName: e.target.value })}
                                            />
                                            <TextField
                                                label="Steuer-ID (opt.)"
                                                placeholder="00 000 000 000"
                                                value={person.taxId}
                                                onChange={(e) => updatePerson(index, { taxId: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Unterlagen */}
                            <div>
                                <SectionLabel>Unterlagen</SectionLabel>
                                <div className="mt-3">
                                    <Table
                                        columns={documentColumns}
                                        data={documentTableData}
                                        sortKey={docSortKey}
                                        sortDirection={docSortDirection}
                                        onSort={handleDocSort}
                                        columnFilters={docColumnFilters}
                                        onColumnFilterChange={handleDocColumnFilterChange}
                                        footerLeft={`${documentTableData.length} Einträge`}
                                    />
                                </div>
                            </div>

                            {/* Generierte Dokumente */}
                            <div>
                                <SectionLabel>Generierte Dokumente</SectionLabel>
                                <div className="mt-3 flex items-center gap-3">
                                    <ComingSoonButton
                                        label="Mieterbescheinigung generieren"
                                        icon={<FileText className="w-4 h-4" />}
                                        variant="outline"
                                    />
                                </div>
                            </div>

                            {/* Mietkaution */}
                            <div>
                                <SectionLabel>Mietkaution</SectionLabel>
                                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-end gap-3">
                                    <div className="w-full sm:w-48">
                                        <NumberField
                                            label="Betrag (informativ)"
                                            unit="€"
                                            value={deposit}
                                            onChange={(e) => setDeposit(e.target.value)}
                                            min={0}
                                        />
                                    </div>
                                    <ComingSoonButton
                                        label="Mietkautionskonto eröffnen"
                                        variant="primary"
                                    />
                                </div>
                            </div>
                </div>
            </main>

            <StickyActionBar
                show={true}
                onGhost={() => router.push(backHref)}
                onPrimary={() => void handleSave()}
                ghostLabel="Zurück"
                ghostIcon={<ArrowLeft className="w-4 h-4" />}
                primaryLabel={BUTTON_DETAILS.Save.label}
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={isSaving}
            />
        </div>
    );
}
