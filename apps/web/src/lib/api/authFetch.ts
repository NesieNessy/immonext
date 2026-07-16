import { getSupabaseClient } from '@/lib/supabase/client.supabase';

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
