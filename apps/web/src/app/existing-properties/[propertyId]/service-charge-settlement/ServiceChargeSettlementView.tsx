"use client";

import { formatUnitLabel } from '@/components/features/PropertyDisplay';
import { DataCard } from '../tenant-data/DocumentGeneratorParts';
import {
    Button,
    CalendarField,
    Header,
    MetricCard,
    NumberField,
    SectionLabel,
    StickyActionBar,
    TextField,
    type BreadcrumbItem,
} from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { base64ToDataUri } from '@/lib/utils';
import type { Property, PropertyUnit } from '@immonext/types';
import { FileDown, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { euro, useServiceChargeSettlementData } from './useServiceChargeSettlementData';

interface ServiceChargeSettlementViewProps {
    propertyId: string;
    property: Property;
    unit: PropertyUnit;
    hasMultipleUnits: boolean;
}

export function ServiceChargeSettlementView({ propertyId, property, unit, hasMultipleUnits }: ServiceChargeSettlementViewProps) {
    const data = useServiceChargeSettlementData(propertyId, property, unit, hasMultipleUnits);
    const router = useRouter();
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const address = `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`;
    const unitLabel = formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote);

    const breadcrumbItems: BreadcrumbItem[] = hasMultipleUnits
        ? [
            { label: 'Bestandsobjekte', href: '/existing-properties' },
            { label: address, href: `/existing-properties/${propertyId}` },
            { label: ExistingPropertiesUseCases.ServiceChargeSettlement, href: `/existing-properties/${propertyId}/service-charge-settlement` },
            { label: unitLabel },
        ]
        : [
            { label: 'Bestandsobjekte', href: '/existing-properties' },
            { label: address, href: `/existing-properties/${propertyId}` },
            { label: ExistingPropertiesUseCases.ServiceChargeSettlement },
        ];

    if (data.isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Wird geladen…</p>
            </div>
        );
    }

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
                            menuItems={data.useCaseMenuItems}
                        />
                    }
                />

                <div className="mt-8 space-y-6">
                    {data.error && (
                        <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                            {data.error}
                        </div>
                    )}

                    {/* Abrechnungszeitraum */}
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <SectionLabel>Abrechnungszeitraum</SectionLabel>
                            <div className="mt-3 flex items-end gap-3">
                                <div className="w-40">
                                    <CalendarField label="Von" value={data.periodStart} onChange={data.setPeriodStart} />
                                </div>
                                <span className="pb-2.5 text-sm text-muted-foreground">bis</span>
                                <div className="w-40">
                                    <CalendarField label="Bis" value={data.periodEnd} onChange={data.setPeriodEnd} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                ref={uploadInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (file) void data.handleUploadSourceDocument(file);
                                }}
                            />
                            <span title={!data.settlement ? 'Bitte zuerst speichern' : undefined}>
                                <Button
                                    label="Upload"
                                    icon={<Upload className="w-4 h-4" />}
                                    variant="outline"
                                    disabled={!data.settlement || data.isUploadingSource}
                                    onClick={() => uploadInputRef.current?.click()}
                                />
                            </span>
                            <Button
                                label="Manuell erfassen"
                                icon={<FileText className="w-4 h-4" />}
                                variant="outline"
                                onClick={data.addCostItem}
                            />
                        </div>
                    </div>

                    {data.settlement?.sourceDocumentName && (
                        <button
                            type="button"
                            onClick={() => void data.handleViewSourceDocument()}
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer w-fit"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            {data.settlement.sourceDocumentName}
                        </button>
                    )}

                    {/* Exportieren / Abrechnung generieren */}
                    <div className="flex items-center gap-3">
                        <Button
                            label="Exportieren"
                            icon={<FileDown className="w-4 h-4" />}
                            variant="outline"
                            onClick={data.handleExportCsv}
                        />
                        <Button
                            label="Abrechnung generieren"
                            icon={<FileText className="w-4 h-4" />}
                            variant="primary"
                            disabled={!data.canGeneratePdf || data.isGeneratingPdf}
                            onClick={() => void data.handleGeneratePdf()}
                        />
                    </div>

                    {/* Info banner */}
                    <div className="px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground">
                        Erfassen Sie alle Kostenpositionen des Abrechnungsjahres. Die Wohnungsanteile und der Wirtschaftsplan werden automatisch berechnet. Fehlende Werte im Wirtschaftsplan können manuell ergänzt werden.
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <MetricCard
                            label="Gesamtkosten Objekt"
                            value={euro(data.totalActualCostsAll)}
                            detail={`Abrechnungsjahr ${data.settlementYear}`}
                        />
                        <MetricCard
                            label={`Anteil ${unitLabel}`}
                            value={euro(data.unitActualShare)}
                            detail={`Vorauszahlung: ${euro(data.annualPrepayment)}`}
                        />
                        <MetricCard
                            label="Über-/Unterdeckung"
                            value={`${data.overUnderCoverage < 0 ? '-' : '+'}${euro(Math.abs(data.overUnderCoverage))}`}
                            detail={data.overUnderCoverage < 0 ? 'Nachzahlung durch Mieter' : 'Guthaben des Mieters'}
                            tone={data.overUnderCoverage < 0 ? 'warning' : 'positive'}
                        />
                    </div>

                    {/* Cost item table */}
                    <div className="rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th rowSpan={2} className="px-3 py-2 text-left align-bottom font-semibold text-foreground whitespace-nowrap">Kostenposition</th>
                                        <th colSpan={2} className="px-3 py-2 text-center font-semibold text-primary border-l border-border whitespace-nowrap">Abrechnung {data.settlementYear}</th>
                                        <th colSpan={2} className="px-3 py-2 text-center font-semibold text-primary border-l border-border whitespace-nowrap">Wirtschaftsplan {data.settlementYear + 1}</th>
                                        <th rowSpan={2} className="w-10"></th>
                                    </tr>
                                    <tr className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                                        <th className="px-3 py-2 text-right border-l border-border whitespace-nowrap">Gesamt Objekt</th>
                                        <th className="px-3 py-2 text-right whitespace-nowrap">Anteil Wohnung</th>
                                        <th className="px-3 py-2 text-right border-l border-border whitespace-nowrap">Gesamt Objekt</th>
                                        <th className="px-3 py-2 text-right whitespace-nowrap">Anteil Wohnung</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.costItems.map((item, index) => (
                                        <tr key={item.id ?? `new-${index}`}>
                                            <td className="px-3 py-2 min-w-[200px]">
                                                <TextField
                                                    value={item.label}
                                                    placeholder="Bezeichnung"
                                                    onChange={(e) => data.updateCostItemField(index, { label: e.target.value })}
                                                />
                                            </td>
                                            <td className="px-3 py-2 border-l border-border w-36">
                                                <NumberField
                                                    unit="€"
                                                    placeholder="–"
                                                    value={item.actualAmount}
                                                    onChange={(e) => data.updateCostItemField(index, { actualAmount: e.target.value })}
                                                    min={0}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">
                                                {item.allocable && item.actualAmount !== '' ? euro(Number(item.actualAmount) * data.unitShare) : '–'}
                                            </td>
                                            <td className="px-3 py-2 border-l border-border w-36">
                                                <NumberField
                                                    unit="€"
                                                    placeholder="–"
                                                    value={item.budgetAmount}
                                                    onChange={(e) => data.updateCostItemField(index, { budgetAmount: e.target.value })}
                                                    min={0}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">
                                                {item.allocable && item.budgetAmount !== '' ? euro(Number(item.budgetAmount) * data.unitShare) : '–'}
                                            </td>
                                            <td className="px-2 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => data.removeCostItem(index)}
                                                    aria-label="Kostenposition entfernen"
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-border font-semibold">
                                        <td className="px-3 py-2">Summe</td>
                                        <td className="px-3 py-2 text-right border-l border-border whitespace-nowrap">{euro(data.totalActualCostsAll)}</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">{euro(data.unitActualShare)}</td>
                                        <td className="px-3 py-2 text-right border-l border-border whitespace-nowrap">{euro(data.totalBudgetCostsAll)}</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">{euro(data.unitBudgetShare)}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="text-primary">
                                        <td className="px-3 py-2">Vorauszahlungen Mieter</td>
                                        <td className="px-3 py-2 border-l border-border">–</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">{euro(data.annualPrepayment)}</td>
                                        <td className="px-3 py-2 border-l border-border">–</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">{euro(data.annualPrepayment)}</td>
                                        <td></td>
                                    </tr>
                                    <tr className={data.overUnderCoverage < 0 ? 'text-destructive' : 'text-emerald-600'}>
                                        <td className="px-3 py-2 font-medium">
                                            {data.overUnderCoverage < 0 ? 'Nachzahlung durch Mieter' : 'Guthaben durch Mieter'}
                                        </td>
                                        <td className="px-3 py-2 border-l border-border">–</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                            {data.overUnderCoverage < 0 ? '-' : '+'}{euro(Math.abs(data.overUnderCoverage))}
                                        </td>
                                        <td className="px-3 py-2 border-l border-border">–</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap text-orange-600">
                                            {data.prepaymentDelta != null ? `${data.prepaymentDelta >= 0 ? '+' : '-'}${euro(Math.abs(data.prepaymentDelta))}` : '–'}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <Button
                        label="Kostenposition hinzufügen"
                        icon={<Plus className="w-4 h-4" />}
                        variant="outline"
                        size="sm"
                        onClick={data.addCostItem}
                    />

                    {/* Anpassung Nebenkostenvorauszahlung */}
                    <div>
                        <SectionLabel>Anpassung Nebenkostenvorauszahlung</SectionLabel>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <MetricCard
                                label="NK-Vorauszahlung aktuell"
                                value={`${euro(data.currentMonthlyPrepayment)}`}
                                detail="/Monat"
                            />
                            <MetricCard
                                label="NK-Vorauszahlung neu"
                                value={data.newMonthlyPrepayment != null ? euro(data.newMonthlyPrepayment) : '–'}
                                detail={`aus Wirtschaftsplan ${data.settlementYear + 1}`}
                                tone="positive"
                            />
                            <MetricCard
                                label="Neue Gesamtmiete"
                                value={euro(data.newTotalRent)}
                                detail={`inkl. ${euro(data.tenancy?.coldRent)} Nettomiete`}
                            />
                        </div>
                    </div>

                    {/* PDF generation */}
                    <DataCard
                        icon={FileText}
                        title="Nebenkostenabrechnung als PDF"
                        footer={
                            <span title={!data.canGeneratePdf ? 'Bitte zuerst Mieterdaten und Abrechnungszeitraum hinterlegen' : undefined}>
                                <Button
                                    label="PDF generieren"
                                    icon={<FileText className="w-4 h-4" />}
                                    variant="primary"
                                    disabled={!data.canGeneratePdf || data.isGeneratingPdf}
                                    onClick={() => void data.handleGeneratePdf()}
                                />
                            </span>
                        }
                    >
                        <p className="text-xs text-muted-foreground">
                            Vollständige Abrechnung inkl. Wirtschaftsplan und NK-Anpassung – wird auch unter Dokumenten abgelegt.
                        </p>
                    </DataCard>
                </div>
            </main>

            <StickyActionBar
                show={true}
                onGhost={() => router.push(data.backHref)}
                onPrimary={() => void data.handleSave()}
                ghostLabel={BUTTON_DETAILS.Back.label}
                ghostIcon={<BUTTON_DETAILS.Back.icon />}
                primaryLabel="Abrechnung speichern"
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={!data.isEditing || data.isSaving}
            />
        </div>
    );
}
