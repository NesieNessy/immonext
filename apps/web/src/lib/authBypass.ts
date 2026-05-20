import type { User } from '@supabase/supabase-js';

export function isAuthBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
}

export const authBypassUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dev@immonext.local',
  user_metadata: {
    full_name: 'ImmoNext Dev User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
} as User;
