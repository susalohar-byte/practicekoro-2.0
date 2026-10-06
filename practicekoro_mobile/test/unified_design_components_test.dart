import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/core/constants/app_colors.dart';
import 'package:practicekoro_mobile/core/components/pk_button.dart';
import 'package:practicekoro_mobile/core/components/pk_card.dart';
import 'package:practicekoro_mobile/core/components/pk_stat_card.dart';
import 'package:practicekoro_mobile/core/components/pk_section_header.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/features/leaderboard/leaderboard_screen.dart';
import 'package:practicekoro_mobile/features/result_analytics/results_hub_screen.dart';
import 'package:practicekoro_mobile/features/profile/settings_screen.dart';
import 'package:practicekoro_mobile/features/profile/support_screen.dart';
import 'package:practicekoro_mobile/core/widgets/pk_bottom_spacing.dart';
import 'package:practicekoro_mobile/features/exams/primary_exam_selection_screen.dart';
import 'package:practicekoro_mobile/features/exams/exam_selection_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:practicekoro_mobile/features/home/home_screen.dart';
import 'package:practicekoro_mobile/features/navigation/main_scaffold.dart';
import 'package:practicekoro_mobile/features/exams/exams_catalog_screen.dart';
import 'package:practicekoro_mobile/features/practice/practice_screen.dart';
import 'package:practicekoro_mobile/features/onboarding/splash_screen.dart';
import 'package:practicekoro_mobile/features/profile/profile_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();
  });

  group('Unified Design Token & Component Tests', () {
    testWidgets('PKPrimaryButton renders text and fires callback', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PKPrimaryButton(
              text: 'Start Test Now',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Start Test Now'), findsOneWidget);
      await tester.tap(find.text('Start Test Now'));
      expect(tapped, isTrue);
    });

    testWidgets('PKCard renders child with border and padding', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PKCard(
              child: Text('Card Content'),
            ),
          ),
        ),
      );

      expect(find.text('Card Content'), findsOneWidget);
    });

    testWidgets('PKStatCard renders icon, label, and metric value', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PKStatCard(
              title: 'Average Score',
              value: '78.5',
              icon: Icons.bar_chart_rounded,
              iconColor: AppColors.primary,
              iconBackgroundColor: AppColors.veryLightBlue,
            ),
          ),
        ),
      );

      expect(find.text('Average Score'), findsOneWidget);
      expect(find.text('78.5'), findsOneWidget);
      expect(find.byIcon(Icons.bar_chart_rounded), findsOneWidget);
    });

    testWidgets('PKSectionHeader renders title and action', (tester) async {
      bool actionTapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PKSectionHeader(
              title: 'Popular Bengal Exams',
              actionText: 'View All',
              onActionTap: () => actionTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Popular Bengal Exams'), findsOneWidget);
      expect(find.text('View All'), findsOneWidget);
      await tester.tap(find.text('View All'));
      expect(actionTapped, isTrue);
    });
  });

  group('New & Upgraded Screens Smoke Tests', () {
    testWidgets('PrimaryExamSelectionScreen renders standardized exam choices', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: PrimaryExamSelectionScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Set Your Primary Exam'), findsOneWidget);
      expect(find.text('WBP Constable'), findsOneWidget);
      expect(find.text('WBPSC Clerkship'), findsOneWidget);
      expect(find.text('WBSSC Group D'), findsOneWidget);
      expect(find.text('Primary TET'), findsOneWidget);
      expect(find.text('Continue'), findsOneWidget);
    });

    testWidgets('ExamSelectionScreen renders with category chips and search', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ExamSelectionScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('পরীক্ষা নির্বাচন'), findsOneWidget);
      expect(find.text('West Bengal'), findsWidgets);
      expect(find.text('Central'), findsWidgets);
      expect(find.text('Teaching'), findsWidgets);
    });

    testWidgets('ResultsHubScreen renders Results page sections', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      await tester.pumpWidget(
        const MaterialApp(
          home: ResultsHubScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Results'), findsOneWidget);
      expect(find.text('Overview'), findsOneWidget);
      expect(find.text('All Tests'), findsOneWidget);
      expect(find.text('Rankings'), findsOneWidget);
      expect(find.text('Total Performance'), findsOneWidget);
    });

    testWidgets('LeaderboardScreen renders test series rankings and header without dummy data', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LeaderboardScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Verify headers and test series selector
      expect(find.text('My Rank'), findsOneWidget);
      expect(find.text('West Bengal'), findsWidgets);
      expect(find.text('Your Rank'), findsOneWidget);
    });

    testWidgets('SettingsScreen renders language toggle and target exam', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SettingsScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Settings & Preferences'), findsOneWidget);
      expect(find.text('Primary Target Exam'), findsOneWidget);
      expect(find.text('Daily Mock Test Reminder'), findsOneWidget);
      expect(find.text('Notifications'), findsOneWidget);
    });

    testWidgets('SupportScreen renders contact options and ticket form', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SupportScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Help & Support'), findsOneWidget);
      expect(find.text('FAQs'), findsOneWidget);
      expect(find.text('Contact'), findsOneWidget);
      expect(find.text('Popular Questions'), findsOneWidget);
      expect(find.text('How to attempt a mock test?'), findsOneWidget);
    });

    testWidgets('PKBottomSpacing calculates floating bar clearance correctly', (tester) async {
      double? calculatedInside;
      double? calculatedOutside;

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(
              padding: EdgeInsets.only(bottom: 34.0), // iPhone safe-area inset
            ),
            child: PKBottomNavScope(
              hasFloatingNavBar: true,
              navBarHeight: 78.0,
              navBarBottomMargin: 10.0,
              child: Builder(
                builder: (context) {
                  calculatedInside = PKBottomSpacing.of(context);
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
        ),
      );

      // 78 (height) + 10 (margin) + 34 (bottom inset) + 12 (breathing gap) - 50 = 84.0
      expect(calculatedInside, equals(84.0));

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(
              padding: EdgeInsets.only(bottom: 34.0),
            ),
            child: PKBottomNavScope(
              hasFloatingNavBar: false,
              child: Builder(
                builder: (context) {
                  calculatedOutside = PKBottomSpacing.of(context);
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
        ),
      );

      // 34 (bottom inset) + 20 (default detail gap) = 54.0
      expect(calculatedOutside, equals(54.0));
    });

    testWidgets('PKBottomNavSpacer renders with proper clearance height', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(
              padding: EdgeInsets.only(bottom: 20.0),
            ),
            child: PKBottomNavScope(
              hasFloatingNavBar: true,
              child: Scaffold(
                body: Column(
                  children: [
                    Text('Content Above'),
                    PKBottomNavSpacer(),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      // 70 + 10 + 20 + 12 - 50 = 62.0
      final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox).last);
      expect(sizedBox.height, equals(62.0));
    });

    testWidgets('Popular Test Series section renders compact landscape cards', (tester) async {
      tester.view.physicalSize = const Size(420, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomeScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Header verification
      expect(find.text('🔥 '), findsWidgets);
      expect(find.text('View All →'), findsWidgets);

      // Verify Test Series titles
      expect(find.text('WBP Constable'), findsWidgets);
      expect(find.text('KP Constable'), findsWidgets);

      // Verify badges
      expect(find.text('Most Popular'), findsWidgets);
    });

    testWidgets('Home page renders Continue Practice and Daily Practice sections', (tester) async {
      tester.view.physicalSize = const Size(1200, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomeScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Continue Practice Section
      expect(find.text('Continue Practice'), findsOneWidget);
      expect(find.text('General Science'), findsWidgets);
      expect(find.text('History'), findsWidgets);
      expect(find.text('Mathematics'), findsWidgets);

      // 2. Daily Practice Section
      expect(find.text('🎯 Daily Practice'), findsOneWidget);
      expect(find.text("Today's Challenge"), findsOneWidget);
      expect(find.text('Start Now'), findsOneWidget);
    });

    testWidgets('MainScaffold renders redesigned pill navbar with 5 items and active circular highlight', (tester) async {
      tester.view.physicalSize = const Size(420, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MainScaffold(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify all 5 navigation items are present
      expect(find.text('Home'), findsWidgets);
      expect(find.text('Test Series'), findsWidgets);
      expect(find.text('Practice'), findsWidgets);
      expect(find.text('Results'), findsWidgets);
      expect(find.text('Profile'), findsWidgets);
    });

    testWidgets('MainScaffold shows mascot only when Practice tab is selected and animates on tap', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MainScaffold(initialIndex: 0),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // On Home: Mascot image is NOT rendered
      expect(find.image(const AssetImage('assets/images/mascot_with_crown_tight.png')), findsNothing);

      // Tap on Practice tab
      await tester.tap(find.text('Practice'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      // Mascot image is now rendered!
      expect(find.image(const AssetImage('assets/images/mascot_with_crown_tight.png')), findsOneWidget);

      // Tap on Test Series tab
      await tester.tap(find.text('Test Series'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pumpAndSettle();

      // Mascot image is hidden again
      expect(find.image(const AssetImage('assets/images/mascot_with_crown_tight.png')), findsNothing);
    });

    testWidgets('ExamsCatalogScreen renders clean search bar and filter dropdown', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ExamsCatalogScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify search icon and placeholder
      expect(find.byIcon(Icons.search_rounded), findsWidgets);
      expect(find.text('Search test series...'), findsOneWidget);

      // Verify All Exams filter button
      expect(find.text('All Exams'), findsWidgets);
      expect(find.byIcon(Icons.keyboard_arrow_down_rounded), findsWidgets);

      // Verify typing into search input
      await tester.enterText(find.byType(TextField).first, 'WBP');
      await tester.pumpAndSettle();
      expect(find.text('WBP'), findsWidgets);
    });

    testWidgets('PracticeScreen renders PKSearchFilterBar with subject or chapter placeholder', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PracticeScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify search icon and Bengali subjects
      expect(find.byIcon(Icons.search_rounded), findsWidgets);
      expect(find.text('Practice'), findsOneWidget);
      expect(find.text('ভারতের ইতিহাস'), findsOneWidget);
      expect(find.text('সাধারণ বিজ্ঞান'), findsOneWidget);
    });

    testWidgets('SplashScreen renders redesigned light-blue splash with logo, branding, and dots', (tester) async {
      tester.view.physicalSize = const Size(576, 1024);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: SplashScreen(),
        ),
      );

      // Verify Scaffold background color is #E8F3FE
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
      expect(scaffold.backgroundColor, const Color(0xFFE8F3FE));

      // Verify images are present: logo, brand, headline, subtitle
      final imageFinders = find.byType(Image);
      expect(imageFinders, findsNWidgets(4));

      // Verify semantics label
      expect(
        find.byWidgetPredicate(
          (w) => w is Semantics && w.properties.label == 'PracticeKoro - পরীক্ষার প্রস্তুতি, এখন আরও সহজ',
        ),
        findsOneWidget,
      );

      // Pump 1 second of animation without throwing
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(SplashScreen), findsOneWidget);
    });

    testWidgets('ExamsCatalogScreen renders complete Test Series section matching reference with dynamic stats and square icons', (tester) async {
      // 1. Desktop test
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ExamsCatalogScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Test Series header and playful subtitle
      expect(find.text('Test Series'), findsWidgets);
      expect(find.text('Practice Today, Be Exam Ready!'), findsWidgets);

      // Verify search and All Exams filter
      expect(find.text('Search test series...'), findsOneWidget);
      expect(find.text('All Exams'), findsWidgets);

      // Verify Test Series cards
      expect(find.text('WBP Constable'), findsWidgets);
      expect(find.text('Railway (NTPC)'), findsWidgets);
    });

    testWidgets('ProfileScreen renders Playful Gen-Z profile page matching reference across all breakpoints', (tester) async {
      for (final width in [320.0, 360.0, 375.0, 390.0, 414.0, 430.0]) {
        tester.view.physicalSize = Size(width, 1000);
        tester.view.devicePixelRatio = 1.0;

        await tester.pumpWidget(
          const ProviderScope(
            child: MaterialApp(
              home: ProfileScreen(),
            ),
          ),
        );
        await tester.pumpAndSettle();

        // 1. Verify Top Header
        expect(find.text('Profile'), findsOneWidget);
        expect(find.textContaining('Manage your account'), findsOneWidget);

        // 2. Verify Profile Card & Edit Profile Button
        expect(find.text('Edit Profile'), findsOneWidget);
        expect(find.text('District'), findsOneWidget);
        expect(find.text('State'), findsOneWidget);
        expect(find.text('Joined'), findsOneWidget);

        // 3. Verify Current Plan Card
        expect(find.text('Current Plan'), findsOneWidget);

        // 4. Verify 3 Quick Action Cards
        expect(find.text('My Subscriptions'), findsOneWidget);
        expect(find.text('Payment History'), findsOneWidget);
        expect(find.text('Coupons'), findsOneWidget);

        // 5. Verify Learning Stats
        expect(find.text('My Learning Stats'), findsOneWidget);
        expect(find.text('Tests Attempted'), findsOneWidget);
        expect(find.text('Average Accuracy'), findsOneWidget);
        expect(find.text('Total Study Time'), findsOneWidget);
        expect(find.text('Day Streak'), findsOneWidget);

        // 6. Verify Settings Items
        expect(find.text('My Exam Preferences'), findsOneWidget);
        expect(find.text('Notifications'), findsOneWidget);
        expect(find.text('Settings'), findsOneWidget);
        expect(find.text('Help & Support'), findsOneWidget);
        expect(find.text('About PracticeKoro'), findsOneWidget);

        // 7. Verify Motivational Banner
        expect(find.textContaining('Keep Learning'), findsOneWidget);
      }
      tester.view.resetPhysicalSize();
    });
  });
}

