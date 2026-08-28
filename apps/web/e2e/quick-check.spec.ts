import { Client } from 'pg';
import { expect, Page, test } from '@playwright/test';

/**
 * Quick Check (Ersteinschätzung) isn't part of the property/unit fixture —
 * unlike the other smoke tests, these create their own record through the
 * UI itself (create → save → reopen), since that's the actual flow under
 * test (the create form, the overview table, and the edit/detail view all
 * reading/writing the same quick_check row). A distinctive postal code
 * ('00420') identifies the row created by this run without needing its id.
 *
 * Unlike fixtures/seed.ts, this data isn't shared setup — it's created by
 * the test itself. Still needs the same delete-before-insert idempotency
 * though: without it, re-running this spec against a stack that wasn't
 * freshly `supabase db reset` (e.g. a local dev loop) would leave multiple
 * rows with the same postal code and break the getByText(POSTAL_CODE)
 * lookups (Playwright's strict mode rejects ambiguous matches).
 */
const STREET = 'E2E Ersteinschätzungsstraße 5';
const POSTAL_CODE = '00420';
const CITY = 'E2E Stadt';

/**
 * Both the overview table (desktop `<Table>` + mobile `renderMobileCard`)
 * and the Header component's page title render a mobile and a desktop copy
 * at the same time — CSS hides whichever doesn't match the viewport, but
 * both stay in the DOM, so a plain getByText() matches both and Playwright's
 * strict mode rejects the ambiguity. `.and(':visible')` narrows to the one
 * actually shown at the Desktop Chrome viewport this suite runs at.
 */
function visibleText(page: Page, text: string, options?: { exact?: boolean }) {
    return page.getByText(text, options).and(page.locator(':visible'));
}

test.beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required to clean up e2e quick-check rows.');

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
        await client.query('DELETE FROM quick_check WHERE postal_code = $1', [POSTAL_CODE]);
    } finally {
        await client.end();
    }
});

test('create an Ersteinschätzung and see it in the overview', async ({ page }) => {
    await page.goto('/property-valuation/quick-check');
    await page.getByRole('button', { name: 'Neue Ersteinschätzung' }).click();

    await expect(page).toHaveURL(/\/property-valuation\/quick-check\/new/);

    await page.getByLabel('Straße & Hausnummer').fill(STREET);
    await page.getByLabel('Postleitzahl').fill(POSTAL_CODE);
    await page.getByLabel('Stadt').fill(CITY);
    await page.getByLabel('Kaufpreis').fill('450000');
    await page.getByLabel('Kaltmiete').fill('1200');
    await page.getByLabel('Zustand').selectOption('Standard');
    await page.getByLabel('Baujahr').fill('1995');

    // All required fields filled -> the live KPF result panel replaces the
    // "no result yet" placeholder.
    await expect(page.getByText('Kein Ergebnis vorhanden')).not.toBeVisible();

    await page.getByRole('button', { name: 'Ersteinschätzung speichern' }).click();
    await expect(page.getByText('Ersteinschätzung gespeichert.')).toBeVisible();

    // Saving navigates back to the overview — the new row must show up there.
    await expect(page).toHaveURL(/\/property-valuation\/quick-check$/);
    await expect(visibleText(page, POSTAL_CODE)).toBeVisible();
});

test('opening an Ersteinschätzung row loads its data', async ({ page }) => {
    await page.goto('/property-valuation/quick-check');
    await visibleText(page, POSTAL_CODE).click();

    await expect(page).toHaveURL(/\/property-valuation\/quick-check\/\d+$/);

    // The breadcrumb's last crumb is the loaded record's street, and the
    // form is pre-filled from the same row — both must reflect what was
    // saved by the previous test, exercising the full read-back path
    // (useQuickCheckById -> edit form -> KPF recompute).
    await expect(visibleText(page, STREET, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Postleitzahl')).toHaveValue(POSTAL_CODE);
    await expect(page.getByLabel('Stadt')).toHaveValue(CITY);
});
