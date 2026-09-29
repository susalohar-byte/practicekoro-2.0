import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/exam_model.dart';
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

  @override
  void initState() {
    super.initState();
    _loadExams();
  }

  Future<void> _loadExams() async {
    final repo = ref.read(catalogRepositoryProvider);
    final exams = await repo.getExams();
    if (mounted) {
      setState(() {
        _exams = exams;
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

  String _getEmblemPath(String examId) {
    if (examId.contains('wbp') || examId.contains('kp')) {
      return 'assets/images/exams/emblem_wbp.png';
    } else if (examId.contains('wbpsc') || examId.contains('wbcs')) {
      return 'assets/images/exams/emblem_wbpsc.png';
    } else if (examId.contains('tet')) {
      return 'assets/images/exams/emblem_tet.png';
    } else if (examId.contains('wbssc')) {
      return 'assets/images/exams/emblem_wbssc.png';
    } else if (examId.contains('ssc')) {
      return 'assets/images/exams/emblem_ssc.png';
    } else if (examId.contains('railway')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    return 'assets/images/logo.png';
  }

  String _getExamTag(String examId) {
    if (examId == 'wbp-constable' || examId == 'wbpsc-clerkship') {
      return '🔥 POPULAR';
    } else if (examId == 'wbssc-group-d' || examId == 'kp-police-si') {
      return '⭐ NEW LAUNCH';
    } else if (examId == 'railway-group-d' || examId == 'ssc-gd') {
      return '👑 HIGH VACANCY';
    }
    return 'VERIFIED';
  }

  Color _getTagBgColor(String tag) {
    if (tag.contains('POPULAR')) return const Color(0xFFFEF3C7);
    if (tag.contains('NEW')) return const Color(0xFFDCFCE7);
    if (tag.contains('HIGH')) return const Color(0xFFEDE9FE);
    return const Color(0xFFEFF6FF);
  }

  Color _getTagTextColor(String tag) {
    if (tag.contains('POPULAR')) return const Color(0xFFD97706);
    if (tag.contains('NEW')) return const Color(0xFF16A34A);
    if (tag.contains('HIGH')) return const Color(0xFF7C3AED);
    return const Color(0xFF2563EB);
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final selectedCategory = _categories[_selectedFilterIndex];

    // Filter exams based on category and search query
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

    final isAllView = _selectedFilterIndex == 0 && query.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Test Series',
              style: AppTypography.titleLarge(color: AppColors.navy),
            ),
            const SizedBox(height: 1),
            const Text(
              'Choose your exam. Start with a plan.',
              style: TextStyle(
                fontSize: 11,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: _buildSeriesHero(),
            ),
            // Top Search Bar & Filter Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Column(
                children: [
                  // Interactive Search Input
                  Container(
                    height: 46,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.search_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(
                              fontSize: 13.5,
                              color: AppColors.navy,
                            ),
                            decoration: const InputDecoration(
                              hintText:
                                  'Search any exam (e.g. WBP, Clerkship, TET)...',
                              hintStyle: TextStyle(
                                fontSize: 13,
                                color: Color(0xFF94A3B8),
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

                  // Horizontal Standardized 5 Category Pills
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
                                  ? AppColors.primary
                                  : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSel
                                    ? AppColors.primary
                                    : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Text(
                              _categories[idx],
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSel
                                    ? FontWeight.bold
                                    : FontWeight.w600,
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

            // Content Body: Sectioned or Filtered Grid
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                      ),
                    )
                  : filteredExams.isEmpty
                  ? _buildEmptyState()
                  : isAllView
                  ? _buildCategorizedSections()
                  : _buildFilteredList(filteredExams, selectedCategory),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeriesHero() {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.navy.withValues(alpha: 0.16),
            blurRadius: 18,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'YOUR NEXT MILESTONE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Prepare with a plan',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Mocks, topic tests and previous papers',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.82),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(17),
              border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Color(0xFFFFD166),
              size: 27,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // CATEGORIZED SECTIONS VIEW (WHEN "ALL" IS SELECTED)
  // ---------------------------------------------------------------------------
  Widget _buildCategorizedSections() {
    final curatedCategories = _categories.sublist(1); // 5 curated categories

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
      itemCount: curatedCategories.length,
      itemBuilder: (context, catIdx) {
        final catName = curatedCategories[catIdx];
        final catExams = _exams
            .where((e) => e.category.toLowerCase() == catName.toLowerCase())
            .toList();

        if (catExams.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        catName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: AppColors.navy,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedFilterIndex = catIdx + 1;
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'View All',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        SizedBox(width: 2),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 16,
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Exam Cards for this Category
              ...catExams.map(
                (exam) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildExamCard(exam),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // FILTERED / SEARCH RESULTS VIEW
  // ---------------------------------------------------------------------------
  Widget _buildFilteredList(List<ExamModel> exams, String category) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 90),
      children: [
        // Subheader showing result count and clear filter
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Showing ${exams.length} examinations',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF64748B),
              ),
            ),
            if (_selectedFilterIndex != 0 || _searchController.text.isNotEmpty)
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
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),

        ...exams.map(
          (exam) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildExamCard(exam),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // EXAM CARD WIDGET
  // ---------------------------------------------------------------------------
  Widget _buildExamCard(ExamModel exam) {
    final tag = _getExamTag(exam.id);
    final emblem = _getEmblemPath(exam.id);

    return InkWell(
      onTap: () => context.push('/exams/${exam.id}'),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.softBlue.withValues(alpha: 0.8)),
          boxShadow: [
            BoxShadow(
              color: AppColors.navy.withValues(alpha: 0.035),
              blurRadius: 16,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Emblem + Title + Tag
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 54,
                  height: 54,
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF2FF),
                    borderRadius: BorderRadius.circular(17),
                    border: Border.all(color: AppColors.softBlue),
                  ),
                  child: Image.asset(
                    emblem,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.school_rounded,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              exam.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: AppColors.navy,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: _getTagBgColor(tag),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              tag,
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900,
                                color: _getTagTextColor(tag),
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        exam.category,
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Description
            Text(
              exam.description ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF475569),
                height: 1.35,
              ),
            ),

            const SizedBox(height: 12),

            // Feature Badges: Tests Count, Questions, Bilingual
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildBadge(
                  icon: Icons.assignment_outlined,
                  text: '${exam.totalTests ?? 25} Mock Tests',
                  bgColor: const Color(0xFFEFF6FF),
                  textColor: AppColors.primary,
                ),
                _buildBadge(
                  icon: Icons.quiz_outlined,
                  text: '${((exam.totalTests ?? 25) * 80).clamp(500, 5000)} Qs',
                  bgColor: const Color(0xFFF1F6FF),
                  textColor: AppColors.navy,
                ),
                _buildBadge(
                  icon: Icons.translate_rounded,
                  text: LocalStorageService.isBilingualEnabled()
                      ? 'Bilingual (বাংলা ও Eng)'
                      : 'বাংলা মাধ্যম (Bengali)',
                  bgColor: const Color(0xFFEAF2FF),
                  textColor: AppColors.primary,
                ),
              ],
            ),

            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 10),

            // Bottom Action Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (exam.totalVacancies != null && exam.totalVacancies! > 0)
                  Text(
                    '${exam.totalVacancies} Vacancies',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F766E),
                    ),
                  )
                else
                  const Text(
                    'Statewide Aspirants Active',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Explore Tests',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 14,
                        color: Colors.white,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge({
    required IconData icon,
    required String text,
    required Color bgColor,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: textColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ],
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
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _selectedFilterIndex = 0;
                  _searchController.clear();
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Reset All Filters',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
