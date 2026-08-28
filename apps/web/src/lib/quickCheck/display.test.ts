import { describe, expect, it } from 'vitest';
import { PropertyCondition } from '@immonext/types';
import type { QuickCheckOverview } from '@/lib/supabase/quick_check.supabase';
import {
  CONDITION_FILTER_OPTIONS,
  CONDITION_PILL_LABEL,
  conditionVariant,
  getPlaceholderPortalUrl,
  getQuickCheckFieldErrors,
  MANUAL_ENTRY_LABEL,
  toEntry,
  type QuickCheckEntry,
  type QuickCheckFormFields,
} from './display';

// Base row shared by the toEntry/getPlaceholderPortalUrl tests below —
// individual tests override only the fields they care about.
const baseRow: QuickCheckOverview = {
  quickCheckId: 1,
  userId: 'user-1',
  ingestDate: '2026-01-15T10:00:00.000Z',
  portalId: 'IS24-12345',
  kpfMultiplier: 24.5,
  purchasePrice: 300000,
  coldRent: 1000,
  street: 'Musterstraße 1',
  postalCode: '80331',
  city: 'München',
  yearOfConstruction: 1990,
  condition: PropertyCondition.Standard,
  status: 'ACTIVE',
  finalisedAction: null,
  detailCheck: false,
  propertyId: null,
  recommendationScore: null,
  recommendationLevel: null,
};

describe('toEntry', () => {
  it('maps the DB row 1:1 for the passthrough fields', () => {
    const entry = toEntry(baseRow);
    expect(entry.id).toBe(baseRow.quickCheckId);
    expect(entry.ingestDate).toBe(baseRow.ingestDate);
    expect(entry.portalId).toBe('IS24-12345');
    expect(entry.kpfMultiplier).toBe(24.5);
    expect(entry.purchasePrice).toBe(300000);
    expect(entry.postalCode).toBe('80331');
    expect(entry.condition).toBe(PropertyCondition.Standard);
    expect(entry.detailCheck).toBe(false);
  });

  it('renames yearOfConstruction to constructionYear', () => {
    expect(toEntry(baseRow).constructionYear).toBe(1990);
  });

  it('falls back to the manual-entry label when portalId is null', () => {
    expect(toEntry({ ...baseRow, portalId: null }).portalId).toBe(MANUAL_ENTRY_LABEL);
  });

  it('maps ACTIVE/INACTIVE to the German aktiv/inaktiv status', () => {
    expect(toEntry({ ...baseRow, status: 'ACTIVE' }).status).toBe('aktiv');
    expect(toEntry({ ...baseRow, status: 'INACTIVE' }).status).toBe('inaktiv');
  });
});

describe('getPlaceholderPortalUrl', () => {
  const entry: QuickCheckEntry = toEntry(baseRow);

  it('returns null for a manually entered row (no real portal ID)', () => {
    expect(getPlaceholderPortalUrl({ ...entry, portalId: MANUAL_ENTRY_LABEL })).toBeNull();
  });

  it('returns null for an inactive row', () => {
    expect(getPlaceholderPortalUrl({ ...entry, status: 'inaktiv' })).toBeNull();
  });

  it('returns null for an opaque, non-URL portal reference — no fabricated link to an unrelated domain', () => {
    expect(getPlaceholderPortalUrl({ ...entry, portalId: 'IS24-12345' })).toBeNull();
  });

  it('returns the portal ID itself when it is a real, absolute URL', () => {
    const realUrl = 'https://www.immobilienscout24.de/expose/123456789';
    expect(getPlaceholderPortalUrl({ ...entry, portalId: realUrl })).toBe(realUrl);
  });

  it('is case-insensitive about the http(s) scheme', () => {
    const realUrl = 'HTTPS://www.immowelt.de/expose/123';
    expect(getPlaceholderPortalUrl({ ...entry, portalId: realUrl })).toBe(realUrl);
  });
});

describe('conditionVariant / CONDITION_PILL_LABEL / CONDITION_FILTER_OPTIONS', () => {
  it('has an entry for every PropertyCondition value', () => {
    for (const condition of Object.values(PropertyCondition)) {
      expect(conditionVariant[condition]).toBeDefined();
      expect(CONDITION_PILL_LABEL[condition]).toBeDefined();
    }
    expect(CONDITION_FILTER_OPTIONS).toHaveLength(Object.values(PropertyCondition).length);
  });
});

describe('getQuickCheckFieldErrors', () => {
  const currentYear = 2026;
  const emptyFields: QuickCheckFormFields = {
    street: '',
    postalCode: '',
    city: '',
    purchasePrice: '',
    coldRent: '',
    yearOfConstruction: '',
  };

  it('reports no errors for an untouched (all-empty) form', () => {
    const errors = getQuickCheckFieldErrors(emptyFields, 0, 0, currentYear);
    expect(Object.values(errors).every((message) => message === '')).toBe(true);
  });

  it('reports no errors for a fully valid form', () => {
    const fields: QuickCheckFormFields = {
      street: 'Musterstraße 1',
      postalCode: '80331',
      city: 'München',
      purchasePrice: '300000',
      coldRent: '1000',
      yearOfConstruction: '1990',
    };
    const errors = getQuickCheckFieldErrors(fields, 300000, 1000, currentYear);
    expect(Object.values(errors).every((message) => message === '')).toBe(true);
  });

  it('flags a street or city longer than 120 characters', () => {
    const longText = 'a'.repeat(121);
    const errors = getQuickCheckFieldErrors({ ...emptyFields, street: longText, city: longText }, 0, 0, currentYear);
    expect(errors.street).toBe('Maximal 120 Zeichen');
    expect(errors.city).toBe('Maximal 120 Zeichen');
  });

  it('requires exactly 5 digits for the postal code once touched', () => {
    expect(getQuickCheckFieldErrors({ ...emptyFields, postalCode: '8033' }, 0, 0, currentYear).postalCode)
      .toBe('Genau 5 Ziffern erforderlich');
    expect(getQuickCheckFieldErrors({ ...emptyFields, postalCode: '80331a' }, 0, 0, currentYear).postalCode)
      .toBe('Genau 5 Ziffern erforderlich');
    expect(getQuickCheckFieldErrors({ ...emptyFields, postalCode: '80331' }, 0, 0, currentYear).postalCode)
      .toBe('');
  });

  it('requires purchase price and cold rent to be > 0 once the field is non-empty', () => {
    const errors = getQuickCheckFieldErrors({ ...emptyFields, purchasePrice: '0', coldRent: '-5' }, 0, -5, currentYear);
    expect(errors.purchasePrice).toBe('Muss größer als 0 sein');
    expect(errors.coldRent).toBe('Muss größer als 0 sein');
  });

  it('does not flag purchase price / cold rent while the field is still empty, regardless of the parsed value', () => {
    const errors = getQuickCheckFieldErrors(emptyFields, 0, 0, currentYear);
    expect(errors.purchasePrice).toBe('');
    expect(errors.coldRent).toBe('');
  });

  it('flags an implausible construction year once touched', () => {
    const errors = getQuickCheckFieldErrors({ ...emptyFields, yearOfConstruction: '1700' }, 0, 0, currentYear);
    expect(errors.yearOfConstruction).toBe(`Zwischen 1850 und ${currentYear}`);
  });

  it('accepts a valid construction year', () => {
    const errors = getQuickCheckFieldErrors({ ...emptyFields, yearOfConstruction: '1990' }, 0, 0, currentYear);
    expect(errors.yearOfConstruction).toBe('');
  });
});
