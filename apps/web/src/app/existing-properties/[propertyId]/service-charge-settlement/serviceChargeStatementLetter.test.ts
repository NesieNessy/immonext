import { describe, expect, it } from 'vitest';
import { serviceChargeStatementHtml, type ServiceChargeStatementParams } from './serviceChargeStatementLetter';

const baseParams: ServiceChargeStatementParams = {
    landlordName: 'Erika Musterfrau',
    landlordStreet: 'Musterweg 1',
    landlordCity: '80331 München',
    propertyAddress: 'Beispielstraße 123, 80801 München',
    unitLabel: 'Whg. 1 (EG links)',
    tenantNames: ['Hans Müller'],
    issuePlace: 'München',
    issueDate: '17.08.2026',
    settlementYear: 2025,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    costRows: [
        { label: 'Grundsteuer', actualAmount: 620, actualShare: 158.1, budgetAmount: 650, budgetShare: 165.75 },
    ],
    totalActualCosts: 10220,
    totalBudgetCosts: 10730,
    unitActualShare: 2605.06,
    unitBudgetShare: 2735.1,
    annualPrepayment: 2160,
    overUnderCoverage: 445.06,
    currentMonthlyPrepayment: 180,
    newMonthlyPrepayment: 227.93,
    coldRent: 1200,
};

describe('serviceChargeStatementHtml', () => {
    it('renders a full HTML document titled with the settlement year', () => {
        const html = serviceChargeStatementHtml(baseParams);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Nebenkostenabrechnung 2025</title>');
        expect(html).toContain('<h1>Nebenkostenabrechnung 2025</h1>');
    });

    it('includes the landlord and property/unit address', () => {
        const html = serviceChargeStatementHtml(baseParams);
        expect(html).toContain('Erika Musterfrau');
        expect(html).toContain('Beispielstraße 123, 80801 München · Whg. 1 (EG links)');
    });

    it('omits the unit label separator when there is no unit label', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, unitLabel: '' });
        expect(html).toContain('Beispielstraße 123, 80801 München');
        expect(html).not.toContain('München ·');
    });

    it('uses singular salutation for one tenant', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, tenantNames: ['Hans Müller'] });
        expect(html).toContain('Sehr geehrter Hans Müller,');
    });

    it('uses plural salutation and slash-joins multiple tenant names', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, tenantNames: ['Hans Müller', 'Maria Müller'] });
        expect(html).toContain('Sehr geehrte Hans Müller / Maria Müller,');
    });

    it('formats the settlement period as German dates', () => {
        const html = serviceChargeStatementHtml(baseParams);
        expect(html).toContain('<strong>01.01.2025</strong> bis <strong>31.12.2025</strong>');
    });

    it('renders one cost row per item in both the actuals and budget-plan tables', () => {
        const html = serviceChargeStatementHtml(baseParams);
        expect(html).toContain('<td>Grundsteuer</td><td>620 €</td><td>158 €</td>');
        expect(html).toContain('<td>Grundsteuer</td><td>650 €</td><td>166 €</td>');
    });

    it('falls back to a dash for null cost amounts', () => {
        const html = serviceChargeStatementHtml({
            ...baseParams,
            costRows: [{ label: 'Sonstiges', actualAmount: null, actualShare: null, budgetAmount: null, budgetShare: null }],
        });
        expect(html).toContain('<td>Sonstiges</td><td>–</td><td>–</td>');
    });

    it('labels a positive over/under coverage as a shortfall ("Nachzahlung durch Sie")', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, overUnderCoverage: 445.06 });
        expect(html).toContain('Nachzahlung durch Sie');
        expect(html).not.toContain('Guthaben zu Ihren Gunsten');
        expect(html).toContain('445 €');
    });

    it('labels a negative over/under coverage as a credit ("Guthaben zu Ihren Gunsten") and shows the absolute amount', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, overUnderCoverage: -300 });
        expect(html).toContain('Guthaben zu Ihren Gunsten');
        expect(html).not.toContain('Nachzahlung durch Sie');
        expect(html).toContain('300 €');
    });

    it('treats an exact break-even (zero) as a credit, matching the non-positive branch', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, overUnderCoverage: 0 });
        expect(html).toContain('Guthaben zu Ihren Gunsten');
    });

    it('titles the budget-plan section with the following year', () => {
        const html = serviceChargeStatementHtml(baseParams);
        expect(html).toContain('<h2>Wirtschaftsplan 2026</h2>');
    });

    it('computes the new prepayment effective date as January 1st of the year after periodEnd', () => {
        const html = serviceChargeStatementHtml(baseParams);
        expect(html).toContain('Neue monatliche Vorauszahlung ab 01.01.2026');
    });

    it('shows a dash for the new monthly prepayment when null', () => {
        const html = serviceChargeStatementHtml({ ...baseParams, newMonthlyPrepayment: null });
        expect(html).toContain('<span>Neue monatliche Vorauszahlung ab 01.01.2026</span><strong>–</strong>');
    });
});
