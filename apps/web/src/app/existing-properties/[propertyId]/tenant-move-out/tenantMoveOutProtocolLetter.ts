interface MeterReadingRow {
    room: string;
    value: string;
}

interface DamageRow {
    description: string;
    photoCount: number;
}

export interface TenantMoveOutProtocolParams {
    landlordName: string;
    landlordStreet: string;
    landlordCity: string;
    propertyAddress: string;
    tenantName: string;
    moveOutDate: string;
    issueDate: string;
    meterReadings: MeterReadingRow[];
    damages: DamageRow[];
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
    th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; }
    thead th { border-bottom: 1px solid #999; color: #555; font-weight: 600; }
    .muted { color: #555; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

export function tenantMoveOutProtocolHtml(p: TenantMoveOutProtocolParams): string {
    const meterRows = p.meterReadings.length > 0
        ? p.meterReadings.map((r) => `<tr><td>${r.room || '–'}</td><td>${r.value || '–'}</td></tr>`).join('')
        : '<tr><td colspan="2" class="muted">Keine Zählerstände erfasst.</td></tr>';

    const damageRows = p.damages.length > 0
        ? p.damages.map((d, i) => `<tr><td>Schaden ${i + 1}</td><td>${d.description || '–'}</td><td>${d.photoCount} Foto${d.photoCount === 1 ? '' : 's'}</td></tr>`).join('')
        : '<tr><td colspan="3" class="muted">Keine Schäden erfasst.</td></tr>';

    const body = `
        <div>
            <strong>${p.landlordName}</strong><br/>
            ${p.landlordStreet}<br/>
            ${p.landlordCity}
        </div>
        <div style="margin-top:24px;">
            ${p.tenantName}<br/>
            ${p.propertyAddress}
        </div>
        <p style="margin-top:24px;text-align:right;">den ${p.issueDate}</p>

        <h1>Abnahmeprotokoll</h1>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Mieter</span><strong>${p.tenantName}</strong></p>
        <p style="margin:16px 0;display:flex;justify-content:space-between;"><span>Auszugsdatum</span><strong>${p.moveOutDate}</strong></p>

        <h2>Zählerstände bei Auszug</h2>
        <table>
            <thead><tr><th>Raum</th><th>Zählerstand</th></tr></thead>
            <tbody>${meterRows}</tbody>
        </table>

        <h2>Schäden</h2>
        <table>
            <thead><tr><th></th><th>Beschreibung</th><th>Fotos</th></tr></thead>
            <tbody>${damageRows}</tbody>
        </table>

        <p style="margin-top:48px;">Mit freundlichen Grüßen</p>
        <div style="height:40px;"></div>
        <p>${p.landlordName}</p>
    `;
    return letterFrame('Abnahmeprotokoll', body);
}
