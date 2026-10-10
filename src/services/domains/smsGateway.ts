import { invokeNotificationGateway } from './notificationGateway';
export interface Fast2SmsSendResult {
  success: boolean;
  message: string;
  requestId?: string;
  recipientCount: number;
  isSimulated?: boolean;
  error?: string;
}
export interface Fast2SmsBalanceResult {
  success: boolean;
  walletBalance?: number;
  message: string;
}
/**
 * Clean and format Indian 10-digit mobile numbers
 */
export function sanitizeIndianMobile(num: string): string | null {
  const digits = num.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return digits.slice(2);
  }
  return null;
}

// Legacy positional key parameters are ignored; credentials never leave the server.
export async function checkFast2SmsBalance(_apiKey = ''): Promise<Fast2SmsBalanceResult> {
  return invokeNotificationGateway({ action: 'balance' });
}
export async function sendFast2Sms(options: {
  apiKey?: string;
  numbers: string[];
  message: string;
  route?: string;
  senderId?: string;
}): Promise<Fast2SmsSendResult> {
  if (options.route && options.route !== 'q')
    return {
      success: false,
      message: 'DLT/OTP routes require server-side template configuration; no SMS sent',
      recipientCount: 0,
    };
  const numbers = Array.from(
    new Set(options.numbers.map(sanitizeIndianMobile).filter((n): n is string => Boolean(n)))
  );
  if (numbers.length !== 1 || options.numbers.length !== 1)
    return {
      success: false,
      message: 'Bulk SMS requires a verified server-side audience resolver; no SMS sent',
      recipientCount: 0,
    };
  if (!options.message.trim() || options.message.length > 480)
    return { success: false, message: 'SMS message must be 1–480 characters', recipientCount: 0 };
  return invokeNotificationGateway({ action: 'sms', numbers, message: options.message.trim() });
}
export async function sendTestSms(
  _apiKey: string,
  testMobileNumber: string,
  _senderId?: string
): Promise<Fast2SmsSendResult> {
  return sendFast2Sms({
    numbers: [testMobileNumber],
    message:
      'PracticeKoro test message. This tests provider acceptance, not verified handset delivery.',
  });
}
