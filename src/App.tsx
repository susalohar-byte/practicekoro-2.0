import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from '@/components/layout/ProtectedRoute';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

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
const Rank = lazyWithRetry(() =>
  import('@/pages/student/Rank').then((module) => ({ default: module.Rank }))
);
const LiveTest = lazyWithRetry(() =>
  import('@/pages/student/LiveTest').then((module) => ({ default: module.LiveTest }))
);
const Flashcards = lazyWithRetry(() =>
  import('@/pages/student/Flashcards').then((module) => ({ default: module.Flashcards }))
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
const AdminTopicManage = lazyWithRetry(() =>
  import('@/pages/admin/AdminTopicManage').then((module) => ({ default: module.AdminTopicManage }))
);
const AdminExamTopics = lazyWithRetry(() =>
  import('@/pages/admin/AdminExamTopics').then((module) => ({ default: module.AdminExamTopics }))
);
const AdminTestSeries = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestSeries').then((module) => ({ default: module.AdminTestSeries }))
);
const AdminLiveTests = lazyWithRetry(() =>
  import('@/pages/admin/AdminLiveTests').then((module) => ({ default: module.AdminLiveTests }))
);
const AdminTests = lazyWithRetry(() =>
  import('@/pages/admin/AdminTests').then((module) => ({ default: module.AdminTests }))
);
const AdminTestQuestions = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestQuestions').then((module) => ({
    default: module.AdminTestQuestions,
  }))
);
const AdminFlashcards = lazyWithRetry(() =>
  import('@/pages/admin/AdminFlashcards').then((module) => ({ default: module.AdminFlashcards }))
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
const AdminItemAnalysis = lazyWithRetry(() =>
  import('@/pages/admin/AdminItemAnalysis').then((module) => ({
    default: module.AdminItemAnalysis,
  }))
);
const AdminRevenueAnalytics = lazyWithRetry(() =>
  import('@/pages/admin/AdminRevenueAnalytics').then((module) => ({
    default: module.AdminRevenueAnalytics,
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
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
            aria-label="Loading page"
          />
        </div>
      }
    >
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
          <Route path="live-test" element={<ProtectedRoute><LiveTest /></ProtectedRoute>} />
          <Route path="quick-revision" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="flashcards" element={<Navigate to="/quick-revision" replace />} />
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
          <Route path="leaderboard" element={<Navigate to="/rank" replace />} />
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
          {/* 1. Dashboard (Consolidated Home + Analytics) */}
          <Route index element={<AdminDashboard />} />

          {/* 2. Question Bank & Item Analysis */}
          <Route
            path="question-bank"
            element={
              <AdminRoute requiredPermission="canManageQuestions">
                <AdminQuestionBank />
              </AdminRoute>
            }
          />
          {/* Analytics & Reports */}
          <Route
            path="item-analysis"
            element={
              <AdminRoute requiredPermission="canManageQuestions">
                <AdminItemAnalysis />
              </AdminRoute>
            }
          />
          <Route
            path="revenue-analytics"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminRevenueAnalytics />
              </AdminRoute>
            }
          />
          <Route path="revenue" element={<Navigate to="/admin/revenue-analytics" replace />} />
          <Route path="financials" element={<Navigate to="/admin/revenue-analytics" replace />} />

          {/* 3. Manage Exams */}
          <Route
            path="exams"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminExams />
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
            path="exam-topics"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminExamTopics />
              </AdminRoute>
            }
          />

          {/* 4. Mock Test Management */}
          <Route
            path="tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTests />
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
            path="flashcards"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminFlashcards />
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

          {/* 5. Subscriptions & Pro Users */}
          <Route
            path="subscriptions"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminSubscriptions />
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
          <Route path="discounts" element={<Navigate to="/admin/coupons" replace />} />

          {/* 6. Team & Staff RBAC */}
          <Route
            path="staff"
            element={
              <AdminRoute requiredPermission="canManageStaff">
                <AdminStaff />
              </AdminRoute>
            }
          />

          {/* 7. Audit Trail Logs */}
          <Route
            path="audit-logs"
            element={
              <AdminRoute requiredPermission="canViewAuditLogs">
                <AdminAuditLogs />
              </AdminRoute>
            }
          />

          {/* 8. Notifications */}
          <Route
            path="notifications"
            element={
              <AdminRoute requiredPermission="canManageNotifications">
                <AdminNotifications />
              </AdminRoute>
            }
          />

          {/* 9. Support & Help */}
          <Route
            path="support"
            element={
              <AdminRoute requiredPermission="canManageSupport">
                <AdminSupport />
              </AdminRoute>
            }
          />

          {/* 10. Settings */}
          <Route
            path="settings"
            element={
              <AdminRoute requiredPermission="canManageSettings">
                <AdminSettings />
              </AdminRoute>
            }
          />

          {/* Backward compatibility & Consolidation Redirects */}
          <Route path="students" element={<Navigate to="/admin/subscriptions" replace />} />
          <Route path="pro-users" element={<Navigate to="/admin/subscriptions" replace />} />
          <Route path="analytics" element={<Navigate to="/admin/revenue-analytics" replace />} />
          <Route path="overview" element={<Navigate to="/admin" replace />} />
          <Route path="questions" element={<Navigate to="/admin/question-bank" replace />} />
          <Route
            path="full-mock-questions"
            element={<Navigate to="/admin/question-bank" replace />}
          />
          <Route
            path="subjects"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminTopicManage />
              </AdminRoute>
            }
          />
          <Route
            path="topic-manage"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminTopicManage />
              </AdminRoute>
            }
          />
          <Route path="topics" element={<Navigate to="/admin/topic-manage" replace />} />
          <Route path="chapters" element={<Navigate to="/admin/topic-manage" replace />} />
          <Route
            path="test-series"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestSeries />
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
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};
