import { deCurrencyFormatter, formatDeDate } from '@/lib/utils';

interface LetterParty {
    landlordName: string;
    landlordStreet: string;
    landlordCity: string;
    propertyAddress: string;
    unitLabel: string;
    tenantNames: string[];
    issuePlace: string;
    issueDate: string;
}

function euro(value: number | null | undefined): string {
    return value != null ? `${deCurrencyFormatter.format(value)} €` : '–';
}

function letterFrame(title: string, bodyHtml: string): string {
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; color: #101828; max-width: 700px; margin: 48px auto; line-height: 1.6; }
    h1 { font-size: 18px; margin: 32px 0 16px; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function letterHeader(p: LetterParty): string {
    return `
        <div>
            <strong>${p.landlordName}</strong><br/>
            ${p.landlordStreet}<br/>
            ${p.landlordCity}
        </div>
        <div style="margin-top:24px;">
            ${p.tenantNames.map((name) => `${name}<br/>`).join('')}
            ${p.propertyAddress}${p.unitLabel ? ` · ${p.unitLabel}` : ''}
        </div>
        <p style="margin-top:24px;text-align:right;">${p.issuePlace}, den ${p.issueDate}</p>
    `;
}

export interface RentIncreaseLetterParams extends LetterParty {
    currentColdRent: number | null;
    increaseAmount: number;
    effectiveDate: string;
}

export function rentIncreaseLetterHtml(p: RentIncreaseLetterParams): string {
    const newRent = p.currentColdRent != null ? p.currentColdRent + p.increaseAmount : null;
    const body = `
        ${letterHeader(p)}
        <h1>Mieterhöhung gemäß § 558 BGB</h1>
        <p>Sehr geehrte${p.tenantNames.length > 1 ? '' : 'r'} ${p.tenantNames.join(' / ')},</p>
        <p>
            hiermit erhöhe ich gemäß § 558 BGB (Mieterhöhung bis zur ortsüblichen Vergleichsmiete)
            die von Ihnen für die oben genannte Wohnung zu zahlende monatliche Netto-Kaltmiete
            mit Wirkung zum <strong>${formatDeDate(p.effectiveDate)}</strong> wie folgt:
        </p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Bisherige Netto-Kaltmiete</span><strong>${euro(p.currentColdRent)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Erhöhungsbetrag</span><strong>${euro(p.increaseAmount)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;border-top:1px solid #d0d5dd;padding-top:8px;"><span>Neue Netto-Kaltmiete</span><strong>${euro(newRent)}</strong></p>
        <p>
            Die übrigen Bestandteile Ihrer Miete (Nebenkosten) bleiben von dieser Erhöhung unberührt.
            Bitte überweisen Sie ab dem genannten Datum die neue Gesamtmiete auf das Ihnen bekannte Konto.
        </p>
        <p style="margin-top:48px;">Mit freundlichen Grüßen</p>
        <div style="height:40px;"></div>
        <p>${p.landlordName}</p>
    `;
    return letterFrame('Mieterhöhungsschreiben', body);
}

export interface RenovationAdjustmentLetterParams extends LetterParty {
    modernizationAmount: number;
    startDate: string | null;
    endDate: string | null;
    effectiveDate: string;
}

export function renovationAdjustmentLetterHtml(p: RenovationAdjustmentLetterParams): string {
    const body = `
        ${letterHeader(p)}
        <h1>Mieterhöhung nach Modernisierung gemäß § 559 BGB</h1>
        <p>Sehr geehrte${p.tenantNames.length > 1 ? '' : 'r'} ${p.tenantNames.join(' / ')},</p>
        <p>
            im Zeitraum vom <strong>${formatDeDate(p.startDate)}</strong> bis zum <strong>${formatDeDate(p.endDate)}</strong>
            wurden an der oben genannten Wohnung Modernisierungsmaßnahmen im Sinne des § 555b BGB durchgeführt.
            Gemäß § 559 BGB erhöhe ich die von Ihnen zu zahlende monatliche Netto-Kaltmiete
            mit Wirkung zum <strong>${formatDeDate(p.effectiveDate)}</strong> um den auf Ihre Wohnung entfallenden Anteil
            der Modernisierungskosten.
        </p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;border-top:1px solid #d0d5dd;padding-top:8px;"><span>Monatliche Erhöhung</span><strong>${euro(p.modernizationAmount)}</strong></p>
        <p>
            Die Berechnung berücksichtigt die gesetzliche Kappungsgrenze von 3,00 € je Quadratmeter Wohnfläche
            innerhalb von sechs Jahren (bzw. 2,00 €, sofern die bisherige Miete unter 7,00 €/m² lag).
        </p>
        <p style="margin-top:48px;">Mit freundlichen Grüßen</p>
        <div style="height:40px;"></div>
        <p>${p.landlordName}</p>
    `;
    return letterFrame('Sanierungsanpassungsschreiben', body);
}

export function openAndPrintLetter(html: string): void {
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
}
