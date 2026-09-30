import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';

class ExamsCatalogScreen extends ConsumerStatefulWidget {
  const ExamsCatalogScreen({super.key});

  @override
  ConsumerState<ExamsCatalogScreen> createState() => _ExamsCatalogScreenState();
}

class _ExamsCatalogScreenState extends ConsumerState<ExamsCatalogScreen> {
  final TextEditingController _searchController = TextEditingController();
  int _selectedFilterIndex = 0;
  bool _isLoading = true;
  List<ExamModel> _exams = [];
  List<TestSeriesModel> _popularSeries = [];

  @override
  void initState() {
    super.initState();
    _loadCatalog();
  }

  Future<void> _loadCatalog() async {
    final repo = ref.read(catalogRepositoryProvider);
    final results = await Future.wait([
      repo.getExams(),
      repo.getPopularTestSeries(),
    ]);
    if (mounted) {
      setState(() {
        _exams = results[0] as List<ExamModel>;
        _popularSeries = results[1] as List<TestSeriesModel>;
        _isLoading = false;
      });
    }
  }

  static const List<String> _categories = [
    'All Examinations',
    'WB Police (WBP / KP)',
    'WBPSC (Clerkship / WBCS)',
    'Teaching (TET / SLST)',
    'SSC & Central Govt.',
    'Railways (RRB)',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _getEmblemPath(String examKey) {
    final lower = examKey.toLowerCase();
    if (lower.contains('wbp') ||
        lower.contains('kp') ||
        lower.contains('police') ||
        lower.contains('constable')) {
      return 'assets/images/exams/emblem_wbp.png';
    } else if (lower.contains('wbpsc') ||
        lower.contains('wbcs') ||
        lower.contains('clerkship')) {
      return 'assets/images/exams/emblem_wbpsc.png';
    } else if (lower.contains('tet') ||
        lower.contains('primary') ||
        lower.contains('teach')) {
      return 'assets/images/exams/emblem_tet.png';
    } else if (lower.contains('wbssc') || lower.contains('slst')) {
      return 'assets/images/exams/emblem_wbssc.png';
    } else if (lower.contains('ssc') ||
        lower.contains('cgl') ||
        lower.contains('gd')) {
      return 'assets/images/exams/emblem_ssc.png';
    } else if (lower.contains('railway') ||
        lower.contains('rrb') ||
        lower.contains('ntpc')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    return 'assets/images/logo.png';
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final selectedCategory = _categories[_selectedFilterIndex];

    final filteredExams = _exams.where((exam) {
      final matchesSearch =
          query.isEmpty ||
          exam.title.toLowerCase().contains(query) ||
          exam.category.toLowerCase().contains(query) ||
          (exam.description ?? '').toLowerCase().contains(query);

      final matchesCategory =
          _selectedFilterIndex == 0 ||
          exam.category.toLowerCase() == selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    }).toList();

    final filteredSeries = _popularSeries.where((series) {
      if (query.isEmpty) return true;
      return series.title.toLowerCase().contains(query) ||
          (series.examTitle ?? '').toLowerCase().contains(query) ||
          (series.description ?? '').toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Sticky Header + Search + Category Tabs (Matches Website TestSeriesCatalog.tsx)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Test Series',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Choose your exam. Start with a plan.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      if (LocalStorageService.isBilingualEnabled())
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: const Text(
                            'বাংলা + Eng',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0158FC),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Search Bar
                  Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDF2F7),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.search_rounded,
                          color: Color(0xFF64748B),
                          size: 19,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF0F172A),
                            ),
                            decoration: const InputDecoration(
                              hintText:
                                  'Search test series, exams, subjects...',
                              hintStyle: TextStyle(
                                fontSize: 12.5,
                                color: Color(0xFF64748B),
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                        if (_searchController.text.isNotEmpty)
                          GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              setState(() {});
                            },
                            child: const Icon(
                              Icons.clear_rounded,
                              size: 18,
                              color: Color(0xFF64748B),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Category Filter Pills
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(_categories.length, (idx) {
                        final isSel = _selectedFilterIndex == idx;
                        return GestureDetector(
                          onTap: () =>
                              setState(() => _selectedFilterIndex = idx),
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: isSel
                                  ? const Color(0xFF0158FC)
                                  : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _categories[idx],
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isSel
                                    ? Colors.white
                                    : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Body Content
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF0158FC),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                      children: [
                        // 1. Dark Blue Subscription Hero Banner (Matches Website TestSeriesCatalog.tsx)
                        _buildSubscriptionHeroBanner(),
                        const SizedBox(height: 16),

                        // 2. 4 Test Type Cards (2x2 Grid)
                        _buildFourTestTypeCards(),
                        const SizedBox(height: 24),

                        // 3. Popular Test Series Section (if available)
                        if (filteredSeries.isNotEmpty &&
                            _selectedFilterIndex == 0) ...[
                          const Row(
                            children: [
                              Text('🔥', style: TextStyle(fontSize: 18)),
                              SizedBox(width: 6),
                              Text(
                                'Popular Test Series',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...filteredSeries.map(
                            (s) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _buildWebsiteSeriesCard(
                                title: s.title,
                                examBadge: s.examTitle ?? 'West Bengal Exam',
                                testsCount: s.testCount,
                                description:
                                    s.description ??
                                    'Complete test series with full-length mocks, topic tests, and detailed solutions.',
                                emblemPath: _getEmblemPath(
                                  '${s.examId} ${s.title} ${s.examTitle ?? ''}',
                                ),
                                onTap: () =>
                                    context.push('/test-series/${s.id}'),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],

                        // 4. All Examinations / Filtered Exams List
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _selectedFilterIndex == 0
                                  ? 'All Exam Test Series'
                                  : selectedCategory,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            if (_selectedFilterIndex != 0 || query.isNotEmpty)
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedFilterIndex = 0;
                                    _searchController.clear();
                                  });
                                },
                                child: const Text(
                                  'Reset Filters',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0158FC),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (filteredExams.isEmpty)
                          _buildEmptyState()
                        else
                          ...filteredExams.map(
                            (exam) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _buildWebsiteSeriesCard(
                                title: exam.title,
                                examBadge: exam.category,
                                testsCount: exam.totalTests ?? 25,
                                description:
                                    exam.description ??
                                    'Full-length mock tests, subject-wise practice & previous year papers.',
                                emblemPath: _getEmblemPath(
                                  '${exam.id} ${exam.title}',
                                ),
                                onTap: () => context.push('/exams/${exam.id}'),
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

  // ===========================================================================
  // 1. SUBSCRIPTION HERO BANNER (Matches Website TestSeriesCatalog.tsx)
  // ===========================================================================
  Widget _buildSubscriptionHeroBanner() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0D2A64), Color(0xFF133882), Color(0xFF1A4AB0)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0D2A64).withValues(alpha: 0.16),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFFFBBF24).withValues(alpha: 0.35),
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
                SizedBox(width: 5),
                Text(
                  'COMPLETE PREPARATION',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFFDE68A),
                    letterSpacing: 0.6,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'All Test Series in One Subscription',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Unlock full mock tests, chapter-wise practice, previous year question papers, and detailed performance analytics across all West Bengal & Central Govt exams.',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFFDBEAFE),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: () {
              if (_exams.isNotEmpty) {
                context.push('/exams/${_exams.first.id}');
              } else {
                context.push('/subscription');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0D2A64),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Start Testing',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
                ),
                SizedBox(width: 5),
                Icon(Icons.arrow_forward_rounded, size: 15),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 2. FOUR TEST TYPE SHORTCUT CARDS (Matches Website TestSeriesCatalog.tsx)
  // ===========================================================================
  Widget _buildFourTestTypeCards() {
    final cards = [
      {
        'title': 'Full Mock Tests',
        'sub': 'Full-length exam simulations',
        'icon': Icons.layers_outlined,
        'bg': const Color(0xFFEFF6FF),
        'fg': const Color(0xFF2563EB),
        'onTap': () {
          if (_exams.isNotEmpty) context.push('/exams/${_exams.first.id}');
        },
      },
      {
        'title': 'Chapter-wise Tests',
        'sub': 'Practice topic by topic',
        'icon': Icons.menu_book_outlined,
        'bg': const Color(0xFFECFDF5),
        'fg': const Color(0xFF059669),
        'onTap': () => context.go('/practice?tab=topics'),
      },
      {
        'title': 'Previous Year Questions',
        'sub': 'Solve past exam papers',
        'icon': Icons.description_outlined,
        'bg': const Color(0xFFFFFBEB),
        'fg': const Color(0xFFD97706),
        'onTap': () => context.go('/practice?tab=pyqs'),
      },
      {
        'title': 'Live Tests',
        'sub': 'Real-time all-WB rank',
        'icon': Icons.emoji_events_outlined,
        'bg': const Color(0xFFFFF1F2),
        'fg': const Color(0xFFE11D48),
        'onTap': () {
          if (_exams.isNotEmpty) context.push('/exams/${_exams.first.id}');
        },
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: cards.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        mainAxisExtent: 74,
      ),
      itemBuilder: (context, idx) {
        final item = cards[idx];
        return InkWell(
          onTap: item['onTap'] as VoidCallback,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: item['bg'] as Color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    item['icon'] as IconData,
                    color: item['fg'] as Color,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'] as String,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item['sub'] as String,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ===========================================================================
  // 3. WEBSITE TEST SERIES / EXAM CARD (Matches Website TestSeriesCatalog.tsx)
  // ===========================================================================
  Widget _buildWebsiteSeriesCard({
    required String title,
    required String examBadge,
    required int testsCount,
    required String description,
    required String emblemPath,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF5FB),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                  ),
                  child: Image.asset(
                    emblemPath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.school_rounded,
                      color: Color(0xFF0158FC),
                      size: 28,
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
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (testsCount > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '$testsCount Tests',
                                style: const TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF1D4ED8),
                                ),
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              examBadge,
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF475569),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 40,
              child: ElevatedButton(
                onPressed: onTap,
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
                      'View Series',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(width: 5),
                    Icon(Icons.arrow_forward_rounded, size: 15),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFEFF6FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.search_off_rounded,
                size: 32,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No Examinations Found',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: AppColors.navy,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'We couldn\'t find any exams matching your search query or selected category filter.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
