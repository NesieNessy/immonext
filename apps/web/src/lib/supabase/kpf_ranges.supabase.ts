// ==============================================================================
// ImmoNext – Supabase Client: kpf_ranges
// KPF = Kaufpreisfaktor (purchase price factor / gross yield multiplier)
// Read-only for app users — data is maintained by admin / service role.
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type { KpfConstructionYearBucket, KpfRange, KpfRangeFilters, KpfRangeInsert, PropertyCondition } from '@immonext/types';

function toKpfRange(row: Record<string, unknown>): KpfRange {
  return {
    postalCode:             row.postal_code as string,
    condition:              row.condition as KpfRange['condition'],
    constructionYearBucket: row.construction_year_bucket as KpfRange['constructionYearBucket'],
    minValue:               row.min_value as number,
    maxValue:               row.max_value as number,
    sampleSize:             row.sample_size as number,
  };
}

// ─── RPC-based range lookup (with geographic fallback) ────────────────────────

/**
 * Result returned by the `get_kpf_range` RPC.
 * `fallbackLevel`: 1=exact postal code, 2=postal prefix, 3=city, 4=state, 0=no data
 */
export interface KpfRangeResult {
  minValue:      number;
  maxValue:      number;
  sampleSize:    number;
  fallbackLevel: number;
  fallbackHint:  string | null;
}

/**
 * Calls the `get_kpf_range` RPC which automatically falls back to wider
 * geographic areas when no exact postal-code match exists.
 */
export async function getKpfRange(
  postalCode: string,
  condition: PropertyCondition,
  bucket: KpfConstructionYearBucket,
): Promise<KpfRangeResult | null> {
  const { data, error } = await supabase.rpc('get_kpf_range', {
    p_postal_code: postalCode,
    p_condition:   condition,
    p_bucket:      bucket,
  });

  if (error || !data?.[0]) return null;

  const row = data[0];
  if (row.fallback_level === 0) return null;

  return {
    minValue:      row.min_value,
    maxValue:      row.max_value,
    sampleSize:    row.sample_size,
    fallbackLevel: row.fallback_level,
    fallbackHint:  row.fallback_hint ?? null,
  };
}

// ─── Direct table queries ──────────────────────────────────────────────────────

/** Fetch all KPF ranges matching any combination of filters. */
export async function getKpfRanges(filters: KpfRangeFilters = {}): Promise<KpfRange[]> {
  let query = supabase.from('kpf_ranges').select('*');
  if (filters.postalCode)             query = query.eq('postal_code',              filters.postalCode);
  if (filters.condition)              query = query.eq('condition',                filters.condition);
  if (filters.constructionYearBucket) query = query.eq('construction_year_bucket', filters.constructionYearBucket);
  query = query
    .order('postal_code',              { ascending: true })
    .order('condition',                { ascending: true })
    .order('construction_year_bucket', { ascending: true });
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(toKpfRange);
}

/**
 * Fetch the single KPF range for an exact postal code + condition + bucket.
 * Use `getKpfRange` instead when geographic fallback is desired.
 */
export async function getKpfRangeExact(
  postalCode: string,
  condition: PropertyCondition,
  constructionYearBucket: KpfRange['constructionYearBucket'],
): Promise<KpfRange | null> {
  const { data, error } = await supabase
    .from('kpf_ranges')
    .select('*')
    .eq('postal_code',              postalCode)
    .eq('condition',                condition)
    .eq('construction_year_bucket', constructionYearBucket)
    .single();
  if (error || !data) return null;
  return toKpfRange(data);
}

/** Fetch all ranges for a postal code, ordered by condition then bucket. */
export async function getKpfRangesByPostalCode(postalCode: string): Promise<KpfRange[]> {
  return getKpfRanges({ postalCode });
}

// ─── Write (admin / service role only) ────────────────────────────────────────

export async function upsertKpfRange(payload: KpfRangeInsert): Promise<KpfRange | null> {
  const { data, error } = await supabase
    .from('kpf_ranges')
    .upsert({
      postal_code:              payload.postalCode,
      condition:                payload.condition,
      construction_year_bucket: payload.constructionYearBucket,
      min_value:                payload.minValue,
      max_value:                payload.maxValue,
      sample_size:              payload.sampleSize,
    }, {
      onConflict: 'postal_code,condition,construction_year_bucket',
    })
    .select()
    .single();
  if (error || !data) return null;
  return toKpfRange(data);
}

export async function upsertKpfRanges(payloads: KpfRangeInsert[]): Promise<KpfRange[]> {
  const { data, error } = await supabase
    .from('kpf_ranges')
    .upsert(
      payloads.map(p => ({
        postal_code:              p.postalCode,
        condition:                p.condition,
        construction_year_bucket: p.constructionYearBucket,
        min_value:                p.minValue,
        max_value:                p.maxValue,
        sample_size:              p.sampleSize,
      })),
      { onConflict: 'postal_code,condition,construction_year_bucket' },
    )
    .select();
  if (error || !data) return [];
  return data.map(toKpfRange);
}

export async function deleteKpfRange(
  postalCode: string,
  condition: PropertyCondition,
  constructionYearBucket: KpfRange['constructionYearBucket'],
): Promise<boolean> {
  const { error } = await supabase
    .from('kpf_ranges')
    .delete()
    .eq('postal_code',              postalCode)
    .eq('condition',                condition)
    .eq('construction_year_bucket', constructionYearBucket);
  return !error;
}
