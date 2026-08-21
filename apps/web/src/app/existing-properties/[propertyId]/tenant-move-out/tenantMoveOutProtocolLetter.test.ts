import { describe, expect, it } from 'vitest';
import { tenantMoveOutProtocolHtml, type TenantMoveOutProtocolParams } from './tenantMoveOutProtocolLetter';

const baseParams: TenantMoveOutProtocolParams = {
    landlordName: 'Erika Musterfrau',
    landlordStreet: 'Musterweg 1',
    landlordCity: '80331 München',
    propertyAddress: 'Beispielstraße 123, 80801 München',
    tenantName: 'Müller, Hans & Maria',
    moveOutDate: '31.08.2026',
    issueDate: '17.08.2026',
    meterReadings: [],
    damages: [],
};

describe('tenantMoveOutProtocolHtml', () => {
    it('renders a full HTML document with the title and party details', () => {
        const html = tenantMoveOutProtocolHtml(baseParams);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Abnahmeprotokoll</title>');
        expect(html).toContain('Erika Musterfrau');
        expect(html).toContain('Müller, Hans & Maria');
        expect(html).toContain('31.08.2026');
        expect(html).toContain('17.08.2026');
    });

    it('shows a placeholder row when there are no meter readings', () => {
        const html = tenantMoveOutProtocolHtml(baseParams);
        expect(html).toContain('Keine Zählerstände erfasst.');
    });

    it('shows a placeholder row when there are no damages', () => {
        const html = tenantMoveOutProtocolHtml(baseParams);
        expect(html).toContain('Keine Schäden erfasst.');
    });

    it('renders one row per meter reading, falling back to a dash for blanks', () => {
        const html = tenantMoveOutProtocolHtml({
            ...baseParams,
            meterReadings: [
                { room: 'Küche', value: '12345' },
                { room: '', value: '' },
            ],
        });
        expect(html).toContain('<tr><td>Küche</td><td>12345</td></tr>');
        expect(html).toContain('<tr><td>–</td><td>–</td></tr>');
        expect(html).not.toContain('Keine Zählerstände erfasst.');
    });

    it('numbers damages sequentially and singularizes a single photo', () => {
        const html = tenantMoveOutProtocolHtml({
            ...baseParams,
            damages: [
                { description: 'Kratzer im Parkett', photoCount: 1 },
                { description: 'Fleck an der Wand', photoCount: 3 },
            ],
        });
        expect(html).toContain('<tr><td>Schaden 1</td><td>Kratzer im Parkett</td><td>1 Foto</td></tr>');
        expect(html).toContain('<tr><td>Schaden 2</td><td>Fleck an der Wand</td><td>3 Fotos</td></tr>');
    });

    it('falls back to a dash for a damage with no description', () => {
        const html = tenantMoveOutProtocolHtml({
            ...baseParams,
            damages: [{ description: '', photoCount: 0 }],
        });
        expect(html).toContain('<tr><td>Schaden 1</td><td>–</td><td>0 Fotos</td></tr>');
    });
});
