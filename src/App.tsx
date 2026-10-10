import { AppRouteLoadingFallback } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from '@/components/layout/ProtectedRoute';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

// Public SEO Pages (no auth required, Google-indexable)
const QuestionPage = lazyWithRetry(() =>
  import('@/pages/public/QuestionPage').then((module) => ({ default: module.QuestionPage }))
);
const QuestionsListing = lazyWithRetry(() =>
  import('@/pages/public/QuestionsListing').then((module) => ({
    default: module.QuestionsListing,
  }))
);
const SitemapPage = lazyWithRetry(() =>
  import('@/pages/public/SitemapPage').then((module) => ({ default: module.SitemapPage }))
);

const Landing = lazyWithRetry(() =>
  import('@/pages/Landing').then((module) => ({ default: module.Landing }))
);
const Home = lazyWithRetry(() =>
  import('@/pages/student/Home').then((module) => ({ default: module.Home }))
);
const TestSeriesCatalog = lazyWithRetry(() =>
  import('@/pages/student/TestSeriesCatalog').then((module) => ({
    default: module.TestSeriesCatalog,
  }))
);
const TestSeriesDetail = lazyWithRetry(() =>
  import('@/pages/student/TestSeriesDetail').then((module) => ({
    default: module.TestSeriesDetail,
  }))
);
const ExamDetail = lazyWithRetry(() =>
  import('@/pages/student/ExamDetail').then((module) => ({ default: module.ExamDetail }))
);
const ExamOrTestDispatcher = lazyWithRetry(() =>
  import('@/pages/student/ExamOrTestDispatcher').then((module) => ({
    default: module.ExamOrTestDispatcher,
  }))
);
const TestRunner = lazyWithRetry(() =>
  import('@/pages/student/TestRunner').then((module) => ({ default: module.TestRunner }))
);
const TestResult = lazyWithRetry(() =>
  import('@/pages/student/TestResult').then((module) => ({ default: module.TestResult }))
);
const TestSolutions = lazyWithRetry(() =>
  import('@/pages/student/TestSolutions').then((module) => ({ default: module.TestSolutions }))
);
const Practice = lazyWithRetry(() =>
  import('@/pages/student/Practice').then((module) => ({ default: module.Practice }))
);
const MyTests = lazyWithRetry(() =>
  import('@/pages/student/MyTests').then((module) => ({ default: module.MyTests }))
);
const Profile = lazyWithRetry(() =>
  import('@/pages/student/Profile').then((module) => ({ default: module.Profile }))
);
const Settings = lazyWithRetry(() =>
  import('@/pages/student/Settings').then((module) => ({ default: module.Settings }))
);
const Subscription = lazyWithRetry(() =>
  import('@/pages/student/Subscription').then((module) => ({ default: module.Subscription }))
);
const Support = lazyWithRetry(() =>
  import('@/pages/student/Support').then((module) => ({ default: module.Support }))
);
const SavedQuestions = lazyWithRetry(() =>
  import('@/pages/student/SavedQuestions').then((module) => ({ default: module.SavedQuestions }))
);
const AudioBooks = lazyWithRetry(() =>
  import('@/pages/student/AudioBooks').then((module) => ({ default: module.AudioBooks }))
);
const Rank = lazyWithRetry(() =>
  import('@/pages/student/Rank').then((module) => ({ default: module.Rank }))
);
const LiveTest = lazyWithRetry(() =>
  import('@/pages/student/LiveTest').then((module) => ({ default: module.LiveTest }))
);
const Onboarding = lazyWithRetry(() =>
  import('@/pages/student/Onboarding').then((module) => ({ default: module.Onboarding }))
);
const Login = lazyWithRetry(() =>
  import('@/pages/auth/Login').then((module) => ({ default: module.Login }))
);
const Register = lazyWithRetry(() =>
  import('@/pages/auth/Register').then((module) => ({ default: module.Register }))
);
const ForgotPassword = lazyWithRetry(() =>
  import('@/pages/auth/ForgotPassword').then((module) => ({ default: module.ForgotPassword }))
);
const ResetPassword = lazyWithRetry(() =>
  import('@/pages/auth/ResetPassword').then((module) => ({ default: module.ResetPassword }))
);
const TermsAndConditions = lazyWithRetry(() =>
  import('@/pages/legal/TermsAndConditions').then((module) => ({
    default: module.TermsAndConditions,
  }))
);
const PrivacyPolicy = lazyWithRetry(() =>
  import('@/pages/legal/PrivacyPolicy').then((module) => ({
    default: module.PrivacyPolicy,
  }))
);
const RefundPolicy = lazyWithRetry(() =>
  import('@/pages/legal/RefundPolicy').then((module) => ({
    default: module.RefundPolicy,
  }))
);
const ContactUs = lazyWithRetry(() =>
  import('@/pages/legal/ContactUs').then((module) => ({
    default: module.ContactUs,
  }))
);
const AdminDashboard = lazyWithRetry(() =>
  import('@/pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const AdminExams = lazyWithRetry(() =>
  import('@/pages/admin/AdminExams').then((module) => ({ default: module.AdminExams }))
);
const AdminBanners = lazyWithRetry(() =>
  import('@/pages/admin/AdminBanners').then((module) => ({ default: module.AdminBanners }))
);
const AdminTestSeries = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestSeries').then((module) => ({ default: module.AdminTestSeries }))
);
const AdminTests = lazyWithRetry(() =>
  import('@/pages/admin/AdminTests').then((module) => ({ default: module.AdminTests }))
);
const AdminTestQuestions = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestQuestions').then((module) => ({
    default: module.AdminTestQuestions,
  }))
);
const AdminSubscriptions = lazyWithRetry(() =>
  import('@/pages/admin/AdminSubscriptions').then((module) => ({
    default: module.AdminSubscriptions,
  }))
);

const AdminQuestionBank = lazyWithRetry(() =>
  import('@/pages/admin/AdminQuestionBank').then((module) => ({
    default: module.AdminQuestionBank,
  }))
);
const AdminNotifications = lazyWithRetry(() =>
  import('@/pages/admin/AdminNotifications').then((module) => ({
    default: module.AdminNotifications,
  }))
);
const AdminSupport = lazyWithRetry(() =>
  import('@/pages/admin/AdminSupport').then((module) => ({
    default: module.AdminSupport,
  }))
);
const AdminSettings = lazyWithRetry(() =>
  import('@/pages/admin/AdminSettings').then((module) => ({
    default: module.AdminSettings,
  }))
);
const AdminCoupons = lazyWithRetry(() =>
  import('@/pages/admin/AdminCoupons').then((module) => ({
    default: module.AdminCoupons,
  }))
);
const AdminStaff = lazyWithRetry(() =>
  import('@/pages/admin/AdminStaff').then((module) => ({
    default: module.AdminStaff,
  }))
);
const AdminAuditLogs = lazyWithRetry(() =>
  import('@/pages/admin/AdminAuditLogs').then((module) => ({
    default: module.AdminAuditLogs,
  }))
);
const AdminSubjects = lazyWithRetry(() =>
  import('@/pages/admin/AdminSubjects').then((module) => ({
    default: module.AdminSubjects,
  }))
);
const AdminTopics = lazyWithRetry(() =>
  import('@/pages/admin/AdminTopics').then((module) => ({
    default: module.AdminTopics,
  }))
);
const AdminStudents = lazyWithRetry(() =>
  import('@/pages/admin/AdminStudents').then((module) => ({
    default: module.AdminStudents,
  }))
);
const AdminTestAttempts = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestAttempts').then((module) => ({
    default: module.AdminTestAttempts,
  }))
);
const AdminRankings = lazyWithRetry(() =>
  import('@/pages/admin/AdminRankings').then((module) => ({
    default: module.AdminRankings,
  }))
);
const AdminDistrictRankings = lazyWithRetry(() =>
  import('@/pages/admin/AdminDistrictRankings').then((module) => ({
    default: module.AdminDistrictRankings,
  }))
);
const AdminPerformance = lazyWithRetry(() =>
  import('@/pages/admin/AdminPerformance').then((module) => ({
    default: module.AdminPerformance,
  }))
);
const AdminCutoff = lazyWithRetry(() =>
  import('@/pages/admin/AdminCutoff').then((module) => ({
    default: module.AdminCutoff,
  }))
);
const AdminPayments = lazyWithRetry(() =>
  import('@/pages/admin/AdminPayments').then((module) => ({
    default: module.AdminPayments,
  }))
);
const AdminSubscriptionPlans = lazyWithRetry(() =>
  import('@/pages/admin/AdminSubscriptionPlans').then((module) => ({
    default: module.AdminSubscriptionPlans,
  }))
);
const AdminAnalytics = lazyWithRetry(() =>
  import('@/pages/admin/AdminAnalytics').then((module) => ({
    default: module.AdminAnalytics,
  }))
);
const AdminLiveTests = lazyWithRetry(() =>
  import('@/pages/admin/AdminLiveTests').then((module) => ({
    default: module.AdminLiveTests,
  }))
);
const AdminBlog = lazyWithRetry(() =>
  import('@/pages/admin/AdminBlog').then((module) => ({
    default: module.AdminBlog,
  }))
);

/**
 * RootRoute:
 * - Always renders the public Landing Page at `/` — this is the first page
 *   every visitor sees, on mobile web and desktop web alike.
 * - Authenticated users reach their panel only via an explicit sign-in
 *   (`/login` -> `/dashboard` for students, `/admin` for admins) or via the
 *   Landing page CTA. There is intentionally NO auto-redirect to a dashboard.
 */
const RootRoute: React.FC = () => {
  return <Landing />;
};

export const App: React.FC = () => {
  return (
    <React.Suspense fallback={<AppRouteLoadingFallback />}>
      <Routes>
        {/* Root Route (public Landing Page for guests and signed-in users alike) */}
        <Route path="/" element={<RootRoute />} />
        {/* Legacy alias: canonical landing URL is `/` */}
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Student App Layout Routes (Standard Navbar & Bottom Nav) */}
        <Route element={<AppLayout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="home" element={<Navigate to="/dashboard" replace />} />
          <Route path="app" element={<Navigate to="/dashboard" replace />} />

          {/* Test Series Hub & Catalog */}
          <Route path="test-series" element={<TestSeriesCatalog />} />
          <Route path="test-series/:seriesId" element={<TestSeriesDetail />} />

          {/* Exams Hub & Catalog (Redirected to Test Series & backwards-compatible) */}
          <Route path="exams" element={<Navigate to="/test-series" replace />} />
          <Route path="exams/:id" element={<ExamOrTestDispatcher />} />
          <Route path="exams/:examId/full-mock" element={<ExamDetail />} />
          <Route path="exams/:examId/pyq" element={<ExamDetail />} />
          <Route path="exams/:examId/topic-tests" element={<ExamDetail />} />

          {/* Legacy redirects */}
          <Route path="tests" element={<Navigate to="/test-series" replace />} />
          <Route path="tests/*" element={<Navigate to="/test-series" replace />} />
          <Route path="my-tests" element={<Navigate to="/results" replace />} />
          <Route path="my-tests/*" element={<Navigate to="/results" replace />} />

          <Route
            path="exams/:testId/results/:attemptId"
            element={
              <ProtectedRoute>
                <TestResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="exams/:testId/solutions/:attemptId"
            element={
              <ProtectedRoute>
                <TestSolutions />
              </ProtectedRoute>
            }
          />
          <Route path="practice" element={<Practice />} />
          <Route path="practice/*" element={<Practice />} />
          <Route
            path="live-test"
            element={
              <ProtectedRoute>
                <LiveTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="results"
            element={
              <ProtectedRoute>
                <MyTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="results/*"
            element={
              <ProtectedRoute>
                <MyTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="saved-questions"
            element={
              <ProtectedRoute>
                <SavedQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="audio-books"
            element={
              <ProtectedRoute>
                <AudioBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="rank"
            element={
              <ProtectedRoute>
                <Rank />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaderboard"
            element={
              <ProtectedRoute>
                <Rank />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="subscription" element={<Subscription />} />
          <Route
            path="support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Standalone Fullscreen Test Runner (Distraction-free, dedicated exam header) */}
        <Route
          path="/exams/:testId/runner"
          element={
            <ProtectedRoute>
              <TestRunner />
            </ProtectedRoute>
          }
        />

        {/* Public SEO Question Pages (Google-indexable, no auth) */}
        <Route path="/questions" element={<QuestionsListing />} />
        <Route path="/questions/:questionId/:slug" element={<QuestionPage />} />
        <Route path="/questions/:questionId" element={<QuestionPage />} />
        <Route path="/sitemap" element={<SitemapPage />} />

        {/* Auth Public-Only Routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public Legal & Compliance Routes (Razorpay & Statutory Policies) */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/cancellation-refund" element={<RefundPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/refunds" element={<RefundPolicy />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* 1. DASHBOARD */}
          <Route index element={<AdminDashboard />} />

          {/* 2. CONTENT */}
          <Route
            path="question-bank"
            element={
              <AdminRoute requiredPermission="canManageQuestions">
                <AdminQuestionBank />
              </AdminRoute>
            }
          />
          <Route
            path="test-series"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestSeries />
              </AdminRoute>
            }
          />
          <Route
            path="mock-tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTests />
              </AdminRoute>
            }
          />
          <Route
            path="tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTests />
              </AdminRoute>
            }
          />
          <Route
            path="tests/:testId/questions"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="test-questions"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="test-questions/:testId"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="exams"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminExams />
              </AdminRoute>
            }
          />
          <Route
            path="subjects"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminSubjects />
              </AdminRoute>
            }
          />
          <Route
            path="topics"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminTopics />
              </AdminRoute>
            }
          />
          <Route
            path="live-tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminLiveTests />
              </AdminRoute>
            }
          />
          <Route
            path="banners"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminBanners />
              </AdminRoute>
            }
          />
          <Route
            path="blog"
            element={
              <AdminRoute requiredPermission="canManageSettings">
                <AdminBlog />
              </AdminRoute>
            }
          />

          {/* 3. STUDENTS */}
          <Route
            path="students"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminStudents />
              </AdminRoute>
            }
          />
          <Route
            path="test-attempts"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestAttempts />
              </AdminRoute>
            }
          />
          <Route
            path="subscriptions"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminSubscriptions />
              </AdminRoute>
            }
          />

          {/* 4. RANK & PERFORMANCE */}
          <Route
            path="rankings"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminRankings />
              </AdminRoute>
            }
          />
          <Route
            path="district-rankings"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminDistrictRankings />
              </AdminRoute>
            }
          />
          <Route
            path="performance"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminPerformance />
              </AdminRoute>
            }
          />
          <Route
            path="cutoff"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminCutoff />
              </AdminRoute>
            }
          />

          {/* 5. COMMERCE */}
          <Route
            path="payments"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminPayments />
              </AdminRoute>
            }
          />
          <Route
            path="subscription-plans"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminSubscriptionPlans />
              </AdminRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <AdminRoute requiredPermission="canManageCoupons">
                <AdminCoupons />
              </AdminRoute>
            }
          />

          {/* 6. COMMUNICATION */}
          <Route
            path="notifications"
            element={
              <AdminRoute requiredPermission="canManageNotifications">
                <AdminNotifications />
              </AdminRoute>
            }
          />
          <Route
            path="support"
            element={
              <AdminRoute requiredPermission="canManageSupport">
                <AdminSupport />
              </AdminRoute>
            }
          />

          {/* 7. ANALYTICS */}
          <Route
            path="analytics"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route path="analytics-insights" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="insights" element={<Navigate to="/admin/analytics" replace />} />

          {/* 8. SYSTEM */}
          <Route
            path="admins"
            element={
              <AdminRoute requiredPermission="canManageStaff">
                <AdminStaff />
              </AdminRoute>
            }
          />
          <Route
            path="staff"
            element={
              <AdminRoute requiredPermission="canManageStaff">
                <AdminStaff />
              </AdminRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <AdminRoute requiredPermission="canViewAuditLogs">
                <AdminAuditLogs />
              </AdminRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AdminRoute requiredPermission="canManageSettings">
                <AdminSettings />
              </AdminRoute>
            }
          />

          {/* Backward compatibility & Consolidation Aliases */}
          <Route path="overview" element={<Navigate to="/admin" replace />} />
          <Route path="questions" element={<Navigate to="/admin/question-bank" replace />} />
          <Route
            path="full-mock-questions"
            element={<Navigate to="/admin/question-bank" replace />}
          />
          <Route path="topic-manage" element={<Navigate to="/admin/topics" replace />} />
          <Route path="chapters" element={<Navigate to="/admin/topics" replace />} />
          <Route path="exam-topics" element={<Navigate to="/admin/topics" replace />} />
          <Route path="revenue" element={<Navigate to="/admin/payments" replace />} />
          <Route path="revenue-analytics" element={<Navigate to="/admin/payments" replace />} />
          <Route path="financials" element={<Navigate to="/admin/payments" replace />} />
          <Route path="item-analysis" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="discounts" element={<Navigate to="/admin/coupons" replace />} />
          <Route path="pro-users" element={<Navigate to="/admin/subscriptions" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};
