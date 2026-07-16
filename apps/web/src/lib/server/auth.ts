import { createClient } from '@supabase/supabase-js';
import { LOCAL_BYPASS_USER_ID } from '@/lib/auth/localBypass';

export function isServerAuthBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
}

export function workflowIdFor(
  userId: string,
  quickCheckId: string | null,
  requestedWorkflowId: string | null = null,
): string {
  if (quickCheckId) return `quick-check:${quickCheckId}`;

  if (
    requestedWorkflowId &&
    (/^detail-check:[0-9a-f-]{36}$/i.test(requestedWorkflowId) ||
      requestedWorkflowId === `user:${userId}:draft`)
  ) {
    return requestedWorkflowId;
  }

  return `user:${userId}:draft`;
}

export async function requireUserId(request: Request): Promise<string> {
  if (isServerAuthBypassEnabled()) return LOCAL_BYPASS_USER_ID;

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Response(JSON.stringify({ error: 'Supabase server configuration is missing.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return data.user.id;
}
