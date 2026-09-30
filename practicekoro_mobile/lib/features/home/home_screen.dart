import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_model.dart';
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
  int _selectedQuickFilter = 0;

  static const List<String> _quickFilters = [
    'All Mocks',
    'Full Length',
    'PYQ Papers',
    'Free Tests',
    'Topic Tests',
  ];

  static const List<Map<String, String>> _examGoals = [
    {
      'title': 'WBP Constable',
      'subtitle': 'West Bengal Police Recruitment Board',
      'badge': 'Police',
    },
    {
      'title': 'WBPSC Clerkship',
      'subtitle': 'WB Public Service Commission',
      'badge': 'WBPSC',
    },
    {
      'title': 'Primary TET',
      'subtitle': 'WB Board of Primary Education',
      'badge': 'Teaching',
    },
    {
      'title': 'SSC GD & CGL',
      'subtitle': 'Staff Selection Commission',
      'badge': 'Central',
    },
    {
      'title': 'Railway NTPC',
      'subtitle': 'Railway Recruitment Board (RRB)',
      'badge': 'Railway',
    },
  ];

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

  String _resolveUserName() {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final fullName = user.userMetadata?['full_name'] as String?;
        if (fullName != null && fullName.trim().isNotEmpty) {
          return fullName.trim().split(' ').first;
        }
        final email = user.email ?? '';
        if (email.isNotEmpty) {
          return email.split('@').first;
        }
      }
    } catch (_) {}
    return 'Aspirant';
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  String _getEmblemPath(String examKey) {
    final lower = examKey.toLowerCase();
    if (lower.contains('wbp') ||
        lower.contains('kp') ||
        lower.contains('police') ||
        lower.contains('constable')) {
      return 'assets/images/exams/emblem_wbp_shield.png';
    } else if (lower.contains('wbpsc') ||
        lower.contains('wbcs') ||
        lower.contains('clerkship')) {
      return 'assets/images/exams/emblem_wbpsc_coin.png';
    } else if (lower.contains('tet') ||
        lower.contains('primary') ||
        lower.contains('teach')) {
      return 'assets/images/exams/emblem_wbtet_seal.png';
    } else if (lower.contains('wbssc') || lower.contains('slst')) {
      return 'assets/images/exams/emblem_wbssc.png';
    } else if (lower.contains('ssc') ||
        lower.contains('cgl') ||
        lower.contains('gd')) {
      return 'assets/images/exams/emblem_ssc_crest.png';
    } else if (lower.contains('railway') ||
        lower.contains('rrb') ||
        lower.contains('ntpc')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    return 'assets/images/logo-circle.png';
  }

  void _openTargetExamSheet() {
    final currentGoal =
        LocalStorageService.getSelectedExam() ?? 'WBP Constable';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select Target Exam',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.4,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Personalizes your daily mocks & subject drills',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(
                      Icons.close_rounded,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ..._examGoals.map((goal) {
                final title = goal['title']!;
                final isSelected =
                    currentGoal.toLowerCase() == title.toLowerCase();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () async {
                      await LocalStorageService.setSelectedExam(title);
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (mounted) setState(() {});
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFFEEF2FF)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF3142D6)
                              : const Color(0xFFE2E8F0),
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Image.asset(
                              _getEmblemPath(title),
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) => const Icon(
                                Icons.workspace_premium_rounded,
                                size: 20,
                                color: Color(0xFF3142D6),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w800,
                                    color: isSelected
                                        ? const Color(0xFF3142D6)
                                        : const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  goal['subtitle']!,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    color: Color(0xFF64748B),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF3142D6)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF3142D6)
                                    : const Color(0xFFCBD5E1),
                              ),
                            ),
                            child: Text(
                              isSelected ? 'Active' : goal['badge']!,
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: isSelected
                                    ? Colors.white
                                    : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  List<Map<String, dynamic>> _buildSearchableItems({
    required List<ExamModel> exams,
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
    required List<MockTestModel> tests,
  }) {
    final searchableItems = _buildSearchableItems(
      exams: exams,
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
          height: MediaQuery.of(context).size.height * 0.84,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
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
                        color: const Color(0xFFF4F6FB),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        autofocus: true,
                        decoration: InputDecoration(
                          hintText: 'Search mock tests, PYQs, exam series...',
                          hintStyle: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF64748B),
                          ),
                          prefixIcon: const Icon(
                            Icons.search_rounded,
                            color: Color(0xFF3142D6),
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
                      'Close',
                      style: TextStyle(
                        color: Color(0xFF475569),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${results.length} Available Items',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: results.isEmpty
                    ? Center(
                        child: Text(
                          query.isEmpty
                              ? 'Type to search exams or mock tests'
                              : 'No results matching "$query"',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      )
                    : ListView.separated(
                        itemCount: results.length,
                        separatorBuilder: (_, _) =>
                            const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        itemBuilder: (context, idx) {
                          final item = results[idx];
                          final isTest = item['category'] == 'test';

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 4,
                            ),
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isTest
                                    ? const Color(0xFFEEF2FF)
                                    : const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isTest
                                    ? Icons.timer_outlined
                                    : Icons.school_outlined,
                                size: 20,
                                color: isTest
                                    ? const Color(0xFF3142D6)
                                    : const Color(0xFF059669),
                              ),
                            ),
                            title: Text(
                              item['title'] as String,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            subtitle: Text(
                              item['type'] as String,
                              style: const TextStyle(
                                fontSize: 11.5,
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
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(homeExamsProvider);
    final testsAsync = ref.watch(homeMockTestsProvider);

    final exams = examsAsync.asData?.value ?? const <ExamModel>[];
    final allTests = testsAsync.asData?.value ?? const <MockTestModel>[];

    final attempts = LocalStorageService.getAttempts();
    final targetExam =
        LocalStorageService.getSelectedExam() ?? 'WBP Constable';
    final isPro = LocalStorageService.isProUser();
    final bookmarksCount = LocalStorageService.getBookmarks().length;

    final testsTaken = attempts.length;
    final avgAccuracy = attempts.isEmpty
        ? 0
        : (attempts.fold<double>(0, (s, a) => s + a.accuracy) / attempts.length)
              .round();
    final totalCorrect = attempts.fold<int>(0, (s, a) => s + a.correctCount);
    final totalWrong = attempts.fold<int>(0, (s, a) => s + a.wrongCount);
    final totalSolved = totalCorrect + totalWrong;
    final streakDays = attempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;

    String bestScoreStr = '0/100';
    if (attempts.isNotEmpty) {
      double best = 0;
      double total = 100;
      for (final a in attempts) {
        if (a.score >= best) {
          best = a.score;
          total = a.totalMarks > 0 ? a.totalMarks : 100;
        }
      }
      bestScoreStr = '${best.round()}/${total.round()}';
    }

    // Filter mock tests for horizontal carousel
    final filteredTests = allTests.where((t) {
      if (_selectedQuickFilter == 1) return t.testType == 'full_mock';
      if (_selectedQuickFilter == 2) return t.testType == 'pyq';
      if (_selectedQuickFilter == 3) return !t.isPremium;
      if (_selectedQuickFilter == 4) {
        return t.testType == 'chapter_mock' || t.testType == 'subject_mock';
      }
      return true;
    }).toList();
    final displayTests =
        (filteredTests.isNotEmpty ? filteredTests : allTests).take(8).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── 1. NATIVE MOBILE TOP BAR ──
            _buildMobileAppBar(
              targetExam: targetExam,
              streakDays: streakDays,
              isPro: isPro,
            ),

            // ── SCROLLABLE NATIVE MOBILE BODY ──
            Expanded(
              child: RefreshIndicator(
                color: const Color(0xFF3142D6),
                onRefresh: () async {
                  ref.invalidate(homeExamsProvider);
                  ref.invalidate(homeMockTestsProvider);
                },
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                  children: [
                    // ── 2. SEARCH BAR + QUICK FILTER PILLS ──
                    _buildSearchAndQuickChips(
                      onSearchTap: () => _openLiveSearchModal(
                        exams: exams,
                        tests: allTests,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── 3. INDIGO-VIOLET DAILY READINESS HERO CARD ──
                    _buildReadinessHeroCard(
                      userName: _resolveUserName(),
                      targetExam: targetExam,
                      testsTaken: testsTaken,
                      avgAccuracy: avgAccuracy,
                      bestScoreStr: bestScoreStr,
                      totalSolved: totalSolved,
                      firstTest: displayTests.isNotEmpty
                          ? displayTests.first
                          : null,
                    ),
                    const SizedBox(height: 22),

                    // ── 4. LIVE & TRENDING MOCK TESTS (HORIZONTAL CAROUSEL) ──
                    _buildSectionHeader(
                      title: 'Featured Mock Tests',
                      badgeText: '${allTests.length}+ Ready',
                      actionText: 'See All',
                      onAction: () => _handleTabNavigation(1, '/exams'),
                    ),
                    const SizedBox(height: 12),
                    _buildMockTestsCarousel(displayTests),
                    const SizedBox(height: 22),

                    // ── 5. 2x2 SUBJECT MASTERY BENTO GRID ──
                    _buildSectionHeader(
                      title: 'Practice by Subject',
                      badgeText: 'Bilingual',
                      actionText: 'All Topics',
                      onAction: () => _handleTabNavigation(2, '/practice'),
                    ),
                    const SizedBox(height: 12),
                    _buildSubjectBentoGrid(avgAccuracy: avgAccuracy),
                    const SizedBox(height: 22),

                    // ── 6. TARGET EXAM TEST SERIES (COMPACT MOBILE CARDS) ──
                    _buildSectionHeader(
                      title: 'Exam Test Series',
                      badgeText: '${exams.length} Exams',
                      actionText: 'Explore',
                      onAction: () => _handleTabNavigation(1, '/exams'),
                    ),
                    const SizedBox(height: 12),
                    _buildExamSeriesList(exams),
                    const SizedBox(height: 22),

                    // ── 7. MISTAKE NOTEBOOK & SAVED REVISION STRIP ──
                    _buildRevisionStrip(
                      mistakesCount: totalWrong,
                      bookmarksCount: bookmarksCount,
                      recentAttempt: attempts.isNotEmpty
                          ? attempts.first
                          : null,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileAppBar({
    required String targetExam,
    required int streakDays,
    required bool isPro,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(11),
              border: Border.all(
                color: const Color(0xFF3142D6).withValues(alpha: 0.2),
              ),
            ),
            child: Image.asset(
              'assets/images/logo-circle.png',
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => const Icon(
                Icons.school_rounded,
                color: Color(0xFF3142D6),
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Target Exam Switcher Pill
          Expanded(
            child: GestureDetector(
              onTap: _openTargetExamSheet,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 11,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F6FB),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF3142D6),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 7),
                    Flexible(
                      child: Text(
                        targetExam,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 17,
                      color: Color(0xFF475569),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Streak Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.local_fire_department_rounded,
                  size: 15,
                  color: Color(0xFFF59E0B),
                ),
                const SizedBox(width: 3),
                Text(
                  '${streakDays}d',
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),

          // Pro / Rank Quick Button
          GestureDetector(
            onTap: () => context.push(isPro ? '/rank' : '/pricing'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF3142D6), Color(0xFF6366F1)],
                ),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isPro
                        ? Icons.emoji_events_rounded
                        : Icons.workspace_premium_rounded,
                    size: 14,
                    color: const Color(0xFFFDE047),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isPro ? 'Rank' : 'PRO',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndQuickChips({required VoidCallback onSearchTap}) {
    return Column(
      children: [
        GestureDetector(
          onTap: onSearchTap,
          child: Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.search_rounded,
                  color: Color(0xFF3142D6),
                  size: 20,
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Search mock tests, PYQs, topic drills...',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'বাংলা / EN',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF3142D6),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 34,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _quickFilters.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, idx) {
              final selected = _selectedQuickFilter == idx;
              return GestureDetector(
                onTap: () => setState(() => _selectedQuickFilter = idx),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: selected ? const Color(0xFF3142D6) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: selected
                          ? const Color(0xFF3142D6)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Text(
                    _quickFilters[idx],
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : const Color(0xFF475569),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildReadinessHeroCard({
    required String userName,
    required String targetExam,
    required int testsTaken,
    required int avgAccuracy,
    required String bestScoreStr,
    required int totalSolved,
    required MockTestModel? firstTest,
  }) {
    final progressValue = (avgAccuracy / 100.0).clamp(0.0, 1.0);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF3142D6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3142D6).withValues(alpha: 0.24),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.18),
                        ),
                      ),
                      child: Text(
                        '🎯 TARGET • ${targetExam.toUpperCase()}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFC7D2FE),
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '${_getGreeting()}, $userName!',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      testsTaken > 0
                          ? 'You have completed $testsTaken tests with $avgAccuracy% accuracy.'
                          : 'Start your first full-length mock test today to unlock your All-India Rank.',
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFFCBD5E1),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              SizedBox(
                width: 78,
                height: 78,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CustomPaint(
                      size: const Size(78, 78),
                      painter: _AccuracyRingPainter(
                        progress: progressValue > 0 ? progressValue : 0.08,
                        trackColor: Colors.white.withValues(alpha: 0.14),
                        progressColor: avgAccuracy >= 70
                            ? const Color(0xFF10B981)
                            : const Color(0xFF818CF8),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$avgAccuracy%',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const Text(
                          'ACCURACY',
                          style: TextStyle(
                            fontSize: 8.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFA5B4FC),
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildHeroMiniStat(
                  label: 'Tests Taken',
                  value: '$testsTaken',
                  icon: Icons.assignment_turned_in_rounded,
                  iconColor: const Color(0xFF60A5FA),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildHeroMiniStat(
                  label: 'Best Score',
                  value: bestScoreStr,
                  icon: Icons.emoji_events_rounded,
                  iconColor: const Color(0xFFFBBF24),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildHeroMiniStat(
                  label: 'Solved MCQs',
                  value: '$totalSolved',
                  icon: Icons.check_circle_rounded,
                  iconColor: const Color(0xFF34D399),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                flex: 6,
                child: ElevatedButton.icon(
                  onPressed: () {
                    if (firstTest != null) {
                      final enc = Uri.encodeComponent(firstTest.title);
                      context.push(
                        '/test-details/${firstTest.id}?title=$enc&isPro=${firstTest.isPremium}',
                      );
                    } else {
                      _handleTabNavigation(1, '/exams');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF3142D6),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Icon(Icons.play_arrow_rounded, size: 20),
                  label: const Text(
                    'Start Quick Mock',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 5,
                child: OutlinedButton.icon(
                  onPressed: () => context.push(
                    '/topic-practice/daily_drill?title=Daily%2015-Q%20Speed%20Drill',
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.28),
                    ),
                    backgroundColor: Colors.white.withValues(alpha: 0.08),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Icon(
                    Icons.bolt_rounded,
                    size: 18,
                    color: Color(0xFFFBBF24),
                  ),
                  label: const Text(
                    '15-Q Drill',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeroMiniStat({
    required String label,
    required String value,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 13, color: iconColor),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFCBD5E1),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required String badgeText,
    required String actionText,
    required VoidCallback onAction,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF2FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badgeText,
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF3142D6),
                ),
              ),
            ),
          ],
        ),
        GestureDetector(
          onTap: onAction,
          child: Row(
            children: [
              Text(
                actionText,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF3142D6),
                ),
              ),
              const SizedBox(width: 2),
              const Icon(
                Icons.chevron_right_rounded,
                size: 18,
                color: Color(0xFF3142D6),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMockTestsCarousel(List<MockTestModel> tests) {
    if (tests.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Center(
          child: Text(
            'Loading mock tests...',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF64748B),
            ),
          ),
        ),
      );
    }

    return SizedBox(
      height: 196,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tests.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, idx) {
          final test = tests[idx];
          final encTitle = Uri.encodeComponent(test.title);
          final isFree = !test.isPremium;
          final isPyq = test.testType == 'pyq';

          return Container(
            width: 276,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: isPyq
                                ? const Color(0xFFFFFBEB)
                                : isFree
                                ? const Color(0xFFECFDF5)
                                : const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            isPyq
                                ? test.typeLabel.toUpperCase()
                                : isFree
                                ? 'FREE MOCK'
                                : 'PRO MOCK',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isPyq
                                  ? const Color(0xFFD97706)
                                  : isFree
                                  ? const Color(0xFF059669)
                                  : const Color(0xFF3142D6),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(7),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: const Text(
                            'বাংলা + Eng',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF475569),
                            ),
                          ),
                        ),
                      ],
                    ),
                    Icon(
                      isFree ? Icons.lock_open_rounded : Icons.stars_rounded,
                      size: 16,
                      color: isFree
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                Text(
                  test.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    height: 1.25,
                  ),
                ),
                const Spacer(),

                Row(
                  children: [
                    _buildSpecChip(
                      Icons.help_outline_rounded,
                      '${test.totalQuestions} Qs',
                    ),
                    const SizedBox(width: 8),
                    _buildSpecChip(
                      Icons.schedule_rounded,
                      '${test.durationMinutes} Mins',
                    ),
                    const SizedBox(width: 8),
                    _buildSpecChip(
                      Icons.workspace_premium_outlined,
                      '${test.totalMarks.round()} Marks',
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  height: 38,
                  child: ElevatedButton(
                    onPressed: () {
                      context.push(
                        '/test-details/${test.id}?title=$encTitle&isPro=${test.isPremium}',
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3142D6),
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
                          'Attempt Now',
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
          );
        },
      ),
    );
  }

  Widget _buildSpecChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF64748B)),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF475569),
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectBentoGrid({required int avgAccuracy}) {
    final subjects = [
      {
        'id': 'gk',
        'title': 'General Knowledge',
        'subtitle': 'Static GK, History, Polity & CA',
        'icon': Icons.public_rounded,
        'color': const Color(0xFF10B981),
        'bgColor': const Color(0xFFECFDF5),
        'progress': avgAccuracy > 0
            ? (avgAccuracy / 100.0).clamp(0.2, 0.95)
            : 0.68,
        'tag': 'High Weightage',
      },
      {
        'id': 'math',
        'title': 'Mathematics',
        'subtitle': 'Arithmetic, Mensuration & Ratio',
        'icon': Icons.calculate_rounded,
        'color': const Color(0xFF3142D6),
        'bgColor': const Color(0xFFEEF2FF),
        'progress': avgAccuracy > 0
            ? ((avgAccuracy - 4) / 100.0).clamp(0.2, 0.92)
            : 0.74,
        'tag': 'Speed Drills',
      },
      {
        'id': 'reasoning',
        'title': 'GI & Reasoning',
        'subtitle': 'Series, Coding & Syllogism',
        'icon': Icons.psychology_rounded,
        'color': const Color(0xFFF59E0B),
        'bgColor': const Color(0xFFFFFBEB),
        'progress': avgAccuracy > 0
            ? ((avgAccuracy + 5) / 100.0).clamp(0.25, 0.96)
            : 0.82,
        'tag': 'Scoring',
      },
      {
        'id': 'english',
        'title': 'English & Bengali',
        'subtitle': 'Grammar, Vocab & Comprehension',
        'icon': Icons.translate_rounded,
        'color': const Color(0xFF8B5CF6),
        'bgColor': const Color(0xFFF5F3FF),
        'progress': avgAccuracy > 0
            ? (avgAccuracy / 100.0).clamp(0.2, 0.90)
            : 0.70,
        'tag': 'Bilingual',
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: subjects.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.18,
      ),
      itemBuilder: (context, idx) {
        final s = subjects[idx];
        final color = s['color'] as Color;
        final bgColor = s['bgColor'] as Color;
        final prog = s['progress'] as double;
        final pct = (prog * 100).round();

        return InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            final enc = Uri.encodeComponent(s['title'] as String);
            context.push('/topic-practice/${s['id']}?title=$enc');
          },
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
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
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        s['icon'] as IconData,
                        size: 20,
                        color: color,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        s['tag'] as String,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  s['title'] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  s['subtitle'] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: prog,
                          minHeight: 5,
                          backgroundColor: const Color(0xFFF1F5F9),
                          valueColor: AlwaysStoppedAnimation<Color>(color),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '$pct%',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: color,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildExamSeriesList(List<ExamModel> exams) {
    final displayExams = exams.take(4).toList();
    if (displayExams.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: displayExams.map((exam) {
        final totalTests = exam.totalTests ?? 25;
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () => context.push('/exams/${exam.id}'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Image.asset(
                      _getEmblemPath(exam.title),
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.verified_rounded,
                        size: 22,
                        color: Color(0xFF3142D6),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exam.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Text(
                              '$totalTests+ Mock Tests',
                              style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Free Mock Inside',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 14,
                      color: Color(0xFF3142D6),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRevisionStrip({
    required int mistakesCount,
    required int bookmarksCount,
    required TestAttemptModel? recentAttempt,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Smart Revision & Analytics',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () => context.push('/mistakes'),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFFECDD3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.auto_fix_high_rounded,
                          size: 19,
                          color: Color(0xFFE11D48),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$mistakesCount Mistakes',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const Text(
                              'Re-test wrong Qs',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
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
            const SizedBox(width: 12),
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () => context.push('/bookmarks'),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFC7D2FE)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.bookmark_rounded,
                          size: 19,
                          color: Color(0xFF3142D6),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$bookmarksCount Saved',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const Text(
                              'Bookmarked MCQs',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
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
          ],
        ),
        if (recentAttempt != null) ...[
          const SizedBox(height: 12),
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () => _handleTabNavigation(3, '/results'),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.analytics_rounded,
                      color: Color(0xFF3142D6),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'LAST ATTEMPTED TEST',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF3142D6),
                            letterSpacing: 0.4,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          recentAttempt.testTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
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
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${recentAttempt.score.round()}/${recentAttempt.totalMarks.round()} • ${recentAttempt.accuracy.round()}%',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _AccuracyRingPainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final Color progressColor;

  _AccuracyRingPainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 10) / 2;

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round;

    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);
    final sweepAngle = 2 * math.pi * progress.clamp(0.0, 1.0);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _AccuracyRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor;
  }
}
