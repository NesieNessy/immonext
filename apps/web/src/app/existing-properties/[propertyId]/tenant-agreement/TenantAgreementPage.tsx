"use client";

import { formatUnitLabel } from '@/components/features/PropertyDisplay';
import { AdjustmentStatusBox } from '../tenant-data/AdjustmentStatusBox';
import { DataCard } from '../tenant-data/DocumentGeneratorParts';
import { Button, CalendarField, ConfirmDeleteModal, Header, Modal, NumberField, SectionLabel, StickyActionBar, Switch, Tag, UnsavedChangesModal, type BreadcrumbItem } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { base64ToDataUri, formatDeDate } from '@/lib/utils';
import type { Property, PropertyUnit } from '@immonext/types';
import { Calculator, Eye, FileSignature, FileText, History, ListChecks, Plus, Trash2, TrendingUp, Wrench } from 'lucide-react';
import { euro, useTenantUnitData } from '../tenant-data/useTenantUnitData';

interface TenantAgreementPageProps {
    propertyId: string;
    property: Property;
    unit: PropertyUnit;
    hasMultipleUnits: boolean;
}

/** The Mietvertrag page: Mietzeiten, Miete & Nebenkosten, Anpassungen and
 *  generated documents. An independent page/route — not nested under
 *  Mieterdaten (tenant-data) either in the URL or in the breadcrumb, and
 *  not a tab of Aktueller Mieter — see ../tenant-data/CurrentTenantPage for
 *  that side. Only the data layer (useTenantUnitData) is shared. */
export function TenantAgreementPage({ propertyId, property, unit, hasMultipleUnits }: TenantAgreementPageProps) {
    const data = useTenantUnitData(propertyId, property, unit, hasMultipleUnits);

    const currentTenantHref = hasMultipleUnits
        ? `/existing-properties/${propertyId}/tenant-data/${unit.propertyUnitId}`
        : `/existing-properties/${propertyId}/tenant-data`;

    // No "Mieterdaten" crumb — Mietvertrag is a sibling page, not nested
    // under it. With several Wohneinheiten the unit label still needs to
    // show which unit this is, linking back to that unit's Aktueller Mieter.
    const breadcrumbItems: BreadcrumbItem[] = hasMultipleUnits
        ? [
            {
                label: 'Bestandsobjekte',
                href: '/existing-properties',
                onClick: (e) => { if (data.isEditing) { e.preventDefault(); data.goTo('/existing-properties'); } },
            },
            {
                label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
                href: `/existing-properties/${propertyId}`,
                onClick: (e) => { if (data.isEditing) { e.preventDefault(); data.goTo(`/existing-properties/${propertyId}`); } },
            },
            {
                label: formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote),
                href: currentTenantHref,
                onClick: (e) => { if (data.isEditing) { e.preventDefault(); data.goTo(currentTenantHref); } },
            },
            { label: 'Mietvertrag' },
        ]
        : [
            {
                label: 'Bestandsobjekte',
                href: '/existing-properties',
                onClick: (e) => { if (data.isEditing) { e.preventDefault(); data.goTo('/existing-properties'); } },
            },
            {
                label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
                href: `/existing-properties/${propertyId}`,
                onClick: (e) => { if (data.isEditing) { e.preventDefault(); data.goTo(`/existing-properties/${propertyId}`); } },
            },
            { label: 'Mietvertrag' },
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

                    <div className="flex items-center gap-2">
                        <Tag label={data.status} variant={data.status === 'Vermietet' ? 'success' : 'muted'} />
                    </div>

                    <div>
                        <SectionLabel>Mietzeiten</SectionLabel>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <CalendarField
                                label="Einzugsdatum *"
                                value={data.persons[0]?.moveInDate}
                                onChange={(date) => data.updatePerson(0, { moveInDate: date })}
                            />
                            <div>
                                <CalendarField
                                    label="Auszugsdatum (opt.)"
                                    value={data.rentalForm.tenancyEndDate}
                                    onChange={(date) => data.setRentalForm((prev) => ({ ...prev, tenancyEndDate: date }))}
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
                                value={data.rentalForm.coldRent}
                                onChange={(e) => data.setRentalForm((prev) => ({ ...prev, coldRent: e.target.value }))}
                                min={0}
                            />
                            <NumberField
                                label="Stellplatz (opt.)"
                                unit="€"
                                value={data.rentalForm.parkingSpaceRent}
                                onChange={(e) => data.setRentalForm((prev) => ({ ...prev, parkingSpaceRent: e.target.value }))}
                                min={0}
                            />
                            <NumberField
                                label="WEG (opt.)"
                                unit="€"
                                value={data.rentalForm.houseMoney}
                                onChange={(e) => data.setRentalForm((prev) => ({ ...prev, houseMoney: e.target.value }))}
                                min={0}
                            />
                            <div>
                                <NumberField
                                    label="Nebenkosten gesamt"
                                    unit="€"
                                    value={data.costBreakdownActive ? String(data.computedTotalCosts) : data.rentalForm.totalCosts}
                                    onChange={(e) => data.setRentalForm((prev) => ({ ...prev, totalCosts: e.target.value }))}
                                    min={0}
                                    disabled={data.costBreakdownActive}
                                />
                                {data.costBreakdownActive && <p className="mt-1 text-xs text-muted-foreground">Berechnet aus Detailerfassung</p>}
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <NumberField
                                label="NK umlagefähig"
                                unit="€"
                                value={data.rentalForm.allocableCosts}
                                onChange={(e) => data.setRentalForm((prev) => ({ ...prev, allocableCosts: e.target.value }))}
                                min={0}
                            />
                            <NumberField
                                label="NK nicht umlagefähig"
                                unit="€"
                                value={data.rentalForm.nonAllocableCosts}
                                onChange={(e) => data.setRentalForm((prev) => ({ ...prev, nonAllocableCosts: e.target.value }))}
                                min={0}
                            />
                        </div>
                        <div className="mt-3">
                            <Button
                                label="Detailerfassung Nebenkosten"
                                icon={<ListChecks className="w-4 h-4" />}
                                variant="outline"
                                size="sm"
                                onClick={data.openCostItemsModal}
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
                                        <Button label="Historie" icon={<History className="w-4 h-4" />} variant="outline" size="sm" onClick={() => data.setHistoryModalType('rent')} />
                                    </div>
                                }
                                footer={
                                    <>
                                        <span className="mr-auto text-xs font-medium text-muted-foreground">Mieterhöhungsschreiben</span>
                                        <span title={!data.canGenerateRentIncreaseLetter ? 'Bitte zuerst Datum, Höhe und Vermieterdaten hinterlegen' : undefined}>
                                            <Button
                                                label="Schreiben erstellen"
                                                icon={<FileText className="w-4 h-4" />}
                                                variant="outline"
                                                size="sm"
                                                disabled={!data.canGenerateRentIncreaseLetter || data.isGeneratingLetter === 'rent'}
                                                onClick={() => void data.handleGenerateRentIncreaseLetter()}
                                            />
                                        </span>
                                    </>
                                }
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <CalendarField
                                            label="Datum"
                                            value={data.rentalForm.nextRentAdjustmentDate}
                                            onChange={(date) => data.setRentalForm((prev) => ({ ...prev, nextRentAdjustmentDate: date }))}
                                        />
                                        <NumberField
                                            label="Höhe"
                                            unit="€"
                                            value={data.rentalForm.nextRentAdjustmentAmount}
                                            onChange={(e) => data.setRentalForm((prev) => ({ ...prev, nextRentAdjustmentAmount: e.target.value }))}
                                        />
                                    </div>
                                    <AdjustmentStatusBox
                                        adjustmentType="rent"
                                        label="Mietanpassung"
                                        targetDate={data.rentalForm.nextRentAdjustmentDate}
                                        reminderDate={data.effectiveRentReminderDate}
                                        amount={data.rentalForm.nextRentAdjustmentAmount}
                                        currentValue={data.tenancy?.coldRent ?? null}
                                        historyEntries={data.historyEntries}
                                        isResolving={data.isResolvingAdjustment === 'rent'}
                                        onAccept={() => void data.handleAcceptRentAdjustment()}
                                        onDecline={() => void data.handleDeclineRentAdjustment()}
                                    />
                                    {data.rentIncreaseLetterRow.doc && data.renderDocRow(data.rentIncreaseLetterRow, 'Mieterhöhungsschreiben', false, false)}
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
                                        <Button label="Historie" icon={<History className="w-4 h-4" />} variant="outline" size="sm" onClick={() => data.setHistoryModalType('renovation')} />
                                    </div>
                                }
                                footer={
                                    <>
                                        <span className="mr-auto text-xs font-medium text-muted-foreground">Sanierungsanpassungsschreiben</span>
                                        <span title={!data.canGenerateRenovationLetter ? 'Bitte zuerst Start/Abschluss, Höhe und Vermieterdaten hinterlegen' : undefined}>
                                            <Button
                                                label="Schreiben erstellen"
                                                icon={<FileText className="w-4 h-4" />}
                                                variant="outline"
                                                size="sm"
                                                disabled={!data.canGenerateRenovationLetter || data.isGeneratingLetter === 'renovation'}
                                                onClick={() => void data.handleGenerateRenovationLetter()}
                                            />
                                        </span>
                                    </>
                                }
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <CalendarField
                                            label="Start"
                                            value={data.rentalForm.renovationAdjustmentStartDate}
                                            onChange={(date) => data.setRentalForm((prev) => ({ ...prev, renovationAdjustmentStartDate: date }))}
                                        />
                                        <CalendarField
                                            label="Abschluss"
                                            value={data.rentalForm.renovationAdjustmentEndDate}
                                            onChange={(date) => data.setRentalForm((prev) => ({ ...prev, renovationAdjustmentEndDate: date }))}
                                        />
                                        <NumberField
                                            label="Höhe"
                                            unit="€"
                                            value={data.rentalForm.renovationAdjustmentAmount}
                                            onChange={(e) => data.setRentalForm((prev) => ({ ...prev, renovationAdjustmentAmount: e.target.value }))}
                                        />
                                    </div>
                                    <AdjustmentStatusBox
                                        adjustmentType="renovation"
                                        label="Sanierungsanpassung"
                                        targetDate={data.rentalForm.renovationAdjustmentStartDate}
                                        reminderDate={data.effectiveRenovationReminderDate}
                                        amount={data.rentalForm.renovationAdjustmentAmount}
                                        currentValue={data.tenancy?.coldRent ?? null}
                                        historyEntries={data.historyEntries}
                                        isResolving={data.isResolvingAdjustment === 'renovation'}
                                        onAccept={() => void data.handleAcceptRenovationAdjustment()}
                                        onDecline={() => void data.handleDeclineRenovationAdjustment()}
                                    />
                                    {data.renovationLetterRow.doc && data.renderDocRow(data.renovationLetterRow, 'Sanierungsanpassungsschreiben', false, false)}
                                </div>
                            </DataCard>
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Generierbare Dokumente</SectionLabel>
                        <div className="mt-3 flex flex-col gap-4">
                            <div className="flex items-center justify-end">
                                <span title={data.landlordMissing ? 'Bitte zuerst Vermieterdaten in den Einstellungen hinterlegen' : undefined}>
                                    <Switch
                                        label="Mehrere Mietverträge"
                                        checked={data.mietvertragIndividual}
                                        disabled={data.landlordMissing}
                                        onCheckedChange={(checked) => data.setMietvertragIndividual(checked)}
                                    />
                                </span>
                            </div>

                            {data.mietvertragIndividual ? (
                                data.mietvertragRows.map((row) => (
                                    <DataCard
                                        key={row.key}
                                        icon={FileSignature}
                                        title={`Mietvertrag – ${row.tenant}`}
                                        footer={
                                            <>
                                                {data.renderFooterUpload(row, data.mietvertrag, data.landlordMissing)}
                                                <Button
                                                    label="Daten prüfen & Vorschau"
                                                    icon={<Eye className="w-4 h-4" />}
                                                    variant="outline"
                                                    disabled={data.landlordMissing || data.tenancy == null || row.tenancyPersonId == null}
                                                    title={row.tenancyPersonId == null ? 'Bitte zuerst speichern' : undefined}
                                                    onClick={() => data.goTo(`${data.generatorBase}/rental-agreement?personId=${row.tenancyPersonId}`)}
                                                />
                                                <Button
                                                    label="PDF generieren"
                                                    icon={<FileText className="w-4 h-4" />}
                                                    variant="primary"
                                                    disabled={data.landlordMissing || data.tenancy == null || row.tenancyPersonId == null}
                                                    title={row.tenancyPersonId == null ? 'Bitte zuerst speichern' : undefined}
                                                    onClick={() => data.goTo(`${data.generatorBase}/rental-agreement?personId=${row.tenancyPersonId}&autoGenerate=1`)}
                                                />
                                            </>
                                        }
                                    >
                                        <div className="flex flex-col gap-3">
                                            {data.renderDocRow(row, data.mietvertrag, data.landlordMissing, false)}
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
                                            {data.renderFooterUpload(data.mietvertragRows[0], data.mietvertrag, data.landlordMissing)}
                                            <Button
                                                label="Daten prüfen & Vorschau"
                                                icon={<Eye className="w-4 h-4" />}
                                                variant="outline"
                                                disabled={data.landlordMissing || data.tenancy == null}
                                                onClick={() => data.goTo(`${data.generatorBase}/rental-agreement`)}
                                            />
                                            <Button
                                                label="PDF generieren"
                                                icon={<FileText className="w-4 h-4" />}
                                                variant="primary"
                                                disabled={data.landlordMissing || data.tenancy == null}
                                                onClick={() => data.goTo(`${data.generatorBase}/rental-agreement?autoGenerate=1`)}
                                            />
                                        </>
                                    }
                                >
                                    <div className="flex flex-col gap-3">
                                        {data.renderDocRow(data.mietvertragRows[0], data.mietvertrag, data.landlordMissing, false)}
                                        <p className="text-xs text-muted-foreground">
                                            Wohnraummietvertrag für die Mietpartei(en) dieser Einheit, inklusive Mietkonditionen, Kaution und Sonderregelungen.
                                        </p>
                                    </div>
                                </DataCard>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <StickyActionBar
                show={true}
                onGhost={() => data.goTo(data.backHref)}
                onPrimary={() => void data.handleSave()}
                ghostLabel={BUTTON_DETAILS.Back.label}
                ghostIcon={<BUTTON_DETAILS.Back.icon />}
                primaryLabel="Mietvertrag speichern"
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={!data.isEditing || data.isSaving}
            />

            <ConfirmDeleteModal
                open={data.docPendingDelete !== null}
                onCancel={() => data.setDocPendingDelete(null)}
                onConfirm={() => void data.confirmDeleteDocument()}
                title="Dokument löschen?"
                confirmDisabled={data.pendingDocKey !== null}
            >
                <p className="text-sm text-muted-foreground">
                    {data.docPendingDelete
                        ? `Möchtest du ${data.docPendingDelete.label} wirklich löschen?`
                        : ''}
                </p>
            </ConfirmDeleteModal>

            <UnsavedChangesModal
                open={data.pendingHref !== null}
                onCancel={() => data.setPendingHref(null)}
                onDiscard={data.confirmDiscard}
                context="am Mietvertrag"
            />

            <Modal
                open={data.costItemsModalOpen}
                onClose={() => data.setCostItemsModalOpen(false)}
                title="Detailerfassung Nebenkosten"
                subtitle="Positionen gemäß § 2 BetrKV"
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button label="Abbrechen" variant="outline" onClick={() => data.setCostItemsModalOpen(false)} />
                        <Button label="Übernehmen" variant="primary" onClick={data.applyCostItemsDraft} />
                    </>
                }
            >
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {data.costItemsDraft.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={item.label}
                                placeholder="Bezeichnung"
                                onChange={(e) => data.updateCostItemsDraftRow(item.id, { label: e.target.value })}
                                className="flex-1 min-w-0 rounded-md border-2 border-primary/30 bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                <input
                                    type="checkbox"
                                    checked={item.allocable}
                                    onChange={(e) => data.updateCostItemsDraftRow(item.id, { allocable: e.target.checked })}
                                />
                                umlagefähig
                            </label>
                            <div className="w-28 shrink-0">
                                <NumberField
                                    unit="€"
                                    value={String(item.amount)}
                                    onChange={(e) => data.updateCostItemsDraftRow(item.id, { amount: Number(e.target.value) || 0 })}
                                    min={0}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => data.removeCostItemsDraftRow(item.id)}
                                aria-label="Position entfernen"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <Button label="Position hinzufügen" icon={<Plus className="w-4 h-4" />} variant="outline" size="sm" onClick={data.addCostItemsDraftRow} />
                <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                    <span>Umlagefähig gesamt: <strong>{euro(data.draftAllocableSum)}</strong></span>
                    <span>Nicht umlagefähig gesamt: <strong>{euro(data.draftNonAllocableSum)}</strong></span>
                </div>
            </Modal>

            <Modal
                open={data.historyModalType !== null}
                onClose={() => data.setHistoryModalType(null)}
                title={data.historyModalType === 'rent' ? 'Historie – Mietanpassung' : 'Historie – Sanierungsanpassung'}
            >
                {data.historyEntries.filter((h) => h.adjustmentType === data.historyModalType).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {data.historyEntries.filter((h) => h.adjustmentType === data.historyModalType).map((h) => (
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
