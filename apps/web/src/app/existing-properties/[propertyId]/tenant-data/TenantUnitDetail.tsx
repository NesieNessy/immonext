"use client";

import { formatUnitLabel } from '@/components/features/PropertyDisplay';
import { Button, CalendarField, ComingSoonButton, ConfirmDeleteModal, Header, NumberField, SectionLabel, StickyActionBar, Table, Tag, TextField, UnsavedChangesModal, useToast, type BreadcrumbItem, type SortDirection, type TableColumn } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createTenancy, getCurrentTenancyByUnit, updateTenancy } from '@/lib/supabase/tenancy.supabase';
import { getPersonalData } from '@/lib/supabase/personal_data.supabase';
import {
    deleteTenancyDocument,
    getTenancyDocumentsByTenancy,
    getTenancyDocumentUrl,
    uploadTenancyDocument,
} from '@/lib/supabase/tenancy_document.supabase';
import {
    createTenancyPerson,
    deleteTenancyPerson,
    getTenancyPersonsByTenancy,
    updateTenancyPerson,
} from '@/lib/supabase/tenancy_person.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri, cn } from '@/lib/utils';
import type { PersonalData, Property, PropertyUnit, Tenancy, TenancyDocument, TenancyDocumentType } from '@immonext/types';
import { format } from 'date-fns';
import { Download, Eye, FileSignature, FileText, Plus, RefreshCw, Star, Trash2, Upload, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface PersonForm {
    id: number | null;
    lastName: string;
    firstName: string;
    taxId: string;
    isPrimary: boolean;
    moveInDate: Date | undefined;
}

const EMPTY_PRIMARY_PERSON: PersonForm = { id: null, lastName: '', firstName: '', taxId: '', isPrimary: true, moveInDate: undefined };

/** Ausweis/Schufa/Bürgschaft are always per person. Mietvertrag defaults to
 *  one shared contract for the whole tenancy (single row); the "Individuell"
 *  toggle swaps that row for one per person, for cases where each tenant
 *  signed a separate contract. */
const PER_PERSON_DOCUMENTS: TenancyDocumentType[] = ['Ausweis', 'Schufa', 'Bürgschaft'];
const SHARED_DOCUMENTS: TenancyDocumentType[] = ['Mietvertrag'];
/** Mieterbescheinigung is always one shared row for the whole tenancy — it
 *  has no Individuell/Gemeinsam toggle since the certificate always lists
 *  every tenant. */
const MIETERBESCHEINIGUNG: TenancyDocumentType = 'Mieterbescheinigung';

function personDisplayName(person: PersonForm, index: number): string {
    const name = `${person.firstName} ${person.lastName}`.trim();
    return name || `Person ${index + 1}`;
}

function allTenantsDisplayName(persons: PersonForm[]): string {
    const names = persons.map((p, i) => personDisplayName(p, i));
    if (names.length <= 1) return names[0] ?? 'Alle Mieter';
    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/** Comparable snapshot of the person list — Date fields don't compare
 *  reliably with JSON.stringify unless normalized to ISO strings first. */
function serializePersons(persons: PersonForm[]): string {
    return JSON.stringify(persons.map((p) => ({ ...p, moveInDate: p.moveInDate ? p.moveInDate.toISOString() : null })));
}

interface TenantUnitDetailProps {
    propertyId: string;
    property: Property;
    unit: PropertyUnit;
    hasMultipleUnits: boolean;
}

export function TenantUnitDetail({ propertyId, property, unit, hasMultipleUnits }: TenantUnitDetailProps) {
    const router = useRouter();
    const { user } = useRequireAuth();
    const { showToast } = useToast();

    const [tenancy, setTenancy] = useState<Tenancy | null>(null);
    const [persons, setPersons] = useState<PersonForm[]>([EMPTY_PRIMARY_PERSON]);
    const [deletedPersonIds, setDeletedPersonIds] = useState<number[]>([]);
    const [personIndexPendingDelete, setPersonIndexPendingDelete] = useState<number | null>(null);
    const [deposit, setDeposit] = useState('');
    const [startFreshTenancy, setStartFreshTenancy] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [landlord, setLandlord] = useState<PersonalData | null | undefined>(undefined);
    const [docSortKey, setDocSortKey] = useState<string>('document');
    const [docSortDirection, setDocSortDirection] = useState<SortDirection>('asc');
    const [docColumnFilters, setDocColumnFilters] = useState<Record<string, string>>({});
    const [documents, setDocuments] = useState<TenancyDocument[]>([]);
    const [pendingDocKey, setPendingDocKey] = useState<string | null>(null);
    const [docPendingDelete, setDocPendingDelete] = useState<{ key: string; label: string; doc: TenancyDocument } | null>(null);
    const [mietvertragIndividual, setMietvertragIndividual] = useState(false);
    const [activeTab, setActiveTab] = useState<'mieter' | 'mietvertrag'>('mieter');
    const [originalPersonsSnapshot, setOriginalPersonsSnapshot] = useState(() => serializePersons([EMPTY_PRIMARY_PERSON]));
    const [originalDeposit, setOriginalDeposit] = useState('');
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getCurrentTenancyByUnit(unit.propertyUnitId).then(async (found) => {
            if (cancelled) return;
            setTenancy(found);
            const loadedDeposit = found?.deposit != null ? String(found.deposit) : '';
            setDeposit(loadedDeposit);
            setOriginalDeposit(loadedDeposit);
            if (found) {
                const [loadedPersons, loadedDocuments] = await Promise.all([
                    getTenancyPersonsByTenancy(found.tenancyId),
                    getTenancyDocumentsByTenancy(found.tenancyId),
                ]);
                if (cancelled) return;
                const mappedPersons = loadedPersons.length > 0
                    ? loadedPersons.map((p) => ({
                        id: p.tenancyPersonId,
                        lastName: p.lastName ?? '',
                        firstName: p.firstName ?? '',
                        taxId: p.taxId ?? '',
                        isPrimary: p.isPrimary,
                        moveInDate: p.moveInDate ? new Date(p.moveInDate) : undefined,
                    }))
                    : [EMPTY_PRIMARY_PERSON];
                setPersons(mappedPersons);
                setOriginalPersonsSnapshot(serializePersons(mappedPersons));
                setDocuments(loadedDocuments);
            } else {
                setPersons([EMPTY_PRIMARY_PERSON]);
                setOriginalPersonsSnapshot(serializePersons([EMPTY_PRIMARY_PERSON]));
                setDocuments([]);
            }
        });
        return () => { cancelled = true; };
    }, [unit.propertyUnitId]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        getPersonalData(user.id).then((data) => { if (!cancelled) setLandlord(data ?? null); });
        return () => { cancelled = true; };
    }, [user]);

    const status = useMemo(() => {
        if (!tenancy || startFreshTenancy) return 'Unvermietet' as const;
        return 'Vermietet' as const;
    }, [tenancy, startFreshTenancy]);

    const isEditing = startFreshTenancy || deposit !== originalDeposit || serializePersons(persons) !== originalPersonsSnapshot;

    // Any navigation away from an unsaved edit is routed through here so it
    // can be confirmed first (breadcrumb links, Zurück, Anwendungsfall).
    const goTo = (href: string) => {
        if (isEditing) {
            setPendingHref(href);
        } else {
            router.push(href);
        }
    };

    const confirmDiscard = () => {
        if (pendingHref) router.push(pendingHref);
        setPendingHref(null);
    };

    // Upload is only possible once the underlying row is actually saved —
    // a draft person (id === null) or a unit with no tenancy yet has
    // nothing to attach the document to. Mietvertrag is either one shared
    // row (default) or one row per person — never both — toggled via
    // mietvertragIndividual; every Mietvertrag row carries the toggle
    // button so switching modes is reachable from any of them.
    // Mietvertrag can't meaningfully be generated without the landlord's own
    // (Vermieter) data, so the whole row — upload, toggle and Generieren —
    // stays disabled until user-settings has been filled in.
    const landlordMissing = !landlord;

    // Ausweis/Schufa/Bürgschaft only — Mietvertrag and Mieterbescheinigung
    // moved to the "Generierbare Dokumente" section below, where the
    // generate action can be a lot more prominent than a table icon.
    const documentRows = useMemo(() => (
        persons.flatMap((person, personIndex) =>
            PER_PERSON_DOCUMENTS.map((document) => ({
                key: `${document}-${personIndex}`,
                document,
                tenant: personDisplayName(person, personIndex),
                tenancyPersonId: person.id,
                canUpload: tenancy != null && person.id != null,
                doc: person.id != null
                    ? documents.find((d) => d.tenancyPersonId === person.id && d.documentType === document)
                    : undefined,
            }))
        )
    ), [persons, documents, tenancy]);

    const documentFilterOptions = useMemo(
        () => PER_PERSON_DOCUMENTS.map((value) => ({ value, label: value })),
        []
    );

    const mietvertrag = SHARED_DOCUMENTS[0];

    const mietvertragRows = useMemo(() => (
        mietvertragIndividual
            ? persons.map((person, personIndex) => ({
                key: `${mietvertrag}-${personIndex}`,
                tenant: personDisplayName(person, personIndex),
                tenancyPersonId: person.id,
                canUpload: tenancy != null && person.id != null,
                doc: person.id != null
                    ? documents.find((d) => d.tenancyPersonId === person.id && d.documentType === mietvertrag)
                    : undefined,
            }))
            : [{
                key: mietvertrag,
                tenant: allTenantsDisplayName(persons),
                tenancyPersonId: null as number | null,
                canUpload: tenancy != null,
                doc: documents.find((d) => d.tenancyPersonId === null && d.documentType === mietvertrag),
            }]
    ), [persons, documents, tenancy, mietvertragIndividual, mietvertrag]);

    const mieterbescheinigungRow = useMemo(() => ({
        key: MIETERBESCHEINIGUNG,
        tenant: allTenantsDisplayName(persons),
        canUpload: tenancy != null,
        doc: documents.find((d) => d.tenancyPersonId === null && d.documentType === MIETERBESCHEINIGUNG),
    }), [persons, documents, tenancy]);

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
            const av = String(a[docSortKey as keyof typeof a] ?? '');
            const bv = String(b[docSortKey as keyof typeof a] ?? '');
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return docSortDirection === 'asc' ? cmp : -cmp;
        });
    }, [documentRows, docColumnFilters, docSortKey, docSortDirection]);

    const useCaseMenuItems = useMemo(() =>
        createUseCaseMenuItems(propertyId, 'TenantData', (route) => {
            goTo(route);
        }),
        [propertyId, isEditing] // eslint-disable-line react-hooks/exhaustive-deps
    );

    // With multiple Wohneinheiten, "Mieterdaten" links back to the units
    // overview and the unit label becomes the current breadcrumb segment.
    // Every link is routed through goTo() so an in-progress edit is
    // confirmed before actually navigating away.
    const breadcrumbItems: BreadcrumbItem[] = hasMultipleUnits
        ? [
            {
                label: 'Bestandsobjekte',
                href: '/existing-properties',
                onClick: (e) => { if (isEditing) { e.preventDefault(); goTo('/existing-properties'); } },
            },
            {
                label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
                href: `/existing-properties/${propertyId}`,
                onClick: (e) => { if (isEditing) { e.preventDefault(); goTo(`/existing-properties/${propertyId}`); } },
            },
            {
                label: ExistingPropertiesUseCases.TenantData,
                href: `/existing-properties/${propertyId}/tenant-data`,
                onClick: (e) => { if (isEditing) { e.preventDefault(); goTo(`/existing-properties/${propertyId}/tenant-data`); } },
            },
            { label: formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote) },
        ]
        : [
            {
                label: 'Bestandsobjekte',
                href: '/existing-properties',
                onClick: (e) => { if (isEditing) { e.preventDefault(); goTo('/existing-properties'); } },
            },
            {
                label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
                href: `/existing-properties/${propertyId}`,
                onClick: (e) => { if (isEditing) { e.preventDefault(); goTo(`/existing-properties/${propertyId}`); } },
            },
            { label: ExistingPropertiesUseCases.TenantData },
        ];

    const updatePerson = (index: number, patch: Partial<PersonForm>) => {
        setPersons((prev) => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
    };

    const addPerson = () => {
        setPersons((prev) => [...prev, { id: null, lastName: '', firstName: '', taxId: '', isPrimary: false, moveInDate: undefined }]);
    };

    const removePerson = (index: number) => {
        setPersons((prev) => {
            const removed = prev[index];
            if (removed.id) setDeletedPersonIds((ids) => [...ids, removed.id!]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Already-saved persons (id !== null) get a confirmation modal before
    // removal; drafts that were never persisted can just be dropped.
    const handleDeletePersonClick = (index: number) => {
        if (index === 0) return;
        if (persons[index].id !== null) {
            setPersonIndexPendingDelete(index);
        } else {
            removePerson(index);
        }
    };

    const confirmDeletePerson = () => {
        if (personIndexPendingDelete !== null) removePerson(personIndexPendingDelete);
        setPersonIndexPendingDelete(null);
    };

    // The primary tenant is always index 0 (required fields, non-deletable),
    // so making someone else primary means moving them to the front.
    const makePrimary = (index: number) => {
        if (index === 0) return;
        setPersons((prev) => {
            const next = prev.map((p, i) => ({ ...p, isPrimary: i === index }));
            const [newPrimary] = next.splice(index, 1);
            return [newPrimary, ...next];
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
                    const moveInDate = p.moveInDate ? format(p.moveInDate, 'yyyy-MM-dd') : null;
                    if (p.id) {
                        await updateTenancyPerson(p.id, {
                            lastName: p.lastName || null,
                            firstName: p.firstName || null,
                            taxId: p.taxId || null,
                            moveInDate,
                        });
                    } else if (p.lastName.trim() !== '' || p.firstName.trim() !== '') {
                        await createTenancyPerson({
                            tenancyId: activeTenancyId,
                            lastName: p.lastName || null,
                            firstName: p.firstName || null,
                            taxId: p.taxId || null,
                            isPrimary: p.isPrimary,
                            sortOrder: i,
                            moveInDate,
                        });
                    }
                }
            }

            for (const id of deletedPersonIds) {
                await deleteTenancyPerson(id);
            }

            showToast('Mieterdaten gespeichert.');
            router.push(backHref);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadDocument = async (
        key: string,
        tenancyPersonId: number | null,
        documentType: TenancyDocumentType,
        file: File,
    ) => {
        if (!tenancy || !user) return;
        setPendingDocKey(key);
        try {
            const uploaded = await uploadTenancyDocument(user.id, file, {
                tenancyId: tenancy.tenancyId,
                tenancyPersonId,
                documentType,
            });
            if (uploaded) {
                setDocuments((prev) => [...prev.filter((d) => d.tenancyDocumentId !== uploaded.tenancyDocumentId), uploaded]);
            } else {
                setError('Datei konnte nicht hochgeladen werden.');
            }
        } finally {
            setPendingDocKey(null);
        }
    };

    const handleViewDocument = async (doc: TenancyDocument) => {
        const url = await getTenancyDocumentUrl(doc.storagePath);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    // The signed URL is cross-origin, so a plain <a download> doesn't force
    // a download in every browser — fetch the bytes and save them locally.
    const handleDownloadDocument = async (doc: TenancyDocument) => {
        const url = await getTenancyDocumentUrl(doc.storagePath);
        if (!url) return;
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
    };

    const confirmDeleteDocument = async () => {
        if (!docPendingDelete) return;
        const { key, doc } = docPendingDelete;
        setPendingDocKey(key);
        try {
            const success = await deleteTenancyDocument(doc.tenancyDocumentId, doc.storagePath);
            if (success) {
                setDocuments((prev) => prev.filter((d) => d.tenancyDocumentId !== doc.tenancyDocumentId));
            }
        } finally {
            setPendingDocKey(null);
            setDocPendingDelete(null);
        }
    };

    const documentColumns: TableColumn<Record<string, unknown>>[] = [
        {
            key: 'document',
            label: 'Dokument',
            width: '140px',
            sortable: true,
            filterable: true,
            filterOptions: documentFilterOptions,
        },
        {
            key: 'tenant',
            label: 'Mieter',
            width: '220px',
            sortable: true,
            filterable: true,
            filterOptions: tenantFilterOptions,
            renderCell: (v) => <span className="block truncate" title={String(v)}>{String(v)}</span>,
        },
        {
            key: 'file',
            label: 'Datei',
            width: '200px',
            renderCell: (_v, row) => {
                const fileName = (row.doc as TenancyDocument | undefined)?.fileName ?? '–';
                return <span className="block truncate" title={fileName}>{fileName}</span>;
            },
        },
        {
            key: 'action',
            label: 'Aktion',
            width: '140px',
            align: 'right',
            renderCell: (_v, row) => {
                const key = row.key as string;
                const doc = row.doc as TenancyDocument | undefined;
                const isPending = pendingDocKey === key;

                if (doc) {
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => void handleViewDocument(doc)}
                                aria-label={`${row.document as string} ansehen`}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDownloadDocument(doc)}
                                aria-label={`${row.document as string} herunterladen`}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocPendingDelete({ key, doc, label: `${row.document as string} von ${row.tenant as string}` })}
                                disabled={isPending}
                                aria-label={`${row.document as string} löschen`}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }

                if (!row.canUpload) {
                    return (
                        <div className="flex justify-end">
                            <span title="Bitte zuerst speichern">
                                <Button
                                    iconOnly
                                    icon={<Upload className="w-4 h-4" />}
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    aria-label={`${row.document as string} für ${row.tenant as string} hochladen`}
                                />
                            </span>
                        </div>
                    );
                }

                const inputId = `tenancy-document-upload-${key}`;
                return (
                    <div className="flex justify-end">
                        <input
                            id={inputId}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            disabled={isPending}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (file) {
                                    void handleUploadDocument(key, row.tenancyPersonId as number | null, row.document as TenancyDocumentType, file);
                                }
                            }}
                        />
                        <label
                            htmlFor={inputId}
                            aria-label={`${row.document as string} für ${row.tenant as string} hochladen`}
                            title="Hochladen"
                            className={cn(
                                "inline-flex items-center justify-center p-1.5 rounded-lg border-2 border-primary text-primary cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground",
                                isPending && "opacity-50 pointer-events-none"
                            )}
                        >
                            <Upload className="w-4 h-4" />
                        </label>
                    </div>
                );
            },
        },
    ];

    // Shared row renderer for the Mietvertrag/Mieterbescheinigung cards in
    // "Generierbare Dokumente" — same view/download/delete/upload logic as
    // the Unterlagen table's action column, just inside a card row instead
    // of a table cell.
    const renderDocRow = (
        row: { key: string; tenant: string; tenancyPersonId?: number | null; canUpload: boolean; doc?: TenancyDocument },
        documentType: TenancyDocumentType,
        blocked: boolean,
    ) => {
        const isPending = pendingDocKey === row.key;
        return (
            <div key={row.key} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30">
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-foreground truncate">{row.tenant}</span>
                    {row.doc && (
                        <button
                            type="button"
                            onClick={() => void handleViewDocument(row.doc!)}
                            title={row.doc.fileName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium max-w-[180px] hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate">{row.doc.fileName}</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {row.doc ? (
                        <>
                            <button
                                type="button"
                                onClick={() => void handleDownloadDocument(row.doc!)}
                                aria-label="Herunterladen"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocPendingDelete({ key: row.key, doc: row.doc!, label: `${documentType} von ${row.tenant}` })}
                                disabled={isPending}
                                aria-label="Löschen"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : !row.canUpload || blocked ? (
                        <span title={blocked ? 'Bitte zuerst Vermieterdaten in den Einstellungen hinterlegen' : 'Bitte zuerst speichern'}>
                            <Button iconOnly icon={<Upload className="w-4 h-4" />} variant="outline" size="sm" disabled aria-label="Hochladen" />
                        </span>
                    ) : (
                        <>
                            <input
                                id={`doc-upload-${row.key}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="sr-only"
                                disabled={isPending}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (file) void handleUploadDocument(row.key, row.tenancyPersonId ?? null, documentType, file);
                                }}
                            />
                            <label
                                htmlFor={`doc-upload-${row.key}`}
                                title="Hochladen"
                                className={cn(
                                    "inline-flex items-center justify-center p-1.5 rounded-lg border-2 border-primary text-primary cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground",
                                    isPending && "opacity-50 pointer-events-none"
                                )}
                            >
                                <Upload className="w-4 h-4" />
                            </label>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const generatorBase = `/existing-properties/${propertyId}/tenant-data/unit/${unit.propertyUnitId}`;

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

                <div className="mt-8 space-y-6">
                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Tag label={status} variant={status === 'Vermietet' ? 'success' : 'muted'} />
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

                            {/* Tabs */}
                            <div className="flex items-center gap-6 border-b border-border">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('mieter')}
                                    className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'mieter' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <User className="w-4 h-4" />
                                    Aktueller Mieter
                                    {activeTab === 'mieter' && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('mietvertrag')}
                                    className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'mietvertrag' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <FileSignature className="w-4 h-4" />
                                    Mietvertrag
                                    {activeTab === 'mietvertrag' && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary" />}
                                </button>
                            </div>

                            {activeTab === 'mieter' && (
                            <>
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
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => makePrimary(index)}
                                                        aria-label="Zum Hauptmieter machen"
                                                        title="Zum Hauptmieter machen"
                                                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePersonClick(index)}
                                                        aria-label="Person entfernen"
                                                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                                                label={person.isPrimary ? 'Steuer-ID *' : 'Steuer-ID (opt.)'}
                                                placeholder="00 000 000 000"
                                                value={person.taxId}
                                                onChange={(e) => updatePerson(index, { taxId: e.target.value })}
                                            />
                                            <CalendarField
                                                label={person.isPrimary ? 'Einzug *' : 'Einzug (opt.)'}
                                                value={person.moveInDate}
                                                onChange={(date) => updatePerson(index, { moveInDate: date })}
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
                            </>
                            )}

                            {activeTab === 'mietvertrag' && (
                            <div>
                                <SectionLabel>Dokumente</SectionLabel>
                                <div className="mt-3 flex flex-col gap-4">
                                    <div className="rounded-lg border border-border bg-card p-4">
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <FileSignature className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-semibold text-foreground">Mietvertrag</span>
                                            </div>
                                            <Button
                                                iconOnly
                                                icon={mietvertragIndividual ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                variant="outline"
                                                size="sm"
                                                disabled={landlordMissing}
                                                title={landlordMissing ? 'Bitte zuerst Vermieterdaten in den Einstellungen hinterlegen' : (mietvertragIndividual ? 'Gemeinsam' : 'Individuell')}
                                                aria-label={mietvertragIndividual ? 'Gemeinsam' : 'Individuell'}
                                                onClick={() => setMietvertragIndividual((prev) => !prev)}
                                            />
                                        </div>

                                        <div className="mt-3 flex flex-col gap-2">
                                            {mietvertragRows.map((row) => renderDocRow(row, mietvertrag, landlordMissing))}
                                        </div>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Wohnraummietvertrag für die Mietpartei(en) dieser Einheit, inklusive Mietkonditionen, Kaution und Sonderregelungen.
                                        </p>

                                        <div className="mt-3 flex items-center justify-end gap-2">
                                            <Button
                                                label="Daten prüfen & Vorschau"
                                                icon={<Eye className="w-4 h-4" />}
                                                variant="outline"
                                                disabled={landlordMissing || tenancy == null}
                                                onClick={() => goTo(`${generatorBase}/rental-agreement`)}
                                            />
                                            <Button
                                                label="PDF generieren"
                                                icon={<FileText className="w-4 h-4" />}
                                                variant="primary"
                                                disabled={landlordMissing || tenancy == null}
                                                onClick={() => goTo(`${generatorBase}/rental-agreement?autoGenerate=1`)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

                            {activeTab === 'mieter' && (
                            <>
                            {/* Generierbare Dokumente */}
                            <div>
                                <SectionLabel>Generierbare Dokumente</SectionLabel>
                                <div className="mt-3 flex flex-col gap-4">
                                    <div className="rounded-lg border border-border bg-card p-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-semibold text-foreground">Mieterbescheinigung</span>
                                        </div>

                                        <div className="mt-3 flex flex-col gap-2">
                                            {renderDocRow(mieterbescheinigungRow, MIETERBESCHEINIGUNG, false)}
                                        </div>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Bestätigt das bestehende Mietverhältnis für alle Mietparteien auf Basis der hinterlegten Daten.
                                        </p>

                                        <div className="mt-3 flex items-center justify-end gap-2">
                                            <Button
                                                label="Daten prüfen & Vorschau"
                                                icon={<Eye className="w-4 h-4" />}
                                                variant="outline"
                                                disabled={tenancy == null}
                                                onClick={() => goTo(`${generatorBase}/certificate`)}
                                            />
                                            <Button
                                                label="PDF generieren"
                                                icon={<FileText className="w-4 h-4" />}
                                                variant="primary"
                                                disabled={tenancy == null}
                                                onClick={() => goTo(`${generatorBase}/certificate?autoGenerate=1`)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mietkaution */}
                            <div>
                                <SectionLabel>Mietkaution</SectionLabel>
                                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-end gap-3">
                                    <div className="w-full sm:w-48">
                                        <NumberField
                                            label="Betrag (informativ)"
                                            placeholder="z.B. 2.400"
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
                            </>
                            )}
                </div>
            </main>

            <StickyActionBar
                show={true}
                onGhost={() => goTo(backHref)}
                onPrimary={() => void handleSave()}
                ghostLabel={BUTTON_DETAILS.Back.label}
                ghostIcon={<BUTTON_DETAILS.Back.icon />}
                primaryLabel="Mieterdaten speichern"
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={!isEditing || isSaving}
            />

            <ConfirmDeleteModal
                open={personIndexPendingDelete !== null}
                onCancel={() => setPersonIndexPendingDelete(null)}
                onConfirm={confirmDeletePerson}
                title="Person löschen?"
            >
                <p className="text-sm text-muted-foreground">
                    {personIndexPendingDelete !== null
                        ? `Möchten Sie ${personDisplayName(persons[personIndexPendingDelete], personIndexPendingDelete)} wirklich löschen?`
                        : ''}
                </p>
            </ConfirmDeleteModal>

            <ConfirmDeleteModal
                open={docPendingDelete !== null}
                onCancel={() => setDocPendingDelete(null)}
                onConfirm={() => void confirmDeleteDocument()}
                title="Dokument löschen?"
                confirmDisabled={pendingDocKey !== null}
            >
                <p className="text-sm text-muted-foreground">
                    {docPendingDelete
                        ? `Möchten Sie ${docPendingDelete.label} wirklich löschen?`
                        : ''}
                </p>
            </ConfirmDeleteModal>

            <UnsavedChangesModal
                open={pendingHref !== null}
                onCancel={() => setPendingHref(null)}
                onDiscard={confirmDiscard}
                context="an den Mieterdaten"
            />
        </div>
    );
}
