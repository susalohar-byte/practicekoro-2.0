import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';

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
  final String type;
  final String questionsCount;
  final String date;
  final int percentage;
  final int scored;
  final int total;
  final String emblemType;
  final Color scoreBg;
  final Color scoreColor;

  const _RecentTestResultData({
    required this.id,
    required this.title,
    required this.type,
    required this.questionsCount,
    required this.date,
    required this.percentage,
    required this.scored,
    required this.total,
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

  static const List<String> _filters = [
    'Overview',
    'Mock Tests',
    'Test Series',
    'Practice Tests',
    'Live Tests',
  ];

  static const List<_SubjectPerformanceData> _subjectData = [
    _SubjectPerformanceData(
      title: 'General Knowledge',
      scored: 18,
      total: 25,
      percentage: 72,
      iconBg: Color(0xFFEBF3FF),
      iconColor: Color(0xFF2563EB),
      icon: Icons.article_rounded,
      progressColor: Color(0xFF10B981),
      badgeBg: Color(0xFFECFDF5),
      badgeTextColor: Color(0xFF10B981),
    ),
    _SubjectPerformanceData(
      title: 'Mathematics',
      scored: 20,
      total: 30,
      percentage: 67,
      iconBg: Color(0xFFE6F8EE),
      iconColor: Color(0xFF16A34A),
      icon: Icons.calculate_rounded,
      progressColor: Color(0xFF0877FF),
      badgeBg: Color(0xFFEFF6FF),
      badgeTextColor: Color(0xFF0877FF),
    ),
    _SubjectPerformanceData(
      title: 'Reasoning',
      scored: 12,
      total: 20,
      percentage: 60,
      iconBg: Color(0xFFFFE4E6),
      iconColor: Color(0xFFE11D48),
      icon: Icons.hub_rounded,
      progressColor: Color(0xFFEF4444),
      badgeBg: Color(0xFFFFF1F2),
      badgeTextColor: Color(0xFFEF4444),
    ),
    _SubjectPerformanceData(
      title: 'English',
      scored: 16,
      total: 20,
      percentage: 80,
      iconBg: Color(0xFFF3E8FF),
      iconColor: Color(0xFF9333EA),
      symbol: 'A',
      symbolBg: Color(0xFF9333EA),
      progressColor: Color(0xFF10B981),
      badgeBg: Color(0xFFECFDF5),
      badgeTextColor: Color(0xFF10B981),
    ),
    _SubjectPerformanceData(
      title: 'General Science',
      scored: 6,
      total: 15,
      percentage: 40,
      iconBg: Color(0xFFFEF3C7),
      iconColor: Color(0xFFD97706),
      icon: Icons.science_outlined,
      progressColor: Color(0xFF0877FF),
      badgeBg: Color(0xFFEFF6FF),
      badgeTextColor: Color(0xFF0877FF),
    ),
  ];

  static const List<_RecentTestResultData> _recentTests = [
    _RecentTestResultData(
      id: 'wbp_mock_01',
      title: 'WBP Constable Mock Test 01',
      type: 'Full Length Test',
      questionsCount: '100 Questions',
      date: '28 Sep 2026',
      percentage: 72,
      scored: 72,
      total: 100,
      emblemType: 'wbssc_red',
      scoreBg: Color(0xFFECFDF5),
      scoreColor: Color(0xFF10B981),
    ),
    _RecentTestResultData(
      id: 'kp_mock_02',
      title: 'KP Constable Mock Test 02',
      type: 'Full Length Test',
      questionsCount: '100 Questions',
      date: '25 Sep 2026',
      percentage: 65,
      scored: 65,
      total: 100,
      emblemType: 'kp_crest',
      scoreBg: Color(0xFFEFF6FF),
      scoreColor: Color(0xFF0877FF),
    ),
    _RecentTestResultData(
      id: 'ssc_gd_mock_01',
      title: 'SSC GD Mock Test 01',
      type: 'Full Length Test',
      questionsCount: '80 Questions',
      date: '20 Sep 2026',
      percentage: 58,
      scored: 58,
      total: 80,
      emblemType: 'ssc_red',
      scoreBg: Color(0xFFFFF1F2),
      scoreColor: Color(0xFFEF4444),
    ),
  ];

  static const List<_SeriesResultData> _seriesResults = [
    _SeriesResultData(
      id: 'wbp_constable_2026',
      title: 'WBP Constable Test Series 2026',
      totalTests: 12,
      completedTests: 8,
      status: 'In Progress',
      isCompleted: false,
      avgScore: 68,
      emblemType: 'wbssc_red',
      scoreBg: Color(0xFFEFF6FF),
      scoreColor: Color(0xFF0877FF),
    ),
    _SeriesResultData(
      id: 'kp_constable_2026',
      title: 'KP Constable Test Series 2026',
      totalTests: 10,
      completedTests: 10,
      status: 'Completed',
      isCompleted: true,
      avgScore: 74,
      emblemType: 'kp_crest',
      scoreBg: Color(0xFFECFDF5),
      scoreColor: Color(0xFF10B981),
    ),
  ];

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
                        color: isSelected ? const Color(0xFF0877FF) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF0877FF)
                              : const Color(0xFFE2ECF8),
                        ),
                        boxShadow: [
                          if (isSelected)
                            BoxShadow(
                              color: const Color(0xFF0877FF).withValues(alpha: 0.25),
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
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? Colors.white : const Color(0xFF475569),
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
            ..._recentTests.map((test) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _buildRecentTestCard(context, test),
                )),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Performance',
                    style: TextStyle(
                      fontSize: 17.5,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0B1F5B),
                      letterSpacing: -0.3,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Based on 25 tests across all exams',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => _showTimeRangePicker(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2ECF8)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 12,
                        color: Color(0xFF0B1F5B),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _selectedTimeRange,
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
          const SizedBox(height: 16),

          // Accuracy Donut Ring + 4 Colored Stat Badges
          Row(
            children: [
              // 72% Accuracy Donut Ring
              SizedBox(
                width: 90,
                height: 90,
                child: CustomPaint(
                  painter: _DonutChartPainter(
                    percentage: 0.72,
                    strokeWidth: 9,
                    progressColor: const Color(0xFF0877FF),
                    backgroundColor: const Color(0xFFE2ECF8),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '72%',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0B1F5B),
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
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
              ),
              const SizedBox(width: 12),

              // 4 Stat Tiles in a 4-column row
              Expanded(
                child: Row(
                  children: [
                    // Correct
                    Expanded(
                      child: _buildStatTile(
                        icon: Icons.check_circle_rounded,
                        iconColor: const Color(0xFF10B981),
                        value: '1,254',
                        label: 'Correct',
                        bgColor: const Color(0xFFECFDF5),
                        labelColor: const Color(0xFF059669),
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Wrong
                    Expanded(
                      child: _buildStatTile(
                        icon: Icons.cancel_rounded,
                        iconColor: const Color(0xFFEF4444),
                        value: '356',
                        label: 'Wrong',
                        bgColor: const Color(0xFFFFF1F2),
                        labelColor: const Color(0xFFDC2626),
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Skipped
                    Expanded(
                      child: _buildStatTile(
                        icon: Icons.remove_circle_rounded,
                        iconColor: const Color(0xFF64748B),
                        value: '190',
                        label: 'Skipped',
                        bgColor: const Color(0xFFF1F5F9),
                        labelColor: const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Time Spent
                    Expanded(
                      child: _buildStatTile(
                        icon: Icons.access_time_filled_rounded,
                        iconColor: const Color(0xFF0877FF),
                        value: '42h',
                        label: 'Time Spent',
                        bgColor: const Color(0xFFEFF6FF),
                        labelColor: const Color(0xFF0877FF),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFEDF2F7)),
          const SizedBox(height: 14),

          // Bottom Metric Row (Total Tests | Total Questions | Rank | Improvement)
          Row(
            children: [
              Expanded(
                child: _buildBottomSummaryItem(
                  icon: Icons.bar_chart_rounded,
                  iconBg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF0877FF),
                  value: '25',
                  label: 'Total Tests',
                ),
              ),
              Expanded(
                child: _buildBottomSummaryItem(
                  icon: Icons.description_outlined,
                  iconBg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF0877FF),
                  value: '2,480',
                  label: 'Total Questions',
                ),
              ),
              Expanded(
                child: _buildBottomSummaryItem(
                  icon: Icons.emoji_events_rounded,
                  iconBg: const Color(0xFFFEF3C7),
                  iconColor: const Color(0xFFF59E0B),
                  value: '1,245 / 12,680',
                  label: 'Your Rank',
                ),
              ),
              Expanded(
                child: _buildBottomSummaryItem(
                  icon: Icons.trending_up_rounded,
                  iconBg: const Color(0xFFECFDF5),
                  iconColor: const Color(0xFF10B981),
                  value: '+18%',
                  label: 'Improvement',
                  valueColor: const Color(0xFF10B981),
                ),
              ),
            ],
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
                    _selectedMetric = _selectedMetric == 'Marks' ? 'Percentage' : 'Marks';
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
          ..._subjectData.map((sub) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: _buildSubjectPerformanceRow(context, sub),
              )),
        ],
      ),
    );
  }

  Widget _buildSubjectPerformanceRow(BuildContext context, _SubjectPerformanceData sub) {
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
                  sub.icon,
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
  Widget _buildRecentTestCard(BuildContext context, _RecentTestResultData item) {
    return GestureDetector(
      onTap: () => context.push('/result/${item.id}'),
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
                        size: 11,
                        color: Color(0xFF64748B),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '${item.type} • ${item.questionsCount}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 10,
                        color: Color(0xFF64748B),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        item.date,
                        style: const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Right score badge + Chevron
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
        final ranges = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'All Time'];
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
                        color: isSel ? const Color(0xFF0877FF) : const Color(0xFF0B1F5B),
                      ),
                    ),
                    trailing: isSel
                        ? const Icon(Icons.check_rounded, color: Color(0xFF0877FF))
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
