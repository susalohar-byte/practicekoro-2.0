import { isSupabaseConfigured, supabaseRuntime } from '@/lib/supabase';
export async function invokeNotificationGateway(
  payload: Record<string, unknown>
): Promise<{
  success: boolean;
  message: string;
  recipientCount: number;
  requestId?: string;
  walletBalance?: number;
}> {
  if (!isSupabaseConfigured)
    return {
      success: false,
      message: 'Server-side notification gateway is unavailable; nothing was sent',
      recipientCount: 0,
    };
  try {
    const { data, error } = await supabaseRuntime.functions.invoke('notification-gateway', {
      body: { ...payload, requestId: crypto.randomUUID() },
    });
    if (error || data?.success !== true)
      return {
        success: false,
        message:
          data?.message ||
          'Gateway did not confirm acceptance; check provider history before retrying',
        recipientCount: 0,
      };
    if (
      typeof data.message !== 'string' ||
      !Number.isFinite(data.recipientCount) ||
      data.recipientCount < 0
    )
      return {
        success: false,
        message: 'Invalid gateway response; acceptance not verified',
        recipientCount: 0,
      };
    return data;
  } catch {
    return {
      success: false,
      message: 'Gateway request could not be confirmed; nothing is reported as delivered',
      recipientCount: 0,
    };
  }
}
