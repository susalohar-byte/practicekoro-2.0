import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
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

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _recommendedFilter = 'Test Series';
  String _rankTab = 'All India';
  Timer? _countdownTimer;

  static const List<Map<String, dynamic>> _subjectCards = [
    {
      'id': 'math',
      'title': 'Mathematics',
      'subtitle': 'Topic Practice',
      'color': Color(0xFF2563EB),
      'symbol': '∑',
    },
    {
      'id': 'reasoning',
      'title': 'Reasoning',
      'subtitle': 'Topic Practice',
      'color': Color(0xFFF43F5E),
      'symbol': '🎗',
    },
    {
      'id': 'gk',
      'title': 'General Knowledge',
      'subtitle': 'Topic Practice',
      'color': Color(0xFF10B981),
      'symbol': '🌐',
    },
    {
      'id': 'english',
      'title': 'English',
      'subtitle': 'Topic Practice',
      'color': Color(0xFF9333EA),
      'symbol': 'A',
    },
    {
      'id': 'bengali',
      'title': 'Bengali',
      'subtitle': 'Topic Practice',
      'color': Color(0xFFF59E0B),
      'symbol': 'অ',
    },
    {
      'id': 'computer',
      'title': 'Computer Awareness',
      'subtitle': 'Topic Practice',
      'color': Color(0xFF0EA5E9),
      'symbol': '💻',
    },
    {
      'id': 'current-affairs',
      'title': 'Current Affairs',
      'subtitle': 'Topic Practice',
      'color': Color(0xFFEC4899),
      'symbol': '📅',
    },
    {
      'id': 'environment',
      'title': 'Environment',
      'subtitle': 'Topic Practice',
      'color': Color(0xFF14B8A6),
      'symbol': '🌱',
    },
  ];

  @override
  void initState() {
    super.initState();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
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

  String _currentUserName() {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final metaName = user.userMetadata?['full_name'] as String?;
        if (metaName != null && metaName.trim().isNotEmpty) {
          return metaName.trim();
        }
        if (user.email != null && user.email!.isNotEmpty) {
          return user.email!.split('@').first;
        }
      }
    } catch (_) {}
    return 'Candidate';
  }

  List<Map<String, dynamic>> _buildSearchableItems({
    required List<ExamModel> exams,
    required List<TestSeriesModel> series,
    required List<MockTestModel> tests,
  }) {
    final items = <Map<String, dynamic>>[];
    for (final e in exams) {
      items.add({
        'title': e.title,
        'type': e.category,
        'category': 'exam',
        'route': '/exams/${e.id}',
      });
    }
    for (final s in series) {
      items.add({
        'title': s.title,
        'type': s.examTitle ?? 'Test Series',
        'category': 'series',
        'route': '/test-series/${s.id}',
      });
    }
    for (final t in tests) {
      final encTitle = Uri.encodeComponent(t.title);
      items.add({
        'title': t.title,
        'type': '${t.totalQuestions} Questions • ${t.durationMinutes} Mins',
        'category': 'test',
        'route': '/test-details/${t.id}?title=$encTitle&isPro=${t.isPremium}',
      });
    }
    return items;
  }

  void _openLiveSearchModal({
    required List<ExamModel> exams,
    required List<TestSeriesModel> series,
    required List<MockTestModel> tests,
  }) {
    final searchableItems = _buildSearchableItems(
      exams: exams,
      series: series,
      tests: tests,
    );
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildLiveSearchSheet(ctx, searchableItems),
    );
  }

  Widget _buildLiveSearchSheet(
    BuildContext context,
    List<Map<String, dynamic>> searchableItems,
  ) {
    return StatefulBuilder(
      builder: (context, setModalState) {
        final query = _searchController.text.trim().toLowerCase();
        final results = query.isEmpty
            ? searchableItems
            : searchableItems.where((item) {
                final t = (item['title'] as String).toLowerCase();
                final typ = (item['type'] as String).toLowerCase();
                return t.contains(query) || typ.contains(query);
              }).toList();

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
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
                        color: const Color(0xFFEDF2F7),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        autofocus: true,
                        decoration: InputDecoration(
                          hintText:
                              'Search exams, tests, subjects or topics...',
                          hintStyle: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF64748B),
                          ),
                          prefixIcon: const Icon(
                            Icons.search_rounded,
                            color: Color(0xFF64748B),
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
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildSearchFilterChip('WBP Constable', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('Mock Test', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('General Knowledge', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('Mathematics', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('PYQ', setModalState),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '${results.length} Results Found',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: results.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.search_off_rounded,
                              size: 48,
                              color: Color(0xFFCBD5E1),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              query.isEmpty
                                  ? 'Start typing to search exams or mock tests'
                                  : 'No tests or topics found for "$query"',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: results.length,
                        separatorBuilder: (_, _) =>
                            const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        itemBuilder: (context, idx) {
                          final item = results[idx];
                          final isTest = item['category'] == 'test';
                          final isSeries = item['category'] == 'series';

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isTest
                                    ? const Color(0xFFEFF6FF)
                                    : isSeries
                                    ? const Color(0xFFFEF3C7)
                                    : const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isTest
                                    ? Icons.assignment_outlined
                                    : isSeries
                                    ? Icons.layers_outlined
                                    : Icons.school_outlined,
                                color: isTest
                                    ? const Color(0xFF0158FC)
                                    : isSeries
                                    ? const Color(0xFFD97706)
                                    : const Color(0xFF10B981),
                                size: 20,
                              ),
                            ),
                            title: Text(
                              item['title'] as String,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            subtitle: Text(
                              item['type'] as String,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0158FC),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Open',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
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
  }

  Widget _buildSearchFilterChip(
    String label,
    void Function(void Function()) setModalState,
  ) {
    final isSelected =
        _searchController.text.trim().toLowerCase() == label.toLowerCase();
    return InkWell(
      onTap: () {
        setModalState(() {
          if (isSelected) {
            _searchController.clear();
          } else {
            _searchController.text = label;
          }
        });
      },
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0158FC) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF0158FC)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final liveTestAsync = ref.watch(activeLiveTestProvider);
    final popularSeriesAsync = ref.watch(popularTestSeriesProvider);
    final examsAsync = ref.watch(homeExamsProvider);
    final mockTestsAsync = ref.watch(homeMockTestsProvider);
    final scopeKey = _rankTab == 'West Bengal' ? 'west_bengal' : 'all_india';
    final leaderboardAsync = ref.watch(homeLeaderboardProvider(scopeKey));

    final popularList = popularSeriesAsync.value ?? <TestSeriesModel>[];
    final examsList = examsAsync.value ?? <ExamModel>[];
    final mockTestsList = mockTestsAsync.value ?? <MockTestModel>[];
    final leaderboardList = leaderboardAsync.value ?? <LeaderboardEntry>[];

    final completedAttempts = LocalStorageService.getAttempts();
    final totalCorrect = completedAttempts.fold<int>(
      0,
      (sum, a) => sum + a.correctCount,
    );
    final totalWrong = completedAttempts.fold<int>(
      0,
      (sum, a) => sum + a.wrongCount,
    );
    final totalSkipped = completedAttempts.fold<int>(
      0,
      (sum, a) => sum + a.skippedCount,
    );
    final totalQ = totalCorrect + totalWrong + totalSkipped;
    final overallAccuracyPct = completedAttempts.isEmpty
        ? 0
        : (completedAttempts.fold<double>(0, (s, a) => s + a.accuracy) /
                  completedAttempts.length)
              .round();
    final activeStreakDays = completedAttempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;
    final isPro = LocalStorageService.isProUser();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildStudentNavbar(
              exams: examsList,
              series: popularList,
              tests: mockTestsList,
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(activeLiveTestProvider);
                  ref.invalidate(popularTestSeriesProvider);
                  ref.invalidate(homeExamsProvider);
                  ref.invalidate(homeMockTestsProvider);
                  ref.invalidate(homeLeaderboardProvider(scopeKey));
                  await Future.delayed(const Duration(milliseconds: 300));
                },
                color: const Color(0xFF0158FC),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  children: [
                    // 1. Dynamic Hero Banner (Website Section 1)
                    _buildHeroBanner(),
                    const SizedBox(height: 16),

                    // 2. 4 Stat Cards (Website Section 2)
                    _buildFourStatCards(
                      testsTaken: completedAttempts.length,
                      questionsPracticed: totalCorrect + totalWrong,
                      accuracyPct: overallAccuracyPct,
                      streakDays: activeStreakDays,
                    ),
                    const SizedBox(height: 16),

                    // 3. Live Test Card (Website Section 3 - Dark #0F172A Card)
                    liveTestAsync.when(
                      data: (liveTest) => liveTest == null
                          ? const SizedBox.shrink()
                          : Padding(
                              padding: const EdgeInsets.only(bottom: 20),
                              child: _buildWebsiteLiveTestCard(liveTest),
                            ),
                      loading: () => Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: _buildLiveTestLoadingState(),
                      ),
                      error: (_, _) => const SizedBox.shrink(),
                    ),

                    // 5. Popular Test Series (Website Section 5)
                    _buildPopularTestSeriesSection(
                      popularList,
                      isLoading: popularSeriesAsync.isLoading,
                      hasError: popularSeriesAsync.hasError,
                    ),
                    const SizedBox(height: 24),

                    // 6. Practice by Subject (Website Section 6)
                    _buildPracticeBySubjectSection(),
                    const SizedBox(height: 24),

                    // 7. Recommended for You (Website Section 7)
                    _buildRecommendedForYouSection(mockTestsList),
                    const SizedBox(height: 24),

                    // 8. Your Progress (Website Section 8)
                    _buildYourProgressSection(
                      overallAccuracyPct: overallAccuracyPct,
                      totalCorrect: totalCorrect,
                      totalWrong: totalWrong,
                      totalSkipped: totalSkipped,
                      totalQ: totalQ,
                    ),
                    const SizedBox(height: 24),

                    // 9. Recent Mock Tests & Rank (Website Section 9)
                    _buildRecentMockTestsCard(completedAttempts),
                    const SizedBox(height: 20),
                    _buildRankCard(
                      leaderboardEntries: leaderboardList,
                      overallAccuracyPct: overallAccuracyPct,
                      hasAttempts: completedAttempts.isNotEmpty,
                    ),

                    // 10. Upgrade to PracticeKoro Pro Banner (Website Section 10)
                    if (!isPro) ...[
                      const SizedBox(height: 24),
                      _buildUpgradeProBanner(),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // TOP NAVBAR (Matches Website StudentNavbar.tsx)
  // ===========================================================================
  Widget _buildStudentNavbar({
    required List<ExamModel> exams,
    required List<TestSeriesModel> series,
    required List<MockTestModel> tests,
  }) {
    return Container(
      height: 62,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
      ),
      child: Row(
        children: [
          // Brand Logo + PracticeKoro
          InkWell(
            onTap: () => _handleTabNavigation(0, '/home'),
            borderRadius: BorderRadius.circular(10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/images/logo.png',
                    width: 30,
                    height: 30,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0158FC),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'P',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 7),
                const Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: 'Practice',
                        style: TextStyle(color: Color(0xFF0B1F44)),
                      ),
                      TextSpan(
                        text: 'Koro',
                        style: TextStyle(color: Color(0xFF0158FC)),
                      ),
                    ],
                  ),
                  style: TextStyle(
                    fontSize: 17.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Center Pill Search Bar (Matches StudentNavbar.tsx)
          Expanded(
            child: GestureDetector(
              onTap: () => _openLiveSearchModal(
                exams: exams,
                series: series,
                tests: tests,
              ),
              child: Container(
                height: 38,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEDF2F7),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.search_rounded,
                      size: 16,
                      color: Color(0xFF64748B),
                    ),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Search exams, tests, subjects...',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Notification Bell Button
          InkWell(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('No new notifications right now'),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.transparent,
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.notifications_none_rounded,
                size: 21,
                color: Color(0xFF475569),
              ),
            ),
          ),
          const SizedBox(width: 4),

          // Profile Avatar
          InkWell(
            onTap: () => _handleTabNavigation(4, '/profile'),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/student_avatar_hd.png',
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const Icon(
                    Icons.person_rounded,
                    size: 18,
                    color: Color(0xFF0158FC),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 1. HERO BANNER WITH APP TOUR PILL (Matches Website Home.tsx Section 1)
  // ===========================================================================
  Widget _buildHeroBanner() {
    return Semantics(
      button: true,
      label: 'Start practicing',
      child: Stack(
        children: [
          InkWell(
            onTap: () => _handleTabNavigation(2, '/practice'),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
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
                      child: const Icon(
                        Icons.school_rounded,
                        color: Color(0xFF0158FC),
                        size: 54,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 10,
            right: 10,
            child: InkWell(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Welcome to PracticeKoro! Use the tabs below to access Test Series, Practice, Results & Profile.',
                    ),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.25),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.auto_awesome_rounded,
                      size: 13,
                      color: Color(0xFFFCD34D),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'App Tour',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 2. FOUR STAT CARDS (Matches Website Home.tsx Section 2)
  // ===========================================================================
  Widget _buildFourStatCards({
    required int testsTaken,
    required int questionsPracticed,
    required int accuracyPct,
    required int streakDays,
  }) {
    final cards = [
      {
        'value': '$testsTaken',
        'label': 'Tests Taken',
        'icon': Icons.task_alt_rounded,
        'bg': const Color(0xFFECFDF5),
        'fg': const Color(0xFF059669),
      },
      {
        'value': '$questionsPracticed',
        'label': 'Questions Practiced',
        'icon': Icons.description_outlined,
        'bg': const Color(0xFFEFF6FF),
        'fg': const Color(0xFF2563EB),
      },
      {
        'value': '$accuracyPct%',
        'label': 'Accuracy',
        'icon': Icons.check_circle_outline_rounded,
        'bg': const Color(0xFFFFF1F2),
        'fg': const Color(0xFFE11D48),
      },
      {
        'value': '$streakDays',
        'label': 'Day Streak',
        'icon': Icons.local_fire_department_rounded,
        'bg': const Color(0xFFFFFBEB),
        'fg': const Color(0xFFD97706),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: cards.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        mainAxisExtent: 76,
      ),
      itemBuilder: (context, idx) {
        final item = cards[idx];
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.025),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: item['bg'] as Color,
                  borderRadius: BorderRadius.circular(13),
                ),
                alignment: Alignment.center,
                child: Icon(
                  item['icon'] as IconData,
                  color: item['fg'] as Color,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['value'] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item['label'] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ===========================================================================
  // 3. LIVE TEST CARD (Matches Website Home.tsx Dark #0F172A Card)
  // ===========================================================================
  Widget _buildWebsiteLiveTestCard(LiveTestModel liveTest) {
    final now = DateTime.now();
    final isLive = liveTest.isLiveNow;
    final isUpcoming = now.isBefore(liveTest.scheduledStartTime);
    final diff = isUpcoming
        ? liveTest.scheduledStartTime.difference(now)
        : (liveTest.scheduledEndTime.isAfter(now)
              ? liveTest.scheduledEndTime.difference(now)
              : Duration.zero);

    final days = diff.inDays.clamp(0, 99).toString().padLeft(2, '0');
    final hours = (diff.inHours % 24).clamp(0, 23).toString().padLeft(2, '0');
    final mins = (diff.inMinutes % 60).clamp(0, 59).toString().padLeft(2, '0');
    final secs = (diff.inSeconds % 60).clamp(0, 59).toString().padLeft(2, '0');

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E293B)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.18),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Status Badge + Countdown Timer
          Wrap(
            spacing: 10,
            runSpacing: 10,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              // Status Pill
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: isLive
                      ? const Color(0xFFF43F5E)
                      : const Color(0xFFF59E0B),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: isLive ? Colors.white : const Color(0xFF0F172A),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isLive ? 'LIVE NOW' : 'UPCOMING LIVE TEST',
                      style: TextStyle(
                        color: isLive ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
              ),

              // Countdown Timer Boxes
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isLive ? 'Ends in:' : 'Starts in:',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(width: 6),
                  _buildDarkTimerBox('$days', 'd'),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 2),
                    child: Text(
                      ':',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildDarkTimerBox('$hours', 'h'),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 2),
                    child: Text(
                      ':',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildDarkTimerBox('$mins', 'm'),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 2),
                    child: Text(
                      ':',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildDarkTimerBox('$secs', 's'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Live Test Title
          Text(
            liveTest.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w800,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 10),

          // Metadata Chips Row
          Wrap(
            spacing: 14,
            runSpacing: 6,
            children: [
              _buildDarkMetaItem('⏱️ ${liveTest.durationMinutes} Mins'),
              _buildDarkMetaItem('📝 ${liveTest.totalQuestions} Questions'),
              _buildDarkMetaItem('🏆 ${liveTest.totalMarks.toInt()} Marks'),
              const Text(
                '🎖️ Statewide Ranking',
                style: TextStyle(
                  color: Color(0xFFFCD34D),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFF1E293B)),
          const SizedBox(height: 14),

          // Bottom Action Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.groups_rounded,
                      color: Color(0xFF38BDF8),
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${liveTest.enrolledCount} Students ${isLive ? 'Competing Now' : 'Registered'}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              InkWell(
                onTap: () async {
                  final userId = ref
                      .read(catalogRepositoryProvider)
                      .currentUserId;
                  await ref
                      .read(catalogRepositoryProvider)
                      .joinLiveTest(liveTest.id, userId);
                  if (mounted) {
                    context.push(
                      '/live-test/${liveTest.testId}?liveTestId=${Uri.encodeComponent(liveTest.id)}',
                    );
                  }
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isLive
                          ? [const Color(0xFFF43F5E), const Color(0xFFDC2626)]
                          : [const Color(0xFF0158FC), const Color(0xFF0EA5E9)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        isLive ? 'Join Live Test' : 'Register Now',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        color: Colors.white,
                        size: 15,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDarkTimerBox(String numStr, String unit) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: numStr,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
            TextSpan(
              text: unit,
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 9.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDarkMetaItem(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFFCBD5E1),
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildLiveTestLoadingState() {
    return Container(
      height: 100,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: const Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          ),
          SizedBox(width: 12),
          Text(
            'Loading live test schedule…',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 5. POPULAR TEST SERIES (Matches Website Home.tsx Section 5)
  // ===========================================================================
  String _resolveExamEmblem(TestSeriesModel series) {
    if (series.iconUrl != null && series.iconUrl!.trim().isNotEmpty) {
      final url = series.iconUrl!.trim();
      if (url.startsWith('http') || url.startsWith('assets/')) {
        return url;
      }
    }

    final idLower = series.examId.toLowerCase();
    final titleLower = '${series.title} ${series.examTitle ?? ''}'
        .toLowerCase();

    if (idLower.contains('wbp') ||
        idLower.contains('kp') ||
        titleLower.contains('wbp') ||
        titleLower.contains('police') ||
        titleLower.contains('constable')) {
      return 'assets/images/exams/emblem_wbp.png';
    }
    if (idLower.contains('wbpsc') ||
        idLower.contains('wbcs') ||
        titleLower.contains('wbpsc') ||
        titleLower.contains('clerkship') ||
        titleLower.contains('wbcs') ||
        titleLower.contains('food')) {
      return 'assets/images/exams/emblem_wbpsc.png';
    }
    if (idLower.contains('railway') ||
        idLower.contains('rrb') ||
        titleLower.contains('railway') ||
        titleLower.contains('rrb') ||
        titleLower.contains('group d') ||
        titleLower.contains('ntpc')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    if (idLower.contains('tet') ||
        titleLower.contains('tet') ||
        titleLower.contains('primary') ||
        titleLower.contains('teach')) {
      return 'assets/images/exams/emblem_tet.png';
    }
    if (idLower.contains('wbssc') ||
        titleLower.contains('wbssc') ||
        titleLower.contains('slst')) {
      return 'assets/images/exams/emblem_wbssc.png';
    }
    if (idLower.contains('ssc') ||
        titleLower.contains('ssc') ||
        titleLower.contains('cgl') ||
        titleLower.contains('gd')) {
      return 'assets/images/exams/emblem_ssc.png';
    }
    return 'assets/images/logo.png';
  }

  Widget _buildEmblemImage(String pathOrUrl, {double size = 48}) {
    if (pathOrUrl.startsWith('http')) {
      return Image.network(
        pathOrUrl,
        width: size,
        height: size,
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) => Image.asset(
          'assets/images/logo.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
        ),
      );
    }
    return Image.asset(
      pathOrUrl,
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => Image.asset(
        'assets/images/logo.png',
        width: size,
        height: size,
        fit: BoxFit.contain,
      ),
    );
  }

  Widget _buildPopularTestSeriesSection(
    List<TestSeriesModel> seriesList, {
    required bool isLoading,
    required bool hasError,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Text('🔥', style: TextStyle(fontSize: 18)),
                SizedBox(width: 6),
                Text(
                  'Popular Test Series',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/test-series'),
              child: const Row(
                children: [
                  Text(
                    'See All',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Color(0xFF0158FC),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (isLoading || hasError || seriesList.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            alignment: Alignment.center,
            child: Text(
              isLoading
                  ? 'Loading popular test series…'
                  : 'No popular test series published yet. Check back soon!',
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          )
        else
          SizedBox(
            height: 98,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: seriesList.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, idx) {
                final series = seriesList[idx];
                final emblemPath = _resolveExamEmblem(series);
                return InkWell(
                  onTap: () => context.push('/test-series/${series.id}'),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    width: 270,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF0F172A,
                          ).withValues(alpha: 0.025),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF5FB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                          ),
                          child: _buildEmblemImage(emblemPath, size: 46),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                series.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                series.examTitle ?? 'Test Series',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Color(0xFFEFF6FF),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 16,
                            color: Color(0xFF0158FC),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  // ===========================================================================
  // 6. PRACTICE BY SUBJECT (Matches Website Home.tsx Section 6)
  // ===========================================================================
  Widget _buildPracticeBySubjectSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Practice by Subject',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: () => _handleTabNavigation(2, '/practice'),
              child: const Row(
                children: [
                  Text(
                    'See All',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Color(0xFF0158FC),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _subjectCards.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            mainAxisExtent: 68,
          ),
          itemBuilder: (context, idx) {
            final sub = _subjectCards[idx];
            return InkWell(
              onTap: () => context.push('/practice/topics/${sub['id']}'),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: sub['color'] as Color,
                        borderRadius: BorderRadius.circular(11),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        sub['symbol'] as String,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sub['title'] as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            sub['subtitle'] as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: Color(0xFF94A3B8),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // ===========================================================================
  // 7. RECOMMENDED FOR YOU (Matches Website Home.tsx Section 7)
  // ===========================================================================
  Widget _buildRecommendedForYouSection(List<MockTestModel> allTests) {
    const filters = [
      'Test Series',
      'Topic Practice',
      'Previous Year Questions',
      'Based on Your Progress',
    ];

    final filtered = allTests
        .where((t) {
          if (_recommendedFilter == 'Previous Year Questions') {
            return t.testType == 'pyq';
          }
          if (_recommendedFilter == 'Topic Practice') {
            return t.testType == 'chapter_mock' || t.testType == 'subject_mock';
          }
          return true;
        })
        .take(3)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recommended for You',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/test-series'),
              child: const Row(
                children: [
                  Text(
                    'See All',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Color(0xFF0158FC),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: filters.map((tab) {
              final isSelected = _recommendedFilter == tab;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: InkWell(
                  onTap: () => setState(() => _recommendedFilter = tab),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF0158FC)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      tab,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isSelected
                            ? Colors.white
                            : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 12),
        if (filtered.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            alignment: Alignment.center,
            child: const Text(
              'No tests available for this category yet.',
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          )
        else
          ...filtered.map((test) {
            final isPyq = test.testType == 'pyq';
            final badgeText = isPyq
                ? 'PYQ'
                : (!test.isPremium ? 'Free' : 'Mock Test');
            final badgeBg = isPyq
                ? const Color(0xFFFEF3C7)
                : (!test.isPremium
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFFEFF6FF));
            final badgeFg = isPyq
                ? const Color(0xFFD97706)
                : (!test.isPremium
                      ? const Color(0xFF059669)
                      : const Color(0xFF0158FC));

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.025),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.description_outlined,
                            color: Color(0xFF0158FC),
                            size: 20,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: badgeBg,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            badgeText,
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: badgeFg,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      test.title,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 4,
                      children: [
                        _buildRecommendedMeta(
                          Icons.description_outlined,
                          '${test.totalQuestions} Questions',
                        ),
                        _buildRecommendedMeta(
                          Icons.schedule_rounded,
                          '${test.durationMinutes} Minutes',
                        ),
                        _buildRecommendedMeta(
                          Icons.check_circle_outline_rounded,
                          'Online CBT',
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 38,
                      child: ElevatedButton(
                        onPressed: () {
                          final encTitle = Uri.encodeComponent(test.title);
                          context.push(
                            '/test-details/${test.id}?title=$encTitle&isPro=${test.isPremium}',
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0158FC),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Start Test',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(Icons.arrow_forward_rounded, size: 15),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildRecommendedMeta(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13.5, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11.5,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // 8. YOUR PROGRESS (Matches Website Home.tsx Section 8)
  // ===========================================================================
  Widget _buildYourProgressSection({
    required int overallAccuracyPct,
    required int totalCorrect,
    required int totalWrong,
    required int totalSkipped,
    required int totalQ,
  }) {
    final correctPct = totalQ > 0 ? ((totalCorrect / totalQ) * 100).round() : 0;
    final wrongPct = totalQ > 0 ? ((totalWrong / totalQ) * 100).round() : 0;
    final skippedPct = totalQ > 0
        ? math.max(0, 100 - correctPct - wrongPct)
        : 100;

    final subjectPerf = [
      {
        'name': 'Mathematics',
        'pct': overallAccuracyPct,
        'color': const Color(0xFF0158FC),
      },
      {
        'name': 'Reasoning',
        'pct': overallAccuracyPct,
        'color': const Color(0xFFF43F5E),
      },
      {
        'name': 'General Knowledge',
        'pct': overallAccuracyPct,
        'color': const Color(0xFF10B981),
      },
      {
        'name': 'English',
        'pct': overallAccuracyPct,
        'color': const Color(0xFFF59E0B),
      },
      {
        'name': 'Bengali',
        'pct': overallAccuracyPct,
        'color': const Color(0xFF9333EA),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Your Progress',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: () => _handleTabNavigation(3, '/results'),
              child: const Row(
                children: [
                  Text(
                    'View Detailed Analytics',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Color(0xFF0158FC),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.025),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Circular Accuracy Donut + Legend
              Row(
                children: [
                  SizedBox(
                    width: 112,
                    height: 112,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 104,
                          height: 104,
                          child: CircularProgressIndicator(
                            value: overallAccuracyPct / 100.0,
                            strokeWidth: 11,
                            backgroundColor: const Color(0xFFE2E8F0),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFF10B981),
                            ),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$overallAccuracyPct%',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const Text(
                              'OVERALL\nACCURACY',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF94A3B8),
                                height: 1.1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLegendRow(
                          const Color(0xFF10B981),
                          'Correct ($correctPct%)',
                        ),
                        const SizedBox(height: 8),
                        _buildLegendRow(
                          const Color(0xFFF43F5E),
                          'Incorrect ($wrongPct%)',
                        ),
                        const SizedBox(height: 8),
                        _buildLegendRow(
                          const Color(0xFFCBD5E1),
                          'Skipped ($skippedPct%)',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'SUBJECT WISE PERFORMANCE',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF64748B),
                      letterSpacing: 0.5,
                    ),
                  ),
                  InkWell(
                    onTap: () => _handleTabNavigation(3, '/results'),
                    child: const Text(
                      'View All >',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...subjectPerf.map((s) {
                final pct = s['pct'] as int;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            s['name'] as String,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF334155),
                            ),
                          ),
                          Text(
                            '$pct%',
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: pct / 100.0,
                          minHeight: 7,
                          backgroundColor: const Color(0xFFF1F5F9),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            s['color'] as Color,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLegendRow(Color dotColor, String label) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF475569),
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // 9A. RECENT MOCK TESTS CARD (Matches Website Home.tsx Section 9 Left)
  // ===========================================================================
  Widget _buildRecentMockTestsCard(List<TestAttemptModel> completedAttempts) {
    final recentList = completedAttempts.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.025),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Mock Tests',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              InkWell(
                onTap: () => _handleTabNavigation(3, '/results'),
                child: const Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: Color(0xFF0158FC),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (recentList.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'No mock tests attempted yet. Start your first test to track your progress!',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                ),
              ),
            )
          else
            ...recentList.map((attempt) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            attempt.testTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Score: ${attempt.score.toStringAsFixed(0)}/${attempt.totalMarks.toStringAsFixed(0)}  •  Accuracy: ${attempt.accuracy.round()}%',
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () => context.push('/result/${attempt.id}'),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'View Result',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0158FC),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ===========================================================================
  // 9B. RANK CARD (Matches Website Home.tsx Section 9 Right)
  // ===========================================================================
  Widget _buildRankCard({
    required List<LeaderboardEntry> leaderboardEntries,
    required int overallAccuracyPct,
    required bool hasAttempts,
  }) {
    const tabs = ['All India', 'West Bengal', 'Friends'];
    final topEntries = leaderboardEntries.take(5).toList();
    final userRank = hasAttempts ? '#1' : '#-';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.025),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Rank',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              InkWell(
                onTap: () => context.push('/rank'),
                child: const Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: Color(0xFF0158FC),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Segmented Control (All India | West Bengal | Friends)
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: tabs.map((t) {
                final selected = _rankTab == t;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _rankTab = t),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: selected
                            ? const Color(0xFF0158FC)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        t,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: selected
                              ? Colors.white
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // Table Header
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                SizedBox(
                  width: 32,
                  child: Text(
                    '#',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    'Student',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ),
                Text(
                  'Score',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          if (topEntries.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Center(
                child: Text(
                  'Rankings will appear as students complete mock tests.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ),
            )
          else
            ...topEntries.map((item) {
              return Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 32,
                      child: Text(
                        '${item.rank}',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        item.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    Text(
                      '${item.averagePercentage.round()}%',
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              );
            }),

          const SizedBox(height: 8),

          // Highlighted Current User Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Row(
              children: [
                Text(
                  userRank,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0158FC),
                  ),
                ),
                const SizedBox(width: 12),
                ClipOval(
                  child: Image.asset(
                    'assets/images/student_avatar_hd.png',
                    width: 26,
                    height: 26,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.person_rounded,
                      size: 18,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'You (${_currentUserName()})',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                Text(
                  '$overallAccuracyPct%',
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0158FC),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 10. UPGRADE TO PRACTICEKORO PRO BANNER (Matches Website Home.tsx Section 10)
  // ===========================================================================
  Widget _buildUpgradeProBanner() {
    const features = [
      'All Exams',
      'Unlimited Tests',
      'Detailed Solutions',
      'Web + Mobile App',
      'Priority Support',
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEEF6FF), Color(0xFFE6F2FE), Color(0xFFDBEBFE)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFF0158FC),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.auto_awesome_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Upgrade to PracticeKoro Pro',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Get unlimited access to all test series, topic practice & detailed analytics across every West Bengal exam.',
            style: TextStyle(
              fontSize: 12.5,
              color: Color(0xFF475569),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: features.map((f) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    size: 14,
                    color: Color(0xFF0158FC),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    f,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF334155),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: () => context.push('/subscription'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0158FC),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Upgrade Now',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
