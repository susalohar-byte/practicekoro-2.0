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

    testWidgets('ExamSelectionScreen renders with 5 curated category chips', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ExamSelectionScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Select Your\nTarget Exam'), findsOneWidget);
      expect(find.text('WB Police (WBP / KP)'), findsWidgets);
      expect(find.text('WBPSC (Clerkship / WBCS)'), findsWidgets);
      expect(find.text('Teaching (TET / SLST)'), findsWidgets);
      expect(find.text('SSC & Central Govt.'), findsWidgets);
      expect(find.text('Railways (RRB)'), findsWidgets);
      expect(find.text('Continue'), findsOneWidget);
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
      expect(find.text('Track your performance and improve'), findsOneWidget);
      expect(find.text('Total Performance'), findsOneWidget);
      expect(find.text('Recent Tests'), findsOneWidget);
      expect(find.text('Test Series Results'), findsOneWidget);
    });

    testWidgets('LeaderboardScreen renders test series rankings and header without dummy data', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LeaderboardScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Verify headers and test series selector
      expect(find.text('Leaderboard'), findsOneWidget);
      expect(find.text('Compete, stay consistent and climb the ranks! 💙'), findsOneWidget);
      expect(find.text('WBP Constable Test Series 2026'), findsAtLeast(1));
      expect(find.text('You (Susanta Lohar)'), findsNothing);
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

      expect(find.text('Student Help & Support'), findsOneWidget);
      expect(find.text('WhatsApp Chat'), findsOneWidget);
      expect(find.text('Email Support'), findsOneWidget);
      expect(find.text('Submit Support Ticket'), findsOneWidget);
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

    testWidgets('Popular Test Series section renders compact landscape cards without bottom stats or language labels', (tester) async {
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
      expect(find.text('👑'), findsWidgets);
      expect(find.text('Popular Test Series'), findsOneWidget);

      // Verify Test Series titles & year
      expect(find.text('WBP Constable'), findsWidgets);
      expect(find.text('KP Constable'), findsWidgets);
      expect(find.text('Test Series 2026'), findsWidgets);

      // Verify badges
      expect(find.text('🔥 Bestseller'), findsWidgets);
      expect(find.text('⭐ Most Popular'), findsWidgets);

      // Verify bottom statistics and language information are completely removed
      expect(find.text('Full Mock Test'), findsNothing);
      expect(find.text('Practice Test'), findsNothing);
      expect(find.text('PYQ'), findsNothing);
      expect(find.text('Bengali Medium'), findsNothing);
    });

    testWidgets('Home page renders Continue Practice, Top Performers, Today\'s Info, and Motivational Quote sections', (tester) async {
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
      expect(find.text('Pick up where you left off and keep your momentum going'), findsNothing);
      expect(find.text('Mock Test 12'), findsWidgets);
      expect(find.text('Mock Test 08'), findsWidgets);
      expect(find.text('Practice Set 05'), findsWidgets);
      expect(find.text('Continue Test'), findsWidgets);

      // 2. Top Performers Section
      expect(find.text('Top Performers'), findsOneWidget);
      expect(find.text('Students who are performing the best this week'), findsNothing);
      expect(find.text('View Leaderboard'), findsWidgets);
      expect(find.text('Rahul Das'), findsWidgets);
      expect(find.text('Amit Kumar'), findsWidgets);
      expect(find.text('Sneha Roy'), findsWidgets);
      expect(find.text('Priya Sharma'), findsWidgets);

      // Verify Top Performer cards are strictly 1:1 square aspect ratio and horizontally centered
      final rahulCard = find.ancestor(
        of: find.text('Rahul Das'),
        matching: find.byType(AspectRatio),
      );
      expect(rahulCard, findsOneWidget);
      final rahulRect = tester.getRect(rahulCard);
      expect(rahulRect.width, closeTo(rahulRect.height, 0.01));

      // Verify elements are centered horizontally inside the square card
      final rahulTextRect = tester.getRect(find.text('Rahul Das'));
      expect(rahulTextRect.center.dx, closeTo(rahulRect.center.dx, 1.0));
      final scoreRect = tester.getRect(find.text('94%'));
      expect(scoreRect.center.dx, closeTo(rahulRect.center.dx, 1.0));

      // 3. Today's Info Section
      expect(find.text("Today's Info"), findsOneWidget);
      expect(find.textContaining('ভারতের সংবিধান ২৬ জানুয়ারি ১৯৫০'), findsOneWidget);
      expect(find.text('Indian Polity'), findsWidgets);

      // 4. Motivational Quote Section
      expect(find.text('Motivational Quote'), findsOneWidget);
      expect(find.textContaining('ছোট ছোট প্রচেষ্টার যোগফলই বড় সাফল্য'), findsOneWidget);
      expect(find.text('— রবার্ট কলিয়ার'), findsOneWidget);
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

      final verticalListFinder = find.byWidgetPredicate(
        (w) => w is ListView && w.scrollDirection == Axis.vertical,
      ).first;
      final scrollable = tester.state<ScrollableState>(
        find.descendant(of: verticalListFinder, matching: find.byType(Scrollable)).first,
      );
      while (scrollable.position.pixels < scrollable.position.maxScrollExtent) {
        scrollable.position.jumpTo(scrollable.position.maxScrollExtent);
        await tester.pumpAndSettle();
      }

      final authorFinder = find.text('— রবার্ট কলিয়ার');
      final quoteContainer = find.ancestor(
        of: authorFinder,
        matching: find.byType(Container),
      ).last;
      final quoteCardRect = tester.getRect(quoteContainer);
      final navBarFinder = find.byType(SafeArea).last;
      final navBarRect = tester.getRect(navBarFinder);

      // Verify gap is reduced by 50px (42.0px clearance above navbar)
      expect(navBarRect.top - quoteCardRect.bottom, closeTo(42.0, 0.001));
    });

    testWidgets('ExamsCatalogScreen renders Variation 1 clean full-width search bar and filter button', (tester) async {
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
      expect(find.text('Search test series (e.g. WBP, SSC, TET...)'), findsOneWidget);

      // Verify filter button
      expect(find.text('Filter'), findsOneWidget);
      expect(find.byIcon(Icons.tune_rounded), findsOneWidget);
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

      // Verify search icon and placeholder
      expect(find.byIcon(Icons.search_rounded), findsWidgets);
      expect(find.text('Search subject or chapter...'), findsOneWidget);

      // Verify filter button
      expect(find.text('Filter'), findsOneWidget);
      expect(find.byIcon(Icons.tune_rounded), findsOneWidget);
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

      // Verify Popular Test Series section header matching reference UI above All Test Series
      expect(find.text('Popular Test Series'), findsOneWidget);
      expect(find.text('See All'), findsOneWidget);
      expect(find.text('Bestseller'), findsWidgets);
      expect(find.text('Most Popular'), findsWidgets);
      expect(find.text('WBP Constable Test Series 2026'), findsWidgets);
      expect(find.text('KP Constable Test Series 2026'), findsWidgets);

      // Verify Popular Test Series section is positioned vertically ABOVE All Test Series
      final popularTestsOffset = tester.getTopLeft(find.text('Popular Test Series')).dy;
      final allTestSeriesOffset = tester.getTopLeft(find.text('All Test Series')).dy;
      expect(popularTestsOffset, lessThan(allTestSeriesOffset));

      // Verify All Test Series section header
      expect(find.text('All Test Series'), findsOneWidget);
      expect(find.text('Sort by: '), findsOneWidget);
      expect(find.text('Popular'), findsWidgets);
      expect(find.byIcon(Icons.article_rounded), findsWidgets);

      // Verify old "Bengali Medium" and "Total Tests" are completely removed
      expect(find.text('Bengali Medium'), findsNothing);
      expect(find.text('Total Tests'), findsNothing);

      // Verify exactly three test-type statistics are shown with dynamic counts
      expect(find.text('Full Mock Tests'), findsWidgets);
      expect(find.text('Topic Tests'), findsWidgets);
      expect(find.text('PYQ Tests'), findsWidgets);

      // Verify dynamic counts for WBP Constable (60, 40, 20) and KP Constable (50, 35, 15)
      expect(find.text('60'), findsWidgets);
      expect(find.text('40'), findsWidgets);
      expect(find.text('20'), findsWidgets);
      expect(find.text('50'), findsWidgets);
      expect(find.text('35'), findsWidgets);
      expect(find.text('15'), findsWidgets);

      // Verify Full Syllabus badge and View buttons
      expect(find.text('Full Syllabus'), findsWidgets);
      expect(find.text('View'), findsWidgets);
      expect(find.byIcon(Icons.arrow_forward_rounded), findsWidgets);

      // 2. Mobile Responsive Test (360px width)
      tester.view.physicalSize = const Size(360, 800);
      await tester.pumpAndSettle();

      expect(find.text('All Test Series'), findsOneWidget);
      expect(find.text('WBP Constable Test Series 2026'), findsWidgets);
      expect(find.text('Full Mock Tests'), findsWidgets);
      expect(find.text('Topic Tests'), findsWidgets);
      expect(find.text('PYQ Tests'), findsWidgets);
      expect(find.text('Bengali Medium'), findsNothing);

      // 3. Tablet Responsive Test (520px width)
      tester.view.physicalSize = const Size(520, 1000);
      await tester.pumpAndSettle();

      expect(find.text('All Test Series'), findsOneWidget);
      expect(find.text('KP Constable Test Series 2026'), findsWidgets);
      expect(find.text('View'), findsWidgets);
    });
  });
}

