import {
  MOCK_EXAMS,
  MOCK_SUBJECTS,
  MOCK_CHAPTERS,
  MOCK_TEST_SERIES,
  MOCK_TESTS,
  MOCK_QUESTIONS,
} from '@/services/mockData';
import type { Database } from '@/types/database';
import type {
  AttemptAnswerState,
  Chapter,
  Exam,
  ExamCategory,
  GradedResult,
  MockTest,
  Question,
  Subject,
  TestAttempt,
  TestSeries,
  CouponItem,
  NotificationItem,
  AppSettingItem,
  SupportTicketItem,
  AdminAuditLog,
  AdminStaffMember,
  QuestionItemAnalysis,
  AdminPaymentRow,
  AdminStudentRow,
  LiveTest,
  LiveTestParticipation,
} from '@/types';

// Shared in-memory fallback stores (used when Supabase is unconfigured).
// Extracted verbatim from the original src/services/api.ts during the domain split.

export type ExamRow = Database['public']['Tables']['exams']['Row'];
export type SubjectRow = Database['public']['Tables']['subjects']['Row'];
export type ChapterRow = Database['public']['Tables']['chapters']['Row'];
export type TestRow = Database['public']['Tables']['tests']['Row'];
export type QuestionRow = Database['public']['Tables']['questions']['Row'];
export type AttemptRow = Database['public']['Tables']['test_attempts']['Row'];
export type MistakeRow = Database['public']['Tables']['mistakes']['Row'];
export type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
export type PlanRow = Database['public']['Tables']['subscription_plans']['Row'];

export const localExams: Exam[] = [...MOCK_EXAMS];
export const localSubjects: Subject[] = Object.values(MOCK_SUBJECTS).flat();
export const localChapters: Chapter[] = Object.values(MOCK_CHAPTERS).flat();
export const localTestSeries: TestSeries[] = Object.values(MOCK_TEST_SERIES).flat();
export const localTests: MockTest[] = Object.values(MOCK_TESTS).flat();
export const localQuestions: Question[] = Object.values(MOCK_QUESTIONS).flat();

export const localLiveTests: LiveTest[] = [
  {
    id: 'live-wbp-weekly-01',
    testId: 'test-indus-01',
    startAt: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 18 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 18 * 3600 * 1000 + 25 * 60 * 1000).toISOString(),
    status: 'upcoming',
    rankingEnabled: true,
    subscriptionRequired: false,
    title: 'WBP Constable Weekly Live Test',
    examId: 'wbp-constable',
    scheduledStartTime: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 18 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 20 * 3600 * 1000).toISOString(),
    scheduledStartAt: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 18 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
    scheduledEndAt: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 20 * 3600 * 1000).toISOString(),
    durationMinutes: 90,
    totalQuestions: 100,
    totalMarks: 100.0,
    negativeMarking: 0.25,
    instructions: 'Official West Bengal Police Constable pattern. 100 Questions, 90 Minutes, 0.25 Negative Marking. Statewide ranking and detailed analysis will be available immediately upon completion.',
    isPublished: true,
    enrolledCount: 12450,
    createdAt: new Date().toISOString(),
    examTitle: 'WB Police (WBP / KP)',
    testTitle: 'WBP Constable Full Mock 01',
  },
];

export const localLiveTestParticipations: LiveTestParticipation[] = [
  {
    id: 'part-demo-1',
    liveTestId: 'live-wbp-weekly-01',
    userId: 'mock-user-1',
    registeredAt: new Date(Date.now() - 3600000).toISOString(),
    joinedAt: new Date(Date.now() - 3500000).toISOString(),
    completedAt: new Date(Date.now() - 1000000).toISOString(),
    status: 'completed',
    score: 82.5,
    accuracy: 91.2,
    timeTaken: 3840,
    rank: 1,
    fullName: 'Sourav Ganguly',
    district: 'Kolkata',
  },
  {
    id: 'part-demo-2',
    liveTestId: 'live-wbp-weekly-01',
    userId: 'mock-user-2',
    registeredAt: new Date(Date.now() - 3600000).toISOString(),
    joinedAt: new Date(Date.now() - 3500000).toISOString(),
    completedAt: new Date(Date.now() - 1100000).toISOString(),
    status: 'completed',
    score: 79.0,
    accuracy: 88.0,
    timeTaken: 4120,
    rank: 2,
    fullName: 'Ananya Roy',
    district: 'North 24 Parganas',
  },
  {
    id: 'part-demo-3',
    liveTestId: 'live-wbp-weekly-01',
    userId: 'mock-user-3',
    registeredAt: new Date(Date.now() - 3600000).toISOString(),
    joinedAt: new Date(Date.now() - 3500000).toISOString(),
    completedAt: new Date(Date.now() - 1200000).toISOString(),
    status: 'completed',
    score: 74.5,
    accuracy: 84.5,
    timeTaken: 4500,
    rank: 3,
    fullName: 'Rahul Karmakar',
    district: 'Hooghly',
  },
];

export const localExamCategories: ExamCategory[] = [
  { id: 'cat_wb_police', name: 'WB Police (WBP / KP)', orderIndex: 1, isActive: true },
  { id: 'cat_wbpsc', name: 'WBPSC (Clerkship / WBCS)', orderIndex: 2, isActive: true },
  { id: 'cat_teaching', name: 'Teaching (TET / SLST)', orderIndex: 3, isActive: true },
  { id: 'cat_ssc', name: 'SSC & Central Govt.', orderIndex: 4, isActive: true },
  { id: 'cat_railways', name: 'Railways (RRB)', orderIndex: 5, isActive: true },
];

// Local test-question assignments store for offline demo
export const localTestQuestions: {
  id: string;
  testId: string;
  questionId: string;
  questionOrder: number;
  marks: number;
  negativeMarks: number;
}[] = [];

// Initialize localTestQuestions from MOCK_QUESTIONS and MOCK_TESTS
Object.entries(MOCK_QUESTIONS).forEach(([testId, questions]) => {
  questions.forEach((q, idx) => {
    localTestQuestions.push({
      id: `tq-${testId}-${q.id}`,
      testId,
      questionId: q.id,
      questionOrder: idx + 1,
      marks: q.defaultMarks || 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      negativeMarks: q.defaultNegativeMarks || 0,
    });
  });
});

// Local in-memory store for session attempts & submissions (for fallback/offline demo)
export const localAttemptsStore: Record<
  string,
  {
    attempt: TestAttempt;
    answers: Record<string, AttemptAnswerState>;
    result?: GradedResult;
  }
> = {};

// Local in-memory store for promotional coupons
export const localCoupons: CouponItem[] = [
  {
    id: 'coupon_welcome50',
    code: 'WELCOME50',
    description: 'Special ₹50 introductory discount for new aspirants',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 199,
    maxUses: 500,
    usedCount: 38,
    maxUsesPerUser: 1,
    applicablePlanId: 'pro_1_year',
    validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
    validUntil: new Date(Date.now() + 150 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'coupon_festive20',
    code: 'FESTIVE20',
    description: 'Festive 20% discount on 1-Year All-Access Pro Pass',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 100,
    minOrderAmount: 299,
    maxUses: 1000,
    usedCount: 142,
    maxUsesPerUser: 1,
    applicablePlanId: 'pro_1_year',
    validFrom: new Date(Date.now() - 15 * 86400000).toISOString(),
    validUntil: new Date(Date.now() + 75 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'coupon_propass100',
    code: 'PROPASS100',
    description: 'Special seasonal ₹100 flat off on Pro Pass',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 299,
    maxUses: 250,
    usedCount: 89,
    maxUsesPerUser: 1,
    applicablePlanId: 'pro_1_year',
    validFrom: new Date(Date.now() - 5 * 86400000).toISOString(),
    validUntil: new Date(Date.now() + 55 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Fallback in-memory notification store
export const localNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New WBP Constable Full Mock Test 05 Released',
    message:
      'The latest Full Mock Test is now live for all enrolled students. Complete your full 85-question simulation.',
    targetAudience: 'all',
    channel: 'in_app',
    status: 'sent',
    sentAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-pro-1',
    title: 'Pro Exclusive: New Subject-Wise GK Marathon Released',
    message:
      'Special 1500+ curated GK & Static Awareness question drill is now available for all Pro Pass aspirants.',
    targetAudience: 'pro',
    channel: 'in_app',
    status: 'sent',
    sentAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-free-1',
    title: 'Free Mock Test Available Today',
    message:
      'Take our free weekly demo mock test to analyze your West Bengal Police preparation level!',
    targetAudience: 'free',
    channel: 'in_app',
    status: 'sent',
    sentAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

export function syncLocalScheduledNotifications(): NotificationItem[] {
  const now = new Date();
  localNotifications.forEach((n) => {
    if (n.status === 'scheduled' && n.scheduledAt && new Date(n.scheduledAt) <= now) {
      n.status = 'sent';
      n.sentAt = n.scheduledAt;
    }
  });
  return localNotifications;
}

export const localAppSettings: AppSettingItem[] = [
  {
    id: 'general_app_name',
    category: 'general',
    key: 'app_name',
    value: 'PracticeKoro',
    description: 'Platform name displayed across UI',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'general_support_email',
    category: 'general',
    key: 'support_email',
    value: 'support@practicekoro.online',
    description: 'Support contact email',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'general_support_phone',
    category: 'general',
    key: 'support_phone',
    value: '+91 9547771118',
    description: 'Support phone helpline',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'general_support_whatsapp',
    category: 'general',
    key: 'support_whatsapp',
    value: '+91 9547771118',
    description: 'Official WhatsApp customer support helpline',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'general_support_hours',
    category: 'general',
    key: 'support_hours',
    value: 'Mon - Sat: 10:00 AM - 7:00 PM (IST)',
    description: 'Customer support desk operational hours',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'general_support_address',
    category: 'general',
    key: 'support_address',
    value: 'West Bengal, India',
    description: 'Registered operating location & jurisdiction',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'general_website_url',
    category: 'general',
    key: 'website_url',
    value: 'https://practicekoro.online',
    description: 'Official web application domain',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'content_language_mode',
    category: 'general',
    key: 'content_language_mode',
    value: 'bengali_only',
    description: 'Global content language mode: bengali_only (default) or bilingual',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exam_default_duration',
    category: 'exam_defaults',
    key: 'default_duration_minutes',
    value: 60,
    description: 'Standard default exam duration in minutes',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exam_default_marks',
    category: 'exam_defaults',
    key: 'default_marks_per_q',
    value: 1.0,
    description: 'Standard default marks per correct question',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exam_default_negative_marks',
    category: 'exam_defaults',
    key: 'default_negative_marks',
    value: 0.25,
    description: 'Standard default negative marking',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exam_passing_percentage',
    category: 'exam_defaults',
    key: 'default_passing_percentage',
    value: 35,
    description: 'Standard passing score percentage',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sub_currency',
    category: 'subscription',
    key: 'currency',
    value: 'INR',
    description: 'Platform transaction currency',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sub_expiry_warning_days',
    category: 'subscription',
    key: 'expiry_warning_days',
    value: 7,
    description: 'Days before expiry to display renewal warning',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sys_maintenance_mode',
    category: 'system',
    key: 'maintenance_mode',
    value: false,
    description: 'Enable platform maintenance splash mode',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sys_app_version',
    category: 'system',
    key: 'app_version',
    value: '2.0.0',
    description: 'Platform production release version',
    updatedAt: new Date().toISOString(),
  },
];

export interface LocalPaymentGatewayRecord {
  gateway: string;
  key_id: string;
  key_secret?: string;
  webhook_secret?: string;
  is_active: boolean;
  updated_at?: string;
}

export const localPaymentGateways: Record<string, LocalPaymentGatewayRecord> = {
  razorpay: {
    gateway: 'razorpay',
    key_id: '',
    key_secret: '',
    webhook_secret: '',
    is_active: true,
    updated_at: new Date().toISOString(),
  },
};

export const localSupportTickets: SupportTicketItem[] = [
  {
    id: 'tkt_101',
    userId: 'user_student_1',
    studentName: 'Sourav Ganguly',
    studentEmail: 'sourav.aspirant@example.com',
    subject: 'Question 14 Answer Key in WBCS Prelims Mock #2',
    issue:
      'In question 14, option B was marked correct, but according to latest syllabus Option C is verified by standard texts.',
    category: 'Test Issue',
    priority: 'medium',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'tkt_102',
    userId: 'user_student_2',
    studentName: 'Ananya Roy',
    studentEmail: 'ananya.wb@example.com',
    subject: 'UPI Payment debited but Pro Pass delayed',
    issue:
      'I paid ₹499 via Google Pay for 1-Year Pro Pass. UTR 428198271891. Please verify and activate.',
    category: 'Payment Issue',
    priority: 'high',
    status: 'resolved',
    resolutionNotes:
      'Verified with gateway logs. Transaction was captured. Pro Pass manually renewed for 365 days.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const localStaffUsers: AdminStaffMember[] = [
  {
    id: 'staff_super_admin',
    email: 'admin@practicekoro.online',
    fullName: 'Chief Super Admin',
    role: 'admin',
    adminRole: 'super_admin',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'staff_content_writer',
    email: 'writer@practicekoro.online',
    fullName: 'Debabrata Mukherjee (Content Specialist)',
    role: 'admin',
    adminRole: 'content_writer',
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
  },
  {
    id: 'staff_support_agent',
    email: 'support.lead@practicekoro.online',
    fullName: 'Priya Sen (Student Support Lead)',
    role: 'admin',
    adminRole: 'support_agent',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
];

export const localAuditLogs: AdminAuditLog[] = [
  {
    id: 'log_001',
    adminEmail: 'admin@practicekoro.online',
    adminName: 'Chief Super Admin',
    adminRole: 'super_admin',
    action: 'SETTINGS_UPDATE',
    entityType: 'settings',
    entityId: 'sys_maintenance_mode',
    entityName: 'Platform Maintenance Mode',
    details: { maintenance_mode: false },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log_002',
    adminEmail: 'writer@practicekoro.online',
    adminName: 'Debabrata Mukherjee',
    adminRole: 'content_writer',
    action: 'QUESTION_CREATE',
    entityType: 'question',
    entityId: 'q-wbp-const-001',
    entityName: 'WBP Constable Reasoning Pattern Q1',
    details: { exam: 'WBP Constable', subject: 'Reasoning', hasDiagram: true },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'log_003',
    adminEmail: 'admin@practicekoro.online',
    adminName: 'Chief Super Admin',
    adminRole: 'super_admin',
    action: 'SUBSCRIPTION_MANUAL_GRANT',
    entityType: 'subscription',
    entityId: 'sub_manual_102',
    entityName: 'Ananya Roy (ananya.wb@example.com)',
    details: { plan: '1-Year Pro Pass', durationDays: 365, note: 'Resolved UPI discrepancy' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// ─── Multi-Date Seeded Payments for Custom Date-Range Analytics ──────
const nowMs = Date.now();
const dayMs = 86400000;

export const localPayments: AdminPaymentRow[] = [
  {
    id: 'pay_today_1',
    userId: 'usr_001',
    studentName: 'Subhasish Majumdar',
    studentEmail: 'subhasish@example.com',
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    amount: 499,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_today_01',
    status: 'completed',
    createdAt: new Date(nowMs - 3600000 * 2).toISOString(), // Today
  },
  {
    id: 'pay_today_2',
    userId: 'usr_002',
    studentName: 'Moumita Banerjee',
    studentEmail: 'moumita.b@example.com',
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    amount: 299,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_today_02',
    status: 'completed',
    createdAt: new Date(nowMs - 3600000 * 5).toISOString(), // Today
  },
  {
    id: 'pay_yesterday_1',
    userId: 'usr_003',
    studentName: 'Rohan Mondal',
    studentEmail: 'rohan.wbp@example.com',
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    amount: 499,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_yest_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs - 3600000 * 3).toISOString(), // Yesterday
  },
  {
    id: 'pay_day3_1',
    userId: 'usr_004',
    studentName: 'Debolina Dutta',
    studentEmail: 'debolina@example.com',
    planId: 'pro_1_month',
    planTitle: '1-Month Pro Pass',
    amount: 99,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_d3_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs * 3).toISOString(),
  },
  {
    id: 'pay_day5_1',
    userId: 'usr_005',
    studentName: 'Aritra Sen',
    studentEmail: 'aritra.sen@example.com',
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    amount: 499,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_d5_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs * 5).toISOString(),
  },
  {
    id: 'pay_day10_1',
    userId: 'usr_006',
    studentName: 'Suman Chatterjee',
    studentEmail: 'suman.wbcs@example.com',
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    amount: 299,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_d10_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs * 10).toISOString(),
  },
  {
    id: 'pay_day18_1',
    userId: 'usr_007',
    studentName: 'Priyanka Naskar',
    studentEmail: 'priyanka.n@example.com',
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    amount: 499,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_d18_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs * 18).toISOString(),
  },
  {
    id: 'pay_day25_1',
    userId: 'usr_008',
    studentName: 'Bikram Sarkar',
    studentEmail: 'bikram.s@example.com',
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    amount: 299,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_d25_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs * 25).toISOString(),
  },
  {
    id: 'pay_day45_1',
    userId: 'usr_009',
    studentName: 'Tanmoy Ghosh',
    studentEmail: 'tanmoy.g@example.com',
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    amount: 499,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_d45_01',
    status: 'completed',
    createdAt: new Date(nowMs - dayMs * 45).toISOString(),
  },
  {
    id: 'pay_fixed_jan05',
    userId: 'usr_010',
    studentName: 'Joydeep Mukherjee',
    studentEmail: 'joydeep.m@example.com',
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    amount: 499,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_jan05_01',
    status: 'completed',
    createdAt: '2026-01-05T10:30:00.000Z',
  },
  {
    id: 'pay_fixed_jan12',
    userId: 'usr_011',
    studentName: 'Sweta Karmakar',
    studentEmail: 'sweta.k@example.com',
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    amount: 299,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_jan12_01',
    status: 'completed',
    createdAt: '2026-01-12T14:45:00.000Z',
  },
  {
    id: 'pay_fixed_jan14',
    userId: 'usr_012',
    studentName: 'Dipankar Halder',
    studentEmail: 'dipankar.h@example.com',
    planId: 'pro_1_month',
    planTitle: '1-Month Pro Pass',
    amount: 99,
    currency: 'INR',
    gateway: 'razorpay',
    orderId: 'ord_jan14_01',
    status: 'completed',
    createdAt: '2026-01-14T18:20:00.000Z',
  },
];

// ─── Multi-Date Seeded Students for Signups Calculation ─────────────
export const localStudents: AdminStudentRow[] = [
  {
    id: 'usr_001',
    fullName: 'Subhasish Majumdar',
    email: 'subhasish@example.com',
    phone: '+91 98301 11223',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 360).toISOString(),
    testsCompleted: 14,
    createdAt: new Date(nowMs - 3600000 * 4).toISOString(), // Today
  },
  {
    id: 'usr_002',
    fullName: 'Moumita Banerjee',
    email: 'moumita.b@example.com',
    phone: '+91 98312 22334',
    isPro: true,
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 175).toISOString(),
    testsCompleted: 9,
    createdAt: new Date(nowMs - 3600000 * 8).toISOString(), // Today
  },
  {
    id: 'usr_003',
    fullName: 'Rohan Mondal',
    email: 'rohan.wbp@example.com',
    phone: '+91 98323 33445',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 364).toISOString(),
    testsCompleted: 22,
    createdAt: new Date(nowMs - dayMs - 3600000 * 6).toISOString(), // Yesterday
  },
  {
    id: 'usr_004',
    fullName: 'Debolina Dutta',
    email: 'debolina@example.com',
    phone: '+91 98334 44556',
    isPro: false,
    testsCompleted: 4,
    createdAt: new Date(nowMs - dayMs * 3).toISOString(),
  },
  {
    id: 'usr_005',
    fullName: 'Aritra Sen',
    email: 'aritra.sen@example.com',
    phone: '+91 98345 55667',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 360).toISOString(),
    testsCompleted: 18,
    createdAt: new Date(nowMs - dayMs * 5).toISOString(),
  },
  {
    id: 'usr_006',
    fullName: 'Suman Chatterjee',
    email: 'suman.wbcs@example.com',
    phone: '+91 98356 66778',
    isPro: true,
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 170).toISOString(),
    testsCompleted: 31,
    createdAt: new Date(nowMs - dayMs * 10).toISOString(),
  },
  {
    id: 'usr_007',
    fullName: 'Priyanka Naskar',
    email: 'priyanka.n@example.com',
    phone: '+91 98367 77889',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 347).toISOString(),
    testsCompleted: 25,
    createdAt: new Date(nowMs - dayMs * 18).toISOString(),
  },
  {
    id: 'usr_008',
    fullName: 'Bikram Sarkar',
    email: 'bikram.s@example.com',
    phone: '+91 98378 88990',
    isPro: false,
    testsCompleted: 7,
    createdAt: new Date(nowMs - dayMs * 25).toISOString(),
  },
  {
    id: 'usr_009',
    fullName: 'Tanmoy Ghosh',
    email: 'tanmoy.g@example.com',
    phone: '+91 98389 99001',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(nowMs + dayMs * 320).toISOString(),
    testsCompleted: 19,
    createdAt: new Date(nowMs - dayMs * 45).toISOString(),
  },
  {
    id: 'usr_jan02',
    fullName: 'Sandip Roy',
    email: 'sandip.r@example.com',
    phone: '+91 98300 00112',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    testsCompleted: 12,
    createdAt: '2026-01-02T09:15:00.000Z',
  },
  {
    id: 'usr_jan05',
    fullName: 'Joydeep Mukherjee',
    email: 'joydeep.m@example.com',
    phone: '+91 98300 00113',
    isPro: true,
    planId: 'pro_1_year',
    planTitle: '1-Year Pro All-Access',
    subscriptionStatus: 'active',
    testsCompleted: 15,
    createdAt: '2026-01-05T08:30:00.000Z',
  },
  {
    id: 'usr_jan12',
    fullName: 'Sweta Karmakar',
    email: 'sweta.k@example.com',
    phone: '+91 98300 00114',
    isPro: true,
    planId: 'pro_6_month',
    planTitle: '6-Month Pro Pass',
    subscriptionStatus: 'active',
    testsCompleted: 8,
    createdAt: '2026-01-12T11:45:00.000Z',
  },
  {
    id: 'usr_jan14',
    fullName: 'Dipankar Halder',
    email: 'dipankar.h@example.com',
    phone: '+91 98300 00115',
    isPro: true,
    planId: 'pro_1_month',
    planTitle: '1-Month Pro Pass',
    subscriptionStatus: 'active',
    testsCompleted: 6,
    createdAt: '2026-01-14T15:20:00.000Z',
  },
];

// ─── Item Analysis Seed Store (Question Accuracy & Difficulty) ──────
export const localItemAnalysisStore: QuestionItemAnalysis[] = [
  {
    questionId: 'q-lit-04',
    questionText:
      'কোন কাব্যগ্রন্থটির জন্য মাইকেল মধুসূদন দত্ত অমিত্রাক্ষর ছন্দের প্রথম সার্থক প্রয়োগ ঘটান?',
    questionBengali:
      'কোন কাব্যগ্রন্থটির জন্য মাইকেল মধুসূদন দত্ত অমিত্রাক্ষর ছন্দের প্রথম সার্থক প্রয়োগ ঘটান?',
    subjectId: 'sub_bengali',
    subjectName: 'বাংলা সাহিত্য ও ব্যাকরণ',
    chapterId: 'chap_bengali_modern',
    chapterName: 'আধুনিক বাংলা কাব্য ও নাটক',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_bengali_01',
    testTitle: 'WBCS Bengali Literature Mastery Mock',
    declaredDifficulty: 'medium',
    empiricalDifficulty: 'extreme',
    totalAttempts: 154,
    correctCount: 24,
    wrongCount: 126,
    skippedCount: 4,
    accuracyRate: 15.6,
    failureRate: 81.8, // >= 80% failure rate!
    avgTimeSpentSeconds: 78,
    isHighFailure: true,
    isTimeTrap: false,
    isMisclassified: true, // declared medium but actual extreme failure
    options: {
      A: 'তিলোত্তমাসম্ভব কাব্য',
      B: 'মেঘনাদবধ কাব্য',
      C: 'পদ্মাবতী নাটক',
      D: 'বীরাঙ্গনা কাব্য',
    },
    correctOption: 'A',
    optionDistribution: {
      A: 15.6, // Correct option (only 15.6%)
      B: 58.4, // Trap distractor! Most students mistakenly chose মেঘনাদবধ
      C: 18.2,
      D: 5.2,
    },
    explanation:
      'মাইকেল মধুসূদন দত্ত ১৮৬০ সালে প্রকাশিত "তিলোত্তমাসম্ভব কাব্য"-এ প্রথম সার্থকভাবে অমিত্রাক্ষর ছন্দ (Blank Verse) প্রয়োগ করেন। তবে এই ছন্দের চূড়ান্ত মহাকাব্যিক পরাকাষ্ঠা ঘটে ১৮৬১ সালে "মেঘনাদবধ কাব্য"-এ। ৫৮% শিক্ষার্থী ভুলবশত মেঘনাদবধ নির্বাচন করেছে।',
  },
  {
    questionId: 'q-math-02',
    questionText:
      'একটি নির্বাচনে দুইজন প্রার্থীর মধ্যে বিজয়ী প্রার্থী মোট প্রদত্ত ভোটের ৫৮% পেয়ে ৪,৮০০ ভোটে জয়লাভ করলেন। যদি ২০% ভোট অবৈধ ঘোষিত হয়ে থাকে, তবে ভোটার তালিকায় মোট ভোটারের সংখ্যা কত ছিল?',
    questionBengali:
      'একটি নির্বাচনে দুইজন প্রার্থীর মধ্যে বিজয়ী প্রার্থী মোট প্রদত্ত ভোটের ৫৮% পেয়ে ৪,৮০০ ভোটে জয়লাভ করলেন। যদি ২০% ভোট অবৈধ ঘোষিত হয়ে থাকে, তবে ভোটার তালিকায় মোট ভোটারের সংখ্যা কত ছিল?',
    subjectId: 'sub_math',
    subjectName: 'পাটিগণিত ও সংখ্যাতত্ত্ব',
    chapterId: 'chap_math_percentage',
    chapterName: 'শতকরা ও অনুপাত',
    examId: 'exam_wb_police',
    examTitle: 'West Bengal Police Constable & SI',
    testId: 'test_wbp_math_01',
    testTitle: 'WBP Arithmetic Full Speed Mock',
    declaredDifficulty: 'medium',
    empiricalDifficulty: 'extreme',
    totalAttempts: 168,
    correctCount: 26,
    wrongCount: 138,
    skippedCount: 4,
    accuracyRate: 15.5,
    failureRate: 82.1, // >= 80% failure rate!
    avgTimeSpentSeconds: 124, // > 90s Time Trap!
    isHighFailure: true,
    isTimeTrap: true, // Both High Failure and Time Trap!
    isMisclassified: true,
    options: {
      A: '৩৭,৫০০',
      B: '৩০,০০০',
      C: '৪০,০০০',
      D: '৪২,০০০',
    },
    correctOption: 'A',
    optionDistribution: {
      A: 15.5,
      B: 64.3, // Calculation error without invalid vote adjustment
      C: 12.5,
      D: 5.4,
    },
    explanation:
      'ধরি মোট ভোটার = x। বৈধ ভোট = ০.৮x। বিজয়ী ও পরাজিত প্রার্থীর ব্যবধান = (৫৮% - ৪২%) = ১৬% বৈধ ভোট। সুতরাং ০.১৬ × ০.৮x = ৪,৮০০ => ০.১২৮x = ৪,৮০০ => x = ৩৭,৫০০। ৬৪% ছাত্র ২০% অবৈধ ভোটের হিসাব বাদ দেওয়ায় ৩০,০০০ উত্তর বেছে নিয়েছে।',
  },
  {
    questionId: 'q-hist-03',
    questionText:
      '১৮৫৭ সালের মহাবিদ্রোহ চলাকালে অযোধ্যায় (লখনউ) ব্রিটিশ সৈন্যবাহিনীর বিরুদ্ধে সিপাহীদের কার্যকর নেতৃত্ব কে প্রদান করেছিলেন?',
    questionBengali:
      '১৮৫৭ সালের মহাবিদ্রোহ চলাকালে অযোধ্যায় (লখনউ) ব্রিটিশ সৈন্যবাহিনীর বিরুদ্ধে সিপাহীদের কার্যকর নেতৃত্ব কে প্রদান করেছিলেন?',
    subjectId: 'sub_history',
    subjectName: 'ভারতের আধুনিক ইতিহাস ও জাতীয় আন্দোলন',
    chapterId: 'chap_hist_1857',
    chapterName: 'মহাবিদ্রোহ ও ব্রিটিশ নীতি',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_hist_02',
    testTitle: 'Indian Freedom Movement Core Test',
    declaredDifficulty: 'easy',
    empiricalDifficulty: 'extreme',
    totalAttempts: 145,
    correctCount: 28,
    wrongCount: 116,
    skippedCount: 1,
    accuracyRate: 19.3,
    failureRate: 80.0, // >= 80% failure rate!
    avgTimeSpentSeconds: 48,
    isHighFailure: true,
    isTimeTrap: false,
    isMisclassified: true, // author wrote easy, but 80% candidates failed!
    options: {
      A: 'নানা সাহেব',
      B: 'বেগম হজরত মহল',
      C: 'খান বাহাদুর খান',
      D: 'মৌলভি আহমদুল্লাহ',
    },
    correctOption: 'B',
    optionDistribution: {
      A: 42.1, // Distractor trap (Nana Saheb led Kanpur, not Lucknow)
      B: 19.3, // Correct (Begum Hazrat Mahal)
      C: 8.3,
      D: 29.7, // Maulvi Ahmadullah also operated near Faizabad/Awadh
    },
    explanation:
      'লখনউতে মহাবিদ্রোহের মূল নেতৃত্ব দেন বেগম হজরত মহল। তিনি তার নাবালক পুত্র বিজ্রিস কাদিরকে নবাব ঘোষণা করে যুদ্ধ পরিচালনা করেন। কানপুরে নেতৃত্ব দেন নানা সাহেব।',
  },
  {
    questionId: 'q-reas-03',
    questionText:
      'আটজন ব্যক্তি A, B, C, D, E, F, G, H একটি বৃত্তাকার টেবিলের চারিদিকে কেন্দ্রের দিকে মুখ করে বসে আছেন। B বসেছে D-এর ডানদিকে তৃতীয় স্থানে এবং F-এর বামদিকে দ্বিতীয় স্থানে। H-এর অবস্থান নির্ণয় করো।',
    questionBengali:
      'আটজন ব্যক্তি A, B, C, D, E, F, G, H একটি বৃত্তাকার টেবিলের চারিদিকে কেন্দ্রের দিকে মুখ করে বসে আছেন। B বসেছে D-এর ডানদিকে তৃতীয় স্থানে এবং F-এর বামদিকে দ্বিতীয় স্থানে। H-এর অবস্থান নির্ণয় করো।',
    subjectId: 'sub_reasoning',
    subjectName: 'যৌক্তিক বিশ্লেষণ ও রিজনিং',
    chapterId: 'chap_reas_seating',
    chapterName: 'বৃত্তাকার ও রৈখিক আসন বিন্যাস',
    examId: 'exam_wb_police',
    examTitle: 'West Bengal Police Constable & SI',
    testId: 'test_wbp_reas_02',
    testTitle: 'Advanced Seating & Puzzles Mock',
    declaredDifficulty: 'hard',
    empiricalDifficulty: 'moderate',
    totalAttempts: 122,
    correctCount: 62,
    wrongCount: 46,
    skippedCount: 14,
    accuracyRate: 50.8,
    failureRate: 37.7,
    avgTimeSpentSeconds: 148, // > 90s Time Trap!
    isHighFailure: false,
    isTimeTrap: true, // Time Trap!
    isMisclassified: false,
    options: {
      A: 'C এবং E এর ঠিক মাঝে',
      B: 'F এর মুখোমুখি বিপরীত দিকে',
      C: 'A এর ডানদিকে দ্বিতীয় স্থানে',
      D: 'D এর বামদিকে দ্বিতীয় স্থানে',
    },
    correctOption: 'B',
    optionDistribution: {
      A: 18.0,
      B: 50.8,
      C: 17.2,
      D: 10.7,
    },
    explanation:
      'আসন বিন্যাস তৈরি করলে দেখা যায় F এবং H পরস্পরের মুখোমুখি বিপরীত বিন্দুতে অবস্থান করছে। প্রশ্নটি সমাধান করতে প্রার্থীদের গড়ে ১৪৮ সেকেন্ড লেগেছে, যা আদর্শ সময়ের (৬০ সে.) দ্বিগুণের বেশি।',
  },
  {
    questionId: 'q-sci-05',
    questionText:
      'বায়ুমণ্ডলে ওজন স্তরের ঘনত্ব পরিমাপের জন্য নিচের কোন বৈজ্ঞানিক এককটি ব্যবহার করা হয়?',
    questionBengali:
      'বায়ুমণ্ডলে ওজন স্তরের ঘনত্ব পরিমাপের জন্য নিচের কোন বৈজ্ঞানিক এককটি ব্যবহার করা হয়?',
    subjectId: 'sub_science',
    subjectName: 'সাধারণ বিজ্ঞান ও পরিবেশ বিদ্যা',
    chapterId: 'chap_sci_atmosphere',
    chapterName: 'বায়ুমণ্ডল ও পরিবেশ দূষণ',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_sci_01',
    testTitle: 'WBCS General Science Prelims Drill',
    declaredDifficulty: 'easy',
    empiricalDifficulty: 'easy',
    totalAttempts: 195,
    correctCount: 158,
    wrongCount: 32,
    skippedCount: 5,
    accuracyRate: 81.0,
    failureRate: 16.4,
    avgTimeSpentSeconds: 28,
    isHighFailure: false,
    isTimeTrap: false,
    isMisclassified: false,
    options: {
      A: 'ডবসন একক (Dobson Unit)',
      B: 'পাস্কাল (Pascal)',
      C: 'ক্যান্ডেলা (Candela)',
      D: 'অ্যাম্পিয়ার (Ampere)',
    },
    correctOption: 'A',
    optionDistribution: {
      A: 81.0,
      B: 12.3,
      C: 4.1,
      D: 1.5,
    },
    explanation:
      'ওজন স্তরের মোট ঘনত্ব পরিমাপ করতে ডবসন ইউনিট (DU) ব্যবহৃত হয়। ১ ডবসন ইউনিট হলো মানক চাপ ও তাপমাত্রায় ০.০১ মিমি পুরু বিশুদ্ধ ওজন স্তর।',
  },
  {
    questionId: 'q-geo-02',
    questionText:
      'পশ্চিমবঙ্গের সুন্দরবন অঞ্চলের প্রধান ম্যানগ্রোভ বনভূমির জীববৈচিত্র্য সংরক্ষণের ক্ষেত্রে ইউনেস্কো কোন সালে এটিকে ওয়ার্ল্ড হেরিটেজ সাইট হিসেবে ঘোষণা করে?',
    questionBengali:
      'পশ্চিমবঙ্গের সুন্দরবন অঞ্চলের প্রধান ম্যানগ্রোভ বনভূমির জীববৈচিত্র্য সংরক্ষণের ক্ষেত্রে ইউনেস্কো কোন সালে এটিকে ওয়ার্ল্ড হেরিটেজ সাইট হিসেবে ঘোষণা করে?',
    subjectId: 'sub_geography',
    subjectName: 'পশ্চিমবঙ্গ ও ভারতের ভূগোল',
    chapterId: 'chap_geo_wb',
    chapterName: 'পশ্চিমবঙ্গের ভূপ্রকৃতি ও অরণ্য',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_geo_01',
    testTitle: 'West Bengal Geography Core Mock',
    declaredDifficulty: 'easy',
    empiricalDifficulty: 'extreme',
    totalAttempts: 172,
    correctCount: 31,
    wrongCount: 139,
    skippedCount: 2,
    accuracyRate: 18.0,
    failureRate: 80.8, // >= 80% failure rate!
    avgTimeSpentSeconds: 38,
    isHighFailure: true,
    isTimeTrap: false,
    isMisclassified: true, // Declared easy, but 80.8% failure!
    options: {
      A: '১৯৮৪',
      B: '১৯৮৭',
      C: '১৯৮৯',
      D: '২০০১',
    },
    correctOption: 'B',
    optionDistribution: {
      A: 34.9, // National park declaration year (1984) trap!
      B: 18.0, // Correct UNESCO World Heritage (1987)
      C: 38.4, // Biosphere reserve (1989) trap!
      D: 6.4,
    },
    explanation:
      'সুন্দরবন জাতীয় উদ্যানকে ১৯৮৭ সালে ইউনেস্কো ওয়ার্ল্ড হেরিটেজ সাইট হিসেবে স্বীকৃতি দেয়। ১৯৮৪ সালে এটি জাতীয় উদ্যান এবং ১৯৮৯ সালে বায়োস্ফিয়ার রিজার্ভ হিসেবে ঘোষিত হয়েছিল। ৩৫% শিক্ষার্থী ১৯৮৪ এবং ৩৮% শিক্ষার্থী ১৯৮৯ নির্বাচন করেছে।',
  },
];
