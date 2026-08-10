"use client";

import { useToast } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createUseCaseMenuItems } from '@/lib/propertyUseCaseMenu';
import { getPersonalData } from '@/lib/supabase/personal_data.supabase';
import {
    createCostItem,
    deleteCostItem,
    getCostItemsBySettlement,
    updateCostItem,
} from '@/lib/supabase/service_charge_cost_item.supabase';
import {
    createSettlement,
    getCurrentSettlementByProperty,
    getSettlementSourceDocumentUrl,
    removeSettlementSourceDocument,
    updateSettlement,
    uploadSettlementSourceDocument,
} from '@/lib/supabase/service_charge_settlement.supabase';
import { getCurrentTenancyByUnit } from '@/lib/supabase/tenancy.supabase';
import { getTenancyPersonsByTenancy } from '@/lib/supabase/tenancy_person.supabase';
import { uploadTenancyDocument } from '@/lib/supabase/tenancy_document.supabase';
import { getPropertyUnitsByProperty } from '@/lib/supabase/property_unit.supabase';
import { deCurrencyFormatter, formatDeDate } from '@/lib/utils';
import { htmlToPdfBlob } from '@/lib/pdf/htmlToPdf';
import type {
    PersonalData,
    Property,
    PropertyUnit,
    ServiceChargeCostItem,
    ServiceChargeSettlement,
    Tenancy,
} from '@immonext/types';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DEFAULT_COST_ITEMS, euro } from '../tenant-data/useTenantUnitData';
import { formatUnitLabel } from '@/components/features/PropertyDisplay';
import { serviceChargeStatementHtml } from './serviceChargeStatementLetter';

export interface CostItemForm {
    id: number | null;
    label: string;
    allocable: boolean;
    actualAmount: string;
    budgetAmount: string;
}

function toCostItemForm(item: ServiceChargeCostItem): CostItemForm {
    return {
        id: item.serviceChargeCostItemId,
        label: item.label,
        allocable: item.allocable,
        actualAmount: item.actualAmount != null ? String(item.actualAmount) : '',
        budgetAmount: item.budgetAmount != null ? String(item.budgetAmount) : '',
    };
}

function serializeCostItems(items: CostItemForm[], periodStart: Date | undefined, periodEnd: Date | undefined): string {
    return JSON.stringify({
        periodStart: periodStart?.toISOString() ?? null,
        periodEnd: periodEnd?.toISOString() ?? null,
        items: items.map((i) => ({ id: i.id, label: i.label, allocable: i.allocable, actualAmount: i.actualAmount, budgetAmount: i.budgetAmount })),
    });
}

export { euro };

export function useServiceChargeSettlementData(propertyId: string, property: Property, unit: PropertyUnit, hasMultipleUnits: boolean) {
    const router = useRouter();
    const { user } = useRequireAuth();
    const { showToast } = useToast();

    const [units, setUnits] = useState<PropertyUnit[]>([]);
    const [settlement, setSettlement] = useState<ServiceChargeSettlement | null>(null);
    const [periodStart, setPeriodStart] = useState<Date | undefined>(undefined);
    const [periodEnd, setPeriodEnd] = useState<Date | undefined>(undefined);
    const [costItems, setCostItems] = useState<CostItemForm[]>([]);
    const [deletedCostItemIds, setDeletedCostItemIds] = useState<number[]>([]);
    const [originalSnapshot, setOriginalSnapshot] = useState('');
    const [tenancy, setTenancy] = useState<Tenancy | null>(null);
    const [landlord, setLandlord] = useState<PersonalData | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingSource, setIsUploadingSource] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        const [loadedUnits, currentSettlement, currentTenancy] = await Promise.all([
            getPropertyUnitsByProperty(property.propertyId),
            getCurrentSettlementByProperty(property.propertyId),
            getCurrentTenancyByUnit(unit.propertyUnitId),
        ]);
        setUnits(loadedUnits);
        setTenancy(currentTenancy);
        setSettlement(currentSettlement);

        if (currentSettlement) {
            setPeriodStart(new Date(currentSettlement.periodStart));
            setPeriodEnd(new Date(currentSettlement.periodEnd));
            const loadedItems = (await getCostItemsBySettlement(currentSettlement.serviceChargeSettlementId)).map(toCostItemForm);
            setCostItems(loadedItems);
            setOriginalSnapshot(serializeCostItems(loadedItems, new Date(currentSettlement.periodStart), new Date(currentSettlement.periodEnd)));
        } else {
            const currentYear = new Date().getFullYear();
            const defaultStart = new Date(currentYear, 0, 1);
            const defaultEnd = new Date(currentYear, 11, 31);
            setPeriodStart(defaultStart);
            setPeriodEnd(defaultEnd);
            const defaults = DEFAULT_COST_ITEMS.map((item) => ({ id: null, label: item.label, allocable: item.allocable, actualAmount: '', budgetAmount: '' }));
            setCostItems(defaults);
            setOriginalSnapshot('');
        }
        setDeletedCostItemIds([]);
        setIsLoading(false);
    }, [property.propertyId, unit.propertyUnitId]);

    useEffect(() => { void load(); }, [load]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        getPersonalData(user.id).then((data) => { if (!cancelled) setLandlord(data ?? null); });
        return () => { cancelled = true; };
    }, [user]);

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'ServiceChargeSettlement', (route) => router.push(route));

    const isEditing = !settlement || serializeCostItems(costItems, periodStart, periodEnd) !== originalSnapshot;

    // ── Allocation & summary math ───────────────────────────────────────────
    const totalArea = useMemo(() => units.reduce((sum, u) => sum + (u.livingAreaM2 ?? 0), 0), [units]);
    const unitShare = unit.livingAreaM2 && totalArea > 0 ? unit.livingAreaM2 / totalArea : 0;

    const totalActualCostsAll = useMemo(() => costItems.reduce((sum, i) => sum + (Number(i.actualAmount) || 0), 0), [costItems]);
    const totalBudgetCostsAll = useMemo(() => costItems.reduce((sum, i) => sum + (Number(i.budgetAmount) || 0), 0), [costItems]);
    const totalActualAllocable = useMemo(() => costItems.filter((i) => i.allocable).reduce((sum, i) => sum + (Number(i.actualAmount) || 0), 0), [costItems]);
    const totalBudgetAllocable = useMemo(() => costItems.filter((i) => i.allocable).reduce((sum, i) => sum + (Number(i.budgetAmount) || 0), 0), [costItems]);

    const unitActualShare = totalActualAllocable * unitShare;
    const unitBudgetShare = totalBudgetAllocable * unitShare;

    const annualPrepayment = (tenancy?.miscRent ?? 0) * 12;
    const currentMonthlyPrepayment = tenancy?.miscRent ?? 0;
    /** Negative = Nachzahlung durch Mieter, positive = Guthaben/Rückzahlung. */
    const overUnderCoverage = unitActualShare - annualPrepayment;

    const newMonthlyPrepayment = totalBudgetAllocable > 0 ? Math.round((unitBudgetShare / 12) * 100) / 100 : null;
    const prepaymentDelta = newMonthlyPrepayment != null ? newMonthlyPrepayment * 12 - annualPrepayment : null;
    const newTotalRent = (tenancy?.coldRent ?? 0) + (newMonthlyPrepayment ?? currentMonthlyPrepayment) + (tenancy?.parkingSpaceRent ?? 0);

    const settlementYear = periodEnd ? periodEnd.getFullYear() : new Date().getFullYear();

    // ── Cost item editing ────────────────────────────────────────────────────
    const updateCostItemField = (index: number, patch: Partial<CostItemForm>) => {
        setCostItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const addCostItem = () => {
        setCostItems((prev) => [...prev, { id: null, label: '', allocable: true, actualAmount: '', budgetAmount: '' }]);
    };

    const removeCostItem = (index: number) => {
        setCostItems((prev) => {
            const item = prev[index];
            if (item?.id != null) setDeletedCostItemIds((ids) => [...ids, item.id!]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const currentYear = new Date().getFullYear();
            const periodStartStr = periodStart ? format(periodStart, 'yyyy-MM-dd') : format(new Date(currentYear, 0, 1), 'yyyy-MM-dd');
            const periodEndStr = periodEnd ? format(periodEnd, 'yyyy-MM-dd') : format(new Date(currentYear, 11, 31), 'yyyy-MM-dd');

            let activeSettlement = settlement;
            if (!activeSettlement) {
                activeSettlement = await createSettlement({
                    propertyId: property.propertyId,
                    periodStart: periodStartStr,
                    periodEnd: periodEndStr,
                    sourceDocumentName: null,
                    sourceDocumentPath: null,
                });
                if (!activeSettlement) throw new Error('Konnte Abrechnung nicht anlegen.');
                setSettlement(activeSettlement);
            } else if (activeSettlement.periodStart !== periodStartStr || activeSettlement.periodEnd !== periodEndStr) {
                const updated = await updateSettlement(activeSettlement.serviceChargeSettlementId, { periodStart: periodStartStr, periodEnd: periodEndStr });
                if (updated) { activeSettlement = updated; setSettlement(updated); }
            }

            await Promise.all(deletedCostItemIds.map((id) => deleteCostItem(id)));

            const savedItems: CostItemForm[] = [];
            for (let index = 0; index < costItems.length; index++) {
                const item = costItems[index];
                const payload = {
                    serviceChargeSettlementId: activeSettlement.serviceChargeSettlementId,
                    propertyId: property.propertyId,
                    sortOrder: index,
                    label: item.label,
                    allocable: item.allocable,
                    actualAmount: item.actualAmount === '' ? null : Number(item.actualAmount),
                    budgetAmount: item.budgetAmount === '' ? null : Number(item.budgetAmount),
                };
                if (item.id != null) {
                    const updated = await updateCostItem(item.id, payload);
                    savedItems.push(updated ? toCostItemForm(updated) : item);
                } else {
                    const created = await createCostItem(payload);
                    savedItems.push(created ? toCostItemForm(created) : item);
                }
            }
            setCostItems(savedItems);
            setDeletedCostItemIds([]);
            setOriginalSnapshot(serializeCostItems(savedItems, periodStart, periodEnd));
            showToast('Nebenkostenabrechnung gespeichert.', 'success');
        } catch {
            setError('Die Nebenkostenabrechnung konnte nicht gespeichert werden.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Source document upload ──────────────────────────────────────────────
    const handleUploadSourceDocument = async (file: File) => {
        if (!user || !settlement) return;
        setIsUploadingSource(true);
        try {
            const uploaded = await uploadSettlementSourceDocument(user.id, property.propertyId, file);
            if (!uploaded) return;
            if (settlement.sourceDocumentPath) await removeSettlementSourceDocument(settlement.sourceDocumentPath);
            const updated = await updateSettlement(settlement.serviceChargeSettlementId, {
                sourceDocumentName: uploaded.name,
                sourceDocumentPath: uploaded.path,
            });
            if (updated) setSettlement(updated);
        } finally {
            setIsUploadingSource(false);
        }
    };

    const handleViewSourceDocument = async () => {
        if (!settlement?.sourceDocumentPath) return;
        const url = await getSettlementSourceDocumentUrl(settlement.sourceDocumentPath);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    // ── Export (CSV) ─────────────────────────────────────────────────────────
    const handleExportCsv = () => {
        const header = ['Kostenposition', `Abrechnung ${settlementYear} Gesamt`, `Abrechnung ${settlementYear} Anteil Whg.`, `Wirtschaftsplan ${settlementYear + 1} Gesamt`, `Wirtschaftsplan ${settlementYear + 1} Anteil Whg.`];
        const rows = costItems.map((item) => [
            item.label,
            item.actualAmount,
            item.allocable && item.actualAmount !== '' ? String(Math.round(Number(item.actualAmount) * unitShare * 100) / 100) : '',
            item.budgetAmount,
            item.allocable && item.budgetAmount !== '' ? String(Math.round(Number(item.budgetAmount) * unitShare * 100) / 100) : '',
        ]);
        const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Nebenkostenabrechnung_${property.street}_${settlementYear}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // ── PDF generation ───────────────────────────────────────────────────────
    const canGeneratePdf = tenancy != null && settlement != null;

    const handleGeneratePdf = async () => {
        if (!user || !tenancy || !settlement) return;
        setIsGeneratingPdf(true);
        try {
            const persons = await getTenancyPersonsByTenancy(tenancy.tenancyId);
            const tenantNames = persons
                .filter((p) => (p.lastName ?? '').trim() !== '' || (p.firstName ?? '').trim() !== '')
                .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim());

            const costRows = costItems.map((item) => ({
                label: item.label,
                actualAmount: item.actualAmount === '' ? null : Number(item.actualAmount),
                actualShare: item.allocable && item.actualAmount !== '' ? Number(item.actualAmount) * unitShare : null,
                budgetAmount: item.budgetAmount === '' ? null : Number(item.budgetAmount),
                budgetShare: item.allocable && item.budgetAmount !== '' ? Number(item.budgetAmount) * unitShare : null,
            }));

            const html = serviceChargeStatementHtml({
                landlordName: landlord ? `${landlord.firstName} ${landlord.lastName}`.trim() : '',
                landlordStreet: landlord ? `${landlord.street} ${landlord.houseNumber}` : '',
                landlordCity: landlord ? `${landlord.postalCode} ${landlord.city}` : '',
                propertyAddress: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
                unitLabel: formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote),
                tenantNames: tenantNames.length > 0 ? tenantNames : ['Mieter'],
                issuePlace: landlord?.city || property.city,
                issueDate: formatDeDate(new Date().toISOString()),
                settlementYear,
                periodStart: settlement.periodStart,
                periodEnd: settlement.periodEnd,
                costRows,
                totalActualCosts: totalActualAllocable,
                totalBudgetCosts: totalBudgetAllocable,
                unitActualShare,
                unitBudgetShare,
                annualPrepayment,
                overUnderCoverage,
                currentMonthlyPrepayment,
                newMonthlyPrepayment,
                coldRent: tenancy.coldRent,
            });

            const blob = await htmlToPdfBlob(html);
            const file = new File([blob], `Nebenkostenabrechnung_${settlementYear}.pdf`, { type: 'application/pdf' });
            await uploadTenancyDocument(user.id, file, {
                tenancyId: tenancy.tenancyId,
                tenancyPersonId: null,
                documentType: 'Nebenkostenabrechnung',
            });
            window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
            showToast('Nebenkostenabrechnung als PDF erstellt.', 'success');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const backHref = hasMultipleUnits
        ? `/existing-properties/${propertyId}/service-charge-settlement`
        : `/existing-properties/${propertyId}`;

    return {
        // state
        isLoading, isSaving, isUploadingSource, isGeneratingPdf, error,
        settlement, periodStart, setPeriodStart, periodEnd, setPeriodEnd,
        costItems, tenancy, useCaseMenuItems, backHref,
        // computed
        isEditing, unitShare, totalArea,
        totalActualCostsAll, totalBudgetCostsAll,
        totalActualAllocable, totalBudgetAllocable,
        unitActualShare, unitBudgetShare,
        annualPrepayment, currentMonthlyPrepayment, overUnderCoverage,
        newMonthlyPrepayment, prepaymentDelta, newTotalRent, settlementYear,
        canGeneratePdf,
        // handlers
        updateCostItemField, addCostItem, removeCostItem,
        handleSave, handleUploadSourceDocument, handleViewSourceDocument,
        handleExportCsv, handleGeneratePdf,
    };
}
