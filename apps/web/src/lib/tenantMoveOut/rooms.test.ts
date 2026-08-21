import { describe, expect, it } from 'vitest';
import { MOVE_OUT_ROOM_OPTIONS } from './rooms';

describe('MOVE_OUT_ROOM_OPTIONS', () => {
    it('has no duplicate or blank entries', () => {
        expect(new Set(MOVE_OUT_ROOM_OPTIONS).size).toBe(MOVE_OUT_ROOM_OPTIONS.length);
        expect(MOVE_OUT_ROOM_OPTIONS.every((room) => room.trim().length > 0)).toBe(true);
    });

    it('starts with Wohnzimmer and ends with Gartenanteil, per the spec order', () => {
        expect(MOVE_OUT_ROOM_OPTIONS[0]).toBe('Wohnzimmer');
        expect(MOVE_OUT_ROOM_OPTIONS[MOVE_OUT_ROOM_OPTIONS.length - 1]).toBe('Gartenanteil (bei Sondernutzung)');
    });

    it('includes the core household rooms', () => {
        expect(MOVE_OUT_ROOM_OPTIONS).toContain('Küche');
        expect(MOVE_OUT_ROOM_OPTIONS).toContain('Bad / Badezimmer');
        expect(MOVE_OUT_ROOM_OPTIONS).toContain('Schlafzimmer');
    });

    it('has exactly 31 options, matching the spec list', () => {
        expect(MOVE_OUT_ROOM_OPTIONS.length).toBe(31);
    });
});
