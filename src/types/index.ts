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

export type StudentCategoryCode =
  | 'GEN'
  | 'OBC_A'
  | 'OBC_B'
  | 'SC'
  | 'ST'
  | 'EWS'
  | 'PWD'
  | 'OTHER'
  | 'NOT_SPECIFIED';

export const CATEGORY_LABELS: Record<StudentCategoryCode, string> = {
  GEN: 'General / UR',
  OBC_A: 'OBC-A',
  OBC_B: 'OBC-B',
  SC: 'SC',
  ST: 'ST',
  EWS: 'EWS',
  PWD: 'PwD',
  OTHER: 'Other',
  NOT_SPECIFIED: 'Prefer not to say',
};

export type StudentGenderCode =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER'
  | 'NOT_SPECIFIED';

export const GENDER_LABELS: Record<StudentGenderCode, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  NOT_SPECIFIED: 'Prefer not to say',
};

export type PreparationStatusCode =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'REVISION';

export const PREPARATION_STATUS_LABELS: Record<PreparationStatusCode, string> = {
  BEGINNER: 'Beginner (Starting preparation)',
  INTERMEDIATE: 'Intermediate (Covering syllabus)',
  ADVANCED: 'Advanced (Mocks & Speed practice)',
  REVISION: 'Final Revision (Exam ready)',
};

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  district?: string;
  state?: string;
  dob?: string;
  gender?: StudentGenderCode;
  category?: StudentCategoryCode;
  targetExamId?: string;
  targetExamTitle?: string;
  preferredSubjects?: string[];
  preparationStatus?: PreparationStatusCode;
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
  isPopular?: boolean;
  popularOrder?: number;
  cardBadge?: string;
  cardGradientStart?: string;
  cardGradientEnd?: string;
  cardBgImage?: string;
  cardEmblemUrl?: string;
  cardArrowColor?: string;
}

export interface PopularExamCard {
  id: string;
  examId?: string;
  title: string;
  slug?: string;
  testsCount: string;
  cardBadge?: string;
  cardGradientStart: string;
  cardGradientEnd: string;
  cardBgImage?: string;
  cardEmblemUrl?: string;
  cardArrowColor?: string;
  orderIndex: number;
  route: string;
  isActive?: boolean;
}

export interface PopularTestSeriesCard {
  id: string;
  testSeriesId?: string;
  title: string;
  subtitle?: string; // e.g. "Complete Test Series"
  cardGradientStart: string;
  cardGradientEnd: string;
  cardArrowColor?: string;
  cardBgImage?: string;
  cardLogoUrl?: string;
  orderIndex: number;
  route?: string;
  isActive?: boolean;
  fullMockCount?: number;
  topicTestCount?: number;
  pyqTestCount?: number;
  badgeText?: string;
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
  iconName?: string;
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

export type TestSeriesStatus = 'published' | 'draft' | 'under_review' | 'archived';

export interface TestSeries {
  id: string;
  examId: string;
  title: string;
  subtitle?: string;
  slug: string;
  description?: string;
  isPremium: boolean;
  orderIndex: number;
  isActive: boolean;
  status?: TestSeriesStatus;
  isFeatured?: boolean;
  iconUrl?: string;
  bannerUrl?: string;
  createdAt?: string;
  examTitle?: string;
  examCategory?: string;
  isPopular?: boolean;
  testCount?: number;
  testsCount?: number;
  fullMockCount?: number;
  topicTestCount?: number;
  pyqTestCount?: number;
  enrollmentCount?: number;
  avgCompletion?: number;
  avgAccuracy?: number;
}

export type SeriesTestCategory = 'full_mock' | 'pyq' | 'topic_test' | 'live_test';

export interface TestSeriesAttemptHistory {
  attemptId: string;
  testId: string;
  testTitle: string;
  testType: SeriesTestCategory;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  negativeMarks: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface TestSeriesAnalytics {
  totalTests: number;
  testsAttempted: number;
  overallScorePercent: number;
  averageScorePercent: number;
  accuracyPercent: number;
  bestScorePercent: number;
  completionPercent: number;
  testTypeBreakdown: Array<{
    type: SeriesTestCategory;
    testsAttempted: number;
    averageScorePercent: number;
    bestScorePercent: number;
    accuracyPercent: number;
  }>;
  trend: Array<{
    attemptId: string;
    testTitle: string;
    percentage: number;
    completedAt: string;
  }>;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    questionsAttempted: number;
    correctCount: number;
    accuracyPercent: number;
  }>;
  weakTopics: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    questionsAttempted: number;
    accuracyPercent: number;
  }>;
  history: TestSeriesAttemptHistory[];
}

export type LiveTestStatus =
  'upcoming' | 'live' | 'ended' | 'cancelled' | 'draft' | 'scheduled' | 'completed' | 'archived';

export interface LiveTest {
  id: string;
  testId: string;
  startAt: string;
  registrationDeadline?: string | null;
  status: LiveTestStatus;
  rankingEnabled: boolean;
  subscriptionRequired: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Inherited from source MockTest or joined relations
  test?: MockTest | null;
  title?: string;
  examId?: string;
  testSeriesId?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  negativeMarking?: number;
  instructions?: string;
  enrolledCount?: number;
  participantsCount?: number;
  isPublished?: boolean;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  examTitle?: string;
  testTitle?: string;
  testSeriesTitle?: string;
  logo?: string;
  examLogo?: string;
  userParticipant?: LiveTestParticipant | null;
}

export type LiveParticipantStatus =
  'registered' | 'started' | 'completed' | 'abandoned' | 'joined' | 'submitted' | 'cancelled';

export interface LiveTestParticipant {
  id: string;
  liveTestId: string;
  userId: string;
  registeredAt: string;
  joinedAt?: string | null;
  completedAt?: string | null;
  status: LiveParticipantStatus;
  attemptId?: string | null;
  score?: number | null;
  accuracy?: number | null;
  timeTaken?: number | null;
  rank?: number | null;
  fullName?: string;
  avatarUrl?: string;
  district?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Backward-compatible alias for earlier code
export type LiveTestParticipation = LiveTestParticipant;

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
   * Applies to this test only; 0 means no negative marking.
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
  status?: 'active' | 'archived' | 'draft' | 'published' | 'under_review';
  subjectName?: string;
  chapterName?: string;
  topicName?: string;
  testId?: string;
  testTitle?: string;
  uploadMode?: 'exam' | 'subject';
  subtopic?: string;
  section?: string;
  shortNotes?: string;
  tags?: string[];
  versionHistory?: { version: number; editedBy: string; editedAt: string; changes: string }[];
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
  testSeriesId?: string;
  examId?: string;
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

export interface AttemptRankings {
  testSeries: {
    id: string | null;
    name: string | null;
    score: number;
    totalMarks: number;
    rank: number | null;
    participants: number;
  };
  district: {
    name: string | null;
    rank: number | null;
    participants: number;
  };
  westBengal: {
    rank: number | null;
    participants: number;
  };
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

export interface ProcessRefundRequest {
  paymentId: string;
  refundAmount: number;
  refundReason: string;
  refundMode: 'gateway' | 'manual';
  refundId?: string;
  revokeSubscription?: boolean;
  notes?: string;
}

export interface ProcessRefundResponse {
  success: boolean;
  refundId?: string;
  refundAmount?: number;
  status?: string;
  revokedSubscription?: boolean;
  error?: string;
  gatewayResponse?: any;
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
  testsAttempted?: number;
  questionsAnswered?: number;
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
  gender?: StudentGenderCode;
  category?: StudentCategoryCode;
  district?: string;
  state?: string;
  targetExamTitle?: string;
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

// ============================================================================
// CUTOFF SYSTEM ARCHITECTURE (COMPETITIVE EXAMINATIONS)
// ============================================================================

export type CutoffType = 'OFFICIAL' | 'EXPECTED';

export type RecruitmentStage =
  | 'Preliminary'
  | 'Written Examination'
  | 'CBT'
  | 'Physical Test'
  | 'PMT / PET'
  | 'Final Written'
  | 'Final Merit'
  | 'Document Verification'
  | 'Other';

export const ALL_RECRUITMENT_STAGES: RecruitmentStage[] = [
  'Preliminary',
  'Written Examination',
  'CBT',
  'Physical Test',
  'PMT / PET',
  'Final Written',
  'Final Merit',
  'Document Verification',
  'Other',
];

export type CutoffScoreType =
  | 'raw_marks'
  | 'normalized'
  | 'percentage'
  | 'score'
  | 'rank';

export const SCORE_TYPE_LABELS: Record<CutoffScoreType, string> = {
  raw_marks: 'Raw Marks',
  normalized: 'Normalized Marks',
  percentage: 'Percentage (%)',
  score: 'Score Points',
  rank: 'Rank Cutoff Threshold',
};

export type CutoffGenderScope = 'ALL' | 'MALE' | 'FEMALE';

export type VerificationStatus = 'Verified' | 'Pending Verification';

export type SourceType =
  | 'Official Notification'
  | 'Official Result'
  | 'Official Recruitment Board'
  | 'PracticeKoro Academic Panel'
  | 'Other Verified Source';

export const SOURCE_TYPE_OPTIONS: SourceType[] = [
  'Official Notification',
  'Official Result',
  'Official Recruitment Board',
  'PracticeKoro Academic Panel',
  'Other Verified Source',
];

export interface ExamCutoffConfig {
  examId: string;
  examTitle: string;
  categoryEnabled: boolean;
  genderEnabled: boolean;
  districtEnabled: boolean;
  stageEnabled: boolean;
  allowedStages: RecruitmentStage[];
  defaultScoreType: CutoffScoreType;
  defaultMaxMarks: number;
}

export interface CutoffRecord {
  id: string;
  examId: string;
  examTitle: string;
  year: number;
  stage: RecruitmentStage;
  cutoffType: CutoffType; // 'OFFICIAL' vs 'EXPECTED'
  category: StudentCategoryCode;
  gender: CutoffGenderScope; // 'ALL' | 'MALE' | 'FEMALE'
  district?: string; // 'ALL' or specific West Bengal district
  scoreType: CutoffScoreType;
  maxMarks: number;
  cutoffMarks: number;
  percentage?: number;
  negativeMarking?: number;
  sourceType: SourceType;
  source: string;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentApplicableCutoff {
  examId: string;
  examTitle: string;
  studentCategory: StudentCategoryCode;
  studentGender: StudentGenderCode;
  isGenderApplicable: boolean;
  isDistrictApplicable: boolean;
  expectedCutoff: CutoffRecord | null;
  previousOfficialCutoff: CutoffRecord | null;
  historicalOfficialCutoffs: CutoffRecord[];
}

export type BlogPostStatus = 'published' | 'draft' | 'scheduled' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  status: BlogPostStatus;
  isFeatured: boolean;
  thumbnail: string;
  views: number;
  uniqueViews: number;
  likes: number;
  comments: number;
  shares: number;
  readTime: string;
  publishedAt: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  tags?: string[];
}


