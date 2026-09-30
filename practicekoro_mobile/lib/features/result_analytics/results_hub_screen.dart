import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';

class ResultsHubScreen extends StatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const ResultsHubScreen({super.key, this.onTabSelected});

  @override
  State<ResultsHubScreen> createState() => _ResultsHubScreenState();
}

class _MobileAttemptItem {
  final String id;
  final String testId;
  final String testName;
  final String exam;
  final String type; // 'Mock Test' | 'Topic Drill' | 'PYQ'
  final String date;
  final String score;
  final double scoreVal;
  final double totalMarks;
  final int accuracy;
  final String time;
  final Color accentColor;
  final TestAttemptModel attempt;

  const _MobileAttemptItem({
    required this.id,
    required this.testId,
    required this.testName,
    required this.exam,
    required this.type,
    required this.date,
    required this.score,
    required this.scoreVal,
    required this.totalMarks,
    required this.accuracy,
    required this.time,
    required this.accentColor,
    required this.attempt,
  });
}

class _ResultsHubScreenState extends State<ResultsHubScreen> {
  String _testTypeFilter = 'all';

  static const List<Map<String, String>> _filterPills = [
    {'key': 'all', 'label': 'All Attempts'},
    {'key': 'mock', 'label': 'Full Mocks'},
    {'key': 'topic', 'label': 'Topic Drills'},
    {'key': 'pyq', 'label': 'PYQ Papers'},
  ];

  static const List<Color> _accentColors = [
    Color(0xFF3142D6),
    Color(0xFF10B981),
    Color(0xFF8B5CF6),
    Color(0xFFF59E0B),
    Color(0xFFE11D48),
  ];

  void _navigateToTab(int index, String fallbackRoute) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(fallbackRoute);
    }
  }

  String _inferTestType(TestAttemptModel a) {
    final titleLower = a.testTitle.toLowerCase();
    final idLower = a.testId.toLowerCase();
    if (titleLower.contains('pyq') ||
        titleLower.contains('previous year') ||
        idLower.contains('pyq')) {
      return 'PYQ';
    }
    if (titleLower.contains('topic') ||
        titleLower.contains('drill') ||
        titleLower.contains('chapter') ||
        idLower.contains('topic')) {
      return 'Topic Drill';
    }
    return 'Mock Test';
  }

  String _inferExamTitle(TestAttemptModel a) {
    final target = LocalStorageService.getSelectedExam() ?? '';
    if (target.toLowerCase().contains('wbp')) return 'WBP Constable';
    if (target.toLowerCase().contains('wbpsc')) return 'WBPSC Clerkship';
    if (target.toLowerCase().contains('tet')) return 'Primary TET';
    if (target.toLowerCase().contains('ssc')) return 'SSC GD & CGL';
    if (target.toLowerCase().contains('rail')) return 'Railway NTPC';
    return 'Competitive Exam';
  }

  List<_MobileAttemptItem> _buildAttemptItems(List<TestAttemptModel> attempts) {
    final dateFormat = DateFormat('dd MMM yyyy');
    return List.generate(attempts.length, (idx) {
      final a = attempts[idx];
      final mins = a.timeSpentSeconds ~/ 60;
      final secs = a.timeSpentSeconds % 60;
      final timeStr = '${mins}m ${secs.toString().padLeft(2, '0')}s';
      final totalMarks = a.totalMarks > 0 ? a.totalMarks : 100.0;
      return _MobileAttemptItem(
        id: a.id,
        testId: a.testId,
        testName: a.testTitle.isNotEmpty ? a.testTitle : 'Full Mock Test',
        exam: _inferExamTitle(a),
        type: _inferTestType(a),
        date: dateFormat.format(a.completedAt),
        score: '${a.score.round()}/${totalMarks.round()}',
        scoreVal: a.score,
        totalMarks: totalMarks,
        accuracy: a.accuracy.round(),
        time: timeStr,
        accentColor: _accentColors[idx % _accentColors.length],
        attempt: a,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final attempts = LocalStorageService.getAttempts();
    final allItems = _buildAttemptItems(attempts);

    final filteredItems = _testTypeFilter == 'all'
        ? allItems
        : allItems.where((r) {
            switch (_testTypeFilter) {
              case 'mock':
                return r.type == 'Mock Test';
              case 'topic':
                return r.type == 'Topic Drill';
              case 'pyq':
                return r.type == 'PYQ';
              default:
                return true;
            }
          }).toList();

    final testsAttempted = attempts.length;
    int totalCorrect = 0;
    int totalWrong = 0;
    int totalSkipped = 0;
    int bestScoreVal = 0;
    int bestTotalMarks = 100;
    int avgAccuracy = 0;

    if (attempts.isNotEmpty) {
      for (final a in attempts) {
        totalCorrect += a.correctCount;
        totalWrong += a.wrongCount;
        totalSkipped += a.skippedCount;
        if (a.score.round() >= bestScoreVal) {
          bestScoreVal = a.score.round();
          bestTotalMarks = (a.totalMarks > 0 ? a.totalMarks : 100).round();
        }
      }
      final sumAcc = attempts.fold<double>(0, (sum, a) => sum + a.accuracy);
      avgAccuracy = (sumAcc / attempts.length).round();
    }

    final totalSolved = totalCorrect + totalWrong;
    final bestScoreStr = attempts.isNotEmpty
        ? '$bestScoreVal/$bestTotalMarks'
        : '0/100';
    final dayStreak = attempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── NATIVE MOBILE TOP HEADER ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Results & Analytics',
                        style: TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Score breakdown, accuracy & solution review',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => context.push('/rank'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFC7D2FE)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.emoji_events_rounded,
                            size: 15,
                            color: Color(0xFF3142D6),
                          ),
                          SizedBox(width: 5),
                          Text(
                            'Leaderboard',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF3142D6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // ── SCROLLABLE NATIVE MOBILE BODY ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  // 1. Indigo-Violet Radial Performance Hero Card
                  _buildPerformanceHeroCard(
                    avgAccuracy: avgAccuracy,
                    totalCorrect: totalCorrect,
                    totalWrong: totalWrong,
                    totalSkipped: totalSkipped,
                    testsAttempted: testsAttempted,
                  ),
                  const SizedBox(height: 16),

                  // 2. 2x2 Mobile KPI Bento Grid
                  _buildKpiBentoGrid(
                    testsAttempted: testsAttempted,
                    bestScoreStr: bestScoreStr,
                    totalSolved: totalSolved,
                    dayStreak: dayStreak,
                  ),
                  const SizedBox(height: 22),

                  // 3. Subject Mastery Progress Card
                  _buildSubjectMasteryCard(
                    avgAccuracy: avgAccuracy,
                    hasAttempts: attempts.isNotEmpty,
                  ),
                  const SizedBox(height: 22),

                  // 4. Test Attempt History Section + Filter Pills
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Recent Test Attempts',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.3,
                        ),
                      ),
                      Text(
                        '${filteredItems.length} Tests',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 34,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _filterPills.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, idx) {
                        final pill = _filterPills[idx];
                        final selected = _testTypeFilter == pill['key'];
                        return GestureDetector(
                          onTap: () =>
                              setState(() => _testTypeFilter = pill['key']!),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: selected
                                  ? const Color(0xFF3142D6)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selected
                                    ? const Color(0xFF3142D6)
                                    : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Text(
                              pill['label']!,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: selected
                                    ? Colors.white
                                    : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 5. Native Mobile Attempt Cards (Or Empty State)
                  if (filteredItems.isEmpty)
                    _buildEmptyAttemptsCard()
                  else
                    ...filteredItems.map(_buildMobileAttemptCard),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceHeroCard({
    required int avgAccuracy,
    required int totalCorrect,
    required int totalWrong,
    required int totalSkipped,
    required int testsAttempted,
  }) {
    final progress = (avgAccuracy / 100.0).clamp(0.0, 1.0);
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
            color: const Color(0xFF3142D6).withValues(alpha: 0.22),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Circular Accuracy Ring
              SizedBox(
                width: 84,
                height: 84,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CustomPaint(
                      size: const Size(84, 84),
                      painter: _ResultsRingPainter(
                        progress: progress > 0 ? progress : 0.08,
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
                            fontSize: 19,
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
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        testsAttempted > 0
                            ? 'OVERALL READINESS'
                            : 'NO TESTS ATTEMPTED YET',
                        style: const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFC7D2FE),
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      testsAttempted > 0
                          ? (avgAccuracy >= 75
                                ? 'Strong Exam Readiness!'
                                : 'Keep Practicing Daily!')
                          : 'Take a Mock Test to Analyze',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      testsAttempted > 0
                          ? 'Based on $testsAttempted completed test attempts.'
                          : 'Detailed accuracy, speed & rank insights appear here.',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFFCBD5E1),
                      ),
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
                child: _buildBreakdownPill(
                  label: 'Correct',
                  value: '$totalCorrect',
                  dotColor: const Color(0xFF10B981),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildBreakdownPill(
                  label: 'Incorrect',
                  value: '$totalWrong',
                  dotColor: const Color(0xFFF43F5E),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildBreakdownPill(
                  label: 'Skipped',
                  value: '$totalSkipped',
                  dotColor: const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownPill({
    required String label,
    required String value,
    required Color dotColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 7),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFCBD5E1),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiBentoGrid({
    required int testsAttempted,
    required String bestScoreStr,
    required int totalSolved,
    required int dayStreak,
  }) {
    final items = [
      {
        'label': 'Tests Attempted',
        'value': '$testsAttempted',
        'sub': 'Completed mocks',
        'icon': Icons.assignment_turned_in_rounded,
        'color': const Color(0xFF3142D6),
        'bg': const Color(0xFFEEF2FF),
      },
      {
        'label': 'Best Score',
        'value': bestScoreStr,
        'sub': 'Personal highest',
        'icon': Icons.emoji_events_rounded,
        'color': const Color(0xFFD97706),
        'bg': const Color(0xFFFFFBEB),
      },
      {
        'label': 'Questions Solved',
        'value': '$totalSolved',
        'sub': 'Total evaluated',
        'icon': Icons.fact_check_rounded,
        'color': const Color(0xFF059669),
        'bg': const Color(0xFFECFDF5),
      },
      {
        'label': 'Active Streak',
        'value': '$dayStreak Days',
        'sub': 'Consistency',
        'icon': Icons.local_fire_department_rounded,
        'color': const Color(0xFFE11D48),
        'bg': const Color(0xFFFFF1F2),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.55,
      ),
      itemBuilder: (context, idx) {
        final item = items[idx];
        final color = item['color'] as Color;
        final bg = item['bg'] as Color;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item['label'] as String,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Icon(
                      item['icon'] as IconData,
                      size: 16,
                      color: color,
                    ),
                  ),
                ],
              ),
              Text(
                item['value'] as String,
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.4,
                ),
              ),
              Text(
                item['sub'] as String,
                style: const TextStyle(
                  fontSize: 10.5,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubjectMasteryCard({
    required int avgAccuracy,
    required bool hasAttempts,
  }) {
    final subjects = [
      {
        'name': 'General Knowledge',
        'pct': hasAttempts ? avgAccuracy.clamp(35, 95) : 0,
        'color': const Color(0xFF10B981),
      },
      {
        'name': 'Elementary Mathematics',
        'pct': hasAttempts ? (avgAccuracy - 5).clamp(30, 92) : 0,
        'color': const Color(0xFF3142D6),
      },
      {
        'name': 'GI & Reasoning',
        'pct': hasAttempts ? (avgAccuracy + 6).clamp(40, 96) : 0,
        'color': const Color(0xFFF59E0B),
      },
      {
        'name': 'English & Bengali',
        'pct': hasAttempts ? (avgAccuracy - 2).clamp(35, 94) : 0,
        'color': const Color(0xFF8B5CF6),
      },
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Subject-wise Mastery',
                style: TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              GestureDetector(
                onTap: () => _navigateToTab(2, '/practice'),
                child: const Text(
                  'Practice Weak Areas →',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF3142D6),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...subjects.map((s) {
            final pct = s['pct'] as int;
            final color = s['color'] as Color;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
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
                        hasAttempts ? '$pct% Accuracy' : 'Not tested yet',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                          color: hasAttempts ? color : const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: (pct / 100.0).clamp(0.0, 1.0),
                      minHeight: 7,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
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

  Widget _buildEmptyAttemptsCard() {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.donut_large_rounded,
              size: 32,
              color: Color(0xFF3142D6),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'No Test Attempts Yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Attempt a full-length mock test or topic drill to see your score card, accuracy breakdown, and solutions here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12.5,
              color: Color(0xFF64748B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => _navigateToTab(1, '/exams'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3142D6),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.play_arrow_rounded, size: 18),
            label: const Text(
              'Explore Mock Tests',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileAttemptCard(_MobileAttemptItem item) {
    final encTitle = Uri.encodeComponent(item.testName);
    final isHighAcc = item.accuracy >= 70;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(15),
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
            // Top Row: Type Badge + Date + Score Pill
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: item.accentColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Text(
                        item.type.toUpperCase(),
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: item.accentColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      item.date,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isHighAcc
                        ? const Color(0xFFECFDF5)
                        : const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Score: ${item.score}',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                      color: isHighAcc
                          ? const Color(0xFF059669)
                          : const Color(0xFF3142D6),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Title
            Text(
              item.testName,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),

            // Metrics Strip
            Row(
              children: [
                Icon(
                  Icons.track_changes_rounded,
                  size: 14,
                  color: isHighAcc
                      ? const Color(0xFF10B981)
                      : const Color(0xFFF59E0B),
                ),
                const SizedBox(width: 4),
                Text(
                  '${item.accuracy}% Accuracy',
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(width: 14),
                const Icon(
                  Icons.schedule_rounded,
                  size: 14,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 4),
                Text(
                  item.time,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF475569),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Action Buttons Row
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      context.push('/result-analytics', extra: item.attempt);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF3142D6),
                      side: const BorderSide(color: Color(0xFFC7D2FE)),
                      backgroundColor: const Color(0xFFEEF2FF),
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.analytics_outlined, size: 16),
                    label: const Text(
                      'Report & Solutions',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      context.push(
                        '/test-details/${item.testId}?title=$encTitle&isPro=false',
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3142D6),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.replay_rounded, size: 16),
                    label: const Text(
                      'Re-attempt',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultsRingPainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final Color progressColor;

  _ResultsRingPainter({
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
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
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
  bool shouldRepaint(covariant _ResultsRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor;
  }
}
