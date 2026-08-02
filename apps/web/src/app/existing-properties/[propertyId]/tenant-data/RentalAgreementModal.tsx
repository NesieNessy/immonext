"use client";

import { Button } from '@/components/ui';
import { getPersonalData } from '@/lib/supabase/personal_data.supabase';
import { deCurrencyFormatter, formatDeDate } from '@/lib/utils';
import type { PersonalData, Property, PropertyUnit, Tenancy } from '@immonext/types';
import { AlertTriangle, ArrowLeft, Eye, FileSignature, FileText, Home, Landmark, Upload, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DataCard, Field, initials, Pill, readFileAsDataUrl } from './DocumentGeneratorParts';
import type { PersonForCertificate } from './TenantCertificateModal';

interface RentalAgreementModalProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    property: Property;
    unit: PropertyUnit;
    unitLabel: string;
    tenancy: Tenancy | null;
    persons: PersonForCertificate[];
}

type View = 'review' | 'preview';

function euro(value: number | null | undefined): string {
    return value != null ? `${deCurrencyFormatter.format(value)} €` : '–';
}

interface AgreementContent {
    landlordName: string;
    landlordStreet: string;
    landlordCity: string;
    propertyAddress: string;
    unitLabel: string;
    livingArea: string;
    numberOfRooms: string;
    tenants: { name: string; role: string }[];
    mietbeginn: string;
    befristet: boolean;
    mietende: string;
    coldRent: string;
    miscRent: string;
    warmRent: string;
    parkingRent: string | null;
    deposit: string;
    issuePlace: string;
    issueDate: string;
    signatureDataUrl: string | null;
}

function agreementBodyHtml(c: AgreementContent): string {
    const tenantRows = c.tenants.map((t) => `
        <div style="background:#f4f4f5;border-radius:6px;padding:8px 12px;margin-bottom:6px;">
            <strong>${t.name}</strong> <span style="color:#666;font-size:12px;">— ${t.role}</span>
        </div>`).join('');

    const signatureBlock = c.signatureDataUrl
        ? `<img src="${c.signatureDataUrl}" style="max-height:60px;max-width:220px;" />`
        : `<div style="width:220px;height:60px;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">[Unterschrift nicht hinterlegt]</div>`;

    return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="font-size:13px;line-height:1.5;">
                <strong>${c.landlordName}</strong><br/>${c.landlordStreet}<br/>${c.landlordCity}
            </div>
            <div style="font-size:12px;color:#555;text-align:right;line-height:1.6;">
                Ausgestellt am: ${c.issueDate}<br/>
                Ausstellungsort: ${c.issuePlace}
            </div>
        </div>
        <hr style="margin:20px 0;border:none;border-top:1px solid #ccc;" />
        <h1 style="text-align:center;font-size:22px;margin-bottom:4px;">Mietvertrag für Wohnraum</h1>
        <p style="text-align:center;color:#666;font-size:13px;margin-bottom:28px;">zwischen dem Vermieter und der/den nachstehend genannten Mietpartei(en)</p>

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;">Vermieter</h2>
        <p style="margin:4px 0;"><span style="color:#666;">Name:</span> ${c.landlordName}</p>
        <p style="margin:4px 0 20px;"><span style="color:#666;">Adresse:</span> ${c.landlordStreet}, ${c.landlordCity}</p>

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;">Mieter</h2>
        ${tenantRows}

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin:20px 0 10px;">§ 1 Mieträume</h2>
        <p style="margin:4px 0;"><span style="color:#666;">Adresse:</span> ${c.propertyAddress}</p>
        <p style="margin:4px 0;"><span style="color:#666;">Einheit:</span> ${c.unitLabel}</p>
        <p style="margin:4px 0 20px;"><span style="color:#666;">Wohnfläche / Zimmer:</span> ${c.livingArea} / ${c.numberOfRooms}</p>

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;">§ 2 Mietzeit</h2>
        <p style="margin:4px 0;"><span style="color:#666;">Mietbeginn:</span> ${c.mietbeginn}</p>
        <p style="margin:4px 0 20px;"><span style="color:#666;">Mietverhältnis:</span> ${c.befristet ? `befristet bis ${c.mietende}` : 'unbefristet'}</p>

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;">§ 3 Miete und Nebenkosten</h2>
        <p style="margin:4px 0;"><span style="color:#666;">Kaltmiete:</span> ${c.coldRent}</p>
        <p style="margin:4px 0;"><span style="color:#666;">Nebenkostenvorauszahlung:</span> ${c.miscRent}</p>
        ${c.parkingRent ? `<p style="margin:4px 0;"><span style="color:#666;">Stellplatzmiete:</span> ${c.parkingRent}</p>` : ''}
        <p style="margin:4px 0 20px;"><span style="color:#666;">Gesamtmiete (warm):</span> ${c.warmRent}</p>

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;">§ 4 Kaution</h2>
        <p style="margin:4px 0 20px;"><span style="color:#666;">Höhe der Kaution:</span> ${c.deposit}</p>

        <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;">§ 5 Sonstige Vereinbarungen</h2>
        <div style="border-left:3px solid #3b82f6;background:#eff6ff;padding:12px 16px;font-size:13px;margin-bottom:24px;">
            Es gelten ergänzend die gesetzlichen Bestimmungen des Mietrechts (BGB). Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform.
        </div>

        <p style="margin:0 0 40px;">${c.issuePlace}, ${c.issueDate}</p>

        <div style="margin-bottom:8px;">${signatureBlock}</div>
        <div style="border-top:1px solid #111;width:260px;"></div>
        <div style="display:flex;justify-content:space-between;width:260px;font-size:12px;color:#555;margin-top:4px;">
            <span>Unterschrift Vermieter</span>
        </div>

        <div style="height:60px;"></div>
        <div style="border-top:1px solid #111;width:260px;"></div>
        <div style="display:flex;justify-content:space-between;width:260px;font-size:12px;color:#555;margin-top:4px;">
            <span>Unterschrift Mieter</span>
        </div>

        <hr style="margin:32px 0 12px;border:none;border-top:1px solid #eee;" />
        <p style="font-size:11px;color:#999;">Mietvertrag · ${c.propertyAddress} · Seite 1 von 1</p>
    `;
}

function agreementPrintDocument(c: AgreementContent): string {
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Mietvertrag</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 700px; margin: 48px auto; line-height: 1.6; }
    h1, h2 { font-family: Arial, Helvetica, sans-serif; }
</style>
</head>
<body>${agreementBodyHtml(c)}</body>
</html>`;
}

export function RentalAgreementModal({ open, onClose, userId, property, unit, unitLabel, tenancy, persons }: RentalAgreementModalProps) {
    const [view, setView] = useState<View>('review');
    const [landlord, setLandlord] = useState<PersonalData | null | undefined>(undefined);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [isUploadingSignature, setIsUploadingSignature] = useState(false);

    useEffect(() => {
        if (!open) return;
        setView('review');
        setLandlord(undefined);
        setSignatureDataUrl(null);
        getPersonalData(userId).then((data) => setLandlord(data ?? null));
    }, [open, userId]);

    if (!open) return null;

    const landlordName = landlord ? `${landlord.firstName} ${landlord.lastName}`.trim() : '';
    const landlordStreet = landlord ? `${landlord.street} ${landlord.houseNumber}` : '';
    const landlordCity = landlord ? `${landlord.postalCode} ${landlord.city}` : '';
    const propertyStreet = `${property.street} ${property.houseNumber}`;
    const propertyCity = `${property.postalCode} ${property.city}`;
    const propertyAddress = `${propertyStreet}, ${propertyCity}`;
    const namedPersons = persons.filter((p) => p.firstName.trim() !== '' || p.lastName.trim() !== '');
    const tenants = namedPersons.map((p) => ({
        name: `${p.firstName} ${p.lastName}`.trim(),
        role: p.isPrimary ? 'Hauptmieter' : 'Weitere Person',
    }));
    const mietbeginn = tenancy?.tenancyStartDate ? formatDeDate(tenancy.tenancyStartDate) : '–';
    const befristet = tenancy?.tenancyEndDate != null;
    const mietende = tenancy?.tenancyEndDate ? formatDeDate(tenancy.tenancyEndDate) : '–';
    const issuePlace = landlord?.city || property.city;
    const issueDate = formatDeDate(new Date().toISOString());
    const canGenerate = landlord != null && tenants.length > 0 && tenancy != null;

    const content: AgreementContent = {
        landlordName,
        landlordStreet,
        landlordCity,
        propertyAddress,
        unitLabel,
        livingArea: unit.livingAreaM2 != null ? `${unit.livingAreaM2} m²` : '–',
        numberOfRooms: unit.numberOfRooms != null ? String(unit.numberOfRooms) : '–',
        tenants,
        mietbeginn,
        befristet,
        mietende,
        coldRent: euro(tenancy?.coldRent),
        miscRent: euro(tenancy?.miscRent),
        warmRent: euro(tenancy?.warmRent),
        parkingRent: tenancy?.parkingSpaceRent ? euro(tenancy.parkingSpaceRent) : null,
        deposit: euro(tenancy?.deposit),
        issuePlace,
        issueDate,
        signatureDataUrl,
    };

    const handleUploadSignature = async (file: File) => {
        setIsUploadingSignature(true);
        try {
            setSignatureDataUrl(await readFileAsDataUrl(file));
        } finally {
            setIsUploadingSignature(false);
        }
    };

    const handleGenerate = () => {
        if (!canGenerate) return;
        const win = window.open('', '_blank', 'width=800,height=1000');
        if (!win) return;
        win.document.write(agreementPrintDocument(content));
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 250);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            <div className="relative z-10 w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col bg-card border border-border rounded-xl shadow-xl">
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">
                            {view === 'preview' ? 'Vorschau · Mietvertrag' : 'Mietvertrag generieren'}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground truncate">
                            {unitLabel} · {propertyAddress}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Schließen"
                        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {view === 'review' ? (
                    <div className="px-6 py-5 overflow-y-auto flex flex-col gap-6">
                        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/30">
                            <FileText className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                                Der Mietvertrag wird automatisch aus den hinterlegten Daten befüllt. Bitte prüfen Sie die Angaben bevor Sie das Dokument generieren.
                                Fehlende oder veraltete Daten können in den jeweiligen Bereichen ergänzt werden.
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Vermieter</p>
                            {landlord === null ? (
                                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                                    <p className="text-sm text-destructive">
                                        Es sind noch keine Vermieterdaten hinterlegt. Bitte ergänzen Sie diese in den{' '}
                                        <Link href="/user-settings" className="underline font-medium">Einstellungen</Link>.
                                    </p>
                                </div>
                            ) : (
                                <DataCard icon={Landmark} title="Vermieter-Daten" source="Einstellungen">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Field label="Name" value={landlord ? landlordName : '–'} />
                                        <Field label="Straße & Hausnummer" value={landlord ? landlordStreet : '–'} />
                                        <Field label="PLZ & Ort" value={landlord ? landlordCity : '–'} />
                                    </div>
                                </DataCard>
                            )}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mieträume</p>
                            <DataCard icon={Home} title="Objektdaten" source="Bestandsobjekt · Objektdaten">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <Field label="Straße & Hausnummer" value={propertyStreet} />
                                    <Field label="PLZ & Ort" value={propertyCity} />
                                    <Field label="Einheit" value={unitLabel} />
                                    <Field label="Wohnfläche / Zimmer" value={`${content.livingArea} / ${content.numberOfRooms}`} />
                                </div>
                            </DataCard>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mieter</p>
                            <DataCard icon={Users} title="Mieterdaten" source="Bestandsobjekt · Mieterdaten">
                                <div className="flex flex-col gap-2">
                                    {namedPersons.length === 0 && <p className="text-sm text-muted-foreground">Keine Mieterdaten hinterlegt.</p>}
                                    {namedPersons.map((person, index) => (
                                        <div key={index} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                                            <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                                {initials(person.firstName, person.lastName)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{`${person.firstName} ${person.lastName}`.trim()}</p>
                                                <p className="text-xs text-muted-foreground">{person.isPrimary ? 'Hauptmieter' : 'Weitere Person'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DataCard>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mietzeit, Miete und Kaution</p>
                            <DataCard icon={FileSignature} title="Mietkonditionen" source="Bestandsobjekt · Mieterdaten">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Field label="Mietbeginn" value={mietbeginn} />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Befristet</p>
                                        <div className="mt-1"><Pill ok={!befristet} label={befristet ? `bis ${mietende}` : 'Unbefristet'} /></div>
                                    </div>
                                    <Field label="Kaltmiete" value={content.coldRent} />
                                    <Field label="Nebenkosten" value={content.miscRent} />
                                    <Field label="Warmmiete" value={content.warmRent} />
                                    <Field label="Kaution" value={content.deposit} />
                                </div>
                            </DataCard>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Unterschrift Vermieter</p>
                            <div className="flex flex-col gap-3">
                                <div>
                                    <Pill ok={signatureDataUrl != null} label={signatureDataUrl != null ? 'Unterschrift hinterlegt' : 'Keine Unterschrift hinterlegt'} />
                                    {!signatureDataUrl && <span className="ml-2 text-xs text-muted-foreground">Das Dokument wird ohne Unterschrift generiert.</span>}
                                </div>
                                <div className="rounded-lg border border-dashed border-border p-4 flex items-center justify-between gap-4 flex-wrap">
                                    {signatureDataUrl ? (
                                        <div className="flex items-center gap-3">
                                            <img src={signatureDataUrl} alt="Unterschrift" className="h-12 max-w-[180px] object-contain" />
                                            <button type="button" onClick={() => setSignatureDataUrl(null)} className="text-sm text-destructive hover:underline cursor-pointer">
                                                Entfernen
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Laden Sie eine Unterschrift als Bilddatei hoch (PNG, JPG). Diese wird automatisch in das generierte PDF eingefügt.
                                            Alternativ kann die Unterschrift nachträglich in PDF ergänzt werden.
                                        </p>
                                    )}
                                    <input
                                        id="signature-upload-rental"
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        className="sr-only"
                                        disabled={isUploadingSignature}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (file) void handleUploadSignature(file);
                                        }}
                                    />
                                    <label htmlFor="signature-upload-rental">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-primary text-primary text-sm font-medium cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                                            <Upload className="w-4 h-4" />
                                            Unterschrift hochladen
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-center px-6 py-3 border-b border-border shrink-0">
                            <Pill ok={signatureDataUrl != null} label={signatureDataUrl != null ? 'Unterschrift hinterlegt' : 'Keine Unterschrift hinterlegt'} />
                        </div>
                        <div className="px-6 py-5 overflow-y-auto">
                            {canGenerate ? (
                                <div
                                    className="bg-white text-black rounded-md shadow-sm p-8 text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: agreementBodyHtml(content) }}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Es fehlen noch Angaben (Vermieterdaten oder Mieterdaten), um die Vorschau anzuzeigen.
                                </p>
                            )}
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
                    <Button label="Abbrechen" icon={<X className="w-4 h-4" />} variant="outline" onClick={onClose} />
                    {view === 'review' ? (
                        <Button label="Vorschau" icon={<Eye className="w-4 h-4" />} variant="outline" onClick={() => setView('preview')} disabled={!canGenerate} />
                    ) : (
                        <Button label="Daten prüfen" icon={<ArrowLeft className="w-4 h-4" />} variant="outline" onClick={() => setView('review')} />
                    )}
                    <Button
                        label="PDF generieren"
                        icon={<FileText className="w-4 h-4" />}
                        variant="primary"
                        disabled={!canGenerate}
                        onClick={handleGenerate}
                    />
                </div>
            </div>
        </div>
    );
}
