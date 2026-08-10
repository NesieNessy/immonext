import { describe, expect, it } from 'vitest';
import { LOCAL_BYPASS_EMAIL, LOCAL_BYPASS_USER_ID } from './localBypass';

describe('localBypass constants', () => {
  it('LOCAL_BYPASS_USER_ID is a well-formed UUID', () => {
    expect(LOCAL_BYPASS_USER_ID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('LOCAL_BYPASS_EMAIL looks like an email address', () => {
    expect(LOCAL_BYPASS_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
