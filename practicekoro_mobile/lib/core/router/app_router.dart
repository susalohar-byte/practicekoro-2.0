import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/navigation/main_scaffold.dart';
import '../../features/exams/exams_catalog_screen.dart';
import '../../features/onboarding/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/exams/exam_selection_screen.dart';
import '../../features/exams/test_series_detail_screen.dart';
import '../../features/exams/test_details_screen.dart';
import '../../features/practice/subject_detail_screen.dart';
import '../../features/practice/topic_detail_screen.dart';
import '../../features/practice/topic_test_start_screen.dart';
import '../../features/practice/topic_test_runner_screen.dart';
import '../../features/practice/topic_test_result_screen.dart';
import '../../features/practice/topic_review_questions_screen.dart';
import '../../features/practice/individual_question_review_screen.dart';
import '../../features/test_runner/test_runner_screen.dart';
import '../../features/result_analytics/result_screen.dart';
import '../../features/result_analytics/analysis_screen.dart';
import '../../features/result_analytics/solutions_screen.dart';
import '../../features/profile/saved_questions_screen.dart';
import '../../features/profile/settings_screen.dart';
import '../../features/profile/support_screen.dart';
import '../../features/subscription/subscription_screen.dart';
import '../../features/subscription/payment_screen.dart';
import '../../features/notifications/notification_screen.dart';
import '../../features/leaderboard/leaderboard_screen.dart';
import '../../features/audio_books/audio_books_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/auth_callback_screen.dart';
import '../../data/models/attempt_model.dart';

class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier() {
    try {
      Supabase.instance.client.auth.onAuthStateChange.listen((_) {
        notifyListeners();
      });
    } catch (_) {}
  }
}

final _authRefreshNotifier = _AuthRefreshNotifier();

final appRouter = GoRouter(
  initialLocation: kIsWeb ? '/home' : '/splash',
  refreshListenable: _authRefreshNotifier,
  redirect: (context, state) {
    User? currentUser;
    try {
      currentUser = Supabase.instance.client.auth.currentUser;
    } catch (_) {
      currentUser = null;
    }

    final location = state.matchedLocation;

    // Allow OAuth callback deep links to process without premature redirects
    if (location == '/login-callback' ||
        location == '/auth/mobile-callback' ||
        location == '/app/login-callback') {
      if (currentUser != null) {
        return '/home';
      }
      return null;
    }

    final requiresAuthentication =
        location.startsWith('/live-test/') ||
        location.startsWith('/result/') ||
        location.startsWith('/analysis/') ||
        location.startsWith('/solutions/') ||
        location == '/test-runner' ||
        location.startsWith('/test-runner') ||
        location.contains('/runner') ||
        location == '/payment' ||
        location.startsWith('/practice/test-runner') ||
        location.startsWith('/practice/test-start') ||
        location == '/results' ||
        location == '/profile' ||
        location == '/saved-questions' ||
        location == '/settings' ||
        location == '/support';

    if (requiresAuthentication && currentUser == null) {
      final redirect = Uri.encodeComponent(state.uri.toString());
      return '/login?redirect=$redirect';
    }
    if (location == '/login' && currentUser != null) {
      return '/home';
    }
    return null;
  },
  routes: [
    GoRoute(path: '/', redirect: (context, state) => '/home'),
    // 1. Splash Screen
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),

    // 2. Onboarding Screen
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),

    // 3. Login Screen
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),

    // 3.1 OAuth & Deep Link Callback Routes
    GoRoute(
      path: '/login-callback',
      builder: (context, state) => const AuthCallbackScreen(),
    ),
    GoRoute(
      path: '/auth/mobile-callback',
      builder: (context, state) => const AuthCallbackScreen(),
    ),
    GoRoute(
      path: '/app/login-callback',
      builder: (context, state) => const AuthCallbackScreen(),
    ),

    // 4. Exam Selection
    GoRoute(
      path: '/exam-selection',
      builder: (context, state) =>
          ExamSelectionScreen(isProfileChange: state.extra == 'profile'),
    ),

    // Legacy duplicate selector route: target exam selection happens once in
    // onboarding and can be changed later from Profile.
    GoRoute(path: '/primary-exam', redirect: (context, state) => '/home'),

    // 6. Home Screen (via MainScaffold tab 0)
    GoRoute(
      path: '/home',
      builder: (context, state) => const MainScaffold(initialIndex: 0),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const MainScaffold(initialIndex: 0),
    ),

    // 7. Test Series / Exams Screen (via MainScaffold tab 1 or filtered standalone)
    GoRoute(
      path: '/exams',
      builder: (context, state) => const MainScaffold(initialIndex: 1),
    ),
    GoRoute(
      path: '/test-series',
      builder: (context, state) {
        final exam = state.uri.queryParameters['exam'];
        final title = state.uri.queryParameters['title'];
        if (exam != null && exam.isNotEmpty) {
          return ExamsCatalogScreen(
            initialExam: exam,
            initialExamTitle: title,
            isStandAlone: true,
          );
        }
        return const MainScaffold(initialIndex: 1);
      },
    ),
    GoRoute(
      path: '/test-series/:seriesId',
      builder: (context, state) => TestSeriesDetailScreen(
        seriesId: state.pathParameters['seriesId'] ?? '',
      ),
    ),

    // 8 & 9. Test Series Details & Test List Within Exam Series
    GoRoute(
      path: '/exams/:examId',
      builder: (context, state) {
        final examId = state.pathParameters['examId'] ?? 'wbp-constable';
        return ExamsCatalogScreen(
          initialExam: examId,
          initialExamTitle: state.uri.queryParameters['title'],
          isStandAlone: true,
        );
      },
    ),

    // 10. Test Details & Instructions Screen
    GoRoute(
      path: '/test-details/:testId',
      builder: (context, state) {
        final testId = state.pathParameters['testId'] ?? 'test-wbp-001';
        final title = state.uri.queryParameters['title'] ?? 'Mock Test';
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
        return TestRunnerScreen(
          testId: testId,
          liveTestId: state.uri.queryParameters['liveTestId'],
          attemptId: state.uri.queryParameters['attemptId'],
        );
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
      builder: (context, state) => MainScaffold(
        initialIndex: 2,
        practiceInitialTab: state.uri.queryParameters['tab'],
      ),
    ),

    // 17. Practice Flow Screens
    GoRoute(
      path: '/practice/subject/:subjectId',
      builder: (context, state) {
        final subjectId = state.pathParameters['subjectId'] ?? 'history';
        return SubjectDetailScreen(subjectId: subjectId);
      },
    ),
    GoRoute(
      path: '/practice/topics/:subjectId',
      redirect: (context, state) =>
          '/practice/subject/${state.pathParameters['subjectId'] ?? 'history'}',
    ),
    GoRoute(
      path: '/topic-practice/:subjectId',
      redirect: (context, state) =>
          '/practice/subject/${state.pathParameters['subjectId'] ?? 'history'}',
    ),
    GoRoute(
      path: '/practice/topic/:topicId',
      builder: (context, state) {
        final topicId = state.pathParameters['topicId'] ?? 'hist-indus';
        final subjectTitle = state.uri.queryParameters['subjectTitle'];
        final topicTitle = state.uri.queryParameters['topicTitle'];
        final count = int.tryParse(state.uri.queryParameters['count'] ?? '') ?? 50;
        return TopicDetailScreen(
          topicId: topicId,
          subjectTitle: subjectTitle,
          topicTitle: topicTitle,
          totalQuestions: count,
        );
      },
    ),
    GoRoute(
      path: '/practice/test-start/:topicId/:testNumber',
      builder: (context, state) {
        final topicId = state.pathParameters['topicId'] ?? 'hist-indus';
        final testNumber = int.tryParse(state.pathParameters['testNumber'] ?? '1') ?? 1;
        final subjectTitle = state.uri.queryParameters['subjectTitle'];
        final topicTitle = state.uri.queryParameters['topicTitle'];
        return TopicTestStartScreen(
          topicId: topicId,
          testNumber: testNumber,
          subjectTitle: subjectTitle,
          topicTitle: topicTitle,
        );
      },
    ),
    GoRoute(
      path: '/practice/test-runner/:topicId/:testNumber',
      builder: (context, state) {
        final topicId = state.pathParameters['topicId'] ?? 'hist-indus';
        final testNumber = int.tryParse(state.pathParameters['testNumber'] ?? '1') ?? 1;
        final subjectTitle = state.uri.queryParameters['subjectTitle'];
        final topicTitle = state.uri.queryParameters['topicTitle'];
        return TopicTestRunnerScreen(
          topicId: topicId,
          testNumber: testNumber,
          subjectTitle: subjectTitle,
          topicTitle: topicTitle,
        );
      },
    ),
    GoRoute(
      path: '/practice/result/:topicId/:testNumber',
      builder: (context, state) {
        final topicId = state.pathParameters['topicId'] ?? 'hist-indus';
        final testNumber = int.tryParse(state.pathParameters['testNumber'] ?? '1') ?? 1;
        final attemptId = state.uri.queryParameters['attemptId'];
        final subjectTitle = state.uri.queryParameters['subjectTitle'];
        final topicTitle = state.uri.queryParameters['topicTitle'];
        return TopicTestResultScreen(
          topicId: topicId,
          testNumber: testNumber,
          attemptId: attemptId,
          subjectTitle: subjectTitle,
          topicTitle: topicTitle,
        );
      },
    ),
    GoRoute(
      path: '/practice/review/:topicId/:testNumber',
      builder: (context, state) {
        final topicId = state.pathParameters['topicId'] ?? 'hist-indus';
        final testNumber = int.tryParse(state.pathParameters['testNumber'] ?? '1') ?? 1;
        final attemptId = state.uri.queryParameters['attemptId'];
        final subjectTitle = state.uri.queryParameters['subjectTitle'];
        final topicTitle = state.uri.queryParameters['topicTitle'];
        return TopicReviewQuestionsScreen(
          topicId: topicId,
          testNumber: testNumber,
          attemptId: attemptId,
          subjectTitle: subjectTitle,
          topicTitle: topicTitle,
        );
      },
    ),
    GoRoute(
      path: '/practice/review/:topicId/:testNumber/question/:questionIndex',
      builder: (context, state) {
        final topicId = state.pathParameters['topicId'] ?? 'hist-indus';
        final testNumber = int.tryParse(state.pathParameters['testNumber'] ?? '1') ?? 1;
        final questionIndex = int.tryParse(state.pathParameters['questionIndex'] ?? '0') ?? 0;
        final attemptId = state.uri.queryParameters['attemptId'];
        final subjectTitle = state.uri.queryParameters['subjectTitle'];
        final topicTitle = state.uri.queryParameters['topicTitle'];
        return IndividualQuestionReviewScreen(
          topicId: topicId,
          testNumber: testNumber,
          initialQuestionIndex: questionIndex,
          attemptId: attemptId,
          subjectTitle: subjectTitle,
          topicTitle: topicTitle,
        );
      },
    ),

    // 19. Saved Questions Screen
    GoRoute(
      path: '/saved-questions',
      builder: (context, state) => const SavedQuestionsScreen(),
    ),

    // 19b. Audio Books Screen
    GoRoute(
      path: '/audio-books',
      builder: (context, state) => const AudioBooksScreen(),
    ),

    // 22. Results Screen (via MainScaffold tab 3) & Rank / Leaderboard Screen
    GoRoute(
      path: '/results',
      builder: (context, state) => const MainScaffold(initialIndex: 3),
    ),
    GoRoute(
      path: '/leaderboard',
      builder: (context, state) => LeaderboardScreen(
        initialSeriesId: state.uri.queryParameters['seriesId'],
        initialSeriesTitle: state.uri.queryParameters['seriesTitle'],
        initialTestTitle: state.uri.queryParameters['testTitle'],
        initialRank: int.tryParse(state.uri.queryParameters['rank'] ?? ''),
        initialParticipants: int.tryParse(state.uri.queryParameters['participants'] ?? ''),
        initialDistrict: state.uri.queryParameters['district'],
        initialLocationScope: int.tryParse(state.uri.queryParameters['scope'] ?? ''),
      ),
    ),
    GoRoute(
      path: '/rank',
      builder: (context, state) => LeaderboardScreen(
        initialSeriesId: state.uri.queryParameters['seriesId'],
        initialSeriesTitle: state.uri.queryParameters['seriesTitle'],
        initialTestTitle: state.uri.queryParameters['testTitle'],
        initialRank: int.tryParse(state.uri.queryParameters['rank'] ?? ''),
        initialParticipants: int.tryParse(state.uri.queryParameters['participants'] ?? ''),
        initialDistrict: state.uri.queryParameters['district'],
        initialLocationScope: int.tryParse(state.uri.queryParameters['scope'] ?? ''),
      ),
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
    GoRoute(path: '/pricing', redirect: (context, state) => '/subscription'),
    GoRoute(path: '/plans', redirect: (context, state) => '/subscription'),

    // Aliases for subject & test runner
    GoRoute(
      path: '/subject/:subjectId',
      redirect: (context, state) =>
          '/practice/topics/${state.pathParameters['subjectId'] ?? 'math'}',
    ),
    GoRoute(
      path: '/tests/:testId',
      redirect: (context, state) =>
          '/test-details/${state.pathParameters['testId'] ?? 'test-wbp-001'}',
    ),
    GoRoute(
      path: '/test-runner/:testId',
      builder: (context, state) {
        final testId = state.pathParameters['testId'] ?? 'test-wbp-001';
        return TestRunnerScreen(
          testId: testId,
          liveTestId: state.uri.queryParameters['liveTestId'],
          attemptId: state.uri.queryParameters['attemptId'],
        );
      },
    ),
    GoRoute(
      path: '/exams/:examId/runner',
      builder: (context, state) {
        final testId = state.pathParameters['examId'] ?? 'test-wbp-001';
        return TestRunnerScreen(
          testId: testId,
          liveTestId: state.uri.queryParameters['liveTestId'],
          attemptId: state.uri.queryParameters['attemptId'],
        );
      },
    ),
    GoRoute(path: '/rankings', redirect: (context, state) => '/leaderboard'),

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

    // 27. Payment Screen
    GoRoute(
      path: '/payment',
      builder: (context, state) {
        final planId = state.uri.queryParameters['planId'] ?? '1_year';
        final price = int.tryParse(state.uri.queryParameters['price'] ?? '499') ?? 499;
        final title = state.uri.queryParameters['title'] ?? '1 Year Plan';
        return PaymentScreen(
          planId: planId,
          planTitle: title,
          originalPrice: price,
        );
      },
    ),

    // 28. Notifications Screen
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationScreen(),
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    backgroundColor: const Color(0xFFF8FAFC),
    body: SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF2F2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.search_off_rounded, color: Color(0xFFEF4444), size: 38),
              ),
              const SizedBox(height: 18),
              const Text(
                'Page Not Found',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              Text(
                'The page you requested (${state.uri.path}) does not exist or has been moved.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => context.go('/home'),
                icon: const Icon(Icons.home_rounded, size: 18),
                label: const Text('Return Home'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF026BFC),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  ),
);
