import { supabase } from '@/lib/supabase/client';
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '@immonext/types';

function toSubscription(row: Record<string, unknown>): Subscription {
  return {
    subscriptionId:    row.subscription_id as number,
    userId:            row.user_id as string,
    subscriptionModel: row.subscription_model as Subscription['subscriptionModel'],
    startDate:         row.start_date as string,
    endDate:           row.end_date as string | null,
    createdAt:         row.created_at as string,
    updatedAt:         row.updated_at as string,
  };
}

export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error || !data) return [];
  return data.map(toSubscription);
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', userId)
    .or(`end_date.is.null,end_date.gt.${today}`)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return toSubscription(data);
}

export async function getSubscriptionById(subscriptionId: number): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscription')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .single();

  if (error || !data) return null;
  return toSubscription(data);
}

export async function createSubscription(payload: SubscriptionInsert): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscription')
    .insert({
      user_id:            payload.userId,
      subscription_model: payload.subscriptionModel,
      start_date:         payload.startDate,
      end_date:           payload.endDate ?? null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toSubscription(data);
}

export async function updateSubscription(subscriptionId: number, updates: SubscriptionUpdate): Promise<Subscription | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.subscriptionModel !== undefined) dbUpdates.subscription_model = updates.subscriptionModel;
  if (updates.startDate !== undefined)         dbUpdates.start_date         = updates.startDate;
  if (updates.endDate !== undefined)           dbUpdates.end_date           = updates.endDate;

  const { data, error } = await supabase
    .from('subscription')
    .update(dbUpdates)
    .eq('subscription_id', subscriptionId)
    .select()
    .single();

  if (error || !data) return null;
  return toSubscription(data);
}

export async function cancelSubscription(subscriptionId: number): Promise<Subscription | null> {
  const today = new Date().toISOString().split('T')[0];
  return updateSubscription(subscriptionId, { endDate: today });
}

export async function deleteSubscription(subscriptionId: number): Promise<boolean> {
  const { error } = await supabase
    .from('subscription')
    .delete()
    .eq('subscription_id', subscriptionId);

  return !error;
}