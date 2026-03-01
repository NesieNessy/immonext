import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hozexedzeqxsagmsghyt.supabase.co'

let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    }
    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase
}

/**
 * Use this in client components and hooks.
 * The client is created lazily so static prerendering won't fail.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
