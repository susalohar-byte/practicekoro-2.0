import { invokeNotificationGateway } from './notificationGateway';
export interface FcmSendOptions {
  serverKey?: string;
  projectId?: string;
  title: string;
  body: string;
  actionUrl?: string;
  topic?: string;
  deviceTokens?: string[];
}
export interface FcmSendResult {
  success: boolean;
  message: string;
  multicastId?: string;
  recipientCount: number;
  isSimulated?: boolean;
  error?: string;
}
export async function sendFcmPush(options: FcmSendOptions): Promise<FcmSendResult> {
  if (!options.title.trim() || !options.body.trim())
    return { success: false, message: 'Push title and body are required', recipientCount: 0 };
  if (options.topic && options.topic !== 'all_students' && !options.deviceTokens?.length)
    return {
      success: false,
      message: 'Audience-specific push requires verified server-side membership; no push sent',
      recipientCount: 0,
    };
  const result = await invokeNotificationGateway({
    action: 'push',
    title: options.title,
    body: options.body,
    actionUrl: options.actionUrl,
    topic: options.topic || 'all_students',
    deviceTokens: options.deviceTokens || [],
  });
  return { ...result, multicastId: result.requestId };
}
export async function sendTestPushNotification(
  _serverKey: string,
  _projectId?: string
): Promise<FcmSendResult> {
  return {
    success: false,
    message:
      'Select a registered test device before sending. A gateway test must not broadcast to all students.',
    recipientCount: 0,
  };
}
