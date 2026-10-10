import { readCompleteQuery } from './admin.reporting';
import { getErrorMessage } from '@/lib/errors';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { parseSettingValue } from './admin.shared';
import {
  localAppSettings,
  localItemAnalysisStore,
  localPaymentGateways,
} from '@/services/domains/localStore';
import type {
  AppSettingItem,
  EmpiricalDifficulty,
  ItemAnalysisFilterOptions,
  PaymentGatewayConfig,
  PaymentGatewayUpdatePayload,
  QuestionItemAnalysis,
} from '@/types';

/** Section of the admin API: settings (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// APP SETTINGS API
// --------------------------------------------------------------------------
export async function getAppSettings(): Promise<AppSettingItem[]> {
  if (!isSupabaseConfigured) return [...localAppSettings];
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Settings response was not confirmed.');
  return data.map((d: any) => ({
    id: d.id,
    category: d.category,
    key: d.key,
    value: parseSettingValue(d.value),
    description: d.description || undefined,
    updatedAt: d.updated_at,
  }));
}

export async function updateAppSetting(
  id: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  return updateAppSettings([{ id, value }]);
}

export async function updateAppSettings(
  updates: Array<{ id: string; value: unknown }>
): Promise<{ success: boolean; error?: string }> {
  if (!updates.length) return { success: false, error: 'No settings were supplied.' };
  if (new Set(updates.map((u) => u.id)).size !== updates.length)
    return { success: false, error: 'Duplicate setting IDs are not allowed.' };
  if (
    updates.some(
      (u) => !u.id.trim() || /secret|password|service[._ ]?role|private[._ ]?key/i.test(u.id)
    )
  )
    return { success: false, error: 'Credentials must be configured server-side.' };
  const SETTINGS_META: Record<string, { category: string; key: string; description: string }> = {
    general_app_name: {
      category: 'general',
      key: 'app_name',
      description: 'Platform name displayed across UI',
    },
    general_admin_email: {
      category: 'general',
      key: 'admin_email',
      description: 'Administrative contact email',
    },
    general_support_email: {
      category: 'general',
      key: 'support_email',
      description: 'Support contact email',
    },
    general_support_phone: {
      category: 'general',
      key: 'support_phone',
      description: 'Support phone helpline',
    },
    general_support_whatsapp: {
      category: 'general',
      key: 'support_whatsapp',
      description: 'Official WhatsApp customer support helpline',
    },
    general_support_hours: {
      category: 'general',
      key: 'support_hours',
      description: 'Customer support desk operational hours',
    },
    general_support_address: {
      category: 'general',
      key: 'support_address',
      description: 'Registered operating location & jurisdiction',
    },
    general_website_url: {
      category: 'general',
      key: 'website_url',
      description: 'Official web application domain',
    },
    daily_content: {
      category: 'general',
      key: 'daily_content',
      description: 'Student homepage daily fact and motivational quote',
    },
    content_language_mode: {
      category: 'general',
      key: 'content_language_mode',
      description: 'Global content language mode: bengali_only (default) or bilingual',
    },
    general_content_language_mode: {
      category: 'general',
      key: 'content_language_mode',
      description: 'Global content language mode: bengali_only (default) or bilingual',
    },
    exam_default_duration: {
      category: 'exam_defaults',
      key: 'default_duration_minutes',
      description: 'Standard default exam duration in minutes',
    },
    exam_default_marks: {
      category: 'exam_defaults',
      key: 'default_marks_per_q',
      description: 'Standard default marks per correct question',
    },
    exam_default_negative_marks: {
      category: 'exam_defaults',
      key: 'default_negative_marks',
      description: 'Standard default negative marking',
    },
    exam_passing_percentage: {
      category: 'exam_defaults',
      key: 'default_passing_percentage',
      description: 'Standard passing score percentage',
    },
    sub_currency: {
      category: 'subscription',
      key: 'currency',
      description: 'Platform transaction currency',
    },
    sub_expiry_warning_days: {
      category: 'subscription',
      key: 'expiry_warning_days',
      description: 'Days before expiry to display renewal warning',
    },
    sys_maintenance_mode: {
      category: 'system',
      key: 'maintenance_mode',
      description: 'Enable platform maintenance splash mode',
    },
    sys_app_version: {
      category: 'system',
      key: 'app_version',
      description: 'Platform production release version',
    },
    payment_gateway_razorpay_key_id: {
      category: 'monetization',
      key: 'razorpay_key_id',
      description: 'Public Razorpay Key ID for client checkout',
    },
    payment_gateway_razorpay_active: {
      category: 'monetization',
      key: 'razorpay_active',
      description: 'Razorpay payment gateway active status',
    },
  };

  if (isSupabaseConfigured) {
    try {
      const rows = updates.map((u) => {
        const meta = SETTINGS_META[u.id] || {
          category: 'general',
          key: u.id,
          description: 'Platform configuration',
        };
        return { id: u.id, ...meta, value: u.value };
      });
      const { data, error } = await supabase.rpc('admin_update_app_settings', { p_settings: rows });
      if (error) throw new Error(error.message);
      if (data?.success !== true || data?.updated_count !== rows.length)
        throw new Error('Not all settings were confirmed.');
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Settings save failed') };
    }
  }
  // Always update or insert (upsert) into in-memory localAppSettings
  updates.forEach((u) => {
    const parsedVal = parseSettingValue(u.value);
    const meta = SETTINGS_META[u.id] || {
      category: 'general',
      key: u.id,
      description: 'Platform configuration setting',
    };
    const idx = localAppSettings.findIndex((l) => l.id === u.id || l.key === u.id);
    if (idx >= 0) {
      localAppSettings[idx] = {
        ...localAppSettings[idx],
        value: parsedVal,
        updatedAt: new Date().toISOString(),
      };
    } else {
      localAppSettings.push({
        id: u.id,
        category: meta.category,
        key: meta.key,
        value: parsedVal,
        description: meta.description,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return { success: true };
}

export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const settings = await getAppSettings();
    const maint = settings.find(
      (s) => s.id === 'sys_maintenance_mode' || s.key === 'maintenance_mode'
    );
    if (!maint) return false;
    return maint.value === true || maint.value === 'true';
  } catch {
    return false;
  }
}

/**
 * Fetches payment gateway configuration (Key ID, masked secret preview, active state) for admin.
 */
export async function getPaymentGatewayConfig(gateway = 'razorpay'): Promise<PaymentGatewayConfig> {
  const targetGateway = gateway.toLowerCase().trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('admin_get_payment_gateway', {
      p_gateway: targetGateway,
    });
    if (error) throw new Error(error.message);
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      data.gateway !== targetGateway ||
      typeof data.key_id !== 'string' ||
      typeof data.is_active !== 'boolean'
    )
      throw new Error('Payment gateway configuration could not be loaded or was malformed.');
    let keyId = data.key_id || '';
    // An older public Key ID may still be stored in the authoritative settings table.
    if (!keyId) {
      const { data: settingRow, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'payment_gateway_razorpay_key_id')
        .maybeSingle();
      if (settingError) throw new Error(settingError.message);
      if (settingRow?.value) keyId = String(parseSettingValue(settingRow.value)).trim();
    }
    return {
      gateway: data.gateway || targetGateway,
      keyId,
      isActive: Boolean(data.is_active),
      hasSecret: Boolean(data.has_secret),
      secretPreview: data.secret_preview || null,
      hasWebhookSecret: Boolean(data.has_webhook_secret),
      webhookPreview: data.webhook_preview || null,
      updatedAt: data.updated_at || null,
    };
  }

  // Local mock fallback
  const local = localPaymentGateways[targetGateway] || {
    gateway: targetGateway,
    key_id: '',
    key_secret: '',
    webhook_secret: '',
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const hasSecret = Boolean(local.key_secret && local.key_secret.length > 0);
  const hasWebhook = Boolean(local.webhook_secret && local.webhook_secret.length > 0);

  return {
    gateway: local.gateway,
    keyId: local.key_id,
    isActive: local.is_active,
    hasSecret,
    secretPreview: hasSecret
      ? local.key_secret!.length >= 4
        ? `••••••••${local.key_secret!.slice(-4)}`
        : '••••••••'
      : null,
    hasWebhookSecret: hasWebhook,
    webhookPreview: hasWebhook
      ? local.webhook_secret!.length >= 4
        ? `••••••••${local.webhook_secret!.slice(-4)}`
        : '••••••••'
      : null,
    updatedAt: local.updated_at || new Date().toISOString(),
  };
}

/**
 * Updates payment gateway configuration (Key ID + active flag only).
 * Secrets are NEVER persisted here: payload.keySecret / webhookSecret are
 * accepted for type-compat but non-empty secret values are rejected — they live exclusively in
 * Supabase Edge Function Secrets.
 */
export async function updatePaymentGatewayConfig(
  payload: PaymentGatewayUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  const targetGateway = (payload.gateway || 'razorpay').toLowerCase().trim();
  const cleanKeyId = payload.keyId.trim();
  const isActive = payload.isActive ?? true;

  if (targetGateway !== 'razorpay') return { success: false, error: 'Only Razorpay is supported.' };
  if ((payload.keySecret || '').trim() || (payload.webhookSecret || '').trim())
    return {
      success: false,
      error: 'Payment secrets must be configured server-side, not in this form.',
    };
  if (
    (cleanKeyId && !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(cleanKeyId)) ||
    (isActive && !cleanKeyId)
  )
    return {
      success: false,
      error: 'Enter a valid Razorpay public Key ID before enabling the gateway.',
    };

  if (isSupabaseConfigured) {
    try {
      // This RPC updates payment_gateways and its public settings atomically.
      // Never pre-write app_settings or report a local fallback as production success.
      const { data, error } = await supabase.rpc('admin_update_payment_gateway', {
        p_gateway: targetGateway,
        p_key_id: cleanKeyId,
        p_key_secret: null,
        p_webhook_secret: null,
        p_is_active: isActive,
      });
      if (error) throw new Error(error.message);
      if (
        data?.success !== true ||
        data?.gateway !== targetGateway ||
        data?.key_id !== cleanKeyId ||
        data?.is_active !== isActive
      )
        throw new Error(
          'The backend did not confirm the saved payment gateway. Reload before retrying.'
        );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Failed to update payment gateway configuration'),
      };
    }
  }
  // Explicit demo mode only; never mutate this cache ahead of a production response.
  localPaymentGateways[targetGateway] = {
    gateway: targetGateway,
    key_id: cleanKeyId,
    key_secret: '',
    webhook_secret: '',
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };
  return { success: true };
}

/** Explicit FK hints avoid chapter/topic ambiguity. Questions have no direct exam FK. */
export const ADMIN_ITEM_ANALYSIS_SELECT = `
  id,
  question_id,
  selected_option,
  is_correct,
  time_spent_seconds,
  questions:questions!attempt_answers_question_id_fkey (
    id,
    question_text,
    question_bengali_text,
    subject_id,
    chapter_id,
    difficulty,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    explanation,
    subjects:subjects!questions_subject_id_fkey (
      id, name,
      exams:exams!subjects_exam_id_fkey ( id, title )
    ),
    chapters:chapters!questions_chapter_id_fkey (
      id, name,
      subjects:subjects!chapters_subject_id_fkey (
        id, name,
        exams:exams!subjects_exam_id_fkey ( id, title )
      )
    )
  )
`;

/**
 * Question-level Item Analysis (psychometrics, accuracy %, failure rate %, time traps, distractor distribution).
 * Identifies questions where >= 80% students got it wrong or took unusually long time (>90s).
 */
export async function getItemAnalysis(
  filters?: ItemAnalysisFilterOptions
): Promise<QuestionItemAnalysis[]> {
  let items: QuestionItemAnalysis[] = [];

  if (isSupabaseConfigured) {
    const answersData = await readCompleteQuery(() => {
      let query = supabase
        .from('attempt_answers')
        .select(ADMIN_ITEM_ANALYSIS_SELECT, { count: 'exact' })
        .order('id', { ascending: true });
      if (filters?.startIso) query = query.gte('created_at', filters.startIso);
      if (filters?.endIso) query = query.lte('created_at', filters.endIso);
      return query;
    });

    if (answersData.length > 0) {
      const questionMap = new Map<
        string,
        {
          qInfo: any;
          total: number;
          correct: number;
          wrong: number;
          skipped: number;
          totalTime: number;
          optionsCount: { A: number; B: number; C: number; D: number };
        }
      >();

      answersData.forEach((row: any) => {
        const qId = row.question_id;
        if (!questionMap.has(qId)) {
          questionMap.set(qId, {
            qInfo: row.questions,
            total: 0,
            correct: 0,
            wrong: 0,
            skipped: 0,
            totalTime: 0,
            optionsCount: { A: 0, B: 0, C: 0, D: 0 },
          });
        }

        const qStats = questionMap.get(qId)!;
        qStats.total += 1;
        qStats.totalTime += Number(row.time_spent_seconds || 0);

        if (!row.selected_option) {
          qStats.skipped += 1;
        } else {
          const opt = String(row.selected_option).toUpperCase() as 'A' | 'B' | 'C' | 'D';
          if (qStats.optionsCount[opt] !== undefined) {
            qStats.optionsCount[opt] += 1;
          }
          if (row.is_correct) {
            qStats.correct += 1;
          } else {
            qStats.wrong += 1;
          }
        }
      });

      items = Array.from(questionMap.entries()).map(([qId, s]) => {
        const accuracyRate = s.total > 0 ? Number(((s.correct / s.total) * 100).toFixed(1)) : 0;
        const failureRate = s.total > 0 ? Number(((s.wrong / s.total) * 100).toFixed(1)) : 0;
        const avgTimeSpentSeconds = s.total > 0 ? Math.round(s.totalTime / s.total) : 0;
        const isHighFailure = failureRate >= 80;
        const isTimeTrap = avgTimeSpentSeconds >= 90;

        let empiricalDifficulty: EmpiricalDifficulty = 'moderate';
        if (accuracyRate >= 85) empiricalDifficulty = 'very_easy';
        else if (accuracyRate >= 70) empiricalDifficulty = 'easy';
        else if (accuracyRate >= 45) empiricalDifficulty = 'moderate';
        else if (accuracyRate >= 20) empiricalDifficulty = 'hard';
        else empiricalDifficulty = 'extreme';

        const declaredDiff = (s.qInfo?.difficulty?.toLowerCase() || 'medium') as
          'easy' | 'medium' | 'hard';
        const isMisclassified =
          (declaredDiff === 'easy' &&
            (empiricalDifficulty === 'hard' || empiricalDifficulty === 'extreme')) ||
          (declaredDiff === 'hard' &&
            (empiricalDifficulty === 'easy' || empiricalDifficulty === 'very_easy'));

        const answeredTotal = s.correct + s.wrong;
        const optA =
          answeredTotal > 0 ? Number(((s.optionsCount.A / answeredTotal) * 100).toFixed(1)) : 0;
        const optB =
          answeredTotal > 0 ? Number(((s.optionsCount.B / answeredTotal) * 100).toFixed(1)) : 0;
        const optC =
          answeredTotal > 0 ? Number(((s.optionsCount.C / answeredTotal) * 100).toFixed(1)) : 0;
        const optD =
          answeredTotal > 0 ? Number(((s.optionsCount.D / answeredTotal) * 100).toFixed(1)) : 0;

        // Prefer the question's own subject, falling back to the chapter's parent.
        // Left embeds preserve unassigned questions; no synthetic exam ID/title is invented.
        const subject = s.qInfo?.subjects || s.qInfo?.chapters?.subjects;
        const exam = s.qInfo?.subjects?.exams || s.qInfo?.chapters?.subjects?.exams;

        return {
          questionId: qId,
          questionText: s.qInfo?.question_text || 'Question Text',
          questionBengali: s.qInfo?.question_bengali_text || undefined,
          subjectId: s.qInfo?.subject_id || subject?.id,
          subjectName: subject?.name || 'General Subject',
          chapterId: s.qInfo?.chapter_id,
          chapterName: s.qInfo?.chapters?.name || 'Topic Chapter',
          examId: exam?.id,
          examTitle: exam?.title,
          declaredDifficulty: declaredDiff,
          empiricalDifficulty,
          totalAttempts: s.total,
          correctCount: s.correct,
          wrongCount: s.wrong,
          skippedCount: s.skipped,
          accuracyRate,
          failureRate,
          avgTimeSpentSeconds,
          isHighFailure,
          isTimeTrap,
          isMisclassified,
          options: {
            A: s.qInfo?.option_a || 'Option A',
            B: s.qInfo?.option_b || 'Option B',
            C: s.qInfo?.option_c || 'Option C',
            D: s.qInfo?.option_d || 'Option D',
          },
          correctOption: s.qInfo?.correct_option || 'A',
          optionDistribution: { A: optA, B: optB, C: optC, D: optD },
          explanation: s.qInfo?.explanation || undefined,
        };
      });
    }
  }

  // Fallback to localItemAnalysisStore only when Supabase is not configured
  if (!isSupabaseConfigured && items.length === 0) {
    items = [...localItemAnalysisStore];
  }

  // Apply Filters
  let result = [...items];
  if (filters) {
    const activeFilter = filters.filterType || filters.preset;
    if (activeFilter === 'high_failure') {
      result = result.filter((item) => item.isHighFailure);
    } else if (activeFilter === 'time_traps') {
      result = result.filter((item) => item.isTimeTrap);
    } else if (activeFilter === 'misclassified') {
      result = result.filter((item) => item.isMisclassified);
    } else if (activeFilter === 'hardest') {
      result.sort((a, b) => a.accuracyRate - b.accuracyRate);
    } else if (activeFilter === 'easiest') {
      result.sort((a, b) => b.accuracyRate - a.accuracyRate);
    }

    if (filters.subjectId) {
      result = result.filter((item) => item.subjectId === filters.subjectId);
    }
    if (filters.chapterId) {
      result = result.filter((item) => item.chapterId === filters.chapterId);
    }
    if (filters.examId) {
      result = result.filter((item) => item.examId === filters.examId);
    }
    if (filters.testId) {
      result = result.filter((item) => item.testId === filters.testId);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.questionText.toLowerCase().includes(q) ||
          (item.questionBengali && item.questionBengali.toLowerCase().includes(q)) ||
          (item.subjectName && item.subjectName.toLowerCase().includes(q)) ||
          (item.chapterName && item.chapterName.toLowerCase().includes(q))
      );
    }
    if (filters.minAttempts) {
      result = result.filter((item) => item.totalAttempts >= filters.minAttempts!);
    }
  }

  return result;
}

export const adminSettingsApi = {
  getAppSettings,
  updateAppSetting,
  updateAppSettings,
  getMaintenanceMode,
  getPaymentGatewayConfig,
  updatePaymentGatewayConfig,
  getItemAnalysis,
};
