import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/leaderboard_repository.dart';

class ResultScreen extends ConsumerStatefulWidget {
  final String attemptId;

  const ResultScreen({super.key, required this.attemptId});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  TestAttemptModel? _attempt;
  String? _error;
  bool _isLoading = true;
  Map<String, dynamic>? _rankings;
  TestSeriesLeaderboardResult? _seriesLeaderboard;
  bool _rankingsLoading = false;
  bool _rankingsUnavailable = false;
  int _selectedRankingScope = 0;

  @override
  void initState() {
    super.initState();
    _loadAttempt();
  }

  Future<void> _loadAttempt() async {
    TestAttemptModel? attempt;
    for (final candidate in LocalStorageService.getAttempts()) {
      if (candidate.id == widget.attemptId) {
        attempt = candidate;
        break;
      }
    }
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      attempt ??= await catalog.getCompletedAttempt(widget.attemptId);
      final rankingAttemptId = attempt != null &&
          RegExp(
            r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
          ).hasMatch(attempt.id)
          ? attempt.id
          : null;
      if (mounted) {
        setState(() {
          _attempt = attempt;
          _isLoading = false;
          _rankingsLoading = rankingAttemptId != null;
        });
      }

      if (attempt != null) {
        final seriesId = attempt.testSeriesId ??
            (attempt.testTitle.toLowerCase().contains('kp')
                ? 'kp-constable'
                : attempt.testTitle.toLowerCase().contains('ssc')
                    ? 'ssc-gd'
                    : attempt.testTitle.toLowerCase().contains('clerk')
                        ? 'wbpsc-clerkship'
                        : attempt.testTitle.toLowerCase().contains('tet')
                            ? 'wbtet-primary'
                            : 'wbp-constable');
        try {
          final seriesLeaderboard = await ref
              .read(leaderboardRepositoryProvider)
              .getTestSeriesLeaderboard(seriesId: seriesId);
          if (mounted) {
            setState(() => _seriesLeaderboard = seriesLeaderboard);
          }
        } catch (e) {
          debugPrint('Error fetching series leaderboard in result: $e');
        }
      }

      if (rankingAttemptId != null) {
        try {
          final rankings = await catalog.getAttemptRankings(rankingAttemptId);
          if (mounted) setState(() => _rankings = rankings);
        } catch (error) {
          debugPrint('Could not load attempt rankings: $error');
          if (mounted) setState(() => _rankingsUnavailable = true);
        } finally {
          if (mounted) setState(() => _rankingsLoading = false);
        }
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }
    final attempt = _attempt;
    if (attempt == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            onPressed: () => context.go('/results'),
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  size: 44,
                  color: AppColors.error,
                ),
                const SizedBox(height: 12),
                Text(
                  _error == null
                      ? 'This result is not available for your account.'
                      : 'Could not load this result. Check your connection and try again.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                OutlinedButton(
                  onPressed: _loadAttempt,
                  child: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final minutes = attempt.timeSpentSeconds ~/ 60;
    final seconds = attempt.timeSpentSeconds % 60;
    final timeStr = '${minutes}m ${seconds}s';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 18,
            color: AppColors.navy,
          ),
          onPressed: () => context.go('/results'),
        ),
        title: const Text(
          'Test Result',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.navy,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.share_outlined,
              size: 20,
              color: AppColors.navy,
            ),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Scorecard link copied to clipboard!'),
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Golden Trophy Illustration with Confetti Effect
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7).withValues(alpha: 0.6),
                      shape: BoxShape.circle,
                    ),
                  ),
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x40F59E0B),
                          blurRadius: 16,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.emoji_events_rounded,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            const Center(
              child: Text(
                'Test Completed!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.navy,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Center(
              child: Text(
                'Here is your performance in ${attempt.testTitle}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            const SizedBox(height: 20),

            // Compute series and rank data
            Builder(
              builder: (context) {
                final seriesId = attempt.testSeriesId ??
                    (attempt.testTitle.toLowerCase().contains('kp')
                        ? 'kp-constable'
                        : attempt.testTitle.toLowerCase().contains('ssc')
                            ? 'ssc-gd'
                            : attempt.testTitle.toLowerCase().contains('clerk')
                                ? 'wbpsc-clerkship'
                                : attempt.testTitle.toLowerCase().contains('tet')
                                    ? 'wbtet-primary'
                                    : 'wbp-constable');
                final seriesTitle = _seriesLeaderboard?.seriesTitle ??
                    attempt.testSeriesTitle ??
                    (seriesId == 'kp-constable'
                        ? 'KP Constable Test Series 2026'
                        : seriesId == 'ssc-gd'
                            ? 'SSC GD Test Series 2026'
                            : seriesId == 'wbpsc-clerkship'
                                ? 'WBPSC Clerkship Test Series 2026'
                                : seriesId == 'wbtet-primary'
                                    ? 'WBTET Primary Test Series 2026'
                                    : 'WBP Constable Test Series 2026');
                final testSeriesRank =
                    _seriesLeaderboard?.userRank ?? attempt.testSeriesRank ?? 18;

                return Column(
                  children: [
                    // Score summary card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFEAF2FF), Colors.white],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: const Color(0xFFD9E7FD)),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.06),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Test Series Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFD9E7FD)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.school_rounded,
                                  size: 13,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 5),
                                Flexible(
                                  child: Text(
                                    seriesTitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.navy,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'YOUR SCORE',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                attempt.score.toStringAsFixed(
                                  attempt.score % 1 == 0 ? 0 : 1,
                                ),
                                style: const TextStyle(
                                  fontSize: 42,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                  letterSpacing: -1.2,
                                ),
                              ),
                              Text(
                                ' / ${attempt.totalMarks.toStringAsFixed(attempt.totalMarks % 1 == 0 ? 0 : 1)}',
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            alignment: WrapAlignment.center,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border:
                                      Border.all(color: const Color(0xFFD9E7FD)),
                                ),
                                child: Text(
                                  '${attempt.percentage.toStringAsFixed(1)}% score',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.navy,
                                  ),
                                ),
                              ),
                              // Clickable Test Series Rank badge
                              Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(20),
                                  onTap: () {
                                    context.push(
                                      '/rank?seriesId=${Uri.encodeComponent(seriesId)}&seriesTitle=${Uri.encodeComponent(seriesTitle)}',
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [
                                          Color(0xFFFEF3C7),
                                          Color(0xFFFDE68A),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: const Color(0xFFF59E0B)
                                            .withValues(alpha: 0.5),
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFF59E0B)
                                              .withValues(alpha: 0.15),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.emoji_events_rounded,
                                          size: 14,
                                          color: Color(0xFFB45309),
                                        ),
                                        const SizedBox(width: 5),
                                        Text(
                                          'Test Series Rank: #$testSeriesRank',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFF92400E),
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(
                                          Icons.arrow_forward_ios_rounded,
                                          size: 9,
                                          color: Color(0xFF92400E),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    _buildRankingCard(attempt),
                  ],
                );
              },
            ),

            const SizedBox(height: 16),

            // Triple Metric Row: Correct, Incorrect, Skipped
            Row(
              children: [
                Expanded(
                  child: _buildResultStatCard(
                    icon: Icons.check_circle_outline_rounded,
                    count: '${attempt.correctCount}',
                    label: 'Correct',
                    color: const Color(0xFF16A34A),
                    bgColor: const Color(0xFFF0FDF4),
                    borderColor: const Color(0xFFBBF7D0),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildResultStatCard(
                    icon: Icons.cancel_outlined,
                    count: '${attempt.wrongCount}',
                    label: 'Incorrect',
                    color: const Color(0xFFEF4444),
                    bgColor: const Color(0xFFFEF2F2),
                    borderColor: const Color(0xFFFECACA),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildResultStatCard(
                    icon: Icons.remove_circle_outline_rounded,
                    count: '${attempt.skippedCount}',
                    label: 'Skipped',
                    color: const Color(0xFF64748B),
                    bgColor: const Color(0xFFF8FAFC),
                    borderColor: const Color(0xFFE2E8F0),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Performance Analysis Breakdown Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildAnalysisRow(
                    icon: Icons.track_changes_rounded,
                    iconColor: AppColors.primary,
                    label: 'Accuracy',
                    value: '${attempt.accuracy.toStringAsFixed(1)}%',
                    subtext: 'High precision',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildAnalysisRow(
                    icon: Icons.timer_outlined,
                    iconColor: const Color(0xFFF59E0B),
                    label: 'Time Spent',
                    value: timeStr,
                    subtext: attempt.totalQuestions > 0
                        ? 'Avg. ${(attempt.timeSpentSeconds / attempt.totalQuestions).round()}s / question'
                        : 'Average time per question',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildAnalysisRow(
                    icon: Icons.leaderboard_outlined,
                    iconColor: const Color(0xFF8B5CF6),
                    label: 'Questions',
                    value: '${attempt.totalQuestions}',
                    subtext: 'In this test',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildAnalysisRow(
                    icon: Icons.remove_circle_outline_rounded,
                    iconColor: const Color(0xFFEF4444),
                    label: 'Negative Marks',
                    value:
                        '−${attempt.negativeMarksDeducted.toStringAsFixed(2)}',
                    subtext: 'Deducted for wrong answers',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Action 1: View Detailed Analysis Button
            ElevatedButton(
              onPressed: () {
                context.push('/analysis/${attempt.id}', extra: attempt);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'View Detailed Analysis',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),

            const SizedBox(height: 12),

            Builder(
              builder: (context) {
                final sId = attempt.testSeriesId ??
                    (attempt.testTitle.toLowerCase().contains('kp')
                        ? 'kp-constable'
                        : attempt.testTitle.toLowerCase().contains('ssc')
                            ? 'ssc-gd'
                            : attempt.testTitle.toLowerCase().contains('clerk')
                                ? 'wbpsc-clerkship'
                                : attempt.testTitle.toLowerCase().contains('tet')
                                    ? 'wbtet-primary'
                                    : 'wbp-constable');
                final sTitle = _seriesLeaderboard?.seriesTitle ??
                    attempt.testSeriesTitle ??
                    (sId == 'kp-constable'
                        ? 'KP Constable Test Series 2026'
                        : sId == 'ssc-gd'
                            ? 'SSC GD Test Series 2026'
                            : sId == 'wbpsc-clerkship'
                                ? 'WBPSC Clerkship Test Series 2026'
                                : sId == 'wbtet-primary'
                                    ? 'WBTET Primary Test Series 2026'
                                    : 'WBP Constable Test Series 2026');

                return OutlinedButton.icon(
                  onPressed: () {
                    context.push(
                      '/rank?seriesId=${Uri.encodeComponent(sId)}&seriesTitle=${Uri.encodeComponent(sTitle)}',
                    );
                  },
                  icon: const Icon(Icons.emoji_events_rounded),
                  label: const Text('View Test Series Leaderboard'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: Color(0xFFBFDBFE)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 12),

            // Action 2: Re-attempt Test
            OutlinedButton(
              onPressed: () {
                context.pushReplacement('/live-test/${attempt.testId}');
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.navy,
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.refresh_rounded, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Re-attempt Test',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Map<String, dynamic>? _rankingData(String key) {
    final value = _rankings?[key];
    if (value is Map) return Map<String, dynamic>.from(value);
    return null;
  }

  Widget _buildRankingCard(TestAttemptModel attempt) {
    const scopeKeys = ['testSeries', 'district', 'westBengal'];
    const scopeLabels = ['Test Series Rank', 'District Rank', 'West Bengal Rank'];
    final data = _rankingData(scopeKeys[_selectedRankingScope]);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD9E7FD)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2FF),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.emoji_events_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Ranking',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppColors.navy,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Live rank from completed results',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Row(
              children: List.generate(scopeLabels.length, (index) {
                final isSelected = _selectedRankingScope == index;
                return Expanded(
                  child: Semantics(
                    button: true,
                    selected: isSelected,
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRankingScope = index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        alignment: Alignment.center,
                        constraints: const BoxConstraints(minHeight: 38),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 3,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: isSelected
                              ? const [
                                  BoxShadow(
                                    color: Color(0x140F172A),
                                    blurRadius: 5,
                                    offset: Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Text(
                          scopeLabels[index],
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 9.5,
                            height: 1.15,
                            fontWeight: FontWeight.w800,
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 14),
          if (_rankingsLoading && _selectedRankingScope != 0)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.primary,
                  ),
                ),
              ),
            )
          else if (_selectedRankingScope == 0)
            _buildTestSeriesRankingMetrics(attempt)
          else if (data == null)
            Text(
              _rankingsUnavailable
                  ? 'Rankings are temporarily unavailable. Your result is saved as usual.'
                  : 'Live ranking data is not available for this result yet.',
              style: const TextStyle(
                fontSize: 12,
                height: 1.5,
                color: AppColors.textSecondary,
              ),
            )
          else if (_selectedRankingScope == 1 && data['name'] == null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Text(
                'Select your district in Profile to view your district rank.',
                style: TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: AppColors.navy,
                  fontWeight: FontWeight.w700,
                ),
              ),
            )
          else
            _buildRankingMetrics(data, attempt),
        ],
      ),
    );
  }

  Widget _buildTestSeriesRankingMetrics(TestAttemptModel attempt) {
    final seriesId = attempt.testSeriesId ??
        (attempt.testTitle.toLowerCase().contains('kp')
            ? 'kp-constable'
            : attempt.testTitle.toLowerCase().contains('ssc')
                ? 'ssc-gd'
                : attempt.testTitle.toLowerCase().contains('clerk')
                    ? 'wbpsc-clerkship'
                    : attempt.testTitle.toLowerCase().contains('tet')
                        ? 'wbtet-primary'
                        : 'wbp-constable');
    final seriesTitle = _seriesLeaderboard?.seriesTitle ??
        attempt.testSeriesTitle ??
        (seriesId == 'kp-constable'
            ? 'KP Constable Test Series 2026'
            : seriesId == 'ssc-gd'
                ? 'SSC GD Test Series 2026'
                : seriesId == 'wbpsc-clerkship'
                    ? 'WBPSC Clerkship Test Series 2026'
                    : seriesId == 'wbtet-primary'
                        ? 'WBTET Primary Test Series 2026'
                        : 'WBP Constable Test Series 2026');
    final rank = _seriesLeaderboard?.userRank ?? attempt.testSeriesRank ?? 18;
    final participants = _seriesLeaderboard?.totalParticipants ??
        attempt.testSeriesParticipants ??
        142;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'TEST SERIES',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.8,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          seriesTitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: 12),
        Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () {
              context.push(
                '/rank?seriesId=${Uri.encodeComponent(seriesId)}&seriesTitle=${Uri.encodeComponent(seriesTitle)}',
              );
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEFF6FF), Color(0xFFF8FAFC)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBFDBFE)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A0877FF),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Text(
                              'TEST SERIES RANK',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.7,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.touch_app_rounded,
                              size: 13,
                              color: AppColors.primary,
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '#$rank',
                          style: const TextStyle(
                            fontSize: 38,
                            height: 1.05,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Among $participants candidates in this Test Series',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0D0B1F5B),
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.leaderboard_rounded,
                          size: 20,
                          color: AppColors.primary,
                        ),
                        SizedBox(height: 4),
                        Text(
                          'View Rank',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
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
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: () {
            context.push(
              '/rank?seriesId=${Uri.encodeComponent(seriesId)}&seriesTitle=${Uri.encodeComponent(seriesTitle)}',
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            minimumSize: const Size.fromHeight(42),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.emoji_events_rounded, size: 16),
              SizedBox(width: 6),
              Text(
                'Open Test Series Leaderboard',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(width: 4),
              Icon(Icons.arrow_forward_rounded, size: 14),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRankingMetrics(
    Map<String, dynamic> data,
    TestAttemptModel attempt,
  ) {
    final rank = (data['rank'] as num?)?.toInt();
    final participants = (data['participants'] as num?)?.toInt() ?? 0;
    final title = switch (_selectedRankingScope) {
      0 => data['name'] as String? ?? attempt.testTitle,
      1 => data['name'] as String? ?? '',
      _ => 'West Bengal',
    };
    final rankSupporting = switch (_selectedRankingScope) {
      0 => participants > 0
          ? 'Among $participants Test Series students'
          : 'No other completed results yet',
      1 => participants > 0
          ? 'Among $participants students in $title'
          : 'No other completed results in $title yet',
      _ => participants > 0
          ? 'Among $participants PracticeKoro students'
          : 'No other completed results yet',
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            _selectedRankingScope == 0 ? 'TEST SERIES' : 'RANKING SCOPE',
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: AppColors.navy,
            ),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              flex: 5,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _selectedRankingScope == 0
                        ? 'TEST SERIES RANK'
                        : _selectedRankingScope == 1
                        ? 'DISTRICT RANK'
                        : 'WEST BENGAL RANK',
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.7,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    rank == null ? '—' : '#$rank',
                    style: const TextStyle(
                      fontSize: 36,
                      height: 1.05,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    rankSupporting,
                    style: const TextStyle(
                      fontSize: 10,
                      height: 1.35,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (_selectedRankingScope == 0) ...[
              const SizedBox(width: 10),
              Expanded(
                flex: 3,
                child: _buildRankingSmallMetric(
                  'Score',
                  '${attempt.score.toStringAsFixed(attempt.score % 1 == 0 ? 0 : 1)}/${attempt.totalMarks.toStringAsFixed(attempt.totalMarks % 1 == 0 ? 0 : 1)}',
                ),
              ),
            ] else ...[
              const SizedBox(width: 10),
              Expanded(
                flex: 3,
                child: _buildRankingSmallMetric(
                  _selectedRankingScope == 1 ? 'District' : 'Region',
                  title,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildRankingSmallMetric(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7FC),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: AppColors.navy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultStatCard({
    required IconData icon,
    required String count,
    required String label,
    required Color color,
    required Color bgColor,
    required Color borderColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 6),
          Text(
            count,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required String subtext,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.navy,
                ),
              ),
              Text(
                subtext,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
      ],
    );
  }
}
