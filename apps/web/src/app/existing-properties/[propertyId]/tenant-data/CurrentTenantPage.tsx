"use client";

import { formatUnitLabel } from '@/components/features/PropertyDisplay';
import { DataCard } from './DocumentGeneratorParts';
import { Button, CalendarField, ComingSoonButton, ConfirmDeleteModal, Header, Modal, NumberField, SectionLabel, StickyActionBar, Table, Tag, TextField, UnsavedChangesModal, type BreadcrumbItem } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import type { Property, PropertyUnit } from '@immonext/types';
import { base64ToDataUri } from '@/lib/utils';
import { BadgeCheck, DoorOpen, Eye, FileText, Plus, RefreshCw, Star, Trash2, User } from 'lucide-react';
import { MIETERBESCHEINIGUNG, personDisplayName, useTenantUnitData } from './useTenantUnitData';

interface CurrentTenantPageProps {
    propertyId: string;
    property: Property;
    unit: PropertyUnit;
    hasMultipleUnits: boolean;
}

/** The Aktueller Mieter page: person data, Unterlagen, Mieterbescheinigung,
 *  Mietkaution. Mietvertrag lives entirely on its own independent page/route
 *  now (see ../tenant-agreement/TenantAgreementPage) — the two are
 *  deliberately not sharing chrome (breadcrumb, header actions, sticky bar)
 *  beyond the data layer. */
export function CurrentTenantPage({ propertyId, property, unit, hasMultipleUnits }: CurrentTenantPageProps) {
    const data = useTenantUnitData(propertyId, property, unit, hasMultipleUnits);

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
                label: ExistingPropertiesUseCases.TenantData,
                href: `/existing-properties/${propertyId}/tenant-data`,
                onClick: (e) => { if (data.isEditing) { e.preventDefault(); data.goTo(`/existing-properties/${propertyId}/tenant-data`); } },
            },
            { label: formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote) },
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
            { label: ExistingPropertiesUseCases.TenantData },
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

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Tag label={data.status} variant={data.status === 'Vermietet' ? 'success' : 'muted'} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                label="Mieterwechsel"
                                icon={<RefreshCw className="w-4 h-4" />}
                                variant="outline"
                                onClick={() => data.setMieterwechselModalOpen(true)}
                            />
                            <Button
                                label="Person hinzufügen"
                                icon={<Plus className="w-4 h-4" />}
                                variant="primary"
                                onClick={data.addPerson}
                            />
                        </div>
                    </div>

                    {/* Person cards */}
                    <div className="flex flex-col gap-4">
                        {data.persons.map((person, index) => (
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
                                                onClick={() => data.makePrimary(index)}
                                                aria-label="Zum Hauptmieter machen"
                                                title="Zum Hauptmieter machen"
                                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => data.handleDeletePersonClick(index)}
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
                                        onChange={(e) => data.updatePerson(index, { lastName: e.target.value })}
                                    />
                                    <TextField
                                        label={person.isPrimary ? 'Vorname *' : 'Vorname (opt.)'}
                                        value={person.firstName}
                                        onChange={(e) => data.updatePerson(index, { firstName: e.target.value })}
                                    />
                                    <TextField
                                        label={person.isPrimary ? 'Steuer-ID *' : 'Steuer-ID (opt.)'}
                                        placeholder="00 000 000 000"
                                        value={person.taxId}
                                        onChange={(e) => data.updatePerson(index, { taxId: e.target.value })}
                                    />
                                    <CalendarField
                                        label={person.isPrimary ? 'Einzugsdatum *' : 'Einzugsdatum (opt.)'}
                                        value={person.moveInDate}
                                        onChange={(date) => data.updatePerson(index, { moveInDate: date })}
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
                                columns={data.documentColumns}
                                data={data.documentTableData}
                                sortKey={data.docSortKey}
                                sortDirection={data.docSortDirection}
                                onSort={data.handleDocSort}
                                columnFilters={data.docColumnFilters}
                                onColumnFilterChange={data.handleDocColumnFilterChange}
                                footerLeft={`${data.documentTableData.length} Einträge`}
                            />
                        </div>
                    </div>

                    {/* Generierbare Dokumente */}
                    <div>
                        <SectionLabel>Generierbare Dokumente</SectionLabel>
                        <div className="mt-3 flex flex-col gap-4">
                            <DataCard
                                icon={BadgeCheck}
                                title="Mieterbescheinigung"
                                footer={
                                    <>
                                        {data.renderFooterUpload(data.mieterbescheinigungRow, MIETERBESCHEINIGUNG, false)}
                                        <Button
                                            label="Daten prüfen & Vorschau"
                                            icon={<Eye className="w-4 h-4" />}
                                            variant="outline"
                                            disabled={data.tenancy == null}
                                            onClick={() => data.goTo(`${data.generatorBase}/certificate`)}
                                        />
                                        <Button
                                            label="PDF generieren"
                                            icon={<FileText className="w-4 h-4" />}
                                            variant="primary"
                                            disabled={data.tenancy == null}
                                            onClick={() => data.goTo(`${data.generatorBase}/certificate?autoGenerate=1`)}
                                        />
                                    </>
                                }
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-2">
                                        {data.renderDocRow(data.mieterbescheinigungRow, MIETERBESCHEINIGUNG, false, false)}
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
                                    value={data.deposit}
                                    onChange={(e) => data.setDeposit(e.target.value)}
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
                onGhost={() => data.goTo(data.backHref)}
                onPrimary={() => void data.handleSave()}
                ghostLabel={BUTTON_DETAILS.Back.label}
                ghostIcon={<BUTTON_DETAILS.Back.icon />}
                primaryLabel="Mieterdaten speichern"
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={!data.isEditing || data.isSaving}
            />

            <ConfirmDeleteModal
                open={data.personIndexPendingDelete !== null}
                onCancel={() => data.setPersonIndexPendingDelete(null)}
                onConfirm={data.confirmDeletePerson}
                title="Person löschen?"
            >
                <p className="text-sm text-muted-foreground">
                    {data.personIndexPendingDelete !== null
                        ? `Möchtest du ${personDisplayName(data.persons[data.personIndexPendingDelete], data.personIndexPendingDelete)} wirklich löschen?`
                        : ''}
                </p>
            </ConfirmDeleteModal>

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
                context="an den Mieterdaten"
            />

            <Modal
                open={data.mieterwechselModalOpen}
                onClose={() => data.setMieterwechselModalOpen(false)}
                title="Mieterwechsel starten?"
                subtitle="Der aktuelle Mieter wird entfernt und die Einheit als unvermietet markiert."
                footer={
                    <>
                        <Button
                            label="Abbrechen"
                            variant="outline"
                            disabled={data.isStartingMieterwechsel}
                            onClick={() => data.setMieterwechselModalOpen(false)}
                        />
                        <Button
                            label="Ohne Mieterauszug fortfahren"
                            variant="outline"
                            disabled={data.isStartingMieterwechsel}
                            onClick={() => void data.confirmMieterwechsel(false)}
                        />
                        <Button
                            label="Mit Mieterauszug fortfahren"
                            icon={<DoorOpen className="w-4 h-4" />}
                            variant="primary"
                            disabled={data.isStartingMieterwechsel}
                            onClick={() => void data.confirmMieterwechsel(true)}
                        />
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    Du kannst direkt einen neuen Mieter erfassen, oder zuerst den Mieterauszug für den bisherigen Mieter durchführen.
                </p>
            </Modal>
        </div>
    );
}
