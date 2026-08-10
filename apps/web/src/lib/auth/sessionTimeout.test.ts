import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLoginTime, isSessionExpired, msUntilExpiry, recordLoginTime } from './sessionTimeout';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/** Minimal in-memory Storage — vitest's node environment has no real
 *  localStorage (unlike a browser), so this stands in for it. It's a plain
 *  key/value stub, not a rendering fake, so it stays within the "pure logic
 *  only" spirit of this test suite: what's under test is the expiry math,
 *  not the browser Storage API itself. */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, value); },
    removeItem: (key) => { store.delete(key); },
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
  vi.stubGlobal('localStorage', createMemoryStorage());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('isSessionExpired', () => {
  it('is expired when no login time has ever been recorded', () => {
    expect(isSessionExpired()).toBe(true);
  });

  it('is not expired immediately after recording', () => {
    recordLoginTime();
    expect(isSessionExpired()).toBe(false);
  });

  it('is not expired just under the 2-hour window', () => {
    recordLoginTime();
    vi.advanceTimersByTime(TWO_HOURS_MS - 1000);
    expect(isSessionExpired()).toBe(false);
  });

  it('is expired just past the 2-hour window', () => {
    recordLoginTime();
    vi.advanceTimersByTime(TWO_HOURS_MS + 1000);
    expect(isSessionExpired()).toBe(true);
  });

  it('is expired again after clearLoginTime, even right after a fresh login', () => {
    recordLoginTime();
    clearLoginTime();
    expect(isSessionExpired()).toBe(true);
  });
});

describe('msUntilExpiry', () => {
  it('is 0 when no login time has been recorded', () => {
    expect(msUntilExpiry()).toBe(0);
  });

  it('is the full 2-hour window right after recording', () => {
    recordLoginTime();
    expect(msUntilExpiry()).toBe(TWO_HOURS_MS);
  });

  it('counts down as time passes', () => {
    recordLoginTime();
    vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
    expect(msUntilExpiry()).toBe(TWO_HOURS_MS - 30 * 60 * 1000);
  });

  it('never goes negative once expired', () => {
    recordLoginTime();
    vi.advanceTimersByTime(TWO_HOURS_MS + 60 * 60 * 1000); // 1 hour past expiry
    expect(msUntilExpiry()).toBe(0);
  });
});
