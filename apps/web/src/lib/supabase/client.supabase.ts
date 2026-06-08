import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
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
