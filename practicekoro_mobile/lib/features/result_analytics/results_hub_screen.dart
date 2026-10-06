import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';

class ResultsHubScreen extends StatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const ResultsHubScreen({super.key, this.onTabSelected});

  @override
  State<ResultsHubScreen> createState() => _ResultsHubScreenState();
}

class _SubjectPerformanceData {
  final String title;
  final int scored;
  final int total;
  final int percentage;
  final Color iconBg;
  final Color iconColor;
  final IconData? icon;
  final String? symbol;
  final Color? symbolBg;
  final Color progressColor;
  final Color badgeBg;
  final Color badgeTextColor;

  const _SubjectPerformanceData({
    required this.title,
    required this.scored,
    required this.total,
    required this.percentage,
    required this.iconBg,
    required this.iconColor,
    this.icon,
    this.symbol,
    this.symbolBg,
    required this.progressColor,
    required this.badgeBg,
    required this.badgeTextColor,
  });
}

class _RecentTestResultData {
  final String id;
  final String title;
  final String testSeriesTitle;
  final String testSeriesId;
  final int? testSeriesRank;
  final String type;
  final String questionsCount;
  final String date;
  final int percentage;
  final int scored;
  final int total;
  final int correctCount;
  final int wrongCount;
  final int skippedCount;
  final String timeSpent;
  final String emblemType;
  final Color scoreBg;
  final Color scoreColor;

  const _RecentTestResultData({
    required this.id,
    required this.title,
    required this.testSeriesTitle,
    required this.testSeriesId,
    required this.testSeriesRank,
    required this.type,
    required this.questionsCount,
    required this.date,
    required this.percentage,
    required this.scored,
    required this.total,
    this.correctCount = 0,
    this.wrongCount = 0,
    this.skippedCount = 0,
    this.timeSpent = '45m 00s',
    required this.emblemType,
    required this.scoreBg,
    required this.scoreColor,
  });
}

class _SeriesResultData {
  final String id;
  final String title;
  final int totalTests;
  final int completedTests;
  final String status;
  final bool isCompleted;
  final int avgScore;
  final String emblemType;
  final Color scoreBg;
  final Color scoreColor;

  const _SeriesResultData({
    required this.id,
    required this.title,
    required this.totalTests,
    required this.completedTests,
    required this.status,
    required this.isCompleted,
    required this.avgScore,
    required this.emblemType,
    required this.scoreBg,
    required this.scoreColor,
  });
}

class _ResultsHubScreenState extends State<ResultsHubScreen> {
  int _selectedFilterIndex = 0;
  String _selectedTimeRange = 'Last 3 Months';
  String _selectedMetric = 'Marks';
  int _selectedRankLocationIndex =
      0; // 0: West Bengal Rank, 1: My District Rank
  int _selectedRankSeriesIndex = 0;

  static const List<String> _filters = [
    'Overview',
    'Mock Tests',
    'Test Series',
    'Practice Tests',
    'Live Tests',
  ];

  List<TestAttemptModel> _studentAttempts = const [];
  List<_SubjectPerformanceData> _subjectData = const [];
  List<_SeriesResultData> _seriesResults = const [];
  Map<String, Map<String, dynamic>> _seriesRankings = const {};
  Map<String, int> _attemptRanks = const {};
  bool _loadingResults = true;

  @override
  void initState() {
    super.initState();
    _loadStudentResults();
  }

  Future<void> _loadStudentResults() async {
    final repository = CatalogRepository();
    try {
      final attempts = await repository.getStudentCompletedAttempts();
      final attemptedSeriesIds = attempts
          .map((attempt) => attempt.testSeriesId)
          .whereType<String>()
          .toSet();
      final series = await repository.getTestSeries();
      final visibleSeries = series.where(
        (item) => attemptedSeriesIds.contains(item.id),
      );
      final seriesResults = <_SeriesResultData>[];
      final subjectsByName = <String, Map<String, num>>{};
      final rankings = <String, Map<String, dynamic>>{};
      final attemptRanks = <String, int>{};
      for (final item in visibleSeries) {
        try {
          final report = await repository.getSeriesAnalytics(item.id);
          final total = (report['totalTests'] as num?)?.toInt() ?? 0;
          final completed = (report['testsAttempted'] as num?)?.toInt() ?? 0;
          seriesResults.add(
            _SeriesResultData(
              id: item.id,
              title: item.title,
              totalTests: total,
              completedTests: completed,
              status: completed >= total && total > 0
                  ? 'Completed'
                  : 'In Progress',
              isCompleted: completed >= total && total > 0,
              avgScore: (report['averageScorePercent'] as num?)?.round() ?? 0,
              emblemType: 'wbssc_red',
              scoreBg: const Color(0xFFEFF6FF),
              scoreColor: const Color(0xFF0877FF),
            ),
          );
          for (final value
              in (report['subjects'] as List<dynamic>? ?? const [])) {
            if (value is! Map) continue;
            final subject = Map<String, dynamic>.from(value);
            final name = subject['subjectName']?.toString() ?? '';
            if (name.isEmpty) continue;
            final aggregate = subjectsByName.putIfAbsent(
              name,
              () => {'questions': 0, 'correct': 0},
            );
            aggregate['questions'] =
                (aggregate['questions'] ?? 0) +
                ((subject['questionsAttempted'] as num?) ?? 0);
            aggregate['correct'] =
                (aggregate['correct'] ?? 0) +
                ((subject['correctCount'] as num?) ?? 0);
          }
        } catch (_) {
          // A series without analytics remains absent rather than showing sample data.
        }
        final matchingAttempts = attempts
            .where((attempt) => attempt.testSeriesId == item.id)
            .toList();
        final latest = matchingAttempts.isEmpty ? null : matchingAttempts.first;
        if (latest != null) {
          try {
            final result = await repository.getAttemptRankings(latest.id);
            if (result != null) {
              rankings[item.id] = result;
              final seriesRank = result['testSeries'];
              if (seriesRank is Map) {
                final rank = (seriesRank['rank'] as num?)?.toInt();
                if (rank != null) attemptRanks[latest.id] = rank;
                final idx = seriesResults.indexWhere(
                  (entry) => entry.id == item.id,
                );
                if (idx >= 0) {
                  seriesResults[idx] = _SeriesResultData(
                    id: item.id,
                    title: seriesResults[idx].title,
                    totalTests: seriesResults[idx].totalTests,
                    completedTests: seriesResults[idx].completedTests,
                    status: seriesResults[idx].status,
                    isCompleted: seriesResults[idx].isCompleted,
                    avgScore: seriesResults[idx].avgScore,
                    emblemType: seriesResults[idx].emblemType,
                    scoreBg: seriesResults[idx].scoreBg,
                    scoreColor: seriesResults[idx].scoreColor,
                  );
                }
              }
            }
          } catch (_) {}
        }
      }
      final subjects = subjectsByName.entries.map((entry) {
        final questions = entry.value['questions']?.toInt() ?? 0;
        final correct = entry.value['correct']?.toInt() ?? 0;
        final percent = questions == 0
            ? 0
            : (correct * 100 / questions).round();
        final palette = [
          const Color(0xFF2563EB),
          const Color(0xFF16A34A),
          const Color(0xFFE11D48),
          const Color(0xFF9333EA),
          const Color(0xFFD97706),
        ];
        final color =
            palette[subjectsByName.keys.toList().indexOf(entry.key) %
                palette.length];
        final lower = entry.key.toLowerCase();
        IconData? icon;
        String? symbol;
        Color? symbolBg;
        if (lower.contains('math')) {
          icon = Icons.calculate_rounded;
        } else if (lower.contains('english')) {
          symbol = 'A';
          symbolBg = const Color(0xFF9333EA);
        } else if (lower.contains('bengali') || lower.contains('beng')) {
          symbol = 'অ';
          symbolBg = const Color(0xFFEA580C);
        } else if (lower.contains('reasoning') || lower.contains('logic')) {
          icon = Icons.hub_rounded;
        } else if (lower.contains('science') || lower.contains('evs')) {
          icon = Icons.science_outlined;
        } else {
          icon = Icons.menu_book_rounded;
        }

        return _SubjectPerformanceData(
          title: entry.key,
          scored: correct,
          total: questions,
          percentage: percent,
          iconBg: color.withValues(alpha: 0.10),
          iconColor: color,
          icon: icon,
          symbol: symbol,
          symbolBg: symbolBg,
          progressColor: percent >= 65
              ? const Color(0xFF10B981)
              : const Color(0xFF0877FF),
          badgeBg: const Color(0xFFEFF6FF),
          badgeTextColor: const Color(0xFF0877FF),
        );
      }).toList();
      if (!mounted) return;
      setState(() {
        _studentAttempts = attempts;
        _seriesResults = seriesResults;
        _subjectData = subjects;
        _seriesRankings = rankings;
        _attemptRanks = attemptRanks;
        _loadingResults = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingResults = false);
    }
  }

  List<_RecentTestResultData> get _recentTests {
    final attempts = _filteredAttempts;
    if (attempts.isNotEmpty) {
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
      return attempts.map((a) {
        final sId = a.testSeriesId ?? '';
        final sTitle = a.testSeriesTitle ?? '';
        final emblem = sId.contains('kp')
            ? 'kp_crest'
            : sId.contains('ssc')
            ? 'ssc_red'
            : 'wbssc_red';
        final pct = a.percentage.round();
        final scoreColor = pct >= 70
            ? const Color(0xFF10B981)
            : pct >= 50
            ? const Color(0xFF0877FF)
            : const Color(0xFFEF4444);
        final scoreBg = pct >= 70
            ? const Color(0xFFECFDF5)
            : pct >= 50
            ? const Color(0xFFEFF6FF)
            : const Color(0xFFFFF1F2);
        final mins = a.timeSpentSeconds ~/ 60;
        final secs = a.timeSpentSeconds % 60;

        return _RecentTestResultData(
          id: a.id,
          title: a.testTitle,
          testSeriesTitle: sTitle,
          testSeriesId: sId,
          testSeriesRank: _attemptRanks[a.id] ?? a.testSeriesRank,
          type: 'Full Length Test',
          questionsCount: '${a.totalQuestions} Questions',
          date:
              '${a.completedAt.day} ${months[a.completedAt.month - 1]} ${a.completedAt.year}',
          percentage: pct,
          scored: a.score.round(),
          total: a.totalMarks.round(),
          correctCount: a.correctCount,
          wrongCount: a.wrongCount,
          skippedCount: a.skippedCount,
          timeSpent: '${mins}m ${secs.toString().padLeft(2, '0')}s',
          emblemType: emblem,
          scoreBg: scoreBg,
          scoreColor: scoreColor,
        );
      }).toList();
    }
    return const [];
  }

  List<TestAttemptModel> get _filteredAttempts {
    final now = DateTime.now();
    final cutoff = switch (_selectedTimeRange) {
      'Last 30 Days' => now.subtract(const Duration(days: 30)),
      'Last 3 Months' => DateTime(now.year, now.month - 3),
      'Last 6 Months' => DateTime(now.year, now.month - 6),
      _ => null,
    };
    return cutoff == null
        ? _studentAttempts
        : _studentAttempts
              .where((attempt) => !attempt.completedAt.isBefore(cutoff))
              .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5FC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: PKBottomSpacing.edgeInsets(context, horizontal: 16, top: 12),
          children: [
            // ── 1. SCREEN TITLE & SUBTITLE ──
            const Text(
              'Results',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0B1F5B),
                letterSpacing: -0.6,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 3),
            const Text(
              'Track your performance and improve',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
            if (_loadingResults)
              const LinearProgressIndicator(
                minHeight: 2,
                color: Color(0xFF0877FF),
              ),
            const SizedBox(height: 14),

            // ── 2. FILTER PILLS (Overview | Mock Tests | Test Series...) ──
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _filters.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final isSelected = _selectedFilterIndex == idx;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedFilterIndex = idx),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF0877FF)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF0877FF)
                              : const Color(0xFFE2ECF8),
                        ),
                        boxShadow: [
                          if (isSelected)
                            BoxShadow(
                              color: const Color(
                                0xFF0877FF,
                              ).withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _filters[idx],
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected
                              ? FontWeight.w800
                              : FontWeight.w600,
                          color: isSelected
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

            // ── 3. TOTAL PERFORMANCE CARD ──
            _buildTotalPerformanceCard(context),
            const SizedBox(height: 20),

            // ── 3.1 TEST SERIES RANK SECTION ──
            if (_seriesResults.any(
              (series) => _seriesRankings.containsKey(series.id),
            ))
              _buildTestSeriesRankSection(context),
            const SizedBox(height: 20),

            // ── 4. SUBJECT-WISE PERFORMANCE CARD ──
            _buildSubjectWisePerformanceCard(context),
            const SizedBox(height: 20),

            // ── 5. RECENT TESTS SECTION ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Tests',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                    letterSpacing: -0.4,
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _selectedFilterIndex = 1),
                  child: const Row(
                    children: [
                      Text(
                        'See All',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF0877FF),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 15,
                        color: Color(0xFF0877FF),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._recentTests.map(
              (test) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _buildRecentTestCard(context, test),
              ),
            ),
            const SizedBox(height: 18),

            // ── 6. TEST SERIES RESULTS SECTION ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(
                      Icons.bar_chart_rounded,
                      size: 20,
                      color: Color(0xFF0B1F5B),
                    ),
                    SizedBox(width: 6),
                    Text(
                      'Test Series Results',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0B1F5B),
                        letterSpacing: -0.4,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => setState(() => _selectedFilterIndex = 2),
                  child: const Row(
                    children: [
                      Text(
                        'See All',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF0877FF),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 15,
                        color: Color(0xFF0877FF),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._seriesResults.asMap().entries.map((entry) {
              final isLast = entry.key == _seriesResults.length - 1;
              return Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : 10),
                child: _buildTestSeriesCard(context, entry.value),
              );
            }),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // TOTAL PERFORMANCE CARD
  // ==========================================
  Widget _buildTotalPerformanceCard(BuildContext context) {
    final attempts = _filteredAttempts;
    final correct = attempts.fold<int>(
      0,
      (sum, attempt) => sum + attempt.correctCount,
    );
    final wrong = attempts.fold<int>(
      0,
      (sum, attempt) => sum + attempt.wrongCount,
    );
    final skipped = attempts.fold<int>(
      0,
      (sum, attempt) => sum + attempt.skippedCount,
    );
    final totalQuestions = attempts.fold<int>(
      0,
      (sum, attempt) => sum + attempt.totalQuestions,
    );
    final seconds = attempts.fold<int>(
      0,
      (sum, attempt) => sum + attempt.timeSpentSeconds,
    );
    final accuracy = correct + wrong == 0 ? 0.0 : correct / (correct + wrong);
    final split = (attempts.length / 2).ceil();
    final recentAverage = attempts.isEmpty
        ? 0.0
        : attempts
                  .take(split)
                  .fold<double>(0, (sum, attempt) => sum + attempt.percentage) /
              split;
    final olderAttempts = attempts.skip(split).toList();
    final olderAverage = olderAttempts.isEmpty
        ? recentAverage
        : olderAttempts.fold<double>(
                0,
                (sum, attempt) => sum + attempt.percentage,
              ) /
              olderAttempts.length;
    final improvement = (recentAverage - olderAverage).round();
    final accuracyChart = SizedBox(
      width: 90,
      height: 90,
      child: CustomPaint(
        painter: _DonutChartPainter(
          percentage: accuracy,
          strokeWidth: 9,
          progressColor: const Color(0xFF0877FF),
          backgroundColor: const Color(0xFFE2ECF8),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '${(accuracy * 100).round()}%',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0B1F5B),
                  letterSpacing: -0.5,
                ),
              ),
              const Text(
                'Overall\nAccuracy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
    final performanceStats = <Widget>[
      _buildStatTile(
        icon: Icons.check_circle_rounded,
        iconColor: const Color(0xFF10B981),
        value: '$correct',
        label: 'Correct',
        bgColor: const Color(0xFFECFDF5),
        labelColor: const Color(0xFF059669),
      ),
      _buildStatTile(
        icon: Icons.cancel_rounded,
        iconColor: const Color(0xFFEF4444),
        value: '$wrong',
        label: 'Wrong',
        bgColor: const Color(0xFFFFF1F2),
        labelColor: const Color(0xFFDC2626),
      ),
      _buildStatTile(
        icon: Icons.remove_circle_rounded,
        iconColor: const Color(0xFF64748B),
        value: '$skipped',
        label: 'Skipped',
        bgColor: const Color(0xFFF1F5F9),
        labelColor: const Color(0xFF64748B),
      ),
      _buildStatTile(
        icon: Icons.access_time_filled_rounded,
        iconColor: const Color(0xFF0877FF),
        value: '${seconds ~/ 3600}h',
        label: 'Time Spent',
        bgColor: const Color(0xFFEFF6FF),
        labelColor: const Color(0xFF0877FF),
      ),
    ];
    final bottomMetrics = <Widget>[
      _buildBottomSummaryItem(
        icon: Icons.bar_chart_rounded,
        iconBg: const Color(0xFFEFF6FF),
        iconColor: const Color(0xFF0877FF),
        value: '${attempts.length}',
        label: 'Total Tests',
      ),
      _buildBottomSummaryItem(
        icon: Icons.description_outlined,
        iconBg: const Color(0xFFEFF6FF),
        iconColor: const Color(0xFF0877FF),
        value: '$totalQuestions',
        label: 'Total Questions',
      ),
      GestureDetector(
        onTap: () => context.push('/rank'),
        behavior: HitTestBehavior.opaque,
        child: _buildBottomSummaryItem(
          icon: Icons.emoji_events_rounded,
          iconBg: const Color(0xFFFEF3C7),
          iconColor: const Color(0xFFF59E0B),
          value: _seriesRankings.isEmpty
              ? '—'
              : '#${_seriesRankings.values.first['westBengal']?['rank'] ?? '—'}',
          label: 'Your Rank',
        ),
      ),
      _buildBottomSummaryItem(
        icon: Icons.trending_up_rounded,
        iconBg: const Color(0xFFECFDF5),
        iconColor: const Color(0xFF10B981),
        value: '${improvement >= 0 ? '+' : ''}$improvement%',
        label: 'Improvement',
        valueColor: const Color(0xFF10B981),
      ),
    ];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8EEF7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Title & Subtitle + Date Filter Dropdown
          LayoutBuilder(
            builder: (context, constraints) {
              final heading = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total Performance',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0B1F5B),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Based on ${attempts.length} completed tests',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              );
              final timeFilter = GestureDetector(
                onTap: () => _showTimeRangePicker(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2ECF8)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 11,
                        color: Color(0xFF0B1F5B),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _selectedTimeRange,
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0B1F5B),
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 14,
                        color: Color(0xFF0B1F5B),
                      ),
                    ],
                  ),
                ),
              );

              if (constraints.maxWidth < 350) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    heading,
                    const SizedBox(height: 8),
                    Align(alignment: Alignment.centerRight, child: timeFilter),
                  ],
                );
              }
              return Row(
                children: [
                  Expanded(child: heading),
                  const SizedBox(width: 8),
                  timeFilter,
                ],
              );
            },
          ),
          const SizedBox(height: 16),

          // Compact phones stack the chart and use a readable two-column stat grid.
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 430) {
                final tileWidth = (constraints.maxWidth - 8) / 2;
                return Column(
                  children: [
                    Center(child: accuracyChart),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: performanceStats
                          .map(
                            (tile) => SizedBox(width: tileWidth, child: tile),
                          )
                          .toList(),
                    ),
                  ],
                );
              }
              return Row(
                children: [
                  accuracyChart,
                  const SizedBox(width: 12),
                  Expanded(
                    child: Row(
                      children: performanceStats
                          .map(
                            (tile) => Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: tile,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFEDF2F7)),
          const SizedBox(height: 14),

          // Bottom Metric Row (Total Tests | Total Questions | Rank | Improvement)
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 430) {
                final itemWidth = (constraints.maxWidth - 8) / 2;
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: bottomMetrics
                      .map((item) => SizedBox(width: itemWidth, child: item))
                      .toList(),
                );
              }
              return Row(
                children: bottomMetrics
                    .map((item) => Expanded(child: item))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TEST SERIES RANK SECTION (Screen 10 & 11)
  // ==========================================
  Widget _buildTestSeriesRankSection(BuildContext context) {
    final userDistrict = LocalStorageService.getLeaderboardDistrict();
    final activeSeries =
        _seriesResults[_selectedRankSeriesIndex.clamp(
          0,
          _seriesResults.length - 1,
        )];
    final isStateRank = _selectedRankLocationIndex == 0;
    final ranking =
        _seriesRankings[activeSeries.id] ?? const <String, dynamic>{};
    final state = ranking['westBengal'] is Map
        ? Map<String, dynamic>.from(ranking['westBengal'] as Map)
        : const <String, dynamic>{};
    final district = ranking['district'] is Map
        ? Map<String, dynamic>.from(ranking['district'] as Map)
        : const <String, dynamic>{};
    final rankData = isStateRank ? state : district;
    final currentRank = (rankData['rank'] as num?)?.toInt();
    final currentTotal = (rankData['participants'] as num?)?.toInt() ?? 0;
    if (currentRank == null) return const SizedBox.shrink();
    final currentScopeLabel = isStateRank ? 'West Bengal' : userDistrict;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8EEF7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header: Trophy Icon + Title + View Rank List Button
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCD34D)),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.emoji_events_rounded,
                  size: 20,
                  color: Color(0xFFD97706),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Test Series Ranking',
                      style: TextStyle(
                        fontSize: 17.5,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0B1F5B),
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Performance rank in ${activeSeries.title}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              // "View Rank List" Button
              GestureDetector(
                onTap: () {
                  context.push(
                    '/rank?seriesId=${Uri.encodeComponent(activeSeries.id)}&seriesTitle=${Uri.encodeComponent(activeSeries.title)}&scope=$_selectedRankLocationIndex&district=${Uri.encodeComponent(userDistrict)}&rank=$currentRank',
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View Rank List',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0877FF),
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 13,
                        color: Color(0xFF0877FF),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Test Series Selector Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _seriesResults.asMap().entries.map((entry) {
                final isSelected = _selectedRankSeriesIndex == entry.key;
                final item = entry.value;
                return GestureDetector(
                  onTap: () =>
                      setState(() => _selectedRankSeriesIndex = entry.key),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF0B1F5B)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF0B1F5B)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.verified_rounded,
                          size: 11,
                          color: isSelected
                              ? const Color(0xFFFCD34D)
                              : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          item.title.replaceAll(' Test Series', ''),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected
                                ? FontWeight.w800
                                : FontWeight.w600,
                            color: isSelected
                                ? Colors.white
                                : const Color(0xFF475569),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // Location Filter Switcher (West Bengal Rank vs My District Rank)
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5FC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedRankLocationIndex = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: isStateRank ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(9),
                        boxShadow: isStateRank
                            ? [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'West Bengal Rank',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: isStateRank
                              ? FontWeight.w800
                              : FontWeight.w600,
                          color: isStateRank
                              ? const Color(0xFF0B1F5B)
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedRankLocationIndex = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: !isStateRank ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(9),
                        boxShadow: !isStateRank
                            ? [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'My District ($userDistrict)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: !isStateRank
                              ? FontWeight.w800
                              : FontWeight.w600,
                          color: !isStateRank
                              ? const Color(0xFF0B1F5B)
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Main Rank Highlight Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isStateRank
                    ? [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)]
                    : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isStateRank
                    ? const Color(0xFFBFDBFE)
                    : const Color(0xFFA7F3D0),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isStateRank
                                  ? const Color(0xFF0877FF)
                                  : const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isStateRank ? 'STATE RANK' : 'DISTRICT RANK',
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              currentScopeLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isStateRank
                                    ? const Color(0xFF1E3A8A)
                                    : const Color(0xFF065F46),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '#$currentRank',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: isStateRank
                              ? const Color(0xFF0B1F5B)
                              : const Color(0xFF064E3B),
                          letterSpacing: -0.6,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Among $currentTotal Candidates in ${activeSeries.title}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isStateRank
                              ? const Color(0xFF3B82F6)
                              : const Color(0xFF059669),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isStateRank
                          ? const Color(0xFFBFDBFE)
                          : const Color(0xFFA7F3D0),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        isStateRank ? 'Top 2%' : 'Top 3%',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: isStateRank
                              ? const Color(0xFF0877FF)
                              : const Color(0xFF10B981),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Avg ${activeSeries.avgScore}% Marks',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Quick Top 3 Students Preview + User
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Leaderboard Preview',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0B1F5B),
                      ),
                    ),
                    Text(
                      'Score / 100',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                _buildLeaderboardPreviewRow(1, 'Sourav Ganguly', '82.5', false),
                const SizedBox(height: 4),
                _buildLeaderboardPreviewRow(2, 'Ananya Das', '79.0', false),
                const SizedBox(height: 4),
                _buildLeaderboardPreviewRow(3, 'Rahul Banerjee', '76.5', false),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 2),
                  child: Center(
                    child: Text(
                      '• • •',
                      style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                    ),
                  ),
                ),
                _buildLeaderboardPreviewRow(
                  currentRank,
                  'You',
                  '${activeSeries.avgScore}.0',
                  true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Bottom Full-width CTA button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                context.push(
                  '/rank?seriesId=${Uri.encodeComponent(activeSeries.id)}&seriesTitle=${Uri.encodeComponent(activeSeries.title)}&scope=$_selectedRankLocationIndex&district=${Uri.encodeComponent(userDistrict)}&rank=$currentRank',
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0877FF),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 11),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.leaderboard_rounded, size: 16),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'Open Full Rank List (${activeSeries.title.replaceAll(' Test Series', '')})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_rounded, size: 14),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboardPreviewRow(
    int rank,
    String name,
    String score,
    bool isUser,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: isUser ? const Color(0xFFEFF6FF) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: isUser ? Border.all(color: const Color(0xFFBFDBFE)) : null,
      ),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text(
              '$rank.',
              style: TextStyle(
                fontSize: 11,
                fontWeight: isUser ? FontWeight.w900 : FontWeight.w700,
                color: isUser
                    ? const Color(0xFF0877FF)
                    : const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: isUser ? FontWeight.w800 : FontWeight.w600,
                color: isUser
                    ? const Color(0xFF0877FF)
                    : const Color(0xFF1E293B),
              ),
            ),
          ),
          Text(
            score,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: isUser ? const Color(0xFF0877FF) : const Color(0xFF334155),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatTile({
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
    required Color bgColor,
    required Color labelColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 16, color: iconColor),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0B1F5B),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 1),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: labelColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomSummaryItem({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String value,
    required String label,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: iconBg,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Icon(icon, size: 16, color: iconColor),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w900,
                  color: valueColor ?? const Color(0xFF0B1F5B),
                  letterSpacing: -0.2,
                ),
              ),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // SUBJECT-WISE PERFORMANCE CARD
  // ==========================================
  Widget _buildSubjectWisePerformanceCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8EEF7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Subject-wise Performance',
                style: TextStyle(
                  fontSize: 17.5,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0B1F5B),
                  letterSpacing: -0.3,
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedMetric = _selectedMetric == 'Marks'
                        ? 'Percentage'
                        : 'Marks';
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2ECF8)),
                  ),
                  child: Row(
                    children: [
                      Text(
                        _selectedMetric,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0B1F5B),
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 15,
                        color: Color(0xFF0B1F5B),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Subject Rows
          ..._subjectData.map(
            (sub) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: _buildSubjectPerformanceRow(context, sub),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectPerformanceRow(
    BuildContext context,
    _SubjectPerformanceData sub,
  ) {
    final progress = (sub.scored / sub.total).clamp(0.0, 1.0);
    return Row(
      children: [
        // Left Icon / Letter
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: sub.iconBg,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: sub.symbol != null
              ? Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: sub.symbolBg ?? sub.iconColor,
                    borderRadius: BorderRadius.circular(5),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    sub.symbol!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      height: 1,
                    ),
                  ),
                )
              : Icon(
                  sub.icon ?? Icons.menu_book_rounded,
                  size: 17,
                  color: sub.iconColor,
                ),
        ),
        const SizedBox(width: 10),

        // Title
        SizedBox(
          width: 100,
          child: Text(
            sub.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0B1F5B),
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Progress Bar
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: const Color(0xFFE2ECF8),
              valueColor: AlwaysStoppedAnimation(sub.progressColor),
            ),
          ),
        ),
        const SizedBox(width: 10),

        // Score fraction: 18 / 25
        SizedBox(
          width: 48,
          child: Text(
            '${sub.scored} / ${sub.total}',
            textAlign: TextAlign.end,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
        ),
        const SizedBox(width: 10),

        // Percentage Pill
        Container(
          width: 42,
          padding: const EdgeInsets.symmetric(vertical: 3),
          decoration: BoxDecoration(
            color: sub.badgeBg,
            borderRadius: BorderRadius.circular(6),
          ),
          alignment: Alignment.center,
          child: Text(
            '${sub.percentage}%',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: sub.badgeTextColor,
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Right circular arrow
        Container(
          width: 20,
          height: 20,
          decoration: const BoxDecoration(
            color: Color(0xFFEFF6FF),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.chevron_right_rounded,
            size: 15,
            color: Color(0xFF0877FF),
          ),
        ),
      ],
    );
  }

  // ==========================================
  // RECENT TEST CARD
  // ==========================================
  Widget _buildRecentTestCard(
    BuildContext context,
    _RecentTestResultData item,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EEF7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => context.push('/result/${item.id}'),
            behavior: HitTestBehavior.opaque,
            child: Row(
              children: [
                // Left Emblem
                SizedBox(
                  width: 44,
                  height: 44,
                  child: _buildEmblem(item.emblemType),
                ),
                const SizedBox(width: 12),

                // Middle info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0B1F5B),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              item.testSeriesTitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0877FF),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${item.date} • ${item.timeSpent}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Right score badge + Chevron
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: item.scoreBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${item.percentage}%',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w900,
                          color: item.scoreColor,
                        ),
                      ),
                      Text(
                        '${item.scored} / ${item.total}',
                        style: const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: Color(0xFF0877FF),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 8),
          // Bottom row: Breakdown metrics (Correct, Wrong, Skipped) + Clickable Test Series Rank
          Row(
            children: [
              _buildMiniStat(
                Icons.check_circle_rounded,
                '${item.correctCount}',
                const Color(0xFF10B981),
              ),
              const SizedBox(width: 8),
              _buildMiniStat(
                Icons.cancel_rounded,
                '${item.wrongCount}',
                const Color(0xFFEF4444),
              ),
              const SizedBox(width: 8),
              _buildMiniStat(
                Icons.remove_circle_rounded,
                '${item.skippedCount}',
                const Color(0xFF64748B),
              ),
              const Spacer(),
              // Clickable Test Series Rank
              if (item.testSeriesRank != null && item.testSeriesId.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    context.push(
                      '/rank?seriesId=${Uri.encodeComponent(item.testSeriesId)}&seriesTitle=${Uri.encodeComponent(item.testSeriesTitle)}',
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
                      ),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.5),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFFF59E0B,
                          ).withValues(alpha: 0.12),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.emoji_events_rounded,
                          size: 12,
                          color: Color(0xFFB45309),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Series Rank: #${item.testSeriesRank}',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF92400E),
                          ),
                        ),
                        const SizedBox(width: 3),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 8,
                          color: Color(0xFF92400E),
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

  Widget _buildMiniStat(IconData icon, String count, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 3),
        Text(
          count,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  // ==========================================
  // TEST SERIES RESULTS CARD
  // ==========================================
  Widget _buildTestSeriesCard(BuildContext context, _SeriesResultData item) {
    final progress = (item.completedTests / item.totalTests).clamp(0.0, 1.0);
    return GestureDetector(
      onTap: () => context.push('/test-series/${item.id}'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE8EEF7)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Left Emblem
            SizedBox(
              width: 46,
              height: 46,
              child: _buildEmblem(item.emblemType),
            ),
            const SizedBox(width: 12),

            // Middle info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0B1F5B),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(
                        Icons.description_outlined,
                        size: 10.5,
                        color: Color(0xFF64748B),
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${item.totalTests} Tests',
                        style: const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.emoji_events_outlined,
                        size: 10.5,
                        color: Color(0xFF10B981),
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${item.completedTests} Completed',
                        style: const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        item.isCompleted
                            ? Icons.check_circle_rounded
                            : Icons.access_time_rounded,
                        size: 10.5,
                        color: item.isCompleted
                            ? const Color(0xFF10B981)
                            : const Color(0xFF0877FF),
                      ),
                      const SizedBox(width: 2),
                      Text(
                        item.status,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: item.isCompleted
                              ? const Color(0xFF10B981)
                              : const Color(0xFF0877FF),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 4,
                            backgroundColor: const Color(0xFFE2ECF8),
                            valueColor: AlwaysStoppedAnimation(
                              item.isCompleted
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFF0877FF),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${item.completedTests} / ${item.totalTests}',
                        style: const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Right Avg Score + Chevron
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: item.scoreBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  Text(
                    '${item.avgScore}%',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w900,
                      color: item.scoreColor,
                    ),
                  ),
                  const Text(
                    'Avg. Score',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: Color(0xFFEFF6FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chevron_right_rounded,
                size: 17,
                color: Color(0xFF0877FF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmblem(String type) {
    switch (type) {
      case 'kp_crest':
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFF3B1D9E), Color(0xFF1E0B6E)],
            ),
            border: Border.all(color: const Color(0xFFC4B5FD), width: 1.8),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 30,
                height: 30,
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
                size: 20,
              ),
            ],
          ),
        );
      case 'ssc_red':
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFFEF233C), Color(0xFFB91C1C)],
            ),
            border: Border.all(color: const Color(0xFFFECDD3), width: 1.5),
          ),
          padding: const EdgeInsets.all(5),
          child: Image.asset(
            'assets/images/exams/emblem_ssc.png',
            fit: BoxFit.contain,
          ),
        );
      case 'wbssc_red':
      default:
        return Image.asset(
          'assets/images/exams/emblem_wbssc.png',
          fit: BoxFit.contain,
        );
    }
  }

  void _showTimeRangePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final ranges = [
          'Last 30 Days',
          'Last 3 Months',
          'Last 6 Months',
          'All Time',
        ];
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Select Time Range',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                  ),
                ),
                const SizedBox(height: 12),
                ...ranges.map((range) {
                  final isSel = _selectedTimeRange == range;
                  return ListTile(
                    title: Text(
                      range,
                      style: TextStyle(
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        color: isSel
                            ? const Color(0xFF0877FF)
                            : const Color(0xFF0B1F5B),
                      ),
                    ),
                    trailing: isSel
                        ? const Icon(
                            Icons.check_rounded,
                            color: Color(0xFF0877FF),
                          )
                        : null,
                    onTap: () {
                      setState(() => _selectedTimeRange = range);
                      Navigator.pop(ctx);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ==========================================
// ACCURACY DONUT CHART PAINTER
// ==========================================
class _DonutChartPainter extends CustomPainter {
  final double percentage;
  final double strokeWidth;
  final Color progressColor;
  final Color backgroundColor;

  _DonutChartPainter({
    required this.percentage,
    required this.strokeWidth,
    required this.progressColor,
    required this.backgroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * percentage;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) {
    return oldDelegate.percentage != percentage ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.backgroundColor != backgroundColor;
  }
}
