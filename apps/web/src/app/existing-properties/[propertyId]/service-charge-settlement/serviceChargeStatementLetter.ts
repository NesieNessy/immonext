import { deCurrencyFormatter, formatDeDate } from '@/lib/utils';

interface StatementParty {
    landlordName: string;
    landlordStreet: string;
    landlordCity: string;
    propertyAddress: string;
    unitLabel: string;
    tenantNames: string[];
    issuePlace: string;
    issueDate: string;
}

interface StatementCostRow {
    label: string;
    actualAmount: number | null;
    actualShare: number | null;
    budgetAmount: number | null;
    budgetShare: number | null;
}

export interface ServiceChargeStatementParams extends StatementParty {
    settlementYear: number;
    periodStart: string;
    periodEnd: string;
    costRows: StatementCostRow[];
    totalActualCosts: number;
    totalBudgetCosts: number;
    unitActualShare: number;
    unitBudgetShare: number;
    annualPrepayment: number;
    overUnderCoverage: number;
    currentMonthlyPrepayment: number;
    newMonthlyPrepayment: number | null;
    coldRent: number | null;
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
    body { font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 760px; margin: 48px auto; line-height: 1.5; }
    h1 { font-size: 18px; margin: 32px 0 16px; }
    h2 { font-size: 14px; margin: 24px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { padding: 6px 8px; text-align: right; border-bottom: 1px solid #eee; }
    th:first-child, td:first-child { text-align: left; }
    thead th { border-bottom: 1px solid #999; color: #555; font-weight: 600; }
    tfoot td { font-weight: 700; border-top: 1px solid #999; }
    .muted { color: #555; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function costTable(rows: StatementCostRow[], amountKey: 'actualAmount' | 'budgetAmount', shareKey: 'actualShare' | 'budgetShare'): string {
    return `
        <table>
            <thead><tr><th>Kostenposition</th><th>Gesamt Objekt</th><th>Anteil Wohnung</th></tr></thead>
            <tbody>
                ${rows.map((row) => `<tr><td>${row.label}</td><td>${euro(row[amountKey])}</td><td>${euro(row[shareKey])}</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

export function serviceChargeStatementHtml(p: ServiceChargeStatementParams): string {
    const body = `
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

        <h1>Nebenkostenabrechnung ${p.settlementYear}</h1>
        <p>Sehr geehrte${p.tenantNames.length > 1 ? '' : 'r'} ${p.tenantNames.join(' / ')},</p>
        <p>
            anbei erhalten Sie die Abrechnung der Betriebskosten für den Zeitraum
            <strong>${formatDeDate(p.periodStart)}</strong> bis <strong>${formatDeDate(p.periodEnd)}</strong>
            sowie den Wirtschaftsplan für das Folgejahr.
        </p>

        <h2>Abrechnung ${p.settlementYear}</h2>
        ${costTable(p.costRows, 'actualAmount', 'actualShare')}
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Gesamtkosten Objekt (umlagefähig)</span><strong>${euro(p.totalActualCosts)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Ihr Anteil</span><strong>${euro(p.unitActualShare)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Geleistete Vorauszahlungen</span><strong>${euro(p.annualPrepayment)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;">
            <span>${p.overUnderCoverage < 0 ? 'Nachzahlung durch Sie' : 'Guthaben zu Ihren Gunsten'}</span>
            <strong>${euro(Math.abs(p.overUnderCoverage))}</strong>
        </p>

        <h2>Wirtschaftsplan ${p.settlementYear + 1}</h2>
        ${costTable(p.costRows, 'budgetAmount', 'budgetShare')}
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Voraussichtliche Gesamtkosten Objekt (umlagefähig)</span><strong>${euro(p.totalBudgetCosts)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Ihr voraussichtlicher Anteil</span><strong>${euro(p.unitBudgetShare)}</strong></p>

        <h2>Anpassung der Nebenkostenvorauszahlung</h2>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Bisherige monatliche Vorauszahlung</span><strong>${euro(p.currentMonthlyPrepayment)}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;"><span>Neue monatliche Vorauszahlung ab ${formatDeDate(new Date(new Date(p.periodEnd).getFullYear() + 1, 0, 1).toISOString())}</span><strong>${euro(p.newMonthlyPrepayment)}</strong></p>
        <p class="muted">
            Grundlage für die neue Vorauszahlung ist der oben stehende Wirtschaftsplan gemäß § 560 BGB.
            Ihre Nettokaltmiete bleibt hiervon unberührt.
        </p>

        <p style="margin-top:48px;">Mit freundlichen Grüßen</p>
        <div style="height:40px;"></div>
        <p>${p.landlordName}</p>
    `;
    return letterFrame(`Nebenkostenabrechnung ${p.settlementYear}`, body);
}
