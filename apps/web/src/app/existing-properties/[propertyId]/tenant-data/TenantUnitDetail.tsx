"use client";

import { formatUnitLabel } from '@/components/features/PropertyDisplay';
import { DataCard } from './DocumentGeneratorParts';
import { Button, CalendarField, ComingSoonButton, ConfirmDeleteModal, Header, Modal, NumberField, SectionLabel, StickyActionBar, Switch, Table, Tag, TextField, UnsavedChangesModal, useToast, type BreadcrumbItem, type SortDirection, type TableColumn } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createTenancy, getCurrentTenancyByUnit, updateTenancy } from '@/lib/supabase/tenancy.supabase';
import { getPersonalData } from '@/lib/supabase/personal_data.supabase';
import { createMaintenanceCosts, getMaintenanceCostsById, updateMaintenanceCosts } from '@/lib/supabase/maintenance_costs.supabase';
import { addAdjustmentHistoryEntry, getAdjustmentHistoryByTenancy } from '@/lib/supabase/tenancy_adjustment_history.supabase';
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
import { base64ToDataUri, cn, deCurrencyFormatter, formatDeDate } from '@/lib/utils';
import { openAndPrintLetter, renovationAdjustmentLetterHtml, rentIncreaseLetterHtml } from './adjustmentLetters';
import type { MaintenanceCostItem, MaintenanceCosts, PersonalData, Property, PropertyUnit, Tenancy, TenancyAdjustmentHistoryEntry, TenancyAdjustmentType, TenancyDocument, TenancyDocumentType } from '@immonext/types';
import { format } from 'date-fns';
import { AlertTriangle, BadgeCheck, Calculator, Download, Eye, FileSignature, FileText, History, ListChecks, Plus, RefreshCw, Star, Trash2, TrendingUp, Upload, User, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function euro(value: number | null | undefined): string {
    return value != null ? `${deCurrencyFormatter.format(value)} €` : '–';
}

function addMonthsSafe(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

interface RentalForm {
    tenancyEndDate: Date | undefined;
    coldRent: string;
    parkingSpaceRent: string;
    houseMoney: string;
    allocableCosts: string;
    nonAllocableCosts: string;
    totalCosts: string;
    nextRentAdjustmentDate: Date | undefined;
    nextRentAdjustmentAmount: string;
    rentAdjustmentReminderDate: Date | undefined;
    renovationAdjustmentStartDate: Date | undefined;
    renovationAdjustmentEndDate: Date | undefined;
    renovationAdjustmentAmount: string;
    renovationAdjustmentReminderDate: Date | undefined;
}

const EMPTY_RENTAL_FORM: RentalForm = {
    tenancyEndDate: undefined,
    coldRent: '',
    parkingSpaceRent: '',
    houseMoney: '',
    allocableCosts: '',
    nonAllocableCosts: '',
    totalCosts: '',
    nextRentAdjustmentDate: undefined,
    nextRentAdjustmentAmount: '',
    rentAdjustmentReminderDate: undefined,
    renovationAdjustmentStartDate: undefined,
    renovationAdjustmentEndDate: undefined,
    renovationAdjustmentAmount: '',
    renovationAdjustmentReminderDate: undefined,
};

function serializeRentalForm(form: RentalForm): string {
    return JSON.stringify({
        ...form,
        tenancyEndDate: form.tenancyEndDate?.toISOString() ?? null,
        nextRentAdjustmentDate: form.nextRentAdjustmentDate?.toISOString() ?? null,
        rentAdjustmentReminderDate: form.rentAdjustmentReminderDate?.toISOString() ?? null,
        renovationAdjustmentStartDate: form.renovationAdjustmentStartDate?.toISOString() ?? null,
        renovationAdjustmentEndDate: form.renovationAdjustmentEndDate?.toISOString() ?? null,
        renovationAdjustmentReminderDate: form.renovationAdjustmentReminderDate?.toISOString() ?? null,
    });
}

/** Common § 2 BetrKV positions, preselected as umlagefähig except the two
 *  that legally never are (Verwaltung, Instandhaltungsrücklage). Amounts
 *  start at 0 — unused rows are simply not summed. */
const DEFAULT_COST_ITEMS: MaintenanceCostItem[] = [
    { id: 'grundsteuer', label: 'Grundsteuer', amount: 0, allocable: true },
    { id: 'wasser', label: 'Wasserversorgung', amount: 0, allocable: true },
    { id: 'entwaesserung', label: 'Entwässerung', amount: 0, allocable: true },
    { id: 'heizung', label: 'Heizung', amount: 0, allocable: true },
    { id: 'warmwasser', label: 'Warmwasser', amount: 0, allocable: true },
    { id: 'aufzug', label: 'Aufzug', amount: 0, allocable: true },
    { id: 'strassenreinigung', label: 'Straßenreinigung / Müllabfuhr', amount: 0, allocable: true },
    { id: 'gebaeudereinigung', label: 'Gebäudereinigung / Ungezieferbekämpfung', amount: 0, allocable: true },
    { id: 'gartenpflege', label: 'Gartenpflege', amount: 0, allocable: true },
    { id: 'beleuchtung', label: 'Beleuchtung', amount: 0, allocable: true },
    { id: 'schornstein', label: 'Schornsteinreinigung', amount: 0, allocable: true },
    { id: 'versicherung', label: 'Sach- / Haftpflichtversicherung', amount: 0, allocable: true },
    { id: 'hausmeister', label: 'Hausmeister', amount: 0, allocable: true },
    { id: 'kabel', label: 'Gemeinschaftsantenne / Kabel', amount: 0, allocable: true },
    { id: 'sonstige', label: 'Sonstige Betriebskosten', amount: 0, allocable: true },
    { id: 'verwaltung', label: 'Verwaltungskosten', amount: 0, allocable: false },
    { id: 'instandhaltung', label: 'Instandhaltungsrücklage', amount: 0, allocable: false },
];

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
    const [maintenanceCosts, setMaintenanceCosts] = useState<MaintenanceCosts | null>(null);
    const [rentalForm, setRentalForm] = useState<RentalForm>(EMPTY_RENTAL_FORM);
    const [originalRentalFormSnapshot, setOriginalRentalFormSnapshot] = useState(() => serializeRentalForm(EMPTY_RENTAL_FORM));
    const [costItems, setCostItems] = useState<MaintenanceCostItem[]>([]);
    const [originalCostItemsSnapshot, setOriginalCostItemsSnapshot] = useState('[]');
    const [costItemsModalOpen, setCostItemsModalOpen] = useState(false);
    const [costItemsDraft, setCostItemsDraft] = useState<MaintenanceCostItem[]>([]);
    const [historyModalType, setHistoryModalType] = useState<TenancyAdjustmentType | null>(null);
    const [historyEntries, setHistoryEntries] = useState<TenancyAdjustmentHistoryEntry[]>([]);
    const [isGeneratingLetter, setIsGeneratingLetter] = useState<TenancyAdjustmentType | null>(null);

    useEffect(() => {
        let cancelled = false;
        getCurrentTenancyByUnit(unit.propertyUnitId).then(async (found) => {
            if (cancelled) return;
            setTenancy(found);
            const loadedDeposit = found?.deposit != null ? String(found.deposit) : '';
            setDeposit(loadedDeposit);
            setOriginalDeposit(loadedDeposit);
            if (found) {
                const [loadedPersons, loadedDocuments, loadedMaintenanceCosts, loadedHistory] = await Promise.all([
                    getTenancyPersonsByTenancy(found.tenancyId),
                    getTenancyDocumentsByTenancy(found.tenancyId),
                    found.maintenanceCostsId ? getMaintenanceCostsById(found.maintenanceCostsId) : Promise.resolve(null),
                    getAdjustmentHistoryByTenancy(found.tenancyId),
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
                setMaintenanceCosts(loadedMaintenanceCosts);
                setHistoryEntries(loadedHistory);
                const loadedCostItems = loadedMaintenanceCosts?.costItems ?? [];
                setCostItems(loadedCostItems);
                setOriginalCostItemsSnapshot(JSON.stringify(loadedCostItems));
                const form: RentalForm = {
                    tenancyEndDate: found.tenancyEndDate ? new Date(found.tenancyEndDate) : undefined,
                    coldRent: found.coldRent != null ? String(found.coldRent) : '',
                    parkingSpaceRent: found.parkingSpaceRent != null ? String(found.parkingSpaceRent) : '',
                    houseMoney: loadedMaintenanceCosts?.houseMoney != null ? String(loadedMaintenanceCosts.houseMoney) : '',
                    allocableCosts: loadedMaintenanceCosts?.allocableCosts != null ? String(loadedMaintenanceCosts.allocableCosts) : '',
                    nonAllocableCosts: loadedMaintenanceCosts?.nonAllocableCosts != null ? String(loadedMaintenanceCosts.nonAllocableCosts) : '',
                    totalCosts: loadedMaintenanceCosts?.totalCosts != null ? String(loadedMaintenanceCosts.totalCosts) : '',
                    nextRentAdjustmentDate: found.nextRentAdjustmentDate ? new Date(found.nextRentAdjustmentDate) : undefined,
                    nextRentAdjustmentAmount: found.nextRentAdjustmentAmount != null ? String(found.nextRentAdjustmentAmount) : '',
                    rentAdjustmentReminderDate: found.rentAdjustmentReminderDate ? new Date(found.rentAdjustmentReminderDate) : undefined,
                    renovationAdjustmentStartDate: found.renovationAdjustmentStartDate ? new Date(found.renovationAdjustmentStartDate) : undefined,
                    renovationAdjustmentEndDate: found.renovationAdjustmentEndDate ? new Date(found.renovationAdjustmentEndDate) : undefined,
                    renovationAdjustmentAmount: found.renovationAdjustmentAmount != null ? String(found.renovationAdjustmentAmount) : '',
                    renovationAdjustmentReminderDate: found.renovationAdjustmentReminderDate ? new Date(found.renovationAdjustmentReminderDate) : undefined,
                };
                setRentalForm(form);
                setOriginalRentalFormSnapshot(serializeRentalForm(form));
            } else {
                setPersons([EMPTY_PRIMARY_PERSON]);
                setOriginalPersonsSnapshot(serializePersons([EMPTY_PRIMARY_PERSON]));
                setDocuments([]);
                setMaintenanceCosts(null);
                setHistoryEntries([]);
                setCostItems([]);
                setOriginalCostItemsSnapshot('[]');
                setRentalForm(EMPTY_RENTAL_FORM);
                setOriginalRentalFormSnapshot(serializeRentalForm(EMPTY_RENTAL_FORM));
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

    const isEditing = startFreshTenancy
        || deposit !== originalDeposit
        || serializePersons(persons) !== originalPersonsSnapshot
        || serializeRentalForm(rentalForm) !== originalRentalFormSnapshot
        || JSON.stringify(costItems) !== originalCostItemsSnapshot;

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

    // Nebenkosten gesamt is computed as the sum of the two breakdown fields
    // whenever either is filled in — otherwise it stays freely editable.
    const costBreakdownActive = rentalForm.allocableCosts !== '' || rentalForm.nonAllocableCosts !== '';
    const computedTotalCosts = costBreakdownActive
        ? (Number(rentalForm.allocableCosts || 0) + Number(rentalForm.nonAllocableCosts || 0))
        : null;

    const defaultRentReminderDate = rentalForm.nextRentAdjustmentDate ? addMonthsSafe(rentalForm.nextRentAdjustmentDate, -4) : undefined;
    const effectiveRentReminderDate = rentalForm.rentAdjustmentReminderDate ?? defaultRentReminderDate;
    const defaultRenovationReminderDate = rentalForm.renovationAdjustmentStartDate ? addMonthsSafe(rentalForm.renovationAdjustmentStartDate, -4) : undefined;
    const effectiveRenovationReminderDate = rentalForm.renovationAdjustmentReminderDate ?? defaultRenovationReminderDate;

    // The reminder "banner" is a real, on-page check (not a push/email
    // notification, which this app has no infrastructure for): due once the
    // reminder date has passed and no letter has been generated since.
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
    const rentReminderDue = !!effectiveRentReminderDate && effectiveRentReminderDate <= today
        && !historyEntries.some((h) => h.adjustmentType === 'rent' && new Date(h.createdAt) >= effectiveRentReminderDate!);
    const renovationReminderDue = !!effectiveRenovationReminderDate && effectiveRenovationReminderDate <= today
        && !historyEntries.some((h) => h.adjustmentType === 'renovation' && new Date(h.createdAt) >= effectiveRenovationReminderDate!);

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
        setRentalForm(EMPTY_RENTAL_FORM);
        setCostItems([]);
        setMaintenanceCosts(null);
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

            // The Hauptmieter's own Einzugsdatum (persons[0].moveInDate) is the
            // single source of truth for the tenancy's move-in date — the
            // Mietvertrag tab's Einzugsdatum field edits that same value.
            const primaryMoveInDate = persons[0]?.moveInDate;
            const startDateValue = primaryMoveInDate ? format(primaryMoveInDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            const endDateValue = rentalForm.tenancyEndDate ? format(rentalForm.tenancyEndDate, 'yyyy-MM-dd') : null;
            const coldRentValue = rentalForm.coldRent !== '' ? Number(rentalForm.coldRent) : null;
            const parkingSpaceRentValue = rentalForm.parkingSpaceRent !== '' ? Number(rentalForm.parkingSpaceRent) : null;
            const adjustmentFields = {
                nextRentAdjustmentDate: rentalForm.nextRentAdjustmentDate ? format(rentalForm.nextRentAdjustmentDate, 'yyyy-MM-dd') : null,
                nextRentAdjustmentAmount: rentalForm.nextRentAdjustmentAmount !== '' ? Number(rentalForm.nextRentAdjustmentAmount) : null,
                rentAdjustmentReminderDate: rentalForm.rentAdjustmentReminderDate ? format(rentalForm.rentAdjustmentReminderDate, 'yyyy-MM-dd') : null,
                renovationAdjustmentStartDate: rentalForm.renovationAdjustmentStartDate ? format(rentalForm.renovationAdjustmentStartDate, 'yyyy-MM-dd') : null,
                renovationAdjustmentEndDate: rentalForm.renovationAdjustmentEndDate ? format(rentalForm.renovationAdjustmentEndDate, 'yyyy-MM-dd') : null,
                renovationAdjustmentAmount: rentalForm.renovationAdjustmentAmount !== '' ? Number(rentalForm.renovationAdjustmentAmount) : null,
                renovationAdjustmentReminderDate: rentalForm.renovationAdjustmentReminderDate ? format(rentalForm.renovationAdjustmentReminderDate, 'yyyy-MM-dd') : null,
                // Only ever forces this to true (renovation fields filled in here);
                // never clobbers an explicit false set on the Mietvertrag-generieren
                // page when this tab's renovation fields are left untouched.
                renovationAdjustmentPlanned: (rentalForm.renovationAdjustmentStartDate || rentalForm.renovationAdjustmentEndDate || rentalForm.renovationAdjustmentAmount !== '') ? true : undefined,
            };

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
                        tenancyStartDate: startDateValue,
                        tenancyEndDate: endDateValue,
                        tenancyType: null,
                        tenancyUnits: null,
                        tenancyUnitsPrice: null,
                        parkingSpaceRent: parkingSpaceRentValue,
                        miscRent: null,
                        warmRent: null,
                        coldRent: coldRentValue,
                        tenantFirstName: '',
                        tenantLastName: '',
                        deposit: depositValue,
                        ...adjustmentFields,
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
                    tenancyStartDate: startDateValue,
                    tenancyEndDate: endDateValue,
                    tenancyType: null,
                    tenancyUnits: null,
                    tenancyUnitsPrice: null,
                    parkingSpaceRent: parkingSpaceRentValue,
                    miscRent: null,
                    warmRent: null,
                    coldRent: coldRentValue,
                    tenantFirstName: '',
                    tenantLastName: '',
                    deposit: depositValue,
                    ...adjustmentFields,
                });
                activeTenancyId = created?.tenancyId ?? null;
            } else if (tenancy) {
                await updateTenancy(tenancy.tenancyId, {
                    deposit: depositValue,
                    tenancyStartDate: startDateValue,
                    tenancyEndDate: endDateValue,
                    coldRent: coldRentValue,
                    parkingSpaceRent: parkingSpaceRentValue,
                    ...adjustmentFields,
                });
            }

            if (activeTenancyId) {
                const mcFieldsPresent = rentalForm.houseMoney !== '' || rentalForm.allocableCosts !== '' || rentalForm.nonAllocableCosts !== '' || rentalForm.totalCosts !== '' || costItems.length > 0;
                if (mcFieldsPresent) {
                    const totalCostsValue = computedTotalCosts != null ? computedTotalCosts : (rentalForm.totalCosts !== '' ? Number(rentalForm.totalCosts) : null);
                    const mcPayload = {
                        costBreakdown: costItems.length > 0,
                        allocableCosts: rentalForm.allocableCosts !== '' ? Number(rentalForm.allocableCosts) : null,
                        nonAllocableCosts: rentalForm.nonAllocableCosts !== '' ? Number(rentalForm.nonAllocableCosts) : null,
                        totalCosts: totalCostsValue,
                        houseMoney: rentalForm.houseMoney !== '' ? Number(rentalForm.houseMoney) : null,
                        costItems: costItems.length > 0 ? costItems : null,
                    };
                    if (maintenanceCosts) {
                        await updateMaintenanceCosts(maintenanceCosts.maintenanceCostsId, mcPayload);
                    } else {
                        const createdCosts = await createMaintenanceCosts({
                            propertyId: property.propertyId,
                            allocableCostsProjection: false,
                            nonAllocableCostsProjection: false,
                            totalCostsProjection: false,
                            ...mcPayload,
                        });
                        if (createdCosts) {
                            await updateTenancy(activeTenancyId, { maintenanceCostsId: createdCosts.maintenanceCostsId });
                        }
                    }
                }

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
        showUploadInRow: boolean = true,
    ) => {
        const isPending = pendingDocKey === row.key;
        return (
            <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 pr-2.5 rounded-lg bg-muted/30">
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-foreground truncate">{row.tenant}</span>
                    {row.doc ? (
                        <button
                            type="button"
                            onClick={() => void handleViewDocument(row.doc!)}
                            title={row.doc.fileName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium max-w-[180px] hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate">{row.doc.fileName}</span>
                        </button>
                    ) : !showUploadInRow && (
                        <span className="text-xs text-muted-foreground">Kein Dokument hinterlegt</span>
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
                    ) : !showUploadInRow ? null : !row.canUpload || blocked ? (
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

    // Standalone upload control for the footer of generated-document cards
    // (Mietvertrag, Mieterbescheinigung) — re-uploading replaces whatever's
    // there. Sized and styled to match the Button component's md/ghost look
    // exactly, since it can't use Button itself (needs to wrap a hidden
    // file input via a <label for>).
    const renderFooterUpload = (
        row: { key: string; tenancyPersonId?: number | null; canUpload: boolean },
        documentType: TenancyDocumentType,
        blocked: boolean,
        label: string = 'Datei hochladen',
    ) => {
        const isPending = pendingDocKey === row.key;
        if (!row.canUpload || blocked) {
            return (
                <span key={row.key} title={blocked ? 'Bitte zuerst Vermieterdaten in den Einstellungen hinterlegen' : 'Bitte zuerst speichern'}>
                    <Button label={label} icon={<Upload className="w-5 h-5" />} variant="ghost" disabled />
                </span>
            );
        }
        return (
            <span key={row.key}>
                <input
                    id={`doc-upload-footer-${row.key}`}
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
                    htmlFor={`doc-upload-footer-${row.key}`}
                    className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-transparent text-foreground cursor-pointer transition-all duration-200 hover:bg-muted",
                        isPending && "opacity-50 pointer-events-none"
                    )}
                >
                    <Upload className="w-5 h-5" />
                    {label}
                </label>
            </span>
        );
    };

    const generatorBase = `/existing-properties/${propertyId}/tenant-data/unit/${unit.propertyUnitId}`;

    const openCostItemsModal = () => {
        setCostItemsDraft(costItems.length > 0 ? costItems : DEFAULT_COST_ITEMS);
        setCostItemsModalOpen(true);
    };

    const updateCostItemsDraftRow = (id: string, patch: Partial<MaintenanceCostItem>) => {
        setCostItemsDraft((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
    };

    const addCostItemsDraftRow = () => {
        setCostItemsDraft((prev) => [...prev, { id: crypto.randomUUID(), label: '', amount: 0, allocable: true }]);
    };

    const removeCostItemsDraftRow = (id: string) => {
        setCostItemsDraft((prev) => prev.filter((item) => item.id !== id));
    };

    const draftAllocableSum = costItemsDraft.filter((i) => i.allocable).reduce((sum, i) => sum + (i.amount || 0), 0);
    const draftNonAllocableSum = costItemsDraft.filter((i) => !i.allocable).reduce((sum, i) => sum + (i.amount || 0), 0);

    const applyCostItemsDraft = () => {
        const usedItems = costItemsDraft.filter((i) => i.amount !== 0 || i.label.trim() !== '');
        setCostItems(usedItems);
        setRentalForm((prev) => ({
            ...prev,
            allocableCosts: String(usedItems.filter((i) => i.allocable).reduce((sum, i) => sum + (i.amount || 0), 0)),
            nonAllocableCosts: String(usedItems.filter((i) => !i.allocable).reduce((sum, i) => sum + (i.amount || 0), 0)),
        }));
        setCostItemsModalOpen(false);
    };

    const buildLetterParty = () => ({
        landlordName: landlord ? `${landlord.firstName} ${landlord.lastName}`.trim() : '',
        landlordStreet: landlord ? `${landlord.street} ${landlord.houseNumber}` : '',
        landlordCity: landlord ? `${landlord.postalCode} ${landlord.city}` : '',
        propertyAddress: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
        unitLabel: formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote),
        tenantNames: persons.filter((p) => p.lastName.trim() !== '' || p.firstName.trim() !== '').map((p) => `${p.firstName} ${p.lastName}`.trim()),
        issuePlace: landlord?.city || property.city,
        issueDate: formatDeDate(new Date().toISOString()),
    });

    const canGenerateRentIncreaseLetter = !landlordMissing && tenancy != null && rentalForm.nextRentAdjustmentDate != null && rentalForm.nextRentAdjustmentAmount !== '';
    const canGenerateRenovationLetter = !landlordMissing && tenancy != null && rentalForm.renovationAdjustmentAmount !== '' && (rentalForm.renovationAdjustmentStartDate != null || rentalForm.renovationAdjustmentEndDate != null);

    const handleGenerateRentIncreaseLetter = async () => {
        if (!tenancy || !canGenerateRentIncreaseLetter) return;
        setIsGeneratingLetter('rent');
        try {
            const effectiveDate = rentalForm.nextRentAdjustmentDate ? format(rentalForm.nextRentAdjustmentDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            const html = rentIncreaseLetterHtml({
                ...buildLetterParty(),
                currentColdRent: tenancy.coldRent,
                increaseAmount: Number(rentalForm.nextRentAdjustmentAmount),
                effectiveDate,
            });
            openAndPrintLetter(html);
            const created = await addAdjustmentHistoryEntry({
                tenancyId: tenancy.tenancyId,
                propertyId: property.propertyId,
                adjustmentType: 'rent',
                effectiveDate,
                amount: Number(rentalForm.nextRentAdjustmentAmount),
                note: 'Mieterhöhungsschreiben erstellt',
            });
            if (created) setHistoryEntries((prev) => [created, ...prev]);
        } finally {
            setIsGeneratingLetter(null);
        }
    };

    const handleGenerateRenovationLetter = async () => {
        if (!tenancy || !canGenerateRenovationLetter) return;
        setIsGeneratingLetter('renovation');
        try {
            const effectiveDate = rentalForm.renovationAdjustmentEndDate
                ? format(rentalForm.renovationAdjustmentEndDate, 'yyyy-MM-dd')
                : format(new Date(), 'yyyy-MM-dd');
            const html = renovationAdjustmentLetterHtml({
                ...buildLetterParty(),
                modernizationAmount: Number(rentalForm.renovationAdjustmentAmount),
                startDate: rentalForm.renovationAdjustmentStartDate ? format(rentalForm.renovationAdjustmentStartDate, 'yyyy-MM-dd') : null,
                endDate: rentalForm.renovationAdjustmentEndDate ? format(rentalForm.renovationAdjustmentEndDate, 'yyyy-MM-dd') : null,
                effectiveDate,
            });
            openAndPrintLetter(html);
            const created = await addAdjustmentHistoryEntry({
                tenancyId: tenancy.tenancyId,
                propertyId: property.propertyId,
                adjustmentType: 'renovation',
                effectiveDate,
                amount: Number(rentalForm.renovationAdjustmentAmount),
                note: 'Sanierungsanpassungsschreiben erstellt',
            });
            if (created) setHistoryEntries((prev) => [created, ...prev]);
        } finally {
            setIsGeneratingLetter(null);
        }
    };

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
                                                label={person.isPrimary ? 'Einzugsdatum *' : 'Einzugsdatum (opt.)'}
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
                            <>
                            <div>
                                <SectionLabel>Mietzeiten</SectionLabel>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <CalendarField
                                        label="Einzugsdatum *"
                                        value={persons[0]?.moveInDate}
                                        onChange={(date) => updatePerson(0, { moveInDate: date })}
                                    />
                                    <div>
                                        <CalendarField
                                            label="Auszugsdatum (opt.)"
                                            value={rentalForm.tenancyEndDate}
                                            onChange={(date) => setRentalForm((prev) => ({ ...prev, tenancyEndDate: date }))}
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">Synchronisiert mit Mieterauszug-Screen</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <SectionLabel>Miete & Nebenkosten</SectionLabel>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <NumberField
                                        label="Netto-Mieteinnahmen *"
                                        unit="€"
                                        value={rentalForm.coldRent}
                                        onChange={(e) => setRentalForm((prev) => ({ ...prev, coldRent: e.target.value }))}
                                        min={0}
                                    />
                                    <NumberField
                                        label="Stellplatz (opt.)"
                                        unit="€"
                                        value={rentalForm.parkingSpaceRent}
                                        onChange={(e) => setRentalForm((prev) => ({ ...prev, parkingSpaceRent: e.target.value }))}
                                        min={0}
                                    />
                                    <NumberField
                                        label="WEG (opt.)"
                                        unit="€"
                                        value={rentalForm.houseMoney}
                                        onChange={(e) => setRentalForm((prev) => ({ ...prev, houseMoney: e.target.value }))}
                                        min={0}
                                    />
                                    <div>
                                        <NumberField
                                            label="Nebenkosten gesamt"
                                            unit="€"
                                            value={costBreakdownActive ? String(computedTotalCosts) : rentalForm.totalCosts}
                                            onChange={(e) => setRentalForm((prev) => ({ ...prev, totalCosts: e.target.value }))}
                                            min={0}
                                            disabled={costBreakdownActive}
                                        />
                                        {costBreakdownActive && <p className="mt-1 text-xs text-muted-foreground">Berechnet aus Detailerfassung</p>}
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <NumberField
                                        label="NK umlagefähig"
                                        unit="€"
                                        value={rentalForm.allocableCosts}
                                        onChange={(e) => setRentalForm((prev) => ({ ...prev, allocableCosts: e.target.value }))}
                                        min={0}
                                    />
                                    <NumberField
                                        label="NK nicht umlagefähig"
                                        unit="€"
                                        value={rentalForm.nonAllocableCosts}
                                        onChange={(e) => setRentalForm((prev) => ({ ...prev, nonAllocableCosts: e.target.value }))}
                                        min={0}
                                    />
                                </div>
                                <div className="mt-3">
                                    <Button
                                        label="Detailerfassung Nebenkosten"
                                        icon={<ListChecks className="w-4 h-4" />}
                                        variant="outline"
                                        size="sm"
                                        onClick={openCostItemsModal}
                                    />
                                </div>
                            </div>

                            <div>
                                <SectionLabel>Anpassungen</SectionLabel>
                                <div className="mt-3 flex flex-col gap-4">
                                    <DataCard
                                        icon={TrendingUp}
                                        title="Nächste Mietanpassung"
                                        actions={
                                            <div className="flex items-center gap-2">
                                                <span title="Es besteht keine Verknüpfung zwischen diesem Objekt und einem Kalkulator-Ergebnis.">
                                                    <Button label="Vorschlag aus Kalkulator übernehmen" icon={<Calculator className="w-4 h-4" />} variant="outline" size="sm" disabled />
                                                </span>
                                                <Button label="Historie" icon={<History className="w-4 h-4" />} variant="outline" size="sm" onClick={() => setHistoryModalType('rent')} />
                                            </div>
                                        }
                                        footer={
                                            <>
                                                <span className="mr-auto text-xs font-medium text-muted-foreground">Mieterhöhungsschreiben</span>
                                                <span title={!canGenerateRentIncreaseLetter ? 'Bitte zuerst Datum, Höhe und Vermieterdaten hinterlegen' : undefined}>
                                                    <Button
                                                        label="Schreiben erstellen"
                                                        icon={<FileText className="w-4 h-4" />}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={!canGenerateRentIncreaseLetter || isGeneratingLetter === 'rent'}
                                                        onClick={() => void handleGenerateRentIncreaseLetter()}
                                                    />
                                                </span>
                                            </>
                                        }
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <CalendarField
                                                    label="Datum"
                                                    value={rentalForm.nextRentAdjustmentDate}
                                                    onChange={(date) => setRentalForm((prev) => ({ ...prev, nextRentAdjustmentDate: date }))}
                                                />
                                                <NumberField
                                                    label="Höhe"
                                                    unit="€"
                                                    value={rentalForm.nextRentAdjustmentAmount}
                                                    onChange={(e) => setRentalForm((prev) => ({ ...prev, nextRentAdjustmentAmount: e.target.value }))}
                                                />
                                                <div>
                                                    <CalendarField
                                                        label="Erinnerung"
                                                        value={effectiveRentReminderDate}
                                                        onChange={(date) => setRentalForm((prev) => ({ ...prev, rentAdjustmentReminderDate: date }))}
                                                    />
                                                    <p className="mt-1 text-xs text-muted-foreground">Automatisch: Datum -4 Monate</p>
                                                </div>
                                            </div>
                                            {rentReminderDue && (
                                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                    <span>Das Erinnerungsdatum ist erreicht. Du kannst die Mieterhöhung jetzt übernehmen oder ablehnen. Bei Übernahme wird die Netto-Mieteinnahme aktualisiert und ein Historieneintrag erzeugt.</span>
                                                </div>
                                            )}
                                        </div>
                                    </DataCard>

                                    <DataCard
                                        icon={Wrench}
                                        title="Sanierungsanpassung"
                                        actions={
                                            <div className="flex items-center gap-2">
                                                <span title="Es besteht keine Verknüpfung zwischen diesem Objekt und einem Kalkulator-Ergebnis.">
                                                    <Button label="Vorschlag aus Kalkulator übernehmen" icon={<Calculator className="w-4 h-4" />} variant="outline" size="sm" disabled />
                                                </span>
                                                <Button label="Historie" icon={<History className="w-4 h-4" />} variant="outline" size="sm" onClick={() => setHistoryModalType('renovation')} />
                                            </div>
                                        }
                                        footer={
                                            <>
                                                <span className="mr-auto text-xs font-medium text-muted-foreground">Sanierungsanpassungsschreiben</span>
                                                <span title={!canGenerateRenovationLetter ? 'Bitte zuerst Start/Abschluss, Höhe und Vermieterdaten hinterlegen' : undefined}>
                                                    <Button
                                                        label="Schreiben erstellen"
                                                        icon={<FileText className="w-4 h-4" />}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={!canGenerateRenovationLetter || isGeneratingLetter === 'renovation'}
                                                        onClick={() => void handleGenerateRenovationLetter()}
                                                    />
                                                </span>
                                            </>
                                        }
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                <CalendarField
                                                    label="Start"
                                                    value={rentalForm.renovationAdjustmentStartDate}
                                                    onChange={(date) => setRentalForm((prev) => ({ ...prev, renovationAdjustmentStartDate: date }))}
                                                />
                                                <CalendarField
                                                    label="Abschluss"
                                                    value={rentalForm.renovationAdjustmentEndDate}
                                                    onChange={(date) => setRentalForm((prev) => ({ ...prev, renovationAdjustmentEndDate: date }))}
                                                />
                                                <NumberField
                                                    label="Höhe"
                                                    unit="€"
                                                    value={rentalForm.renovationAdjustmentAmount}
                                                    onChange={(e) => setRentalForm((prev) => ({ ...prev, renovationAdjustmentAmount: e.target.value }))}
                                                />
                                                <div>
                                                    <CalendarField
                                                        label="Erinnerung"
                                                        value={effectiveRenovationReminderDate}
                                                        onChange={(date) => setRentalForm((prev) => ({ ...prev, renovationAdjustmentReminderDate: date }))}
                                                    />
                                                    <p className="mt-1 text-xs text-muted-foreground">Automatisch: Start -4 Monate</p>
                                                </div>
                                            </div>
                                            {renovationReminderDue && (
                                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                    <span>Das Erinnerungsdatum ist erreicht. Du kannst die Sanierungsanpassung jetzt übernehmen oder ablehnen. Bei Übernahme wird ein Historieneintrag erzeugt.</span>
                                                </div>
                                            )}
                                        </div>
                                    </DataCard>
                                </div>
                            </div>

                            <div>
                                <SectionLabel>Generierbare Dokumente</SectionLabel>
                                <div className="mt-3 flex flex-col gap-4">
                                    <div className="flex items-center justify-end">
                                        <span title={landlordMissing ? 'Bitte zuerst Vermieterdaten in den Einstellungen hinterlegen' : undefined}>
                                            <Switch
                                                label="Mehrere Mietverträge"
                                                checked={mietvertragIndividual}
                                                disabled={landlordMissing}
                                                onCheckedChange={(checked) => setMietvertragIndividual(checked)}
                                            />
                                        </span>
                                    </div>

                                    {mietvertragIndividual ? (
                                        mietvertragRows.map((row) => (
                                            <DataCard
                                                key={row.key}
                                                icon={FileSignature}
                                                title={`Mietvertrag – ${row.tenant}`}
                                                footer={
                                                    <>
                                                        {renderFooterUpload(row, mietvertrag, landlordMissing)}
                                                        <Button
                                                            label="Daten prüfen & Vorschau"
                                                            icon={<Eye className="w-4 h-4" />}
                                                            variant="outline"
                                                            disabled={landlordMissing || tenancy == null || row.tenancyPersonId == null}
                                                            title={row.tenancyPersonId == null ? 'Bitte zuerst speichern' : undefined}
                                                            onClick={() => goTo(`${generatorBase}/rental-agreement?personId=${row.tenancyPersonId}`)}
                                                        />
                                                        <Button
                                                            label="PDF generieren"
                                                            icon={<FileText className="w-4 h-4" />}
                                                            variant="primary"
                                                            disabled={landlordMissing || tenancy == null || row.tenancyPersonId == null}
                                                            title={row.tenancyPersonId == null ? 'Bitte zuerst speichern' : undefined}
                                                            onClick={() => goTo(`${generatorBase}/rental-agreement?personId=${row.tenancyPersonId}&autoGenerate=1`)}
                                                        />
                                                    </>
                                                }
                                            >
                                                <div className="flex flex-col gap-3">
                                                    {renderDocRow(row, mietvertrag, landlordMissing, false)}
                                                    <p className="text-xs text-muted-foreground">
                                                        Wohnraummietvertrag für {row.tenant}, inklusive Mietkonditionen, Kaution und Sonderregelungen.
                                                    </p>
                                                </div>
                                            </DataCard>
                                        ))
                                    ) : (
                                        <DataCard
                                            icon={FileSignature}
                                            title="Mietvertrag"
                                            footer={
                                                <>
                                                    {renderFooterUpload(mietvertragRows[0], mietvertrag, landlordMissing)}
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
                                                </>
                                            }
                                        >
                                            <div className="flex flex-col gap-3">
                                                {renderDocRow(mietvertragRows[0], mietvertrag, landlordMissing, false)}
                                                <p className="text-xs text-muted-foreground">
                                                    Wohnraummietvertrag für die Mietpartei(en) dieser Einheit, inklusive Mietkonditionen, Kaution und Sonderregelungen.
                                                </p>
                                            </div>
                                        </DataCard>
                                    )}
                                </div>
                            </div>
                            </>
                            )}

                            {activeTab === 'mieter' && (
                            <>
                            {/* Generierbare Dokumente */}
                            <div>
                                <SectionLabel>Generierbare Dokumente</SectionLabel>
                                <div className="mt-3 flex flex-col gap-4">
                                    <DataCard
                                        icon={BadgeCheck}
                                        title="Mieterbescheinigung"
                                        footer={
                                            <>
                                                {renderFooterUpload(mieterbescheinigungRow, MIETERBESCHEINIGUNG, false)}
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
                                            </>
                                        }
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-2">
                                                {renderDocRow(mieterbescheinigungRow, MIETERBESCHEINIGUNG, false, false)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Bestätigt das bestehende Mietverhältnis für alle Mietparteien auf Basis der hinterlegten Daten.
                                            </p>
                                        </div>
                                    </DataCard>
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
                        ? `Möchtest du ${personDisplayName(persons[personIndexPendingDelete], personIndexPendingDelete)} wirklich löschen?`
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
                        ? `Möchtest du ${docPendingDelete.label} wirklich löschen?`
                        : ''}
                </p>
            </ConfirmDeleteModal>

            <UnsavedChangesModal
                open={pendingHref !== null}
                onCancel={() => setPendingHref(null)}
                onDiscard={confirmDiscard}
                context="an den Mieterdaten"
            />

            <Modal
                open={costItemsModalOpen}
                onClose={() => setCostItemsModalOpen(false)}
                title="Detailerfassung Nebenkosten"
                subtitle="Positionen gemäß § 2 BetrKV"
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button label="Abbrechen" variant="outline" onClick={() => setCostItemsModalOpen(false)} />
                        <Button label="Übernehmen" variant="primary" onClick={applyCostItemsDraft} />
                    </>
                }
            >
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {costItemsDraft.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={item.label}
                                placeholder="Bezeichnung"
                                onChange={(e) => updateCostItemsDraftRow(item.id, { label: e.target.value })}
                                className="flex-1 min-w-0 rounded-md border-2 border-primary/30 bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                <input
                                    type="checkbox"
                                    checked={item.allocable}
                                    onChange={(e) => updateCostItemsDraftRow(item.id, { allocable: e.target.checked })}
                                />
                                umlagefähig
                            </label>
                            <div className="w-28 shrink-0">
                                <NumberField
                                    unit="€"
                                    value={String(item.amount)}
                                    onChange={(e) => updateCostItemsDraftRow(item.id, { amount: Number(e.target.value) || 0 })}
                                    min={0}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeCostItemsDraftRow(item.id)}
                                aria-label="Position entfernen"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <Button label="Position hinzufügen" icon={<Plus className="w-4 h-4" />} variant="outline" size="sm" onClick={addCostItemsDraftRow} />
                <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                    <span>Umlagefähig gesamt: <strong>{euro(draftAllocableSum)}</strong></span>
                    <span>Nicht umlagefähig gesamt: <strong>{euro(draftNonAllocableSum)}</strong></span>
                </div>
            </Modal>

            <Modal
                open={historyModalType !== null}
                onClose={() => setHistoryModalType(null)}
                title={historyModalType === 'rent' ? 'Historie – Mietanpassung' : 'Historie – Sanierungsanpassung'}
            >
                {historyEntries.filter((h) => h.adjustmentType === historyModalType).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {historyEntries.filter((h) => h.adjustmentType === historyModalType).map((h) => (
                            <div key={h.historyId} className="p-2.5 rounded-lg bg-muted/30 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span>{h.effectiveDate ? formatDeDate(h.effectiveDate) : '–'}</span>
                                    <span className="font-medium">{h.amount != null ? euro(h.amount) : '–'}</span>
                                </div>
                                {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                                <p className="text-[11px] text-muted-foreground mt-0.5">erstellt am {formatDeDate(h.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
