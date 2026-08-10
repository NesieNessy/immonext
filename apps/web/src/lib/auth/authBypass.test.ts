import { afterEach, describe, expect, it } from 'vitest';
import { authBypassUser, isAuthBypassEnabled } from './authBypass';
import { LOCAL_BYPASS_EMAIL, LOCAL_BYPASS_USER_ID } from './localBypass';

describe('isAuthBypassEnabled', () => {
  const ENV_KEY = 'NEXT_PUBLIC_AUTH_BYPASS';
  const original = process.env[ENV_KEY];

  afterEach(() => {
    if (original === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = original;
  });

  it('is true only when the env var is the exact string "true"', () => {
    process.env[ENV_KEY] = 'true';
    expect(isAuthBypassEnabled()).toBe(true);
  });

  it('is false when unset', () => {
    delete process.env[ENV_KEY];
    expect(isAuthBypassEnabled()).toBe(false);
  });

  it('is false for any other truthy-looking value (not a loose boolean check)', () => {
    process.env[ENV_KEY] = '1';
    expect(isAuthBypassEnabled()).toBe(false);
    process.env[ENV_KEY] = 'TRUE';
    expect(isAuthBypassEnabled()).toBe(false);
    process.env[ENV_KEY] = 'false';
    expect(isAuthBypassEnabled()).toBe(false);
  });
});

describe('authBypassUser', () => {
  it('carries the shared local-bypass id and email', () => {
    expect(authBypassUser.id).toBe(LOCAL_BYPASS_USER_ID);
    expect(authBypassUser.email).toBe(LOCAL_BYPASS_EMAIL);
  });

  it('is marked as an authenticated Supabase user', () => {
    expect(authBypassUser.aud).toBe('authenticated');
  });

  it('has a fixed, stable created_at (epoch) rather than the current time', () => {
    // Deliberately new Date(0), not new Date() — must never drift between
    // calls/renders, since callers may compare it for referential display.
    expect(authBypassUser.created_at).toBe(new Date(0).toISOString());
  });
});
