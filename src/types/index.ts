export type UserRole = 'student' | 'admin' | 'instructor';
export type AdminRole = 'super_admin' | 'content_writer' | 'support_agent';

export interface AdminPermissions {
  canManageQuestions: boolean;
  canManageTests: boolean;
  canDeleteTests: boolean;
  canManageExams: boolean;
  canManageSubscriptions: boolean;
  canManageCoupons: boolean;
  canManageSupport: boolean;
  canManageNotifications: boolean;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canViewAuditLogs: boolean;
}

export function getAdminPermissions(adminRole?: AdminRole): AdminPermissions {
  switch (adminRole) {
    case 'content_writer':
      return {
        canManageQuestions: true,
        canManageTests: true,
        canDeleteTests: false,
        canManageExams: true,
        canManageSubscriptions: false,
        canManageCoupons: false,
        canManageSupport: false,
        canManageNotifications: false,
        canManageSettings: false,
        canManageStaff: false,
        canViewAuditLogs: false,
      };
    case 'support_agent':
      return {
        canManageQuestions: false,
        canManageTests: false,
        canDeleteTests: false,
        canManageExams: false,
        canManageSubscriptions: false,
        canManageCoupons: false,
        canManageSupport: true,
        canManageNotifications: true,
        canManageSettings: false,
        canManageStaff: false,
        canViewAuditLogs: false,
      };
    case 'super_admin':
    default:
      return {
        canManageQuestions: true,
        canManageTests: true,
        canDeleteTests: true,
        canManageExams: true,
        canManageSubscriptions: true,
        canManageCoupons: true,
        canManageSupport: true,
        canManageNotifications: true,
        canManageSettings: true,
        canManageStaff: true,
        canViewAuditLogs: true,
      };
  }
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  district?: string;
  targetExamId?: string;
  role: UserRole;
  adminRole?: AdminRole;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  iconName: string;
  bannerUrl?: string;
  orderIndex: number;
  isActive: boolean;
  fullMockCount?: number;
  pyqCount?: number;
  topicTestCount?: number;
  fullMocksCount?: number;
  pyqsCount?: number;
  topicTestsCount?: number;
  testsCount?: number;
  subjectsCount?: number;
  totalVacancies?: number;
  questionsCount?: number;
}

export interface ExamCategory {
  id: string;
  name: string;
  orderIndex: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Subject {
  id: string;
  examId?: string;
  name: string;
  slug: string;
  description?: string;
  iconName: string;
  orderIndex: number;
  isActive: boolean;
  chaptersCount?: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  orderIndex: number;
  isActive: boolean;
  testsCount?: number;
  updatedAt?: string;
}

export type Topic = Chapter;

export interface ExamTopicMapping {
  id?: string;
  examId: string;
  topicId: string;
  orderIndex?: number;
  createdAt?: string;
  topicName?: string;
  subjectName?: string;
  subjectId?: string;
}

export interface TestSeries {
  id: string;
  examId: string;
  title: string;
  slug: string;
  description?: string;
  isPremium: boolean;
  orderIndex: number;
  isActive: boolean;
  isFeatured?: boolean;
  iconUrl?: string;
  createdAt?: string;
  examTitle?: string;
  examCategory?: string;
  isPopular?: boolean;
  testCount?: number;
  testsCount?: number;
  fullMockCount?: number;
  topicTestCount?: number;
  pyqTestCount?: number;
}

export interface LiveTest {
  id: string;
  title: string;
  examId: string;
  testSeriesId?: string;
  testId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: number;
  instructions?: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  isPublished: boolean;
  enrolledCount: number;
  createdAt?: string;
  updatedAt?: string;
  examTitle?: string;
  testTitle?: string;
  testSeriesTitle?: string;
}

export interface LiveTestParticipation {
  id: string;
  liveTestId: string;
  userId: string;
  attemptId?: string;
  joinedAt: string;
  status: 'joined' | 'started' | 'submitted' | 'abandoned';
  score?: number;
  accuracy?: number;
  rank?: number;
}

export interface MockTest {
  id: string;
  examId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  testSeriesId?: string;
  title: string;
  slug: string;
  description?: string;
  testType: 'chapter_mock' | 'full_mock' | 'subject_mock' | 'pyq' | 'topic';
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  /**
   * Test-level negative marking (marks deducted per wrong answer).
   * Applies ONLY to Full Mock ('full_mock') and PYQ ('pyq') tests, and is
   * OPTIONAL — 0 means the exam has no negative marking scheme.
   * Configured once at test creation time; questions never carry negatives.
   */
  negativeMarking: number;
  isPremium: boolean;
  year?: number;
  paperName?: string;
  shift?: string;
  setName?: string;
  examDate?: string;
  associatedExamIds?: string[];
  orderIndex: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  examTitle?: string;
  subjectName?: string;
  chapterName?: string;
  topicName?: string;
  testSeriesTitle?: string;
}

export interface Question {
  id: string;
  chapterId?: string;
  topicId?: string;
  subjectId?: string;
  questionText: string;
  questionBengaliText?: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanationBengali?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  defaultMarks: number;
  /**
   * Legacy column only — questions NEVER carry negative marks.
   * Always 0 for new questions; scoring uses the test-level scheme.
   */
  defaultNegativeMarks: number;
  questionType?: string;
  sourceType?: 'topic' | 'pyq' | 'other';
  sourceYear?: number;
  sourceExam?: string;
  sourcePaper?: string;
  sourceShift?: string;
  isActive: boolean;
  status?: 'active' | 'archived' | 'draft';
  subjectName?: string;
  chapterName?: string;
  topicName?: string;
  testId?: string;
  testTitle?: string;
}

export interface AdminDashboardStats {
  totalExams: number;
  activeExams: number;
  totalSubjects: number;
  totalChapters: number;
  totalTestSeries: number;
  totalTests: number;
  publishedTests: number;
  draftTests: number;
  archivedTests: number;
  totalQuestions: number;
  activeQuestions: number;
  totalAttempts: number;
  completedAttempts: number;
  totalStudents: number;
}

export interface TestQuestionAssignment {
  questionId: string;
  questionOrder: number;
  marks: number;
  negativeMarks: number;
  questionText?: string;
  questionBengaliText?: string;
  imageUrl?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  explanation?: string;
  explanationBengali?: string;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
}

export interface PublishValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Sanitized question returned to student during active exam */
export interface StudentTestQuestion {
  id: string;
  questionOrder: number;
  questionText: string;
  questionBengaliText?: string;
  imageUrl?: string;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  negativeMarks: number;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
}

export interface AttemptAnswerState {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
}

export interface StudentAttemptExportRow {
  rank: number;
  candidateName: string;
  email: string;
  phone?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentMinutes: string;
  attemptDate: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  testTitle?: string;
  examTitle?: string;
  subjectName?: string;
  chapterName?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  isPremium?: boolean;
  testType?: 'chapter_mock' | 'full_mock' | 'subject_mock' | 'pyq' | 'topic';
  year?: number;
  attemptNumber?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startTime: string;
  endTime?: string;
  timeSpentSeconds: number;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  rank?: number | null;
  percentile?: number | null;
  createdAt: string;
}

export interface GradedResult {
  attemptId: string;
  testId: string;
  testTitle?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSeconds: number;
  rank: number | null;
  totalCandidates: number;
  percentile: number | null;
  passed: boolean;
}

export interface QuestionSolution {
  id: string;
  questionOrder: number;
  questionText: string;
  questionBengaliText?: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
  explanationBengali?: string;
  isBookmarked?: boolean;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
}

export interface MistakeItem {
  id: string;
  userId: string;
  questionId: string;
  question: Question;
  wrongCount: number;
  isResolved: boolean;
  lastReviewedAt?: string;
  createdAt: string;
  examTitle?: string;
  subjectName?: string;
  chapterName?: string;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  questionId: string;
  question: Question;
  note?: string;
  createdAt: string;
  examTitle?: string;
  subjectName?: string;
  chapterName?: string;
}

export interface SubscriptionPlan {
  id: string;
  name?: string;
  title: string;
  description?: string;
  durationDays: number;
  price: number;
  originalPrice?: number;
  currency: string;
  features: string[];
  isActive: boolean;
  orderIndex: number;
}

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'failed';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  userId: string;
  planId?: string;
  planTitle?: string;
  amount: number;
  currency: string;
  gateway: string;
  orderId?: string;
  razorpayOrderId?: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  paymentId: string;
  planId: string;
  planTitle: string;
  amount: number;
  currency: string;
  durationDays: number;
  keyId: string;
  isRealRazorpayOrder?: boolean;
}

export interface RazorpayVerificationPayload {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
}

export interface StudentSubscriptionDetails {
  hasSubscription: boolean;
  isActive: boolean;
  status: SubscriptionStatus | 'none';
  subscriptionId?: string;
  planId?: string;
  planTitle?: string;
  startsAt?: string;
  expiresAt?: string;
  daysRemaining?: number;
}

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  planId: string;
  planTitle: string;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  paymentId?: string;
  daysRemaining: number;
  createdAt: string;
}

export interface AdminPaymentRow {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  planId?: string;
  planTitle?: string;
  amount: number;
  currency: string;
  gateway: string;
  orderId?: string;
  razorpayOrderId?: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
  created_at?: string;
}

export interface AdminBatch {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  created_at?: string;
}

export interface RevenueTrendPoint {
  date: string;
  label: string;
  amount: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'payment' | 'registration' | 'test_created' | 'exam_created' | string;
  description: string;
  timestamp: string;
}

export interface AdminDashboardV2Stats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  revenueTrend: RevenueTrendPoint[];
  totalStudents: number;
  newStudents: number;
  activeStudents: number;
  freeStudents: number;
  proStudents: number;
  activeSubscriptions: number;
  totalExams: number;
  totalTests: number;
  topicTests: number;
  fullMockTests: number;
  pyqTests: number;
  totalQuestions: number;
  topicQuestions: number;
  fullMockQuestions: number;
  pyqQuestions: number;
  recentActivity: AdminActivityItem[];
}

export interface AdminStudentRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  planTitle?: string;
  planId?: string;
  subscriptionStatus?: 'active' | 'expired' | 'none' | string;
  isPro: boolean;
  expiresAt?: string;
  subscriptionExpiresAt?: string;
  totalAttempts?: number;
  testsCompleted?: number;
  lastActive?: string;
}

export interface AdminStudentDetails extends AdminStudentRow {
  recentAttempts: TestAttempt[];
  paymentHistory: AdminPaymentRow[];
  subscriptionHistory: AdminSubscriptionRow[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'free' | 'pro' | 'free_users' | 'pro_users' | string;
  channel: 'in_app' | 'push' | 'both';
  status: 'draft' | 'sent' | 'scheduled';
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SupportTicketItem {
  id: string;
  userId?: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  issue: string;
  category:
    | 'Account Issue'
    | 'Payment Issue'
    | 'Subscription Issue'
    | 'Test Issue'
    | 'Result Issue'
    | 'Technical Issue'
    | 'Other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettingItem {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description?: string;
  updatedAt: string;
}

export interface CouponItem {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  applicablePlanId?: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponUsageItem {
  id: string;
  couponId: string;
  userId?: string;
  paymentId?: string;
  orderAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  message: string;
}

export interface AdminAuditLog {
  id: string;
  adminId?: string;
  adminEmail: string;
  adminName?: string;
  adminRole: AdminRole;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminStaffMember {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  role: UserRole;
  adminRole: AdminRole;
  createdAt: string;
  updatedAt?: string;
}

// ─── Item Analysis (Question Accuracy & Difficulty Psychometrics) ────
export type EmpiricalDifficulty = 'very_easy' | 'easy' | 'moderate' | 'hard' | 'extreme';

export interface QuestionItemAnalysis {
  questionId: string;
  questionText: string;
  questionBengali?: string;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  examId?: string;
  examTitle?: string;
  testId?: string;
  testTitle?: string;
  declaredDifficulty: 'easy' | 'medium' | 'hard';
  empiricalDifficulty: EmpiricalDifficulty;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracyRate: number; // percentage 0 to 100
  failureRate: number; // percentage 0 to 100
  avgTimeSpentSeconds: number; // average seconds
  isHighFailure: boolean; // failureRate >= 80% (>= 80% wrong answers)
  isTimeTrap: boolean; // avgTimeSpentSeconds >= 90s
  isMisclassified: boolean; // declared difficulty does not match student empirical difficulty
  optionDistribution: {
    A: number; // percentage (0 - 100)
    B: number;
    C: number;
    D: number;
  };
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D' | string;
  explanation?: string;
}

export interface ItemAnalysisFilterOptions {
  filterType?: 'all' | 'high_failure' | 'time_traps' | 'misclassified' | 'hardest' | 'easiest';
  preset?: 'all' | 'high_failure' | 'time_traps' | 'misclassified' | 'hardest' | 'easiest';
  subjectId?: string;
  chapterId?: string;
  examId?: string;
  testId?: string;
  searchQuery?: string;
  minAttempts?: number;
}

// ─── Custom Date-Range Revenue Analytics ─────────────────────────────
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | 'last_7_days'
  | 'this_month'
  | '30d'
  | 'last_30_days'
  | 'this_year'
  | 'custom';

export interface DateRangeDailyPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "14 Jan"
  amount: number;
  transactions: number;
  transactionCount?: number;
  signups: number;
}

export interface DateRangeRevenueStats {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset: DateRangePreset;
  totalRevenue: number;
  totalTransactions: number;
  transactionCount?: number;
  avgOrderValue: number;
  averageOrderValue?: number;
  newStudentSignups: number;
  newSignupsCount?: number;
  label?: string;
  dailyTrend: DateRangeDailyPoint[];
}

// ─── Payment Gateway Admin Configuration ─────────────────────────────
export interface PaymentGatewayConfig {
  gateway: string;
  keyId: string;
  isActive: boolean;
  hasSecret: boolean;
  secretPreview?: string | null;
  hasWebhookSecret: boolean;
  webhookPreview?: string | null;
  updatedAt?: string | null;
}

export interface PaymentGatewayUpdatePayload {
  gateway?: string;
  keyId: string;
  keySecret?: string;
  webhookSecret?: string;
  isActive?: boolean;
}

// ─── Platform Analytics & Reports Overview ───────────────────────────
export interface StudentRankRow {
  rank: number;
  userId: string;
  name: string;
  email: string;
  totalTests: number;
  questionsAttempted: number;
  correctCount: number;
  accuracy: number; // e.g. 82.5
  totalScore: number;
  isPro?: boolean;
  lastActive?: string;
}

export interface QuestionInsightRow {
  questionId: string;
  questionText: string;
  questionBengaliText?: string;
  subjectName: string;
  chapterName: string;
  difficulty?: string;
  totalAttempts: number;
  wrongCount: number;
  failureRate: number; // percentage, e.g. 75.0
  accuracyRate: number; // percentage, e.g. 25.0
}

export interface TopicInsightRow {
  chapterId: string;
  chapterName: string;
  subjectName: string;
  totalQuestionsAttempted: number;
  accuracyRate: number; // percentage, e.g. 42.1
}

export interface SubjectInsightRow {
  subjectId: string;
  subjectName: string;
  totalQuestionsAttempted: number;
  accuracyRate: number; // percentage, e.g. 54.3
}

export interface PerformanceTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "15 Sep"
  attemptsCount: number;
  averageAccuracy: number;
  averageScore: number;
}

export interface PlatformAnalyticsData {
  studentPerformance: {
    totalStudents: number;
    activeStudents: number;
    testsAttempted: number;
    questionsAnswered: number;
    overallAccuracy: number;
    topStudent?: StudentRankRow;
    performanceTrend: PerformanceTrendPoint[];
  };
  studentRankings: StudentRankRow[];
  questionInsights: {
    mostWrongQuestions: QuestionInsightRow[];
    weakestTopics: TopicInsightRow[];
    weakestSubjects: SubjectInsightRow[];
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    paidStudents: number;
    activeSubscriptions: number;
    revenueTrend: DateRangeDailyPoint[];
  };
}

export type BannerThemeColor = 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
export type BannerAudience = 'all' | 'free' | 'pro';
export type BannerPlacement = 'home_hero' | 'catalog' | 'all';

export interface HeroBanner {
  id: string;
  badgeText?: string;
  title: string;
  highlightWord?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  featurePills?: string[];
  imageUrl?: string;
  mobileImageUrl?: string;
  bannerType?: 'full_image' | 'text_overlay';
  themeGradient?: BannerThemeColor;
  targetAudience?: BannerAudience;
  placement?: BannerPlacement;
  startsAt?: string;
  expiresAt?: string;
  clickCount?: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

