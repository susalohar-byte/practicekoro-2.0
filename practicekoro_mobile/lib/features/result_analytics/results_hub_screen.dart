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

class _UnifiedTestRow {
  final String id;
  final String testId;
  final String testName;
  final String exam;
  final String type; // 'Mock Test' | 'Topic Test' | 'PYQ' | 'Custom Practice'
  final String date;
  final String score;
  final double scoreVal;
  final double totalMarks;
  final int accuracy;
  final String time;
  final int timeSpentSeconds;
  final Color iconColor;
  final TestAttemptModel attempt;

  const _UnifiedTestRow({
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
    required this.timeSpentSeconds,
    required this.iconColor,
    required this.attempt,
  });
}

class _ResultsHubScreenState extends State<ResultsHubScreen> {
  String _testTypeFilter = 'all'; // 'all' | 'mock' | 'topic' | 'pyq' | 'custom'
  String _timeframe = 'This Year';
  String _subjectTab = 'subject'; // 'subject' | 'topic' | 'exam'
  int _currentPage = 1;
  static const int _pageSize = 8;

  static const List<Map<String, String>> _filterPills = [
    {'key': 'all', 'label': 'All Tests'},
    {'key': 'mock', 'label': 'Mock Tests'},
    {'key': 'topic', 'label': 'Topic Tests'},
    {'key': 'pyq', 'label': 'PYQ'},
    {'key': 'custom', 'label': 'Custom'},
  ];

  static const List<Color> _rowColors = [
    Color(0xFF3B82F6), // blue
    Color(0xFFA855F7), // purple
    Color(0xFF10B981), // green
    Color(0xFFF43F5E), // rose
    Color(0xFFF59E0B), // amber
  ];

  static const List<Map<String, dynamic>> _subjectDefs = [
    {
      'name': 'General Knowledge',
      'color': Color(0xFF10B981),
      'textColor': Color(0xFF059669),
      'icon': Icons.menu_book_rounded,
    },
    {
      'name': 'Mathematics',
      'color': Color(0xFF3B82F6),
      'textColor': Color(0xFF2563EB),
      'icon': Icons.calculate_outlined,
    },
    {
      'name': 'Reasoning',
      'color': Color(0xFFF59E0B),
      'textColor': Color(0xFFD97706),
      'icon': Icons.psychology_outlined,
    },
    {
      'name': 'English',
      'color': Color(0xFFA855F7),
      'textColor': Color(0xFF9333EA),
      'icon': Icons.translate_rounded,
    },
    {
      'name': 'Bengali',
      'color': Color(0xFFF43F5E),
      'textColor': Color(0xFFE11D48),
      'icon': Icons.language_rounded,
    },
    {
      'name': 'Computer Awareness',
      'color': Color(0xFF0EA5E9),
      'textColor': Color(0xFF0284C7),
      'icon': Icons.laptop_mac_rounded,
    },
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
        titleLower.contains('chapter') ||
        idLower.contains('topic')) {
      return 'Topic Test';
    }
    if (titleLower.contains('custom')) {
      return 'Custom Practice';
    }
    return 'Mock Test';
  }

  String _inferExamTitle(TestAttemptModel a) {
    final target = LocalStorageService.getTargetExam() ?? '';
    if (target.toLowerCase().contains('wbp')) return 'WBP Constable';
    if (target.toLowerCase().contains('wbpsc')) return 'WBPSC Clerkship';
    if (target.toLowerCase().contains('tet')) return 'Primary TET';
    if (target.toLowerCase().contains('ssc')) return 'SSC GD';
    if (target.toLowerCase().contains('rail')) return 'Railway NTPC';
    return 'Mock Exam';
  }

  List<_UnifiedTestRow> _buildRows(List<TestAttemptModel> attempts) {
    final dateFormat = DateFormat('dd MMM yyyy');
    return List.generate(attempts.length, (idx) {
      final a = attempts[idx];
      final mins = a.timeSpentSeconds ~/ 60;
      final secs = a.timeSpentSeconds % 60;
      final timeStr = '${mins}m ${secs.toString().padLeft(2, '0')}s';
      final totalMarks = a.totalMarks > 0 ? a.totalMarks : 100.0;
      return _UnifiedTestRow(
        id: a.id,
        testId: a.testId,
        testName: a.testTitle.isNotEmpty ? a.testTitle : 'Mock Test',
        exam: _inferExamTitle(a),
        type: _inferTestType(a),
        date: dateFormat.format(a.completedAt),
        score: '${a.score.round()}/${totalMarks.round()}',
        scoreVal: a.score,
        totalMarks: totalMarks,
        accuracy: a.accuracy.round(),
        time: timeStr,
        timeSpentSeconds: a.timeSpentSeconds,
        iconColor: _rowColors[idx % _rowColors.length],
        attempt: a,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final attempts = LocalStorageService.getAttempts();
    final allRows = _buildRows(attempts);

    // Filter rows
    final filteredRows = _testTypeFilter == 'all'
        ? allRows
        : allRows.where((r) {
            switch (_testTypeFilter) {
              case 'mock':
                return r.type == 'Mock Test';
              case 'topic':
                return r.type == 'Topic Test';
              case 'pyq':
                return r.type == 'PYQ';
              case 'custom':
                return r.type == 'Custom Practice';
              default:
                return true;
            }
          }).toList();

    final totalPages = (filteredRows.length / _pageSize).ceil().clamp(1, 999);
    final safePage = _currentPage.clamp(1, totalPages);
    final startIdx = (safePage - 1) * _pageSize;
    final paginatedRows = filteredRows
        .skip(startIdx)
        .take(_pageSize)
        .toList(growable: false);

    // Metrics calculation (matches MyTests.tsx)
    final testsAttempted = attempts.length;
    int totalCorrect = 0;
    int totalWrong = 0;
    int totalSkipped = 0;
    int bestScoreVal = 0;
    int bestTotalMarks = 0;
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

    final totalQuestions = totalCorrect + totalWrong + totalSkipped;
    final bestScoreStr = attempts.isNotEmpty
        ? '$bestScoreVal/$bestTotalMarks'
        : '0/0';
    final dayStreak = attempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;

    final numberFormat = NumberFormat.decimalPattern('en_IN');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            // ── 0. BREADCRUMB + TITLE ──
            _buildHeaderSection(),
            const SizedBox(height: 18),

            // ── 1. HERO BANNER WITH FILTER PILLS & ILLUSTRATION ──
            _buildHeroFilterBanner(),
            const SizedBox(height: 18),

            // ── 2. 5 METRIC CARDS ──
            _buildMetricCardsSection(
              testsAttempted: '$testsAttempted',
              totalQuestions: numberFormat.format(totalQuestions),
              avgAccuracy: '$avgAccuracy%',
              bestScore: bestScoreStr,
              dayStreak: '$dayStreak',
            ),
            const SizedBox(height: 20),

            // ── 3. TEST HISTORY ──
            _buildTestHistoryCard(
              filteredRows: filteredRows,
              paginatedRows: paginatedRows,
              currentPage: safePage,
              totalPages: totalPages,
            ),
            const SizedBox(height: 20),

            // ── 4. BOTTOM CTA BANNER ("Consistency Creates Champions") ──
            _buildConsistencyBanner(testsAttempted),
            const SizedBox(height: 24),

            // ── 5. PERFORMANCE ANALYTICS & INSIGHTS ──
            _buildPerformanceAnalyticsSection(
              avgAccuracy: avgAccuracy,
              totalCorrect: numberFormat.format(totalCorrect),
              totalWrong: numberFormat.format(totalWrong),
              totalSkipped: numberFormat.format(totalSkipped),
              attempts: attempts,
              allRows: allRows,
            ),
          ],
        ),
      ),
    );
  }

  // ── 0. BREADCRUMB + TITLE ──
  Widget _buildHeaderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () => _navigateToTab(0, '/home'),
              child: const Text(
                'Home',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF94A3B8),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                '>',
                style: TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
              ),
            ),
            const Text(
              'Results',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        RichText(
          text: const TextSpan(
            style: TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
            children: [
              TextSpan(text: 'Your '),
              TextSpan(
                text: 'Results',
                style: TextStyle(color: Color(0xFF0158FC)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Track your performance, identify strengths, and work on weak areas.',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  // ── 1. HERO BANNER ──
  Widget _buildHeroFilterBanner() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFF0F9FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFDBEAFE)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _filterPills.map((pill) {
              final key = pill['key']!;
              final label = pill['label']!;
              final isSelected = _testTypeFilter == key;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _testTypeFilter = key;
                    _currentPage = 1;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 15,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF0158FC)
                        : Colors.white.withValues(alpha: 0.88),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF0158FC)
                          : const Color(0xFFDBEAFE),
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: const Color(
                                0xFF0158FC,
                              ).withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSelected
                          ? Colors.white
                          : const Color(0xFF334155),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ── 2. METRIC CARDS ──
  Widget _buildMetricCardsSection({
    required String testsAttempted,
    required String totalQuestions,
    required String avgAccuracy,
    required String bestScore,
    required String dayStreak,
  }) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                label: 'Tests Attempted',
                value: testsAttempted,
                icon: Icons.description_outlined,
                iconBg: const Color(0xFFEFF6FF),
                iconColor: const Color(0xFF0158FC),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                label: 'Total Questions',
                value: totalQuestions,
                icon: Icons.check_circle_outline_rounded,
                iconBg: const Color(0xFFECFDF5),
                iconColor: const Color(0xFF059669),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                label: 'Avg. Accuracy',
                value: avgAccuracy,
                icon: Icons.track_changes_rounded,
                iconBg: const Color(0xFFFFF1F2),
                iconColor: const Color(0xFFF43F5E),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                label: 'Best Score',
                value: bestScore,
                icon: Icons.bar_chart_rounded,
                iconBg: const Color(0xFFFAF5FF),
                iconColor: const Color(0xFF9333EA),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _buildMetricCard(
          label: 'Day Streak',
          value: dayStreak,
          icon: Icons.local_fire_department_rounded,
          iconBg: const Color(0xFFFFFBEB),
          iconColor: const Color(0xFFF59E0B),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String value,
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.025),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 3. TEST HISTORY CARD ──
  Widget _buildTestHistoryCard({
    required List<_UnifiedTestRow> filteredRows,
    required List<_UnifiedTestRow> paginatedRows,
    required int currentPage,
    required int totalPages,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
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
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(9),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.access_time_rounded,
                        color: Color(0xFF0158FC),
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Test History',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                InkWell(
                  onTap: () {
                    setState(() {
                      _testTypeFilter = 'all';
                      _currentPage = 1;
                    });
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Icon(
                      Icons.filter_list_rounded,
                      size: 16,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),

          // Rows or Empty State
          if (paginatedRows.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
              child: Column(
                children: const [
                  Icon(
                    Icons.description_outlined,
                    size: 34,
                    color: Color(0xFFCBD5E1),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'No tests found matching your criteria.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: paginatedRows.length,
              separatorBuilder: (_, _) =>
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
              itemBuilder: (context, index) {
                final row = paginatedRows[index];
                final accGood = row.accuracy >= 70;
                final badgeColors = _getTypeBadgeStyle(row.type);

                return InkWell(
                  onTap: () => context.push('/result/${row.id}'),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          margin: const EdgeInsets.only(top: 2),
                          decoration: BoxDecoration(
                            color: row.iconColor,
                            borderRadius: BorderRadius.circular(11),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.description_outlined,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                row.testName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 5),
                              Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: badgeColors['bg'],
                                      borderRadius: BorderRadius.circular(999),
                                      border: Border.all(
                                        color: badgeColors['border']!,
                                      ),
                                    ),
                                    child: Text(
                                      row.type,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: badgeColors['text'],
                                      ),
                                    ),
                                  ),
                                  Text(
                                    row.exam,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF94A3B8),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 12,
                                runSpacing: 4,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Text(
                                    row.score,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: accGood
                                          ? const Color(0xFFECFDF5)
                                          : const Color(0xFFFFFBEB),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '${row.accuracy}%',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: accGood
                                            ? const Color(0xFF059669)
                                            : const Color(0xFFD97706),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    row.time,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                  Text(
                                    row.date,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF94A3B8),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        PopupMenuButton<String>(
                          icon: const Icon(
                            Icons.more_vert_rounded,
                            size: 18,
                            color: Color(0xFF94A3B8),
                          ),
                          onSelected: (value) {
                            if (value == 'view') {
                              context.push('/result/${row.id}');
                            } else if (value == 'solutions') {
                              context.push(
                                '/solutions/${row.testId}',
                                extra: row.attempt,
                              );
                            } else if (value == 'reattempt') {
                              final encTitle = Uri.encodeComponent(
                                row.testName,
                              );
                              context.push(
                                '/test-details/${row.testId}?title=$encTitle',
                              );
                            }
                          },
                          itemBuilder: (context) => const [
                            PopupMenuItem(
                              value: 'view',
                              child: Text(
                                'View Result',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            PopupMenuItem(
                              value: 'solutions',
                              child: Text(
                                'View Solutions',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            PopupMenuItem(
                              value: 'reattempt',
                              child: Text(
                                'Re-attempt',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

          // Pagination footer
          if (filteredRows.isNotEmpty) ...[
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Showing ${(currentPage - 1) * _pageSize + 1}–${(currentPage * _pageSize).clamp(1, filteredRows.length)} of ${filteredRows.length} tests',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        onPressed: currentPage > 1
                            ? () => setState(() => _currentPage--)
                            : null,
                        icon: const Icon(Icons.chevron_left_rounded, size: 18),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0158FC),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$currentPage',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        onPressed: currentPage < totalPages
                            ? () => setState(() => _currentPage++)
                            : null,
                        icon: const Icon(Icons.chevron_right_rounded, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Map<String, Color> _getTypeBadgeStyle(String type) {
    switch (type) {
      case 'Topic Test':
        return {
          'bg': const Color(0xFFECFDF5),
          'text': const Color(0xFF047857),
          'border': const Color(0xFFA7F3D0),
        };
      case 'PYQ':
        return {
          'bg': const Color(0xFFEFF6FF),
          'text': const Color(0xFF1D4ED8),
          'border': const Color(0xFFBFDBFE),
        };
      case 'Custom Practice':
        return {
          'bg': const Color(0xFFFAF5FF),
          'text': const Color(0xFF7E22CE),
          'border': const Color(0xFFE9D5FF),
        };
      default:
        return {
          'bg': const Color(0xFFFFFBEB),
          'text': const Color(0xFFB45309),
          'border': const Color(0xFFFDE68A),
        };
    }
  }

  // ── 4. CONSISTENCY CREATES CHAMPIONS BANNER ──
  Widget _buildConsistencyBanner(int testsAttempted) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFF0F9FF)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFDBEAFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.emoji_events_outlined,
                  color: Color(0xFFF59E0B),
                  size: 26,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Consistency Creates Champions',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      testsAttempted > 0
                          ? "You've attempted $testsAttempted tests so far. Keep up the great work!"
                          : 'Attempt your first mock test today to start tracking your progress!',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF475569),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: InkWell(
              onTap: () => _navigateToTab(2, '/practice'),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFDBEAFE)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Go to Practice',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                    SizedBox(width: 6),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 15,
                      color: Color(0xFF0158FC),
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

  // ── 5. PERFORMANCE ANALYTICS & INSIGHTS ──
  Widget _buildPerformanceAnalyticsSection({
    required int avgAccuracy,
    required String totalCorrect,
    required String totalWrong,
    required String totalSkipped,
    required List<TestAttemptModel> attempts,
    required List<_UnifiedTestRow> allRows,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Performance Analytics',
          style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 3),
        const Text(
          'Detailed breakdown of your accuracy, subject mastery, and state-wide rank standing.',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 16),

        // Card A: Performance Overview
        _buildPerformanceOverviewCard(
          avgAccuracy: avgAccuracy,
          totalCorrect: totalCorrect,
          totalWrong: totalWrong,
          totalSkipped: totalSkipped,
        ),
        const SizedBox(height: 16),

        // Card B: Subject Performance
        _buildSubjectPerformanceCard(
          hasAttempts: attempts.isNotEmpty,
          avgAccuracy: avgAccuracy,
        ),
        const SizedBox(height: 16),

        // Card C: Your Rank Card
        _buildYourRankCard(attempts: attempts, allRows: allRows),
        const SizedBox(height: 16),

        // Card D: Keep Going Card
        _buildKeepGoingCard(),
        const SizedBox(height: 16),

        // Card E: Motivational Quote Card
        _buildMotivationalQuoteCard(),
      ],
    );
  }

  Widget _buildPerformanceOverviewCard({
    required int avgAccuracy,
    required String totalCorrect,
    required String totalWrong,
    required String totalSkipped,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Performance Overview',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _timeframe,
                    isDense: true,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF475569),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'This Year',
                        child: Text('This Year'),
                      ),
                      DropdownMenuItem(
                        value: 'All Time',
                        child: Text('All Time'),
                      ),
                      DropdownMenuItem(
                        value: 'This Month',
                        child: Text('This Month'),
                      ),
                      DropdownMenuItem(
                        value: 'This Week',
                        child: Text('This Week'),
                      ),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _timeframe = val);
                      }
                    },
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              SizedBox(
                width: 116,
                height: 116,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 104,
                      height: 104,
                      child: CircularProgressIndicator(
                        value: avgAccuracy / 100.0,
                        strokeWidth: 11,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Color(0xFF0158FC),
                        ),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$avgAccuracy%',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
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
              const SizedBox(width: 22),
              Expanded(
                child: Column(
                  children: [
                    _buildLegendCountRow(
                      dotColor: const Color(0xFF10B981),
                      label: 'Correct',
                      value: totalCorrect,
                    ),
                    const SizedBox(height: 10),
                    _buildLegendCountRow(
                      dotColor: const Color(0xFFF43F5E),
                      label: 'Incorrect',
                      value: totalWrong,
                    ),
                    const SizedBox(height: 10),
                    _buildLegendCountRow(
                      dotColor: const Color(0xFF94A3B8),
                      label: 'Unattempted',
                      value: totalSkipped,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendCountRow({
    required Color dotColor,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 9,
              height: 9,
              decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF475569),
              ),
            ),
          ],
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectPerformanceCard({
    required bool hasAttempts,
    required int avgAccuracy,
  }) {
    final pct = hasAttempts ? avgAccuracy : 0;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Subject Performance',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              GestureDetector(
                onTap: () => _navigateToTab(2, '/practice'),
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0158FC),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Sub-tabs ('By Subject', 'By Topic', 'By Exam')
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: ['subject', 'topic', 'exam'].map((tab) {
                final selected = _subjectTab == tab;
                final label =
                    'By ${tab[0].toUpperCase()}${tab.substring(1)}';
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _subjectTab = tab),
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
                        label,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: selected
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
          const SizedBox(height: 14),

          // Subject bars
          ..._subjectDefs.map((subj) {
            final color = subj['color'] as Color;
            final textColor = subj['textColor'] as Color;
            final icon = subj['icon'] as IconData;
            final name = subj['name'] as String;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: color,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            alignment: Alignment.center,
                            child: Icon(icon, color: Colors.white, size: 13),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '$pct%',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: pct / 100.0,
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

  Widget _buildYourRankCard({
    required List<TestAttemptModel> attempts,
    required List<_UnifiedTestRow> allRows,
  }) {
    final hasAttempts = attempts.isNotEmpty;
    final subtitle = allRows.isNotEmpty
        ? allRows.first.testName
        : 'Attempt a mock test to see your rank';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Rank',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => context.push('/rank'),
                child: const Text(
                  'Leaderboard',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0158FC),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.emoji_events_outlined,
                      color: Color(0xFFF59E0B),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        hasAttempts ? '# 1' : '# -',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        hasAttempts
                            ? 'Based on completed tests'
                            : 'No rank recorded yet',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (hasAttempts)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFD1FAE5)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: const [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.verified_user_outlined,
                            size: 14,
                            color: Color(0xFF047857),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Active',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF047857),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Keep practicing!',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF059669),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKeepGoingCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFF0F9FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFDBEAFE)),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 84),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(
                      Icons.trending_up_rounded,
                      size: 17,
                      color: Color(0xFF0158FC),
                    ),
                    SizedBox(width: 6),
                    Text(
                      'Keep Going!',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Consistency today creates bigger results tomorrow.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () => _navigateToTab(2, '/practice'),
                  borderRadius: BorderRadius.circular(11),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0158FC),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Keep Practicing',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 5),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 14,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Image.asset(
              'assets/images/results_growth_chart.png',
              width: 78,
              height: 66,
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMotivationalQuoteCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFF0F9FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFDBEAFE)),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 90),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Icon(
                  Icons.auto_awesome_rounded,
                  size: 19,
                  color: Color(0xFF0158FC),
                ),
                SizedBox(height: 8),
                Text(
                  '“Progress, not perfection, leads to success.”',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    fontStyle: FontStyle.italic,
                    color: Color(0xFF1E293B),
                    height: 1.4,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '— PracticeKoro',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                bottomRight: Radius.circular(12),
              ),
              child: Opacity(
                opacity: 0.85,
                child: Image.asset(
                  'assets/images/streak_mountain_summit.jpg',
                  width: 84,
                  height: 70,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
