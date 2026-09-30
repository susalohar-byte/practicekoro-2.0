import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';

class TestSeriesDetailScreen extends ConsumerStatefulWidget {
  final String seriesId;

  const TestSeriesDetailScreen({super.key, required this.seriesId});

  @override
  ConsumerState<TestSeriesDetailScreen> createState() =>
      _TestSeriesDetailScreenState();
}

class _TestSeriesDetailScreenState
    extends ConsumerState<TestSeriesDetailScreen> {
  TestSeriesModel? _series;
  List<MockTestModel> _tests = [];
  Map<String, dynamic>? _report;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final repository = ref.read(catalogRepositoryProvider);
      final data = await Future.wait<dynamic>([
        repository.getTestSeriesById(widget.seriesId),
        repository.getTestsForSeries(widget.seriesId),
        repository.getSeriesAnalytics(widget.seriesId),
      ]);
      final series = data[0] as TestSeriesModel?;
      if (series == null) {
        throw StateError('This test series is unavailable.');
      }
      if (!mounted) return;
      setState(() {
        _series = series;
        _tests = data[1] as List<MockTestModel>;
        _report = data[2] as Map<String, dynamic>;
      });
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Could not load this test series. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _number(String key) => (_report?[key] as num?)?.toDouble() ?? 0;
  int _integer(String key) => (_report?[key] as num?)?.toInt() ?? 0;

  List<Map<String, dynamic>> _list(String key) {
    final rows = _report?[key];
    if (rows is! List) return [];
    return rows
        .whereType<Map>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList();
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
    if (_error != null || _series == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            onPressed: () => context.pop(),
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
                  Icons.cloud_off_rounded,
                  size: 44,
                  color: AppColors.textMuted,
                ),
                const SizedBox(height: 12),
                Text(
                  _error ?? 'Test series not found.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                OutlinedButton(
                  onPressed: _load,
                  child: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final series = _series!;
    final trend = _list('trend');
    final categories = _list('testTypeBreakdown');
    final subjects = _list('subjects');
    final weakTopics = _list('weakTopics');
    final history = _list('history');
    final maxTrend = trend.fold<double>(
      100,
      (max, item) =>
          (item['percentage'] as num?)
              ?.toDouble()
              .clamp(max, double.infinity)
              .toDouble() ??
          max,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: AppColors.navy,
            size: 20,
          ),
        ),
        title: const Text(
          'Test Series Report',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 17,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF063585), Color(0xFF0158FC)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    series.examTitle ?? 'Test Series',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    series.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (series.description?.isNotEmpty == true) ...[
                    const SizedBox(height: 7),
                    Text(
                      series.description!,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            _sectionTitle('Series Performance', Icons.bar_chart_rounded),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 2.2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              children: [
                _metric(
                  'Overall score',
                  '${_number('overallScorePercent').toStringAsFixed(1)}%',
                ),
                _metric(
                  'Average score',
                  '${_number('averageScorePercent').toStringAsFixed(1)}%',
                ),
                _metric(
                  'Accuracy',
                  '${_number('accuracyPercent').toStringAsFixed(1)}%',
                ),
                _metric(
                  'Best score',
                  '${_number('bestScorePercent').toStringAsFixed(1)}%',
                ),
                _metric(
                  'Tests completed',
                  '${_integer('testsAttempted')} / ${_integer('totalTests')}',
                ),
                _metric(
                  'Completion',
                  '${_number('completionPercent').toStringAsFixed(1)}%',
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 16),
              child: Text(
                'Overall score weights each test by its marks using the latest completed attempt. Accuracy is correct answers divided by attempted questions.',
                style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
              ),
            ),
            _sectionTitle('Performance Trend', Icons.trending_up_rounded),
            _panel(
              child: trend.isEmpty
                  ? const Text(
                      'Complete a test to start your performance trend.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    )
                  : SizedBox(
                      height: 130,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: trend.take(12).map((item) {
                          final score =
                              (item['percentage'] as num?)?.toDouble() ?? 0;
                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 3,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    '${score.round()}%',
                                    style: const TextStyle(
                                      fontSize: 9,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    height: (score / maxTrend * 82).clamp(
                                      4,
                                      82,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(5),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${trend.indexOf(item) + 1}',
                                    style: const TextStyle(
                                      fontSize: 9,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
            ),
            const SizedBox(height: 14),
            _sectionTitle('Performance by Test Type', Icons.layers_rounded),
            _panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (categories
                      .where(
                        (item) =>
                            (item['testsAttempted'] as num?)?.toInt() != 0,
                      )
                      .isEmpty)
                    const Text(
                      'No completed tests yet.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  for (final item in categories.where(
                    (item) => (item['testsAttempted'] as num?)?.toInt() != 0,
                  ))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 11),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_typeLabel(item['type']?.toString() ?? '')} · ${item['testsAttempted'] ?? 0} tests',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppColors.navy,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Average ${(item['averageScorePercent'] as num?)?.toStringAsFixed(1) ?? '0.0'}% · Best ${(item['bestScorePercent'] as num?)?.toStringAsFixed(1) ?? '0.0'}% · Accuracy ${(item['accuracyPercent'] as num?)?.toStringAsFixed(1) ?? '0.0'}%',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            if (subjects.isNotEmpty) ...[
              const SizedBox(height: 14),
              _sectionTitle('Subject Performance', Icons.menu_book_rounded),
              _panel(
                child: Column(
                  children: subjects
                      .map(
                        (item) => _dataRow(
                          '${item['subjectName'] ?? 'Subject'}',
                          '${(item['accuracyPercent'] as num?)?.toStringAsFixed(1) ?? '0.0'}%',
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
            const SizedBox(height: 14),
            _sectionTitle('Needs Improvement', Icons.track_changes_rounded),
            _panel(
              child: weakTopics.isEmpty
                  ? const Text(
                      'No weak topic has enough attempt data to report yet.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ...weakTopics.map(
                          (item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text(
                              '${item['subjectName'] ?? 'Subject'} · ${item['topicName'] ?? 'Topic'} — ${(item['accuracyPercent'] as num?)?.toStringAsFixed(1) ?? '0.0'}% accuracy',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.navy,
                              ),
                            ),
                          ),
                        ),
                        const Text(
                          'Practice weak topics, try the related topic tests, then take another full mock.',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 14),
            _sectionTitle('Test History', Icons.history_rounded),
            _panel(
              child: history.isEmpty
                  ? const Text(
                      'Your completed tests will appear here.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    )
                  : Column(
                      children: history
                          .map(
                            (item) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                item['testTitle']?.toString() ?? 'Test',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.navy,
                                ),
                              ),
                              subtitle: Text(
                                '${(item['percentage'] as num?)?.toStringAsFixed(1) ?? '0.0'}% · ${item['correctCount'] ?? 0} correct, ${item['wrongCount'] ?? 0} wrong, ${item['skippedCount'] ?? 0} skipped · −${(item['negativeMarks'] as num?)?.toStringAsFixed(2) ?? '0.00'}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              trailing: const Icon(
                                Icons.chevron_right_rounded,
                                color: AppColors.primary,
                              ),
                              onTap: () =>
                                  context.push('/result/${item['attemptId']}'),
                            ),
                          )
                          .toList(),
                    ),
            ),
            const SizedBox(height: 14),
            _sectionTitle('Tests in this series', Icons.quiz_outlined),
            ..._tests.map(
              (test) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(
                    test.title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  subtitle: Text(
                    '${test.totalQuestions} questions · ${test.durationMinutes} min',
                    style: const TextStyle(fontSize: 10),
                  ),
                  trailing: const Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 14,
                  ),
                  onTap: () => context.push(
                    '/test-details/${test.id}?title=${Uri.encodeComponent(test.title)}&isPro=${test.isPremium}',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _typeLabel(String type) => switch (type) {
    'full_mock' => 'Full Mock',
    'pyq' => 'Previous Year Questions',
    'topic_test' => 'Subject & Topic Tests',
    'live_test' => 'Live Tests',
    _ => type,
  };

  Widget _sectionTitle(String title, IconData icon) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 18),
        const SizedBox(width: 7),
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: AppColors.navy,
          ),
        ),
      ],
    ),
  );

  Widget _metric(String label, String value) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: AppColors.navy,
          ),
        ),
      ],
    ),
  );

  Widget _panel({required Widget child}) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border),
    ),
    child: child,
  );

  Widget _dataRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.navy),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: AppColors.primary,
          ),
        ),
      ],
    ),
  );
}
