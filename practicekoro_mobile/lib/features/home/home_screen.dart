import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/live_test_model.dart';
import '../../data/models/test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/leaderboard_repository.dart';

final homeExamsProvider = FutureProvider<List<ExamModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getExams();
});

final homeMockTestsProvider = FutureProvider<List<MockTestModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getMockTests();
});

final homeLeaderboardProvider =
    FutureProvider.family<List<LeaderboardEntry>, String>((ref, scope) async {
      try {
        return await LeaderboardRepository().getLeaderboard(scope: scope);
      } catch (_) {
        return const <LeaderboardEntry>[];
      }
    });

class HomeScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const HomeScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

typedef PracticeKoroHomeScreen = HomeScreen;

class _ModernGradientCardData {
  final String title;
  final String subtitle;
  final String imagePath;
  final List<Color> gradient;
  final Color shadowColor;
  final Color arrowColor;
  final IconData watermarkIcon;
  final Widget topIcon;
  final VoidCallback onTap;

  const _ModernGradientCardData({
    required this.title,
    required this.subtitle,
    required this.imagePath,
    required this.gradient,
    required this.shadowColor,
    required this.arrowColor,
    required this.watermarkIcon,
    required this.topIcon,
    required this.onTap,
  });
}

class _PopularExamCardItem {
  final String title;
  final String testsCount;
  final String imageAsset;
  final String route;
  final Color shadowColor;
  final Color arrowColor;
  final List<Color> gradientColors;
  final String emblemType;

  const _PopularExamCardItem({
    required this.title,
    required this.testsCount,
    required this.imageAsset,
    required this.route,
    required this.shadowColor,
    required this.arrowColor,
    required this.gradientColors,
    required this.emblemType,
  });
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }


  void _handleTabNavigation(int tabIndex, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(tabIndex);
    } else {
      context.go(route);
    }
  }

  void _openLiveSearchModal({
    required List<ExamModel> exams,
    required List<TestSeriesModel> series,
    required List<MockTestModel> tests,
  }) {
    final items = <Map<String, dynamic>>[
      for (final e in exams)
        {
          'title': e.title,
          'type': e.category,
          'category': 'exam',
          'route': '/exams/${e.id}',
        },
      for (final s in series)
        {
          'title': s.title,
          'type': s.examTitle ?? 'Test Series',
          'category': 'series',
          'route': '/test-series/${s.id}',
        },
      for (final t in tests)
        {
          'title': t.title,
          'type': '${t.totalQuestions} Questions • ${t.durationMinutes} Mins',
          'category': 'test',
          'route':
              '/test-details/${t.id}?title=${Uri.encodeComponent(t.title)}&isPro=${t.isPremium}',
        },
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final query = _searchController.text.trim().toLowerCase();
            final results = query.isEmpty
                ? items
                : items.where((item) {
                    final t = (item['title'] as String).toLowerCase();
                    final typ = (item['type'] as String).toLowerCase();
                    return t.contains(query) || typ.contains(query);
                  }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.82,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: EdgeInsets.fromLTRB(
                18,
                12,
                18,
                18 + MediaQuery.paddingOf(context).bottom,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: TextField(
                            controller: _searchController,
                            autofocus: true,
                            decoration: InputDecoration(
                              hintText: 'Search mock tests, exams, subjects...',
                              hintStyle: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF94A3B8),
                              ),
                              prefixIcon: const Icon(
                                Icons.search_rounded,
                                color: Color(0xFF0877FF),
                                size: 20,
                              ),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(
                                        Icons.clear_rounded,
                                        size: 18,
                                        color: Color(0xFF64748B),
                                      ),
                                      onPressed: () {
                                        _searchController.clear();
                                        setModalState(() {});
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 12,
                              ),
                            ),
                            onChanged: (_) => setModalState(() {}),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: results.length,
                      separatorBuilder: (_, _) =>
                          const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      itemBuilder: (context, idx) {
                        final item = results[idx];
                        return ListTile(
                          title: Text(
                            item['title'] as String,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0B1F5B),
                            ),
                          ),
                          subtitle: Text(
                            item['type'] as String,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          trailing: const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 14,
                            color: Color(0xFF94A3B8),
                          ),
                          onTap: () {
                            Navigator.pop(context);
                            context.push(item['route'] as String);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final liveTestAsync = ref.watch(activeLiveTestProvider);
    final popularSeriesAsync = ref.watch(popularTestSeriesProvider);
    final examsAsync = ref.watch(homeExamsProvider);
    final testsAsync = ref.watch(homeMockTestsProvider);

    final exams = examsAsync.asData?.value ?? const <ExamModel>[];
    final popularList =
        popularSeriesAsync.asData?.value ?? const <TestSeriesModel>[];
    final allTests = testsAsync.asData?.value ?? const <MockTestModel>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5FC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(activeLiveTestProvider);
            ref.invalidate(popularTestSeriesProvider);
            ref.invalidate(homeExamsProvider);
            ref.invalidate(homeMockTestsProvider);
          },
          color: const Color(0xFF0877FF),
          child: ListView(
            padding: PKBottomSpacing.edgeInsets(context, horizontal: 16, top: 10),
            children: [
              // 1. PRACTICEKORO BRAND HEADER (media_1790825370692.png)
              _buildPracticeKoroHeader(
                exams: exams,
                series: popularList,
                tests: allTests,
              ),
              const SizedBox(height: 14),

              // 2. HERO BANNER
              _buildHeroBanner(),
              const SizedBox(height: 14),

              // 3. 4 CORE PRACTICE ACTION CARDS
              _buildCorePracticeActions(),
              const SizedBox(height: 14),

              // 4. LIVE TEST CARD
              _buildLiveTestCard(liveTestAsync.asData?.value),
              const SizedBox(height: 18),

              // 5. POPULAR EXAMS
              _buildPopularExamsSection(exams),
              const SizedBox(height: 18),

              // 6. POPULAR TEST SERIES
              _buildPopularTestSeriesSection(popularList),
              const SizedBox(height: 18),

              // 7. CONTINUE PRACTICING
              _buildContinuePracticingSection(),
              const SizedBox(height: 18),

              // 8. TOP PERFORMERS
              _buildTopPerformersSection(),
              const SizedBox(height: 18),

              // 9. TODAY'S INFO & MOTIVATIONAL QUOTE
              _buildDailyInfoAndQuoteSection(),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // ==========================================
  // 1. PRACTICEKORO BRAND HEADER
  // ==========================================
  Widget _buildPracticeKoroHeader({
    required List<ExamModel> exams,
    required List<TestSeriesModel> series,
    required List<MockTestModel> tests,
  }) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isCompact = screenWidth < 370;

    final logoSize = isCompact ? 38.0 : 42.0;
    final actionBtnSize = isCompact ? 35.0 : 38.0;
    final avatarSize = isCompact ? 36.0 : 40.0;
    final fontSize = isCompact ? 19.5 : 21.5;
    final itemGap = isCompact ? 6.0 : 8.0;
    final dividerGap = isCompact ? 7.0 : 8.5;
    final cardPaddingH = isCompact ? 12.0 : 14.0;
    final cardPaddingV = isCompact ? 10.0 : 12.0;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: cardPaddingH, vertical: cardPaddingV),
      decoration: BoxDecoration(
        color: const Color(0xFFE0EFFE), // Seamless light-blue background matching reference UI
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFD4E7FC),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left: PracticeKoro App Icon (assets/images/logo.png)
          ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: Image.asset(
              'assets/images/logo.png',
              width: logoSize,
              height: logoSize,
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => Container(
                width: logoSize,
                height: logoSize,
                decoration: BoxDecoration(
                  color: const Color(0xFF0877FF),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(
                  Icons.menu_book_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
            ),
          ),
          SizedBox(width: isCompact ? 8 : 10),

          // Brand Title: PracticeKoro (No tagline, existing typography & colors)
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Practice',
                    style: TextStyle(
                      color: const Color(0xFF0B1F5B),
                      fontSize: fontSize,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.4,
                    ),
                  ),
                  TextSpan(
                    text: 'Koro',
                    style: TextStyle(
                      color: const Color(0xFF0877FF),
                      fontSize: fontSize,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.4,
                    ),
                  ),
                ],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(width: itemGap),

          // Right Actions: Search + Notification ('3') + Divider + Avatar
          _headerIconButton(
            size: actionBtnSize,
            icon: Icons.search_rounded,
            onTap: () => _openLiveSearchModal(
              exams: exams,
              series: series,
              tests: tests,
            ),
          ),
          SizedBox(width: itemGap),
          _headerNotificationButton(
            size: actionBtnSize,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('3 new exam updates available'),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          SizedBox(width: dividerGap),

          // Thin Vertical Divider
          Container(
            width: 1,
            height: isCompact ? 22 : 26,
            color: const Color(0xFFBFDBFE),
          ),
          SizedBox(width: dividerGap),

          // Existing Student's Profile / Avatar Image
          GestureDetector(
            onTap: () => _handleTabNavigation(4, '/profile'),
            child: Container(
              width: avatarSize,
              height: avatarSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white,
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0B1F5B).withValues(alpha: 0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 1.5),
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/student_avatar_hd.png',
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    color: const Color(0xFF0877FF),
                    child: const Icon(
                      Icons.person_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerIconButton({
    required IconData icon,
    required VoidCallback onTap,
    double size = 38,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(size / 2),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0B1F5B).withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 1.5),
            ),
          ],
        ),
        child: Icon(icon, color: const Color(0xFF0B1F5B), size: size * 0.52),
      ),
    );
  }

  Widget _headerNotificationButton({
    required VoidCallback onTap,
    double size = 38,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(size / 2),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0B1F5B).withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 1.5),
                ),
              ],
            ),
            child: Icon(
              Icons.notifications_none_rounded,
              color: const Color(0xFF0B1F5B),
              size: size * 0.54,
            ),
          ),
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              width: 17,
              height: 17,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              child: const Text(
                '3',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 2. HERO BANNER
  // ==========================================
  Widget _buildHeroBanner() {
    return InkWell(
      onTap: () => _handleTabNavigation(2, '/practice'),
      borderRadius: BorderRadius.circular(20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: AspectRatio(
          aspectRatio: 438 / 200,
          child: Image.asset(
            'assets/images/home_hero_banner.png',
            width: double.infinity,
            fit: BoxFit.fill,
            errorBuilder: (_, _, _) => Container(
              color: const Color(0xFFD9EEFF),
              alignment: Alignment.center,
              child: const Text(
                'Practice Smart — Get Closer to Your Dream Job',
                style: TextStyle(
                  color: Color(0xFF0B1F5B),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // 3. 4 CORE PRACTICE ACTION CARDS (MODERN GRADIENT DESIGN)
  // ==========================================
  Widget _buildCorePracticeActions() {
    final cards = [
      _ModernGradientCardData(
        title: 'Mock Test',
        subtitle: 'Full Test Experience',
        imagePath: 'assets/images/card_mock_test.png',
        gradient: const [Color(0xFF00A2FF), Color(0xFF0052D4)],
        shadowColor: const Color(0xFF005BD4),
        arrowColor: const Color(0xFF0052D4),
        watermarkIcon: Icons.assignment_outlined,
        topIcon: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: const Icon(
            Icons.assignment_rounded,
            size: 25,
            color: Color(0xFF0066FF),
          ),
        ),
        onTap: () => _handleTabNavigation(1, '/exams'),
      ),
      _ModernGradientCardData(
        title: 'Topic Practice',
        subtitle: 'Chapter-wise',
        imagePath: 'assets/images/card_topic_practice.png',
        gradient: const [Color(0xFF2DD878), Color(0xFF059669)],
        shadowColor: const Color(0xFF059669),
        arrowColor: const Color(0xFF059669),
        watermarkIcon: Icons.gps_fixed_rounded,
        topIcon: const SizedBox(
          width: 42,
          height: 42,
          child: Center(
            child: Icon(
              Icons.gps_fixed_rounded,
              size: 38,
              color: Colors.white,
            ),
          ),
        ),
        onTap: () => _handleTabNavigation(2, '/practice'),
      ),
      _ModernGradientCardData(
        title: 'Previous Year',
        subtitle: 'Real Exam Questions',
        imagePath: 'assets/images/card_previous_year.png',
        gradient: const [Color(0xFFFBBF24), Color(0xFFF97316), Color(0xFFEA580C)],
        shadowColor: const Color(0xFFF97316),
        arrowColor: const Color(0xFFEA580C),
        watermarkIcon: Icons.description_rounded,
        topIcon: Container(
          width: 34,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(8),
              topRight: Radius.circular(14),
              bottomLeft: Radius.circular(8),
              bottomRight: Radius.circular(8),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(6, 12, 6, 6),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 14,
                height: 3.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 3.5),
              Container(
                width: 20,
                height: 3.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
        onTap: () => _handleTabNavigation(2, '/practice?tab=pyqs'),
      ),
      _ModernGradientCardData(
        title: 'Live Tests',
        subtitle: 'Join & Compete',
        imagePath: 'assets/images/card_live_tests.png',
        gradient: const [Color(0xFFFB7185), Color(0xFFE11D48), Color(0xFFBE123C)],
        shadowColor: const Color(0xFFE11D48),
        arrowColor: const Color(0xFFBE123C),
        watermarkIcon: Icons.sensors_rounded,
        topIcon: SizedBox(
          width: 42,
          height: 42,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                '((',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -2,
                  height: 1,
                ),
              ),
              const SizedBox(width: 3),
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 3),
              const Text(
                '))',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -2,
                  height: 1,
                ),
              ),
            ],
          ),
        ),
        onTap: () => _handleTabNavigation(1, '/exams'),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final totalWidth = constraints.maxWidth;
        // Consistent responsive gap proportional to width
        final gap = (totalWidth * 0.022).clamp(6.0, 16.0);

        return Row(
          children: [
            for (int i = 0; i < cards.length; i++) ...[
              if (i > 0) SizedBox(width: gap),
              Expanded(
                child: _buildGradientFeatureCard(cards[i]),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildGradientFeatureCard(_ModernGradientCardData data) {
    return AspectRatio(
      aspectRatio: 221 / 224,
      child: Semantics(
        label: '${data.title}, ${data.subtitle}',
        button: true,
        child: InkWell(
          onTap: data.onTap,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: data.shadowColor.withValues(alpha: 0.28),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.asset(
                data.imagePath,
                fit: BoxFit.fill,
                errorBuilder: (_, _, _) => _buildFallbackVectorCard(data),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFallbackVectorCard(_ModernGradientCardData data) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: data.gradient,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          children: [
            // Ambient abstract wave shape top-left
            Positioned(
              left: -22,
              top: -22,
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
              ),
            ),
            // Watermark graphic bottom-right
            Positioned(
              right: -8,
              bottom: -8,
              child: Opacity(
                opacity: 0.16,
                child: Icon(
                  data.watermarkIcon,
                  size: 48,
                  color: Colors.white,
                ),
              ),
            ),
            // Card Content
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  data.topIcon,
                  const SizedBox(height: 6),
                  Text(
                    data.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    data.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withValues(alpha: 0.90),
                    ),
                  ),
                  const Spacer(),
                  // Circular arrow button near bottom center
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 4,
                          offset: const Offset(0, 1.5),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: data.arrowColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // 4. LIVE TEST CARD
  // ==========================================
  Widget _buildLiveTestCard(LiveTestModel? liveTest) {
    final title = liveTest?.title ?? 'WBP Constable Weekly Test';
    final dateStr = liveTest != null
        ? _formatLiveTestDate(liveTest.scheduledStartTime)
        : 'Sat, 28 Sep • 10:00 AM';
    final questions = liveTest?.totalQuestions ?? 100;
    final mins = liveTest?.durationMinutes ?? 90;
    final daysStr = liveTest != null
        ? liveTest.timeRemaining.inDays.toString().padLeft(2, '0')
        : '02';
    final hoursStr = liveTest != null
        ? (liveTest.timeRemaining.inHours % 24).toString().padLeft(2, '0')
        : '18';
    final minsStr = liveTest != null
        ? (liveTest.timeRemaining.inMinutes % 60).toString().padLeft(2, '0')
        : '30';

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 540;
        final isVeryNarrow = constraints.maxWidth < 360;

        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFF012452),
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF012452).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: EdgeInsets.symmetric(
            horizontal: isWide ? 24 : 16,
            vertical: isWide ? 22 : 16,
          ),
          child: isWide
              ? _buildLiveTestWideLayout(
                  liveTest: liveTest,
                  title: title,
                  dateStr: dateStr,
                  questions: questions,
                  mins: mins,
                  daysStr: daysStr,
                  hoursStr: hoursStr,
                  minsStr: minsStr,
                )
              : _buildLiveTestCompactLayout(
                  liveTest: liveTest,
                  title: title,
                  dateStr: dateStr,
                  questions: questions,
                  mins: mins,
                  daysStr: daysStr,
                  hoursStr: hoursStr,
                  minsStr: minsStr,
                  isVeryNarrow: isVeryNarrow,
                ),
        );
      },
    );
  }

  Widget _buildLiveTestWideLayout({
    required LiveTestModel? liveTest,
    required String title,
    required String dateStr,
    required int questions,
    required int mins,
    required String daysStr,
    required String hoursStr,
    required String minsStr,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Left Column: Badge, Title, Date, Meta
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildLiveTestBadge(),
              const SizedBox(height: 12),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.calendar_today_rounded,
                    size: 15,
                    color: Color(0xFF8FA9C8),
                  ),
                  const SizedBox(width: 7),
                  Flexible(
                    child: Text(
                      dateStr,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFC7D7E9),
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _buildLiveTestMetaRow(
                questions: questions,
                mins: mins,
                isCompact: false,
              ),
            ],
          ),
        ),
        const SizedBox(width: 20),
        // Right Column: Countdown blocks on top, Join Now button below
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildCountdownBox(daysStr, 'Days', isCompact: false),
                const SizedBox(width: 8),
                _buildCountdownBox(hoursStr, 'Hours', isCompact: false),
                const SizedBox(width: 8),
                _buildCountdownBox(minsStr, 'Mins', isCompact: false),
              ],
            ),
            const SizedBox(height: 18),
            _buildJoinNowButton(liveTest: liveTest, isCompact: false),
          ],
        ),
      ],
    );
  }

  Widget _buildLiveTestCompactLayout({
    required LiveTestModel? liveTest,
    required String title,
    required String dateStr,
    required int questions,
    required int mins,
    required String daysStr,
    required String hoursStr,
    required String minsStr,
    required bool isVeryNarrow,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Top Row: Red LIVE TEST badge on left + Countdown boxes on right
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _buildLiveTestBadge(isCompact: true),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildCountdownBox(daysStr, 'Days', isCompact: true),
                const SizedBox(width: 6),
                _buildCountdownBox(hoursStr, 'Hours', isCompact: true),
                const SizedBox(width: 6),
                _buildCountdownBox(minsStr, 'Mins', isCompact: true),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Title across full width
        Text(
          title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17.5,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
            height: 1.25,
          ),
        ),
        const SizedBox(height: 8),

        // Date row
        Row(
          children: [
            const Icon(
              Icons.calendar_today_rounded,
              size: 14,
              color: Color(0xFF8FA9C8),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                dateStr,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFFC7D7E9),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Bottom Row: Questions & Duration on left, Join Now on right
        isVeryNarrow
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLiveTestMetaRow(
                    questions: questions,
                    mins: mins,
                    isCompact: true,
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: _buildJoinNowButton(
                      liveTest: liveTest,
                      isCompact: true,
                    ),
                  ),
                ],
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: _buildLiveTestMetaRow(
                      questions: questions,
                      mins: mins,
                      isCompact: true,
                    ),
                  ),
                  const SizedBox(width: 10),
                  _buildJoinNowButton(liveTest: liveTest, isCompact: true),
                ],
              ),
      ],
    );
  }

  Widget _buildLiveTestBadge({bool isCompact = false}) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 10 : 13,
        vertical: isCompact ? 4.5 : 5.5,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFFD0424),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.sensors_rounded,
            color: Colors.white,
            size: isCompact ? 13 : 14.5,
          ),
          const SizedBox(width: 5),
          Text(
            'LIVE TEST',
            style: TextStyle(
              color: Colors.white,
              fontSize: isCompact ? 10.5 : 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTestMetaRow({
    required int questions,
    required int mins,
    required bool isCompact,
  }) {
    final iconSize = isCompact ? 13.5 : 15.0;
    final fontSize = isCompact ? 11.5 : 13.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.article_outlined,
          size: iconSize,
          color: const Color(0xFF8FA9C8),
        ),
        const SizedBox(width: 5),
        Text(
          '$questions Questions',
          style: TextStyle(
            color: const Color(0xFFC7D7E9),
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          width: 1.2,
          height: isCompact ? 11 : 13,
          color: const Color(0xFF264C7A),
        ),
        const SizedBox(width: 8),
        Icon(
          Icons.schedule_rounded,
          size: iconSize,
          color: const Color(0xFF8FA9C8),
        ),
        const SizedBox(width: 5),
        Text(
          '$mins Minutes',
          style: TextStyle(
            color: const Color(0xFFC7D7E9),
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildCountdownBox(
    String value,
    String unit, {
    bool isCompact = false,
  }) {
    return Container(
      width: isCompact ? 42 : 52,
      height: isCompact ? 46 : 56,
      decoration: BoxDecoration(
        color: const Color(0xFF143964),
        borderRadius: BorderRadius.circular(isCompact ? 10 : 12),
      ),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(
              color: Colors.white,
              fontSize: isCompact ? 15 : 18,
              fontWeight: FontWeight.w800,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            unit,
            style: TextStyle(
              color: const Color(0xFF8FA9C8),
              fontSize: isCompact ? 9 : 10.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinNowButton({
    required LiveTestModel? liveTest,
    required bool isCompact,
  }) {
    return SizedBox(
      height: isCompact ? 38 : 44,
      child: ElevatedButton(
        onPressed: () async {
          if (liveTest != null) {
            final userId = LocalStorageService.getUserId();
            await ref
                .read(catalogRepositoryProvider)
                .joinLiveTest(liveTest.id, userId);
            if (mounted) {
              context.push('/live-test/${liveTest.testId}');
            }
          } else {
            _handleTabNavigation(1, '/exams');
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF006BFE),
          foregroundColor: Colors.white,
          elevation: 0,
          padding: EdgeInsets.symmetric(
            horizontal: isCompact ? 16 : 22,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Join Now',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: isCompact ? 13 : 14.5,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.arrow_forward_rounded,
              size: isCompact ? 15 : 17,
              color: Colors.white,
            ),
          ],
        ),
      ),
    );
  }

  String _formatLiveTestDate(DateTime dateTime) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final local = dateTime.toLocal();
    final hour24 = local.hour;
    final hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = hour24 >= 12 ? 'PM' : 'AM';
    return '${weekdays[local.weekday - 1]}, ${local.day} ${months[local.month - 1]} • $hour12:$minute $period';
  }

  // ==========================================
  // 5. POPULAR EXAMS SECTION (IMAGE + GRADIENT CARD DESIGN)
  // ==========================================
  Widget _buildPopularExamsSection(List<ExamModel> exams) {
    final popularExams = [
      const _PopularExamCardItem(
        title: 'WBP Constable',
        testsCount: '120+ Tests',
        imageAsset: 'assets/images/exam_wbp_card.png',
        route: '/exams',
        shadowColor: Color(0xFF0066FF),
        arrowColor: Color(0xFF0066FF),
        gradientColors: [Color(0xFF00A2FF), Color(0xFF0052D4)],
        emblemType: 'wbp_shield',
      ),
      const _PopularExamCardItem(
        title: 'KP Constable',
        testsCount: '100+ Tests',
        imageAsset: 'assets/images/exam_kp_card.png',
        route: '/exams',
        shadowColor: Color(0xFF8B5CF6),
        arrowColor: Color(0xFF8B5CF6),
        gradientColors: [Color(0xFFA855F7), Color(0xFF6D28D9)],
        emblemType: 'kp_crest',
      ),
      const _PopularExamCardItem(
        title: 'SSC GD',
        testsCount: '150+ Tests',
        imageAsset: 'assets/images/exam_ssc_card.png',
        route: '/exams',
        shadowColor: Color(0xFFEA580C),
        arrowColor: Color(0xFFEA580C),
        gradientColors: [Color(0xFFF97316), Color(0xFFDC2626)],
        emblemType: 'ssc_red',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('🔥', style: TextStyle(fontSize: 20)),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Popular Exams',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0B1F5B),
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/exams'),
              borderRadius: BorderRadius.circular(12),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF0877FF),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: Color(0xFF0877FF),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        LayoutBuilder(
          builder: (context, constraints) {
            final availableWidth = constraints.maxWidth;
            final gap = (availableWidth * 0.022).clamp(8.0, 16.0);

            return Row(
              children: [
                for (int i = 0; i < popularExams.length; i++) ...[
                  if (i > 0) SizedBox(width: gap),
                  Expanded(
                    child: AspectRatio(
                      aspectRatio: 3 / 2,
                      child: _buildPopularExamCard(context, popularExams[i]),
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildPopularExamCard(
    BuildContext context,
    _PopularExamCardItem item,
  ) {
    return Semantics(
      label: '${item.title}, ${item.testsCount}',
      button: true,
      child: InkWell(
        onTap: () {
          _handleTabNavigation(1, item.route);
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0B1F5B).withValues(alpha: 0.10),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.asset(
                  item.imageAsset,
                  fit: BoxFit.fill,
                  errorBuilder: (_, _, _) => _buildFallbackExamCard(item),
                ),
                // Subtle glassy/glossy surface reflection highlight
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        stops: const [0.0, 0.35, 0.7, 1.0],
                        colors: [
                          Colors.white.withValues(alpha: 0.16),
                          Colors.white.withValues(alpha: 0.05),
                          Colors.white.withValues(alpha: 0.0),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFallbackExamCard(_PopularExamCardItem item) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: item.gradientColors,
        ),
      ),
      child: Stack(
        children: [
          // Background subtle monument/figure silhouette
          const Positioned(
            left: -10,
            top: 10,
            child: Opacity(
              opacity: 0.18,
              child: Icon(
                Icons.account_balance_rounded,
                size: 90,
                color: Colors.white,
              ),
            ),
          ),
          const Positioned(
            right: 12,
            top: 16,
            child: Opacity(
              opacity: 0.22,
              child: Icon(
                Icons.person_outline_rounded,
                size: 80,
                color: Colors.white,
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              children: [
                // Upper-center emblem
                Center(
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.18),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: _buildPopularExamEmblem(item.emblemType),
                  ),
                ),
                const SizedBox(height: 8),
                // Exam name on one line
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                  ),
                ),
                const Spacer(),
                // Bottom row: calendar test count + circular arrow button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 15,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          item.testsCount,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.arrow_forward_rounded,
                        size: 18,
                        color: item.arrowColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPopularExamEmblem(String type) {
    switch (type) {
      case 'wbp_shield':
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFFE0F2FE), Color(0xFFBAE6FD)],
            ),
            border: Border.all(color: Colors.white, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.all(4),
          child: Image.asset(
            'assets/images/exams/emblem_wbp.png',
            fit: BoxFit.contain,
            errorBuilder: (_, _, _) => const Icon(
              Icons.shield_rounded,
              color: Color(0xFF0284C7),
              size: 20,
            ),
          ),
        );
      case 'kp_crest':
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFF3B1D9E), Color(0xFF1E0B6E)],
            ),
            border: Border.all(color: const Color(0xFFC4B5FD), width: 1.8),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4C1D95).withValues(alpha: 0.16),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.6),
                    width: 1,
                  ),
                ),
              ),
              const Icon(
                Icons.local_police_rounded,
                color: Colors.white,
                size: 22,
              ),
            ],
          ),
        );
      case 'ssc_red':
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
            ),
            border: Border.all(color: const Color(0xFFF59E0B), width: 2.0),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFDC2626).withValues(alpha: 0.18),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.all(4),
          child: Image.asset(
            'assets/images/exams/emblem_ssc.png',
            fit: BoxFit.contain,
            errorBuilder: (_, _, _) => const Icon(
              Icons.account_balance_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
        );
      case 'railway_red':
        return Image.asset(
          'assets/images/exams/emblem_railway.png',
          fit: BoxFit.contain,
        );
      case 'wbssc_red':
      default:
        return Image.asset(
          'assets/images/exams/emblem_wbssc.png',
          fit: BoxFit.contain,
        );
    }
  }

  // ==========================================
  // 6. POPULAR TEST SERIES SECTION (SOFT PASTEL CARDS & COMPACT LANDSCAPE)
  // ==========================================
  Widget _buildPopularTestSeriesSection(List<TestSeriesModel> seriesList) {
    const seriesItems = [
      _PopularTestSeriesCardItem(
        title: 'WBP Constable',
        subtitle: 'Test Series 2026',
        badge: '🔥 Bestseller',
        badgeBg: Color(0xFFFFEDD5),
        badgeColor: Color(0xFFC2410C),
        emblemAsset: 'assets/images/exams/emblem_series_wbp.png',
        emblemType: 'wbp_shield',
        imageAsset: 'assets/images/series_wbp_bg.png',
        gradientColors: [Color(0xFFE8F4FE), Color(0xFFD8EBFA)],
        shadowColor: Color(0x100B1F5B),
        arrowColor: Color(0xFF0877FF),
        route: '/exams',
      ),
      _PopularTestSeriesCardItem(
        title: 'KP Constable',
        subtitle: 'Test Series 2026',
        badge: '⭐ Most Popular',
        badgeBg: Color(0xFFFEF3C7),
        badgeColor: Color(0xFFB45309),
        emblemAsset: 'assets/images/exams/emblem_series_kp.png',
        emblemType: 'kp_crest',
        imageAsset: 'assets/images/series_kp_bg.png',
        gradientColors: [Color(0xFFF3EDFD), Color(0xFFE8DFFC)],
        shadowColor: Color(0x100B1F5B),
        arrowColor: Color(0xFF7C3AED),
        route: '/exams',
      ),
      _PopularTestSeriesCardItem(
        title: 'SSC GD',
        subtitle: 'Test Series 2026',
        badge: '🔥 Bestseller',
        badgeBg: Color(0xFFFFEDD5),
        badgeColor: Color(0xFFC2410C),
        emblemAsset: 'assets/images/exams/emblem_series_ssc.png',
        emblemType: 'ssc_red',
        imageAsset: 'assets/images/series_ssc_bg.png',
        gradientColors: [Color(0xFFFFF2EB), Color(0xFFFFE5D6)],
        shadowColor: Color(0x100B1F5B),
        arrowColor: Color(0xFFEA580C),
        route: '/exams',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('👑', style: TextStyle(fontSize: 20)),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Popular Test Series',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0B1F5B),
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/exams'),
              borderRadius: BorderRadius.circular(12),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF0877FF),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: Color(0xFF0877FF),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _PopularTestSeriesCarousel(
          items: seriesItems,
          emblemBuilder: _buildPopularExamEmblem,
          onNavigate: _handleTabNavigation,
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  // ==========================================
  // 7. CONTINUE PRACTICING
  // ==========================================
  Widget _buildContinuePracticingSection() {
    final practiceItems = [
      const _ContinuePracticeItem(
        examBadge: 'WBP Constable',
        examColor: Color(0xFF0066FF),
        badgeBg: Color(0xFFE0EDFF),
        testName: 'Mock Test 12',
        subject: 'General Knowledge',
        completedQuestions: 7,
        totalQuestions: 20,
        progressPercent: 0.35,
        emblemAsset: 'assets/images/exams/emblem_series_wbp.png',
        emblemType: 'wbp',
        accentColor: Color(0xFF0066FF),
        buttonColor: Color(0xFF0066FF),
        bgGradient: [Color(0xFFF1F6FE), Color(0xFFE4EFFF)],
        progressTrackColor: Color(0xFFD6E4F7),
        route: '/tests/wbp-12',
        bgImageAsset: 'assets/images/series_wbp_bg.png',
      ),
      const _ContinuePracticeItem(
        examBadge: 'KP Constable',
        examColor: Color(0xFF6B21A8),
        badgeBg: Color(0xFFF0E5FA),
        testName: 'Mock Test 08',
        subject: 'Reasoning',
        completedQuestions: 12,
        totalQuestions: 25,
        progressPercent: 0.48,
        emblemAsset: 'assets/images/exams/emblem_series_kp.png',
        emblemType: 'kp',
        accentColor: Color(0xFF6B21A8),
        buttonColor: Color(0xFF6B21A8),
        bgGradient: [Color(0xFFF9F4FD), Color(0xFFEFE5FC)],
        progressTrackColor: Color(0xFFE8DBF8),
        route: '/tests/kp-08',
        bgImageAsset: 'assets/images/series_kp_bg.png',
      ),
      const _ContinuePracticeItem(
        examBadge: 'SSC GD',
        examColor: Color(0xFFEA580C),
        badgeBg: Color(0xFFFFECE0),
        testName: 'Practice Set 05',
        subject: 'Mathematics',
        completedQuestions: 10,
        totalQuestions: 30,
        progressPercent: 0.33,
        emblemAsset: 'assets/images/exams/emblem_series_ssc.png',
        emblemType: 'ssc',
        accentColor: Color(0xFFEA580C),
        buttonColor: Color(0xFFEA580C),
        bgGradient: [Color(0xFFFFF6F0), Color(0xFFFEEADF)],
        progressTrackColor: Color(0xFFFCDDCE),
        route: '/tests/ssc-05',
        bgImageAsset: 'assets/images/series_ssc_bg.png',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 34,
                height: 34,
                child: Image.asset(
                  'assets/images/continue_play_icon.png',
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00E676), Color(0xFF00C853)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF00C853).withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                'Continue Practice',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0B1F5B),
                  letterSpacing: -0.3,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/practice'),
              borderRadius: BorderRadius.circular(12),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF0877FF),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: Color(0xFF0877FF),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final availableWidth = constraints.maxWidth;
            final isCompact = availableWidth < 600;
            final gap = isCompact ? 10.0 : 14.0;
            // 2 complete cards + 1 gap between them + 1 gap to 3rd card + ~22% peek of 3rd card
            final cardWidth = isCompact
                ? ((availableWidth - (2 * gap)) / 2.22).clamp(140.0, 260.0)
                : ((availableWidth - (2 * gap)) / 2.25).clamp(240.0, 390.0);
            final cardHeight = isCompact ? 154.0 : 166.0;

            return SizedBox(
              height: cardHeight,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: practiceItems.length,
                separatorBuilder: (_, _) => SizedBox(width: gap),
                itemBuilder: (context, index) {
                  final item = practiceItems[index];
                  return _buildContinuePracticeCard(
                    item,
                    width: cardWidth,
                    isCompact: isCompact,
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildContinuePracticeCard(
    _ContinuePracticeItem item, {
    required double width,
    required bool isCompact,
  }) {
    return Container(
      width: width,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: item.bgGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: Colors.white,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: item.accentColor.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16.5),
        child: Stack(
          children: [
            // Decorative background monument silhouette
            if (item.bgImageAsset.isNotEmpty)
              Positioned.fill(
                child: Opacity(
                  opacity: 0.85,
                  child: Image.asset(
                    item.bgImageAsset,
                    fit: BoxFit.cover,
                    alignment: Alignment.centerRight,
                    errorBuilder: (_, _, _) => const SizedBox(),
                  ),
                ),
              ),
            // Card foreground content
            Padding(
              padding: EdgeInsets.fromLTRB(
                isCompact ? 12 : 16,
                isCompact ? 10 : 12,
                isCompact ? 12 : 16,
                isCompact ? 10 : 11,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top Row: Exam badge pill + Test Name & Subject (Left) + Full Unclipped Emblem (Right)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: isCompact ? 7 : 9,
                                vertical: isCompact ? 2 : 3,
                              ),
                              decoration: BoxDecoration(
                                color: item.badgeBg,
                                borderRadius: BorderRadius.circular(isCompact ? 8 : 10),
                              ),
                              child: Text(
                                item.examBadge,
                                style: TextStyle(
                                  fontSize: isCompact ? 9.5 : 10.5,
                                  fontWeight: FontWeight.w700,
                                  color: item.examColor,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            SizedBox(height: isCompact ? 3.5 : 5),
                            Text(
                              item.testName,
                              style: TextStyle(
                                fontSize: isCompact ? 13.0 : 14.5,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0B1F5B),
                                letterSpacing: -0.2,
                                height: 1.15,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            SizedBox(height: isCompact ? 1.5 : 2),
                            Text(
                              item.subject,
                              style: TextStyle(
                                fontSize: isCompact ? 10.5 : 11.5,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF64748B),
                                height: 1.15,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Full unclipped exam emblem
                      SizedBox(
                        width: isCompact ? 38 : 50,
                        height: isCompact ? 38 : 50,
                        child: Image.asset(
                          item.emblemAsset,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) =>
                              _buildPopularExamEmblem(item.emblemType),
                        ),
                      ),
                    ],
                  ),
                  // Progress Count & Percentage + Bar
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              '${item.completedQuestions}/${item.totalQuestions} questions',
                              style: TextStyle(
                                fontSize: isCompact ? 9.5 : 11,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF334155),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${(item.progressPercent * 100).toInt()}%',
                            style: TextStyle(
                              fontSize: isCompact ? 10.5 : 11.5,
                              fontWeight: FontWeight.w800,
                              color: item.accentColor,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: isCompact ? 3.5 : 4.5),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: item.progressPercent,
                          backgroundColor: item.progressTrackColor,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(item.accentColor),
                          minHeight: isCompact ? 4.5 : 5.5,
                        ),
                      ),
                    ],
                  ),
                  // Continue Test button
                  InkWell(
                    onTap: () => _handleTabNavigation(1, item.route),
                    borderRadius: BorderRadius.circular(isCompact ? 10 : 12),
                    child: Container(
                      width: double.infinity,
                      padding: EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: isCompact ? 6.5 : 7.5,
                      ),
                      decoration: BoxDecoration(
                        color: item.buttonColor,
                        borderRadius: BorderRadius.circular(isCompact ? 10 : 12),
                        boxShadow: [
                          BoxShadow(
                            color: item.buttonColor.withValues(alpha: 0.28),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Continue Test',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: isCompact ? 11 : 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              size: isCompact ? 13 : 14,
                              color: Colors.white,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // 8. TOP PERFORMERS
  // ==========================================
  Widget _buildTopPerformersSection() {
    final performers = [
      const _TopPerformerItem(
        rank: 1,
        name: 'Rahul Das',
        score: '94%',
        exam: 'WBP Constable',
        testsAttempted: '32 Tests Attempted',
        avatarAsset: 'assets/images/performer_rahul.png',
        badgeAsset: 'assets/images/performer_badge_1.png',
        rankColor: Color(0xFFF59E0B),
        rankBadgeBg: Color(0xFFFFF0D6),
        ribbonColor: Color(0xFFEF4444),
        bgGradient: [Color(0xFFFFFDF5), Color(0xFFFFF7E8)],
        pillBg: Color(0xFFFEE8CE),
        pillTextColor: Color(0xFF9A3412),
        confettiColors: [Color(0xFFF59E0B), Color(0xFFF97316), Color(0xFFFBBF24)],
      ),
      const _TopPerformerItem(
        rank: 2,
        name: 'Amit Kumar',
        score: '92%',
        exam: 'KP Constable',
        testsAttempted: '28 Tests Attempted',
        avatarAsset: 'assets/images/performer_amit.png',
        badgeAsset: 'assets/images/performer_badge_2.png',
        rankColor: Color(0xFF0066FF),
        rankBadgeBg: Color(0xFFE0EDFF),
        ribbonColor: Color(0xFF2563EB),
        bgGradient: [Color(0xFFF4F8FD), Color(0xFFE9F3FE)],
        pillBg: Color(0xFFDBEAFE),
        pillTextColor: Color(0xFF1D4ED8),
        confettiColors: [Color(0xFF0066FF), Color(0xFF38BDF8), Color(0xFF60A5FA)],
      ),
      const _TopPerformerItem(
        rank: 3,
        name: 'Sneha Roy',
        score: '89%',
        exam: 'SSC GD',
        testsAttempted: '25 Tests Attempted',
        avatarAsset: 'assets/images/performer_sneha.png',
        badgeAsset: 'assets/images/performer_badge_3.png',
        rankColor: Color(0xFFEA580C),
        rankBadgeBg: Color(0xFFFFECE0),
        ribbonColor: Color(0xFFC2410C),
        bgGradient: [Color(0xFFFFF7F2), Color(0xFFFDECE3)],
        pillBg: Color(0xFFFFE5DA),
        pillTextColor: Color(0xFF9A3412),
        confettiColors: [Color(0xFFEA580C), Color(0xFFF87171), Color(0xFFFBBF24)],
      ),
      const _TopPerformerItem(
        rank: 4,
        name: 'Priya Sharma',
        score: '86%',
        exam: 'WBP Constable',
        testsAttempted: '22 Tests Attempted',
        avatarAsset: 'assets/images/performer_priya.png',
        badgeAsset: 'assets/images/performer_badge_4.png',
        rankColor: Color(0xFF059669),
        rankBadgeBg: Color(0xFFD1FAE5),
        ribbonColor: Color(0xFF0F766E),
        bgGradient: [Color(0xFFF2FBF6), Color(0xFFE4F8EE)],
        pillBg: Color(0xFFD1FAE5),
        pillTextColor: Color(0xFF065F46),
        confettiColors: [Color(0xFF059669), Color(0xFF34D399), Color(0xFF6EE7B7)],
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Clean single-line header matching reference image
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 28,
                    height: 28,
                    child: Image.asset(
                      'assets/images/performer_trophy.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const Text(
                        '🏆',
                        style: TextStyle(fontSize: 22),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Flexible(
                    child: Text(
                      'Top Performers',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF07194A),
                        letterSpacing: -0.4,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/leaderboard'),
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View Leaderboard',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF0066FF),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: Color(0xFF0066FF),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        LayoutBuilder(
          builder: (context, constraints) {
            final availableWidth = constraints.maxWidth;
            final bool isWide = availableWidth >= 700;
            final double gap = isWide ? 14 : 12;

            // Compute square card dimension (exact 1:1 aspect ratio)
            // On desktop/tablet, 3 cards visible + peek; on mobile, cards sized cleanly with 1:1 ratio
            final double cardWidth = isWide
                ? ((availableWidth - 3 * gap) / 3.25).clamp(200.0, 275.0)
                : ((availableWidth - 2 * gap) / 2.25).clamp(152.0, 205.0);

            // True 1:1 aspect ratio: card width and height are strictly equal
            final double cardHeight = cardWidth;

            return SizedBox(
              height: cardHeight,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: performers.length,
                separatorBuilder: (_, _) => SizedBox(width: gap),
                itemBuilder: (context, index) {
                  final item = performers[index];
                  return _buildTopPerformerCard(
                    item,
                    width: cardWidth,
                    height: cardHeight,
                    isWide: isWide,
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTopPerformerCard(
    _TopPerformerItem item, {
    required double width,
    required double height,
    required bool isWide,
  }) {
    return AspectRatio(
      aspectRatio: 1.0,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: item.bgGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(isWide ? 22 : 18),
          border: Border.all(color: Colors.white, width: isWide ? 2.0 : 1.5),
          boxShadow: [
            BoxShadow(
              color: item.rankColor.withValues(alpha: 0.09),
              blurRadius: isWide ? 14 : 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(isWide ? 20 : 16.5),
          child: Stack(
            children: [
              // Subtle Crown Watermark in bottom right
              Positioned(
                bottom: isWide ? 14 : 8,
                right: -2,
                child: CustomPaint(
                  size: Size(isWide ? 64 : 44, isWide ? 46 : 32),
                  painter: _CrownWatermarkPainter(color: item.rankColor),
                ),
              ),
              // Confetti flecks around the avatar
              Positioned(
                top: isWide ? 16 : 10,
                left: isWide ? 52 : 32,
                child: _buildConfettiDot(
                  isWide ? 6 : 4,
                  isWide ? 10 : 7,
                  -0.4,
                  item.confettiColors[0],
                ),
              ),
              Positioned(
                top: isWide ? 42 : 26,
                left: isWide ? 30 : 16,
                child: _buildConfettiDot(
                  isWide ? 5 : 3.5,
                  isWide ? 5 : 3.5,
                  0.5,
                  item.confettiColors[0],
                ),
              ),
              Positioned(
                top: isWide ? 14 : 9,
                right: isWide ? 44 : 24,
                child: _buildConfettiDot(
                  isWide ? 6 : 4,
                  isWide ? 10 : 6,
                  0.45,
                  item.confettiColors[1],
                ),
              ),
              Positioned(
                top: isWide ? 38 : 24,
                right: isWide ? 28 : 16,
                child: _buildConfettiDot(
                  isWide ? 5 : 3.5,
                  isWide ? 5 : 3.5,
                  -0.3,
                  item.confettiColors.length > 2
                      ? item.confettiColors[2]
                      : item.confettiColors[0],
                ),
              ),
              Positioned(
                top: isWide ? 24 : 15,
                right: isWide ? 14 : 8,
                child: _buildConfettiDot(
                  isWide ? 5 : 3.5,
                  isWide ? 5 : 3.5,
                  0.35,
                  item.confettiColors[0],
                ),
              ),
              // Rank Rosette Medal Badge (top-left)
              Positioned(
                top: isWide ? 10 : 6,
                left: isWide ? 10 : 6,
                child: _buildRankRosette(
                  item.rank,
                  item.rankColor,
                  item.ribbonColor,
                  item.badgeAsset,
                  isWide: isWide,
                ),
              ),
              // Content Center Column (Vertically and Horizontally Centered)
              Positioned.fill(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: isWide ? 10 : 6,
                    vertical: isWide ? 8 : 6,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Avatar with Laurel Wreath
                      SizedBox(
                        width: isWide ? 86 : 58,
                        height: isWide ? 64 : 44,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            CustomPaint(
                              size: Size(isWide ? 86 : 58, isWide ? 64 : 44),
                              painter: _PerformerWreathPainter(
                                wreathColor: item.rankColor,
                              ),
                            ),
                            Container(
                              width: isWide ? 52 : 36,
                              height: isWide ? 52 : 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                                border: Border.all(
                                  color: Colors.white,
                                  width: isWide ? 2.0 : 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: item.rankColor.withValues(alpha: 0.16),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  item.avatarAsset,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, _, _) => Container(
                                    color: item.rankBadgeBg,
                                    alignment: Alignment.center,
                                    child: Text(
                                      item.name.isNotEmpty ? item.name[0] : 'S',
                                      style: TextStyle(
                                        fontSize: isWide ? 20 : 14,
                                        fontWeight: FontWeight.w800,
                                        color: item.rankColor,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: isWide ? 5 : 3),
                      // Name
                      SizedBox(
                        width: double.infinity,
                        child: Text(
                          item.name,
                          style: TextStyle(
                            fontSize: isWide ? 14.5 : 11.5,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF07194A),
                            letterSpacing: -0.2,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ),
                      ),
                      SizedBox(height: isWide ? 3 : 2),
                      // Score
                      SizedBox(
                        width: double.infinity,
                        child: Text(
                          item.score,
                          style: TextStyle(
                            fontSize: isWide ? 19 : 14.5,
                            fontWeight: FontWeight.w900,
                            color: item.rankColor,
                            height: 1.0,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      SizedBox(height: isWide ? 4 : 2.5),
                      // Exam Tag
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: isWide ? 10 : 6,
                          vertical: isWide ? 3 : 1.5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDF2F7),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          item.exam,
                          style: TextStyle(
                            fontSize: isWide ? 11 : 8.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF4B617E),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ),
                      ),
                      SizedBox(height: isWide ? 4 : 2.5),
                      // Tests Attempted Pill
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: isWide ? 10 : 6,
                          vertical: isWide ? 3.5 : 2,
                        ),
                        decoration: BoxDecoration(
                          color: item.pillBg,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.track_changes_rounded,
                              size: isWide ? 12 : 9.5,
                              color: item.pillTextColor,
                            ),
                            SizedBox(width: isWide ? 4 : 3),
                            Flexible(
                              child: Text(
                                item.testsAttempted,
                                style: TextStyle(
                                  fontSize: isWide ? 11 : 8.5,
                                  fontWeight: FontWeight.w700,
                                  color: item.pillTextColor,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConfettiDot(
    double width,
    double height,
    double angle,
    Color color,
  ) {
    return Transform.rotate(
      angle: angle,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.65),
          borderRadius: BorderRadius.circular(1.5),
        ),
      ),
    );
  }

  Widget _buildRankRosette(
    int rank,
    Color color,
    Color ribbonColor,
    String badgeAsset, {
    required bool isWide,
  }) {
    final double badgeWidth = isWide ? 38.0 : 28.0;
    final double badgeHeight = isWide ? 50.0 : 37.0;

    if (badgeAsset.isNotEmpty) {
      return SizedBox(
        width: badgeWidth,
        height: badgeHeight,
        child: Image.asset(
          badgeAsset,
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) => _buildVectorRosette(
            rank,
            color,
            ribbonColor,
            badgeWidth,
            badgeHeight,
          ),
        ),
      );
    }

    return _buildVectorRosette(
      rank,
      color,
      ribbonColor,
      badgeWidth,
      badgeHeight,
    );
  }

  Widget _buildVectorRosette(
    int rank,
    Color color,
    Color ribbonColor,
    double width,
    double height,
  ) {
    return SizedBox(
      width: width,
      height: height,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          CustomPaint(
            size: Size(width, height),
            painter: _RosetteBadgePainter(
              color: color,
              ribbonColor: ribbonColor,
            ),
          ),
          Positioned(
            top: height * 0.30,
            child: Text(
              '$rank',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: width * 0.40,
                height: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 9. TODAY'S INFO & MOTIVATIONAL QUOTE
  // ==========================================
  Widget _buildDailyInfoAndQuoteSection() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth;
        final isWide = availableWidth >= 560;

        if (isWide) {
          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: _buildTodaysInfoCard(isWide: true)),
                const SizedBox(width: 16),
                Expanded(child: _buildMotivationalQuoteCard(isWide: true)),
              ],
            ),
          );
        }

        return Column(
          children: [
            _buildTodaysInfoCard(isWide: false),
            const SizedBox(height: 16),
            _buildMotivationalQuoteCard(isWide: false),
          ],
        );
      },
    );
  }

  Widget _buildTodaysInfoCard({bool isWide = false}) {
    final innerContent = Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2ECF8), width: 1.0),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060D3B66),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Circular container with open-book icon
          Container(
            width: 54,
            height: 54,
            decoration: const BoxDecoration(
              color: Color(0xFFEDF5FF),
              shape: BoxShape.circle,
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/today_info_book_circle.png',
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const Center(
                  child: Icon(
                    Icons.menu_book_rounded,
                    color: Color(0xFF0066FF),
                    size: 26,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Bengali fact text & Indian Polity tag
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'ভারতের সংবিধান ২৬ জানুয়ারি ১৯৫০ সালে গৃহীত হয় এবং সেদিনই কার্যকর হয়।',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF07194A),
                    height: 1.4,
                    letterSpacing: -0.1,
                  ),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => _handleTabNavigation(1, '/study-material'),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBF3FF),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFD7E7FC), width: 0.8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.description_rounded,
                          size: 13,
                          color: Color(0xFF0066FF),
                        ),
                        SizedBox(width: 5),
                        Text(
                          'Indian Polity',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0066FF),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F6FE),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2ECF8), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0D3B66),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 38,
                height: 38,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Image.asset(
                    'assets/images/today_info_sunrise.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F2FC),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: const Icon(
                        Icons.wb_sunny_rounded,
                        color: Color(0xFFF59E0B),
                        size: 22,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "Today's Info",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF07194A),
                        letterSpacing: -0.3,
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Learn something new everyday',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A6E85),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFDBEAFE), width: 1),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.calendar_month_rounded,
                      size: 13,
                      color: Color(0xFF0066FF),
                    ),
                    SizedBox(width: 4),
                    Text(
                      '01 Oct 2026',
                      style: TextStyle(
                        color: Color(0xFF0066FF),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (isWide) Expanded(child: innerContent) else innerContent,
        ],
      ),
    );
  }

  Widget _buildMotivationalQuoteCard({bool isWide = false}) {
    final innerContent = Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFFF6F8),
            Color(0xFFFDECEF),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFCDCE8), width: 1.0),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08F43F5E),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Mountain with summit flag illustration at bottom right
          Positioned(
            right: 0,
            bottom: 0,
            height: 120,
            child: Image.asset(
              'assets/images/quote_mountain_summit.png',
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => const SizedBox(),
            ),
          ),
          // Quote Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  '“',
                  style: TextStyle(
                    fontFamily: 'serif',
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFF43F5E),
                    height: 0.8,
                  ),
                ),
                const SizedBox(height: 4),
                const Padding(
                  padding: EdgeInsets.only(right: 64),
                  child: Text(
                    'ছোট ছোট প্রচেষ্টার যোগফলই বড় সাফল্য, তাই প্রতিদিন একটু একটু করে এগিয়ে চলুন।',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF07194A),
                      height: 1.4,
                      letterSpacing: -0.1,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '— রবার্ট কলিয়ার',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2F6),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFFADBE8), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0AB31942),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 38,
                height: 38,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Image.asset(
                    'assets/images/quote_target_3d.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEDD5),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: const Icon(
                        Icons.track_changes_rounded,
                        color: Color(0xFFEA580C),
                        size: 22,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Motivational Quote',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF07194A),
                        letterSpacing: -0.3,
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Stay inspired, keep going',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A6E85),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (isWide) Expanded(child: innerContent) else innerContent,
        ],
      ),
    );
  }
}

class _PopularTestSeriesCardItem {
  final String title;
  final String subtitle;
  final String badge;
  final Color badgeBg;
  final Color badgeColor;
  final String emblemAsset;
  final String emblemType;
  final String imageAsset;
  final List<Color> gradientColors;
  final Color shadowColor;
  final Color arrowColor;
  final String route;

  const _PopularTestSeriesCardItem({
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.badgeBg,
    required this.badgeColor,
    required this.emblemAsset,
    required this.emblemType,
    required this.imageAsset,
    required this.gradientColors,
    required this.shadowColor,
    required this.arrowColor,
    required this.route,
  });
}

class _PopularTestSeriesCarousel extends StatefulWidget {
  final List<_PopularTestSeriesCardItem> items;
  final Widget Function(String) emblemBuilder;
  final void Function(int, String) onNavigate;

  const _PopularTestSeriesCarousel({
    required this.items,
    required this.emblemBuilder,
    required this.onNavigate,
  });

  @override
  State<_PopularTestSeriesCarousel> createState() =>
      _PopularTestSeriesCarouselState();
}

class _PopularTestSeriesCarouselState
    extends State<_PopularTestSeriesCarousel> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth;
        final isCompact = availableWidth < 600;
        const gap = 12.0;

        // On mobile, show approximately 2 complete cards and a small visible portion of the 3rd card
        final cardWidth = isCompact
            ? ((availableWidth - gap * 1.5) / 2.15).clamp(155.0, 260.0)
            : ((availableWidth - gap * 2) / 2.38).clamp(280.0, 420.0);

        final cardHeight = isCompact
            ? (cardWidth / 1.68).clamp(96.0, 120.0)
            : (cardWidth / 2.38).clamp(120.0, 165.0);

        return SizedBox(
          height: cardHeight,
          child: ListView.separated(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: widget.items.length,
            separatorBuilder: (_, _) => const SizedBox(width: gap),
            itemBuilder: (context, index) {
              final item = widget.items[index];
              return _buildSeriesCard(
                item: item,
                cardWidth: cardWidth,
                cardHeight: cardHeight,
                isCompact: isCompact,
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildSeriesCard({
    required _PopularTestSeriesCardItem item,
    required double cardWidth,
    required double cardHeight,
    required bool isCompact,
  }) {
    final emblemSize = isCompact ? 44.0 : 68.0;
    final arrowSize = isCompact ? 24.0 : 36.0;
    final arrowIconSize = isCompact ? 13.0 : 19.0;
    final titleFontSize = isCompact ? 12.0 : 16.5;
    final subtitleFontSize = isCompact ? 9.0 : 12.0;
    final badgeFontSize = isCompact ? 8.5 : 11.0;

    return Semantics(
      label: '${item.title} ${item.subtitle}',
      button: true,
      child: InkWell(
        onTap: () => widget.onNavigate(1, item.route),
        borderRadius: BorderRadius.circular(18),
        child: Container(
          width: cardWidth,
          height: cardHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.85),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: item.shadowColor,
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(17),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Soft pastel background image with fallback gradient
                Image.asset(
                  item.imageAsset,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: item.gradientColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                ),
                // Card contents in a single horizontal row
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: isCompact ? 8 : 14,
                    vertical: isCompact ? 8 : 12,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Large Emblem on the left
                      SizedBox(
                        width: emblemSize,
                        height: emblemSize,
                        child: Image.asset(
                          item.emblemAsset,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) =>
                              widget.emblemBuilder(item.emblemType),
                        ),
                      ),
                      SizedBox(width: isCompact ? 6 : 10),
                      // Badge + Title + Subtitle in center column
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Pill badge
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: isCompact ? 5 : 8,
                                  vertical: isCompact ? 1.5 : 3,
                                ),
                                decoration: BoxDecoration(
                                  color: item.badgeBg,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  item.badge,
                                  style: TextStyle(
                                    color: item.badgeColor,
                                    fontWeight: FontWeight.w800,
                                    fontSize: badgeFontSize,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(height: isCompact ? 2 : 4),
                            // Title
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Text(
                                item.title,
                                maxLines: 1,
                                style: TextStyle(
                                  color: const Color(0xFF0B1F5B),
                                  fontWeight: FontWeight.w900,
                                  fontSize: titleFontSize,
                                  letterSpacing: -0.3,
                                  height: 1.15,
                                ),
                              ),
                            ),
                            SizedBox(height: isCompact ? 1 : 2),
                            // Subtitle
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Text(
                                item.subtitle,
                                maxLines: 1,
                                style: TextStyle(
                                  color: const Color(0xFF5B6B86),
                                  fontWeight: FontWeight.w600,
                                  fontSize: subtitleFontSize,
                                  letterSpacing: -0.1,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: isCompact ? 4 : 8),
                      // White circular arrow button
                      Container(
                        width: arrowSize,
                        height: arrowSize,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 5,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          size: arrowIconSize,
                          color: item.arrowColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ContinuePracticeItem {
  final String examBadge;
  final Color examColor;
  final Color badgeBg;
  final String testName;
  final String subject;
  final int completedQuestions;
  final int totalQuestions;
  final double progressPercent;
  final String emblemAsset;
  final String emblemType;
  final Color accentColor;
  final Color buttonColor;
  final List<Color> bgGradient;
  final Color progressTrackColor;
  final String route;
  final String bgImageAsset;

  const _ContinuePracticeItem({
    required this.examBadge,
    required this.examColor,
    required this.badgeBg,
    required this.testName,
    required this.subject,
    required this.completedQuestions,
    required this.totalQuestions,
    required this.progressPercent,
    required this.emblemAsset,
    required this.emblemType,
    required this.accentColor,
    required this.buttonColor,
    required this.bgGradient,
    required this.progressTrackColor,
    required this.route,
    this.bgImageAsset = '',
  });
}

class _TopPerformerItem {
  final int rank;
  final String name;
  final String score;
  final String exam;
  final String testsAttempted;
  final String avatarAsset;
  final String badgeAsset;
  final Color rankColor;
  final Color rankBadgeBg;
  final Color ribbonColor;
  final List<Color> bgGradient;
  final Color pillBg;
  final Color pillTextColor;
  final List<Color> confettiColors;

  const _TopPerformerItem({
    required this.rank,
    required this.name,
    required this.score,
    required this.exam,
    required this.testsAttempted,
    required this.avatarAsset,
    this.badgeAsset = '',
    required this.rankColor,
    required this.rankBadgeBg,
    this.ribbonColor = const Color(0xFFEF4444),
    required this.bgGradient,
    required this.pillBg,
    required this.pillTextColor,
    required this.confettiColors,
  });
}

class _PerformerWreathPainter extends CustomPainter {
  final Color wreathColor;

  const _PerformerWreathPainter({required this.wreathColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = wreathColor.withValues(alpha: 0.95)
      ..style = PaintingStyle.fill;

    final stemPaint = Paint()
      ..color = wreathColor.withValues(alpha: 0.90)
      ..style = PaintingStyle.stroke
      ..strokeWidth = (size.width * 0.022).clamp(1.4, 2.4)
      ..strokeCap = StrokeCap.round;

    final cx = size.width / 2;
    final cy = size.height * 0.44;
    final wreathR = size.width * 0.38;

    // Draw left stem arc
    final leftStem = Path();
    for (int i = 0; i <= 20; i++) {
      final t = i / 20.0;
      final ang = math.pi * 0.52 + t * (math.pi * 0.44);
      final x = cx + wreathR * math.cos(ang);
      final y = cy + wreathR * math.sin(ang);
      if (i == 0) {
        leftStem.moveTo(x, y);
      } else {
        leftStem.lineTo(x, y);
      }
    }
    canvas.drawPath(leftStem, stemPaint);

    // Draw right stem arc
    final rightStem = Path();
    for (int i = 0; i <= 20; i++) {
      final t = i / 20.0;
      final ang = math.pi * 0.48 - t * (math.pi * 0.44);
      final x = cx + wreathR * math.cos(ang);
      final y = cy + wreathR * math.sin(ang);
      if (i == 0) {
        rightStem.moveTo(x, y);
      } else {
        rightStem.lineTo(x, y);
      }
    }
    canvas.drawPath(rightStem, stemPaint);

    void drawLeaf(double lx, double ly, double leafAngle, double length, double width) {
      final cosA = math.cos(leafAngle);
      final sinA = math.sin(leafAngle);
      final path = Path()
        ..moveTo(lx, ly)
        ..lineTo(lx + cosA * length * 0.5 - sinA * width * 0.5, ly + sinA * length * 0.5 + cosA * width * 0.5)
        ..lineTo(lx + cosA * length, ly + sinA * length)
        ..lineTo(lx + cosA * length * 0.5 + sinA * width * 0.5, ly + sinA * length * 0.5 - cosA * width * 0.5)
        ..close();
      canvas.drawPath(path, paint);
    }

    final leafScale = size.width / 102.0;

    // Left branch leaves (5 pairs)
    for (int i = 0; i < 5; i++) {
      final t = (i + 0.5) / 5.0;
      final ang = math.pi * 0.52 + t * (math.pi * 0.44);
      final lx = cx + wreathR * math.cos(ang);
      final ly = cy + wreathR * math.sin(ang);

      final outerAng = ang + math.pi * 0.55;
      drawLeaf(lx, ly, outerAng, 9.5 * leafScale, 4.8 * leafScale);

      final innerAng = ang + math.pi * 0.25;
      drawLeaf(lx, ly, innerAng, 8.0 * leafScale, 4.0 * leafScale);
    }

    // Right branch leaves (5 pairs)
    for (int i = 0; i < 5; i++) {
      final t = (i + 0.5) / 5.0;
      final ang = math.pi * 0.48 - t * (math.pi * 0.44);
      final rx = cx + wreathR * math.cos(ang);
      final ry = cy + wreathR * math.sin(ang);

      final outerAng = ang - math.pi * 0.55;
      drawLeaf(rx, ry, outerAng, 9.5 * leafScale, 4.8 * leafScale);

      final innerAng = ang - math.pi * 0.25;
      drawLeaf(rx, ry, innerAng, 8.0 * leafScale, 4.0 * leafScale);
    }
  }

  @override
  bool shouldRepaint(covariant _PerformerWreathPainter oldDelegate) =>
      oldDelegate.wreathColor != wreathColor;
}

class _CrownWatermarkPainter extends CustomPainter {
  final Color color;

  const _CrownWatermarkPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.075)
      ..style = PaintingStyle.fill;

    final w = size.width;
    final h = size.height;
    final baseY = h * 0.85;

    final path = Path()
      ..moveTo(w * 0.12, baseY)
      ..lineTo(w * 0.18, h * 0.32)
      ..lineTo(w * 0.35, h * 0.58)
      ..lineTo(w * 0.50, h * 0.16)
      ..lineTo(w * 0.65, h * 0.58)
      ..lineTo(w * 0.82, h * 0.32)
      ..lineTo(w * 0.88, baseY)
      ..close();

    canvas.drawPath(path, paint);

    // Tip balls
    canvas.drawCircle(Offset(w * 0.18, h * 0.26), w * 0.065, paint);
    canvas.drawCircle(Offset(w * 0.50, h * 0.10), w * 0.08, paint);
    canvas.drawCircle(Offset(w * 0.82, h * 0.26), w * 0.065, paint);

    // Base band
    final baseRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.10, baseY - 2, w * 0.80, h * 0.14),
      const Radius.circular(3),
    );
    canvas.drawRRect(baseRect, paint);
  }

  @override
  bool shouldRepaint(covariant _CrownWatermarkPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _RosetteBadgePainter extends CustomPainter {
  final Color color;
  final Color ribbonColor;

  const _RosetteBadgePainter({
    required this.color,
    this.ribbonColor = const Color(0xFFEF4444),
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Ribbons
    final ribbonPaint = Paint()
      ..color = ribbonColor.withValues(alpha: 0.95)
      ..style = PaintingStyle.fill;

    final ribbonShadowPaint = Paint()
      ..color = ribbonColor.withValues(alpha: 0.78)
      ..style = PaintingStyle.fill;

    // Left ribbon tail
    final pathLeft = Path()
      ..moveTo(w * 0.30, h * 0.45)
      ..lineTo(w * 0.16, h * 0.95)
      ..lineTo(w * 0.32, h * 0.82)
      ..lineTo(w * 0.44, h * 0.95)
      ..lineTo(w * 0.48, h * 0.45)
      ..close();
    canvas.drawPath(pathLeft, ribbonPaint);

    // Right ribbon tail
    final pathRight = Path()
      ..moveTo(w * 0.52, h * 0.45)
      ..lineTo(w * 0.56, h * 0.95)
      ..lineTo(w * 0.68, h * 0.82)
      ..lineTo(w * 0.84, h * 0.95)
      ..lineTo(w * 0.70, h * 0.45)
      ..close();
    canvas.drawPath(pathRight, ribbonShadowPaint);

    final center = Offset(w / 2, h * 0.38);
    final discRadius = w * 0.42;

    // Outer rim circle
    final rimPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          color.withValues(alpha: 0.90),
          Colors.white.withValues(alpha: 0.85),
          color,
          color.withValues(alpha: 0.75),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromCircle(center: center, radius: discRadius))
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, discRadius, rimPaint);

    // Inner disc circle
    final innerPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, discRadius * 0.82, innerPaint);

    // Tiny crown on top of number
    final crownPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final crownW = discRadius * 0.58;
    final crownH = discRadius * 0.28;
    final crownTop = center.dy - discRadius * 0.62;

    final crownPath = Path()
      ..moveTo(center.dx - crownW / 2, crownTop + crownH)
      ..lineTo(center.dx - crownW / 2, crownTop + crownH * 0.3)
      ..lineTo(center.dx - crownW * 0.25, crownTop + crownH * 0.65)
      ..lineTo(center.dx, crownTop)
      ..lineTo(center.dx + crownW * 0.25, crownTop + crownH * 0.65)
      ..lineTo(center.dx + crownW / 2, crownTop + crownH * 0.3)
      ..lineTo(center.dx + crownW / 2, crownTop + crownH)
      ..close();
    canvas.drawPath(crownPath, crownPaint);
  }

  @override
  bool shouldRepaint(covariant _RosetteBadgePainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.ribbonColor != ribbonColor;
}



