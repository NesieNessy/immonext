import { expect, test } from '@playwright/test';
import { E2E_FIXTURE } from './fixtures/seed';

const propertyAddress = `${E2E_FIXTURE.street} ${E2E_FIXTURE.houseNumber}`;

test('property list renders and a property can be opened', async ({ page }) => {
    await page.goto('/existing-properties');
    await expect(page.getByText(propertyAddress)).toBeVisible();

    await page.getByText(propertyAddress).click();

    // Two seeded units -> lands on the Einheiten picker, not stuck loading
    // or "not found" — this is exactly the routing chain that regressed
    // earlier this session (redundant fetches, hardcoded hasMultipleUnits).
    await expect(page.getByText(E2E_FIXTURE.unit1Label, { exact: true })).toBeVisible();
    await expect(page.getByText(E2E_FIXTURE.unit2Label, { exact: true })).toBeVisible();
    await expect(page.getByText('Objekt nicht gefunden')).not.toBeVisible();
});

test('unit hub -> Mieterdaten shows the real tenant', async ({ page }) => {
    await page.goto('/existing-properties');
    await page.getByText(propertyAddress).click();
    await page.getByText(E2E_FIXTURE.unit1Label, { exact: true }).click();

    // Now on the per-unit hub — exercises the [unitId] loader that had the
    // hardcoded hasMultipleUnits=true bug.
    await expect(page.getByText('Mieterdaten', { exact: true })).toBeVisible();
    await page.getByText('Mieterdaten', { exact: true }).click();

    await expect(page.getByText(`${E2E_FIXTURE.tenantFirstName} ${E2E_FIXTURE.tenantLastName}`)).toBeVisible();
});

test('a meter reading on Mieterauszug persists after reload', async ({ page }) => {
    await page.goto('/existing-properties');
    await page.getByText(propertyAddress).click();
    await page.getByText(E2E_FIXTURE.unit1Label, { exact: true }).click();
    await page.getByText('Mieterauszug', { exact: true }).click();

    await page.getByRole('button', { name: 'Zähler hinzufügen' }).click();
    await page.getByLabel('Raum').last().selectOption('Küche');
    await page.getByLabel('Zählerstand').last().fill('12345');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Auszugsdaten gespeichert.')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Zählerstand').last()).toHaveValue('12345');
});
