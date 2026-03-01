import { supabase } from '@/lib/supabase/client.supabase';
import type { Password, PasswordInsert, PasswordUpdate } from '@immonext/types';

function toPassword(row: Record<string, unknown>): Password {
  return {
    passwordId:   row.password_id as number,
    userId:       row.user_id as string,
    passwordHash: row.password_hash as string,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  };
}

export async function getPassword(userId: string): Promise<Password | null> {
  const { data, error } = await supabase
    .from('password')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return toPassword(data);
}

export async function upsertPassword(payload: PasswordInsert): Promise<Password | null> {
  const { data, error } = await supabase
    .from('password')
    .upsert({
      user_id:       payload.userId,
      password_hash: payload.passwordHash,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error || !data) return null;
  return toPassword(data);
}

export async function updatePassword(userId: string, updates: PasswordUpdate): Promise<Password | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;

  const { data, error } = await supabase
    .from('password')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) return null;
  return toPassword(data);
}

export async function deletePassword(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('password')
    .delete()
    .eq('user_id', userId);

  return !error;
}