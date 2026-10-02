import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/models/test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 2 & Screen 3: Test Series Details & Categorized Test List
/// Faithful reproduction of the PracticeKoro Test Series Detail & Test Categories UI.
class TestSeriesDetailScreen extends ConsumerStatefulWidget {
  final String seriesId;

  const TestSeriesDetailScreen({super.key, required this.seriesId});

  @override
  ConsumerState<TestSeriesDetailScreen> createState() =>
      _TestSeriesDetailScreenState();
}

class _TestSeriesDetailScreenState extends ConsumerState<TestSeriesDetailScreen> {
  TestSeriesModel? _series;
  List<MockTestModel> _tests = [];
  bool _isLoading = true;
  bool _isFavorite = false;
  bool _isExpandedAbout = false;
  int _selectedTabIndex = 0;

  final List<String> _tabs = ['All Tests', 'Full Mock Tests', 'Topic Tests', 'PYQ'];

  @override
  void initState() {
    super.initState();
    _loadSeriesData();
  }

  Future<void> _loadSeriesData() async {
    setState(() => _isLoading = true);
    final repository = ref.read(catalogRepositoryProvider);
    try {
      final series = await repository.getTestSeriesById(widget.seriesId);
      final tests = await repository.getTestsForSeries(widget.seriesId);
      if (mounted) {
        setState(() {
          _series = series;
          _tests = tests;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _resolveEmblemAsset(String id, String? title) {
    final lower = '${id.toLowerCase()} ${title?.toLowerCase() ?? ""}';
    if (lower.contains('kp')) return 'assets/images/exams/emblem_series_kp.png';
    if (lower.contains('ssc')) return 'assets/images/exams/emblem_series_ssc.png';
    if (lower.contains('tet')) return 'assets/images/exams/emblem_wbtet_seal.png';
    if (lower.contains('panchayat') || lower.contains('clerk') || lower.contains('wbpsc')) {
      return 'assets/images/exams/emblem_wbpsc_coin.png';
    }
    return 'assets/images/exams/emblem_series_wbp.png';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final series = _series ??
        TestSeriesModel(
          id: widget.seriesId,
          examId: 'wbp-constable',
          title: 'WBP Constable Test Series 2026',
          slug: widget.seriesId,
          description:
              'Complete test series for WBP Constable 2026 with full mock tests, topic-wise tests and previous year questions. Designed as per latest syllabus and exam pattern.',
        );

    final fullMockTests = _tests.where((t) => t.testType == 'full_mock').toList();
    final topicTests = _tests.where((t) => t.testType == 'topic' || t.testType == 'subject_mock' || t.testType == 'chapter_mock').toList();
    final pyqTests = _tests.where((t) => t.testType == 'pyq').toList();

    List<MockTestModel> currentTests;
    switch (_selectedTabIndex) {
      case 1:
        currentTests = fullMockTests.isNotEmpty ? fullMockTests : _tests;
        break;
      case 2:
        currentTests = topicTests.isNotEmpty ? topicTests : _tests;
        break;
      case 3:
        currentTests = pyqTests.isNotEmpty ? pyqTests : _tests;
        break;
      case 0:
      default:
        currentTests = _tests;
        break;
    }

    final fullMockCount = fullMockTests.isNotEmpty ? fullMockTests.length : 60;
    final topicCount = topicTests.isNotEmpty ? topicTests.length : 40;
    final pyqCount = pyqTests.isNotEmpty ? pyqTests.length : 20;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.navy),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: _isFavorite ? const Color(0xFFEF4444) : AppColors.navy,
              size: 22,
            ),
            onPressed: () {
              setState(() => _isFavorite = !_isFavorite);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isFavorite ? 'Saved to Favorites' : 'Removed from Favorites'),
                  duration: const Duration(seconds: 1),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined, color: AppColors.navy, size: 21),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Test Series link copied to clipboard!'),
                  duration: Duration(seconds: 1),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: PKBottomSpacing.safeAreaEdgeInsets(context, horizontal: 16, top: 12),
        children: [
          // ── SCREEN 2: HERO CARD ──
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE8EEF7)),
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
                // Top Row: Emblem + Title + Badges
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Emblem circle container
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Padding(
                          padding: const EdgeInsets.all(3),
                          child: Image.asset(
                            _resolveEmblemAsset(series.id, series.title),
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.shield_rounded, color: AppColors.primary, size: 30),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            series.title,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              color: AppColors.navy,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Badges Row
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFFFEDD5)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('🔥 ', style: TextStyle(fontSize: 10)),
                                    Text(
                                      'Bestseller',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFFC2410C),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFDBEAFE)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.language_rounded, size: 12, color: AppColors.primary),
                                    SizedBox(width: 4),
                                    Text(
                                      'Bengali & English',
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
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),
                const Divider(color: Color(0xFFF1F5F9), height: 1),
                const SizedBox(height: 14),

                // 3 Count metrics
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricTile(
                        icon: Icons.description_outlined,
                        iconColor: const Color(0xFF1D4ED8),
                        iconBg: const Color(0xFFEFF6FF),
                        count: '$fullMockCount',
                        label: 'Full Mock Tests',
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildMetricTile(
                        icon: Icons.edit_note_rounded,
                        iconColor: const Color(0xFF16A34A),
                        iconBg: const Color(0xFFF0FDF4),
                        count: '$topicCount',
                        label: 'Topic Tests',
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildMetricTile(
                        icon: Icons.history_edu_rounded,
                        iconColor: const Color(0xFFEA580C),
                        iconBg: const Color(0xFFFFF7ED),
                        count: '$pyqCount',
                        label: 'PYQ Tests',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // ── ABOUT THIS TEST SERIES ──
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE8EEF7)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'About This Test Series',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: AppColors.navy,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  series.description ??
                      'Complete test series for ${series.title} with full mock tests, topic-wise tests and previous year questions. Designed as per latest syllabus and exam pattern.',
                  maxLines: _isExpandedAbout ? 10 : 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12.5,
                    height: 1.5,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () => setState(() => _isExpandedAbout = !_isExpandedAbout),
                  child: Text(
                    _isExpandedAbout ? 'Read Less ∧' : 'Read More ∨',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Divider(color: Color(0xFFF1F5F9), height: 1),
                const SizedBox(height: 12),
                // Spec Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildSpecPill(Icons.description_outlined, '100 Questions'),
                    _buildSpecPill(Icons.access_time_rounded, '60 Minutes'),
                    _buildSpecPill(Icons.military_tech_outlined, '100 Marks'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // ── SCREEN 3: TEST CATEGORIES TABS ──
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(_tabs.length, (index) {
                final isSelected = _selectedTabIndex == index;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTabIndex = index),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.25),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ]
                            : null,
                      ),
                      child: Text(
                        _tabs[index],
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                          color: isSelected ? Colors.white : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),

          const SizedBox(height: 14),

          // ── TEST LIST CARDS ──
          if (currentTests.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  'No tests available in this category yet.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                ),
              ),
            )
          else
            ...List.generate(currentTests.length, (index) {
              final test = currentTests[index];
              return _buildTestCard(test, index + 1);
            }),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String count,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: iconBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(height: 4),
          Text(
            count,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: iconColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.navy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecPill(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: const Color(0xFF64748B)),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: Color(0xFF334155),
          ),
        ),
      ],
    );
  }

  Widget _buildTestCard(MockTestModel test, int order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EEF7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Circular number container
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFDBEAFE)),
            ),
            alignment: Alignment.center,
            child: Text(
              '$order',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Title & Subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  test.title,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.navy,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      '📄 ${test.totalQuestions} Q',
                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                    ),
                    const Text(' • ', style: TextStyle(fontSize: 10, color: Color(0xFFCBD5E1))),
                    Text(
                      '⏱️ ${test.durationMinutes} Min',
                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                    ),
                    const Text(' • ', style: TextStyle(fontSize: 10, color: Color(0xFFCBD5E1))),
                    Text(
                      '🎖️ ${test.totalMarks.toInt()} Marks',
                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // "Start Test" CTA pill button
          GestureDetector(
            onTap: () {
              context.push(
                '/test-details/${test.id}?title=${Uri.encodeComponent(test.title)}&isPro=${test.isPremium}',
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'Start Test',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
