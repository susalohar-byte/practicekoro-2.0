import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/navigation/main_scaffold.dart';
import '../../features/onboarding/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/exams/exam_selection_screen.dart';
import '../../features/exams/primary_exam_selection_screen.dart';
import '../../features/exams/exam_tests_screen.dart';
import '../../features/exams/test_details_screen.dart';
import '../../features/practice/topic_screen.dart';
import '../../features/test_runner/test_runner_screen.dart';
import '../../features/result_analytics/result_screen.dart';
import '../../features/result_analytics/analysis_screen.dart';
import '../../features/result_analytics/solutions_screen.dart';
import '../../features/profile/saved_questions_screen.dart';
import '../../features/profile/settings_screen.dart';
import '../../features/profile/support_screen.dart';
import '../../features/subscription/subscription_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../data/models/attempt_model.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    // 1. Splash Screen
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),

    // 2. Onboarding Screen
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),

    // 3. Login Screen
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),

    // 4. Exam Selection
    GoRoute(
      path: '/exam-selection',
      builder: (context, state) => const ExamSelectionScreen(),
    ),

    // 5. Primary Exam Selection
    GoRoute(
      path: '/primary-exam',
      builder: (context, state) {
        final initialId = state.extra as String?;
        return PrimaryExamSelectionScreen(initialExamId: initialId);
      },
    ),

    // 6. Home Screen (via MainScaffold tab 0)
    GoRoute(
      path: '/home',
      builder: (context, state) => const MainScaffold(initialIndex: 0),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const MainScaffold(initialIndex: 0),
    ),

    // 7. Test Series / Exams Screen (via MainScaffold tab 1)
    GoRoute(
      path: '/exams',
      builder: (context, state) => const MainScaffold(initialIndex: 1),
    ),
    GoRoute(
      path: '/test-series',
      builder: (context, state) => const MainScaffold(initialIndex: 1),
    ),

    // 8 & 9. Test Series Details & Test List Within Exam Series
    GoRoute(
      path: '/exams/:examId',
      builder: (context, state) {
        final examId = state.pathParameters['examId'] ?? 'wbp-constable';
        return ExamTestsScreen(examId: examId);
      },
    ),

    // 10. Test Details & Instructions Screen
    GoRoute(
      path: '/test-details/:testId',
      builder: (context, state) {
        final testId = state.pathParameters['testId'] ?? 'test-wbp-001';
        final title = state.uri.queryParameters['title'] ?? 'WBP Constable Full Mock Test 01';
        final isPro = state.uri.queryParameters['isPro'] == 'true';
        return TestDetailsScreen(
          testId: testId,
          testTitle: title,
          isPremium: isPro,
        );
      },
    ),

    // 11. Live Test Screen (Runner)
    GoRoute(
      path: '/live-test/:testId',
      builder: (context, state) {
        final testId = state.pathParameters['testId'] ?? 'test-wbp-001';
        return TestRunnerScreen(testId: testId);
      },
    ),

    // 12. Test Result Screen
    GoRoute(
      path: '/result/:attemptId',
      builder: (context, state) {
        final attemptId = state.pathParameters['attemptId'] ?? 'att-latest';
        return ResultScreen(attemptId: attemptId);
      },
    ),

    // 13. Detailed Analysis Screen
    GoRoute(
      path: '/analysis/:attemptId',
      builder: (context, state) {
        final attemptId = state.pathParameters['attemptId'] ?? 'att-latest';
        final attempt = state.extra as TestAttemptModel?;
        return AnalysisScreen(attemptId: attemptId, attempt: attempt);
      },
    ),

    // 14. Question Solution Review Screen
    GoRoute(
      path: '/solutions/:testId',
      builder: (context, state) {
        final testId = state.pathParameters['testId'] ?? 'test-wbp-001';
        final attempt = state.extra as TestAttemptModel?;
        return SolutionsScreen(testId: testId, attempt: attempt);
      },
    ),

    // 15, 16, 18, 20, 21. Practice Screen (via MainScaffold tab 2)
    GoRoute(
      path: '/practice',
      builder: (context, state) => const MainScaffold(initialIndex: 2),
    ),

    // 17. Topic Practice Screen
    GoRoute(
      path: '/practice/topics/:subjectId',
      builder: (context, state) {
        final subjectId = state.pathParameters['subjectId'] ?? 'math';
        return TopicScreen(subjectId: subjectId);
      },
    ),

    // 19. Saved Questions Screen
    GoRoute(
      path: '/saved-questions',
      builder: (context, state) => const SavedQuestionsScreen(),
    ),

    // 22. Results / Rank / Leaderboard Screen (via MainScaffold tab 3)
    GoRoute(
      path: '/results',
      builder: (context, state) => const MainScaffold(initialIndex: 3),
    ),
    GoRoute(
      path: '/leaderboard',
      builder: (context, state) => const MainScaffold(initialIndex: 3),
    ),
    GoRoute(
      path: '/rank',
      builder: (context, state) => const MainScaffold(initialIndex: 3),
    ),

    // 23. Profile Screen (via MainScaffold tab 4)
    GoRoute(
      path: '/profile',
      builder: (context, state) => const MainScaffold(initialIndex: 4),
    ),

    // 24. Subscription Screen
    GoRoute(
      path: '/subscription',
      builder: (context, state) => const SubscriptionScreen(),
    ),

    // 25. Settings Screen
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),

    // 26. Help & Support Screen
    GoRoute(
      path: '/support',
      builder: (context, state) => const SupportScreen(),
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    body: Center(
      child: Text('Page not found: ${state.uri}'),
    ),
  ),
);
