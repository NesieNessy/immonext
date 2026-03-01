// ==============================================================================
// ImmoNext – Supabase Client: system_config, notifications
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type {
    Notification, NotificationInsert,
    SystemConfig, SystemConfigUpdate,
} from '@immonext/types';

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toSystemConfig(row: Record<string, unknown>): SystemConfig {
  return {
    configId:    row.config_id as number,
    configKey:   row.config_key as string,
    configValue: row.config_value as string,
    description: row.description as string | null,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
  };
}

function toNotification(row: Record<string, unknown>): Notification {
  return {
    notificationId:  row.notification_id as number,
    userId:          row.user_id as string,
    propertyId:      row.property_id as number | null,
    type:            row.type as Notification['type'],
    message:         row.message as string,
    tradesperson:    row.tradesperson as string | null,
    financialBroker: row.financial_broker as string | null,
    readAt:          row.read_at as string | null,
    createdAt:       row.created_at as string,
  };
}

// ─── SystemConfig ─────────────────────────────────────────────────────────────

export async function getAllSystemConfig(): Promise<SystemConfig[]> {
  const { data, error } = await supabase
    .from('system_config')
    .select('*')
    .order('config_key');
  if (error || !data) return [];
  return data.map(toSystemConfig);
}

export async function getSystemConfigByKey(configKey: string): Promise<SystemConfig | null> {
  const { data, error } = await supabase
    .from('system_config')
    .select('*')
    .eq('config_key', configKey)
    .single();
  if (error || !data) return null;
  return toSystemConfig(data);
}

// Admin / service role only
export async function updateSystemConfig(configId: number, updates: SystemConfigUpdate): Promise<SystemConfig | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.configValue !== undefined) dbUpdates.config_value = updates.configValue;
  if (updates.description !== undefined) dbUpdates.description  = updates.description;
  const { data, error } = await supabase
    .from('system_config')
    .update(dbUpdates)
    .eq('config_id', configId)
    .select()
    .single();
  if (error || !data) return null;
  return toSystemConfig(data);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toNotification);
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toNotification);
}

export async function createNotification(payload: NotificationInsert): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id:          payload.userId,
      property_id:      payload.propertyId ?? null,
      type:             payload.type,
      message:          payload.message,
      tradesperson:     payload.tradesperson ?? null,
      financial_broker: payload.financialBroker ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toNotification(data);
}

export async function markNotificationRead(notificationId: number): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .select()
    .single();
  if (error || !data) return null;
  return toNotification(data);
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  return !error;
}

export async function deleteNotification(notificationId: number): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('notification_id', notificationId);
  return !error;
}
