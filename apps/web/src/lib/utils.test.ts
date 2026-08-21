import { describe, expect, it } from 'vitest';
import { base64ToDataUri, cn, deCurrencyFormatter, deNumberFormatter, formatDeDate } from './utils';

describe('cn', () => {
    it('merges class names, letting later Tailwind classes win over earlier conflicting ones', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('drops falsy values', () => {
        expect(cn('a', false, undefined, null, 'b')).toBe('a b');
    });
});

describe('deNumberFormatter', () => {
    it('formats whole numbers without decimals', () => {
        expect(deNumberFormatter.format(50)).toBe('50');
    });

    it('formats fractional numbers with a German decimal comma', () => {
        expect(deNumberFormatter.format(2.5)).toBe('2,5');
    });
});

describe('deCurrencyFormatter', () => {
    it('formats whole euro amounts with German thousands separators', () => {
        expect(deCurrencyFormatter.format(1200)).toBe('1.200');
    });

    it('rounds to whole euros', () => {
        expect(deCurrencyFormatter.format(1200.6)).toBe('1.201');
    });
});

describe('formatDeDate', () => {
    it('formats an ISO date string as dd.MM.yyyy', () => {
        expect(formatDeDate('2026-03-05')).toBe('05.03.2026');
    });

    it('returns a dash for null', () => {
        expect(formatDeDate(null)).toBe('–');
    });

    it('returns a dash for undefined', () => {
        expect(formatDeDate(undefined)).toBe('–');
    });

    it('returns a dash for an empty string', () => {
        expect(formatDeDate('')).toBe('–');
    });
});

describe('base64ToDataUri', () => {
    it('returns null for falsy input', () => {
        expect(base64ToDataUri(null)).toBeNull();
        expect(base64ToDataUri(undefined)).toBeNull();
        expect(base64ToDataUri('')).toBeNull();
    });

    it('passes through a value that is already a data URI', () => {
        expect(base64ToDataUri('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    });

    it('detects JPEG from the base64 prefix', () => {
        expect(base64ToDataUri('/9j/4AAQ')).toBe('data:image/jpeg;base64,/9j/4AAQ');
    });

    it('detects PNG from the base64 prefix', () => {
        expect(base64ToDataUri('iVBORw0KGgo')).toBe('data:image/png;base64,iVBORw0KGgo');
    });

    it('detects GIF from the base64 prefix', () => {
        expect(base64ToDataUri('R0lGODlhAQ')).toBe('data:image/gif;base64,R0lGODlhAQ');
    });

    it('detects WEBP from the base64 prefix', () => {
        expect(base64ToDataUri('UklGRiQAAA')).toBe('data:image/webp;base64,UklGRiQAAA');
    });

    it('falls back to JPEG for an unrecognized prefix', () => {
        expect(base64ToDataUri('unknownPrefix')).toBe('data:image/jpeg;base64,unknownPrefix');
    });
});
