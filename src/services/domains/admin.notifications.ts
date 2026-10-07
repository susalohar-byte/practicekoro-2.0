import { requireSavedRow, deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localNotifications, syncLocalScheduledNotifications } from '@/services/domains/localStore';
import type { NotificationItem } from '@/types';

/** Section of the admin API: notifications (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// NOTIFICATIONS API
// --------------------------------------------------------------------------
export async function getNotifications(): Promise<NotificationItem[]> {
  if (isSupabaseConfigured) {
    // 1. Attempt background auto-transition for any scheduled notifications that have reached their time
    try {
      await supabase.rpc('process_scheduled_notifications');
    } catch {
      // Non-fatal if stored procedure is not yet applied in active environment
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      return data.map((d: any) => {
        const scheduledAt = d.scheduled_at || undefined;
        const effectiveStatus = d.status;
        const effectiveSentAt = d.sent_at || undefined;

        return {
          id: d.id,
          title: d.title,
          message: d.message,
          targetAudience: d.target_audience,
          channel: d.channel,
          status: effectiveStatus,
          sentAt: effectiveSentAt,
          scheduledAt,
          createdAt: d.created_at,
          createdBy: d.created_by || undefined,
          actionLink: d.action_link || undefined,
          type: d.type || undefined,
        };
      });
    }
    return [];
  }

  // Fallback: sync scheduled items in local in-memory store
  return [...syncLocalScheduledNotifications()];
}

export async function createNotification(
  notif: Omit<NotificationItem, 'id' | 'createdAt'>
): Promise<{ success: boolean; notification: NotificationItem }> {
  if (!notif.title.trim() || !notif.message.trim())
    throw new Error('Title and message are required.');
  if (isSupabaseConfigured) {
    if (notif.channel !== 'in_app')
      throw new Error(
        'Only in-app notifications are connected. No email or push delivery is configured.'
      );
    if (!['all', 'free', 'pro'].includes(notif.targetAudience))
      throw new Error('Select a supported audience: All, Free or Pro students.');
    const saved = requireSavedRow(
      await supabase.from('notifications').insert(notificationPayload(notif)).select('*').single()
    );
    return { success: true, notification: mapNotification(saved) };
  }
  const saved = { ...notif, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  localNotifications.unshift(saved);
  return { success: true, notification: saved };
}

export async function createTargetedNotification(
  notif: Pick<NotificationItem, 'title' | 'message' | 'channel'> & { userIds: string[] }
): Promise<{ success: boolean; error?: string }> {
  if (notif.userIds.length === 0) return { success: true };
  if (isSupabaseConfigured) {
    if (notif.channel !== 'in_app')
      return { success: false, error: 'Only in-app delivery is configured.' };
    const { data, error } = await supabase.rpc('create_targeted_notification', {
      p_title: notif.title,
      p_message: notif.message,
      p_channel: notif.channel,
      p_user_ids: notif.userIds,
    });
    if (error) return { success: false, error: error.message };
    if (typeof data !== 'string' || !data)
      return { success: false, error: 'Notification persistence was not confirmed.' };
    return { success: true };
  }

  localNotifications.unshift({
    id: `notif-${Date.now()}`,
    title: notif.title,
    message: notif.message,
    targetAudience: 'selected',
    channel: notif.channel,
    status: 'sent',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function sendNotificationNow(id: string): Promise<boolean> {
  await updateNotification(id, {
    status: 'sent',
    sentAt: new Date().toISOString(),
    scheduledAt: undefined,
  });
  return true;
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (isSupabaseConfigured) return deleteAdminRecord('notifications', id);
  const i = localNotifications.findIndex((n) => n.id === id);
  if (i < 0) throw new Error('Notification not found');
  localNotifications.splice(i, 1);
  return true;
}

export const adminNotificationsApi = {
  getNotifications,
  createNotification,
  updateNotification,
  createTargetedNotification,
  sendNotificationNow,
  deleteNotification,
};

function mapNotification(d: any): NotificationItem {
  return {
    id: d.id,
    title: d.title,
    message: d.message,
    targetAudience: d.target_audience,
    channel: d.channel,
    status: d.status,
    sentAt: d.sent_at || undefined,
    scheduledAt: d.scheduled_at || undefined,
    createdAt: d.created_at,
    actionLink: d.action_link || undefined,
    type: d.type || undefined,
  };
}
function notificationPayload(n: Partial<NotificationItem>) {
  const p: Record<string, unknown> = {};
  for (const [key, column] of Object.entries({
    title: 'title',
    message: 'message',
    targetAudience: 'target_audience',
    channel: 'channel',
    status: 'status',
    actionLink: 'action_link',
    type: 'type',
  })) {
    if (key in n) p[column] = (n as any)[key];
  }
  if (n.status === 'sent') {
    p.sent_at = n.sentAt || new Date().toISOString();
    p.scheduled_at = null;
  }
  if (n.status === 'draft') {
    p.sent_at = null;
    p.scheduled_at = null;
  }
  if (n.status === 'scheduled') {
    if (
      !n.scheduledAt ||
      !Number.isFinite(Date.parse(n.scheduledAt)) ||
      Date.parse(n.scheduledAt) <= Date.now()
    )
      throw new Error('Choose a future schedule date.');
    p.scheduled_at = n.scheduledAt;
    p.sent_at = null;
  }
  return p;
}
export async function updateNotification(
  id: string,
  updates: Partial<NotificationItem>
): Promise<NotificationItem> {
  if (isSupabaseConfigured) {
    const current = (await getNotifications()).find((n) => n.id === id);
    if (!current) throw new Error('Notification not found');
    const merged = { ...current, ...updates };
    if (!merged.title.trim() || !merged.message.trim())
      throw new Error('Title and message required');
    if (merged.channel !== 'in_app') throw new Error('Only in-app delivery is connected.');
    return mapNotification(
      requireSavedRow(
        await supabase
          .from('notifications')
          .update(notificationPayload(merged))
          .eq('id', id)
          .select('*')
          .single(),
        id
      )
    );
  }
  const i = localNotifications.findIndex((n) => n.id === id);
  if (i < 0) throw new Error('Notification not found');
  return (localNotifications[i] = { ...localNotifications[i], ...updates });
}
