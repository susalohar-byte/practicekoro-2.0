import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/exam_assets.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/catalog_repository.dart';

class ExamsCatalogScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;
  final String? initialExam;
  final String? initialExamTitle;
  final bool isStandAlone;

  const ExamsCatalogScreen({
    super.key,
    this.onTabSelected,
    this.initialExam,
    this.initialExamTitle,
    this.isStandAlone = false,
  });

  @override
  ConsumerState<ExamsCatalogScreen> createState() => _ExamsCatalogScreenState();
}

class _ExamsCatalogScreenState extends ConsumerState<ExamsCatalogScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  String? _selectedExamSlug;
  String? _selectedExamTitle;
  String _selectedSort = 'Most Popular';

  // Canonical fallback test series data matching reference design
  static const List<Map<String, dynamic>> _fallbackSeries = [
    {
      'id': 'wbp-constable',
      'slug': 'wbp-constable',
      'examId': 'wbp-constable',
      'title': 'WBP Constable',
      'subtitle': 'Complete Test Series',
      'examTitle': 'WBP Constable',
      'isPaid': false,
      'mocks': 12,
      'topics': 48,
      'pyqs': 15,
      'isPopular': true,
      'badgeText': 'Most Popular',
      'badgeType': 'popular',
    },
    {
      'id': 'railway-ntpc',
      'slug': 'railway-ntpc',
      'examId': 'railway-ntpc',
      'title': 'Railway (NTPC)',
      'subtitle': 'Complete Test Series',
      'examTitle': 'Railway NTPC',
      'isPaid': true,
      'mocks': 15,
      'topics': 60,
      'pyqs': 25,
      'isPopular': true,
      'badgeText': 'Trending Now',
      'badgeType': 'trending',
    },
    {
      'id': 'ssc-mts',
      'slug': 'ssc-mts',
      'examId': 'ssc-mts',
      'title': 'SSC MTS',
      'subtitle': 'Complete Test Series',
      'examTitle': 'SSC MTS',
      'isPaid': true,
      'mocks': 8,
      'topics': 28,
      'pyqs': 10,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
    {
      'id': 'wbssc-group-c',
      'slug': 'wbssc-group-c',
      'examId': 'wbssc-group-c',
      'title': 'WBSSC Group C',
      'subtitle': 'Complete Test Series',
      'examTitle': 'WBSSC Group C',
      'isPaid': true,
      'mocks': 10,
      'topics': 32,
      'pyqs': 12,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
    {
      'id': 'icds',
      'slug': 'icds',
      'examId': 'icds',
      'title': 'ICDS',
      'subtitle': 'Complete Test Series',
      'examTitle': 'ICDS Supervisor',
      'isPaid': false,
      'mocks': 8,
      'topics': 20,
      'pyqs': 10,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
    {
      'id': 'food-si',
      'slug': 'food-si',
      'examId': 'food-si',
      'title': 'Food SI',
      'subtitle': 'Complete Test Series',
      'examTitle': 'Food SI',
      'isPaid': true,
      'mocks': 10,
      'topics': 32,
      'pyqs': 14,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialExam != null && widget.initialExam!.isNotEmpty) {
      _selectedExamSlug = widget.initialExam;
      _selectedExamTitle = widget.initialExamTitle ?? _formatTitle(widget.initialExam!);
    }
  }

  @override
  void didUpdateWidget(covariant ExamsCatalogScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialExam != oldWidget.initialExam && widget.initialExam != null) {
      setState(() {
        _selectedExamSlug = widget.initialExam;
        _selectedExamTitle = widget.initialExamTitle ?? _formatTitle(widget.initialExam!);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  String _formatTitle(String slug) {
    return slug
        .replaceAll('-', ' ')
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');
  }

  bool _matchesExam(Map<String, dynamic> item, String examSlug) {
    final slug = examSlug.toLowerCase().replaceAll('_', '-').trim();
    final id = (item['id'] as String? ?? '').toLowerCase();
    final sSlug = (item['slug'] as String? ?? '').toLowerCase();
    final sExamId = (item['examId'] as String? ?? '').toLowerCase();
    final title = (item['title'] as String? ?? '').toLowerCase();
    final examTitle = (item['examTitle'] as String? ?? '').toLowerCase();

    if (id == slug || sSlug == slug || sExamId == slug) return true;
    if (slug.contains('wbp') &&
        (id.contains('wbp') ||
            title.contains('wbp') ||
            examTitle.contains('wbp') ||
            title.contains('police'))) {
      return true;
    }
    if (slug.contains('ssc') &&
        (id.contains('ssc') ||
            title.contains('ssc') ||
            examTitle.contains('ssc'))) {
      return true;
    }
    if ((slug.contains('railway') ||
            slug.contains('ntpc') ||
            slug.contains('rrb')) &&
        (id.contains('railway') ||
            id.contains('ntpc') ||
            title.contains('railway') ||
            title.contains('ntpc'))) {
      return true;
    }
    if (slug.contains('icds') &&
        (id.contains('icds') ||
            title.contains('icds') ||
            examTitle.contains('icds'))) {
      return true;
    }
    if (slug.contains('food') &&
        (id.contains('food') ||
            title.contains('food') ||
            examTitle.contains('food'))) {
      return true;
    }

    final slugWords = slug.split(RegExp(r'[-_\s]+')).where((w) => w.length > 2);
    for (final w in slugWords) {
      if (title.contains(w) || examTitle.contains(w) || id.contains(w)) return true;
    }
    return false;
  }

  void _onCardTap(Map<String, dynamic> item) {
    final isPaid = item['isPaid'] as bool? ?? false;
    final isSubscribed = LocalStorageService.isProUser();

    if (isPaid && !isSubscribed) {
      // Paywall / subscription flow for paid test series
      context.push('/subscription');
    } else {
      // Direct access to test series details
      context.push('/test-series/${item['id']}');
    }
  }

  // Visual personality themes according to reference mockup
  _CardTheme _resolveCardTheme(String title, String? examTitle) {
    final combined = '$title ${examTitle ?? ''}'.toLowerCase();

    if (combined.contains('wbp') || combined.contains('police') || combined.contains('constable')) {
      return const _CardTheme(
        bgGradientStart: Color(0xFFEFF6FF),
        bgGradientEnd: Color(0xFFDBEAFE),
        borderColor: Color(0xFFBFDBFE),
        arrowBg: Color(0xFF1E293B),
        fallbackIcon: Icons.shield_rounded,
        iconColor: Color(0xFFDC2626),
        defaultBadge: 'Most Popular',
        badgeIcon: Icons.workspace_premium_rounded,
        badgeBg: Color(0xFFFFEDD5),
        badgeTextColor: Color(0xFFC2410C),
      );
    }
    if (combined.contains('railway') || combined.contains('ntpc') || combined.contains('rrb')) {
      return const _CardTheme(
        bgGradientStart: Color(0xFFFFF1F2),
        bgGradientEnd: Color(0xFFFFE4E6),
        borderColor: Color(0xFFFECDD3),
        arrowBg: Color(0xFFE11D48),
        fallbackIcon: Icons.train_rounded,
        iconColor: Color(0xFFE11D48),
        defaultBadge: 'Trending Now',
        badgeIcon: Icons.bolt_rounded,
        badgeBg: Color(0xFFFFE4E6),
        badgeTextColor: Color(0xFFE11D48),
      );
    }
    if (combined.contains('ssc') || combined.contains('mts') || combined.contains('cgl')) {
      return const _CardTheme(
        bgGradientStart: Color(0xFFFEF9C3),
        bgGradientEnd: Color(0xFFFEF3C7),
        borderColor: Color(0xFFFDE68A),
        arrowBg: Color(0xFF1E293B),
        fallbackIcon: Icons.account_balance_rounded,
        iconColor: Color(0xFFCA8A04),
      );
    }
    if (combined.contains('group c') ||
        combined.contains('group-c') ||
        combined.contains('group d') ||
        combined.contains('group-d') ||
        combined.contains('wbssc')) {
      return const _CardTheme(
        bgGradientStart: Color(0xFFECFDF5),
        bgGradientEnd: Color(0xFFD1FAE5),
        borderColor: Color(0xFFA7F3D0),
        arrowBg: Color(0xFF10B981),
        fallbackIcon: Icons.military_tech_rounded,
        iconColor: Color(0xFF059669),
      );
    }
    if (combined.contains('icds') || combined.contains('anganwadi')) {
      return const _CardTheme(
        bgGradientStart: Color(0xFFFDF2F8),
        bgGradientEnd: Color(0xFFFCE7F3),
        borderColor: Color(0xFFFBCFE8),
        arrowBg: Color(0xFFEC4899),
        fallbackIcon: Icons.family_restroom_rounded,
        iconColor: Color(0xFFDB2777),
      );
    }
    if (combined.contains('food') ||
        combined.contains('si') ||
        combined.contains('psc') ||
        combined.contains('wbpsc')) {
      return const _CardTheme(
        bgGradientStart: Color(0xFFF5F3FF),
        bgGradientEnd: Color(0xFFEDE9FE),
        borderColor: Color(0xFFDDD6FE),
        arrowBg: Color(0xFF7C3AED),
        fallbackIcon: Icons.eco_rounded,
        iconColor: Color(0xFF7C3AED),
      );
    }

    // Default harmonic theme
    return const _CardTheme(
      bgGradientStart: Color(0xFFF0FDF4),
      bgGradientEnd: Color(0xFFDCFCE7),
      borderColor: Color(0xFFBBF7D0),
      arrowBg: Color(0xFF026BFC),
      fallbackIcon: Icons.menu_book_rounded,
      iconColor: Color(0xFF026BFC),
    );
  }

  void _openExamFilterSheet(BuildContext context, List<Map<String, dynamic>> examsList) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Filter by Exam',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (_selectedExamSlug != null)
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _selectedExamSlug = null;
                            _selectedExamTitle = null;
                          });
                          Navigator.pop(ctx);
                        },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Show All',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF026BFC),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.55,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        // All Exams Option
                        _buildExamFilterRow(
                          title: 'All Exams',
                          isSelected: _selectedExamSlug == null,
                          onTap: () {
                            setState(() {
                              _selectedExamSlug = null;
                              _selectedExamTitle = null;
                            });
                            Navigator.pop(ctx);
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        ...examsList.map((exam) {
                          final slug = (exam['slug'] ?? exam['id'] ?? '').toString();
                          final title = (exam['title'] ?? '').toString();
                          final isSelected = _selectedExamSlug == slug;

                          return Column(
                            children: [
                              _buildExamFilterRow(
                                title: title,
                                isSelected: isSelected,
                                emblemUrl: (exam['cardEmblemUrl'] ?? exam['cardLogoUrl']) as String?,
                                onTap: () {
                                  setState(() {
                                    _selectedExamSlug = slug;
                                    _selectedExamTitle = title;
                                  });
                                  Navigator.pop(ctx);
                                },
                              ),
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                            ],
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildExamFilterRow({
    required String title,
    required bool isSelected,
    String? emblemUrl,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                ),
              ),
              child: emblemUrl != null && emblemUrl.isNotEmpty
                  ? ClipOval(
                      child: PkAdminImage(
                        imageUrl: emblemUrl,
                        fallbackExamTitle: title,
                        width: 32,
                        height: 32,
                        fit: BoxFit.contain,
                      ),
                    )
                  : Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.school_rounded,
                      size: 16,
                      color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF64748B),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF1E293B),
                ),
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_rounded,
                color: Color(0xFF026BFC),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final allSeriesAsync = ref.watch(allTestSeriesProvider);
    final popularExamsAsync = ref.watch(popularExamsProvider);

    // Build the consolidated series list
    final List<Map<String, dynamic>> sourceList;
    if (allSeriesAsync.value != null && allSeriesAsync.value!.isNotEmpty) {
      sourceList = allSeriesAsync.value!.map((s) {
        return {
          'id': s.id,
          'slug': s.slug.isNotEmpty ? s.slug : s.id,
          'examId': s.examId,
          'title': s.title,
          'subtitle': (s.description != null && s.description!.isNotEmpty)
              ? s.description!
              : 'Complete Test Series',
          'examTitle': s.examTitle ?? s.title,
          'isPaid': s.isPremium,
          'mocks': s.fullMockCount > 0 ? s.fullMockCount : (s.testCount > 0 ? s.testCount : 12),
          'topics': s.topicTestCount > 0 ? s.topicTestCount : 48,
          'pyqs': s.pyqTestCount > 0 ? s.pyqTestCount : 15,
          'isPopular': s.isPopular,
          'badgeText': s.isPopular ? 'Most Popular' : null,
          'badgeType': s.isPopular ? 'popular' : null,
          'orderIndex': s.orderIndex,
        };
      }).toList();
    } else {
      sourceList = _fallbackSeries;
    }

    // Consolidated exams list for filter sheet
    final List<Map<String, dynamic>> examsList;
    if (popularExamsAsync.value != null && popularExamsAsync.value!.isNotEmpty) {
      examsList = popularExamsAsync.value!;
    } else {
      examsList = const [
        {'id': 'wbp-constable', 'slug': 'wbp-constable', 'title': 'WBP Constable'},
        {'id': 'railway-ntpc', 'slug': 'railway-ntpc', 'title': 'Railway (NTPC)'},
        {'id': 'ssc-mts', 'slug': 'ssc-mts', 'title': 'SSC MTS'},
        {'id': 'wbssc-group-c', 'slug': 'wbssc-group-c', 'title': 'WBSSC Group C'},
        {'id': 'wbssc-group-d', 'slug': 'wbssc-group-d', 'title': 'WBSSC Group D'},
        {'id': 'icds', 'slug': 'icds', 'title': 'ICDS'},
        {'id': 'food-si', 'slug': 'food-si', 'title': 'Food SI'},
      ];
    }

    // Filter by Exam + Search query
    final filtered = sourceList.where((s) {
      if (_selectedExamSlug != null && _selectedExamSlug!.isNotEmpty) {
        if (!_matchesExam(s, _selectedExamSlug!)) return false;
      }
      if (query.isNotEmpty) {
        final title = (s['title'] as String? ?? '').toLowerCase();
        final sub = (s['subtitle'] as String? ?? '').toLowerCase();
        final examTitle = (s['examTitle'] as String? ?? '').toLowerCase();
        if (!title.contains(query) && !sub.contains(query) && !examTitle.contains(query)) {
          return false;
        }
      }
      return true;
    }).toList();

    // Sort logic
    if (_selectedSort == 'Most Popular') {
      filtered.sort((a, b) {
        final aPop = (a['isPopular'] as bool? ?? false) ? 1 : 0;
        final bPop = (b['isPopular'] as bool? ?? false) ? 1 : 0;
        if (aPop != bPop) return bPop.compareTo(aPop);
        final aTests = (a['mocks'] as int) + (a['topics'] as int) + (a['pyqs'] as int);
        final bTests = (b['mocks'] as int) + (b['topics'] as int) + (b['pyqs'] as int);
        return bTests.compareTo(aTests);
      });
    } else if (_selectedSort == 'Newest') {
      filtered.sort((a, b) => ((b['orderIndex'] as int? ?? 0)).compareTo(a['orderIndex'] as int? ?? 0));
    } else if (_selectedSort == 'Most Tests') {
      filtered.sort((a, b) {
        final aTests = (a['mocks'] as int) + (a['topics'] as int) + (a['pyqs'] as int);
        final bTests = (b['mocks'] as int) + (b['topics'] as int) + (b['pyqs'] as int);
        return bTests.compareTo(aTests);
      });
    } else if (_selectedSort == 'A–Z') {
      filtered.sort((a, b) => (a['title'] as String).compareTo(b['title'] as String));
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = screenWidth >= 900 ? 4 : (screenWidth >= 600 ? 3 : 2);
    // Responsive aspect ratio to prevent overflow on every device size
    final childAspectRatio = screenWidth < 360
        ? 0.74
        : (screenWidth < 400
            ? 0.78
            : (screenWidth < 600 ? 0.81 : 0.88));

    return Scaffold(
      backgroundColor: const Color(0xFFFAFCFF),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: const Color(0xFF026BFC),
          onRefresh: () async {
            ref.invalidate(allTestSeriesProvider);
            ref.invalidate(popularExamsProvider);
            await ref.read(allTestSeriesProvider.future);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverPadding(
                padding: PKBottomSpacing.edgeInsets(
                  context,
                  horizontal: 16,
                  top: 8,
                  additionalGap: 12,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // 1. Top Navigation
                    _buildTopBar(context),
                    const SizedBox(height: 14),

                    // 2. Search + All Exams Filter Control
                    _buildSearchAndFilterBar(context, examsList),
                    const SizedBox(height: 14),

                    // 3. Motivational Gen-Z Hero Banner
                    _buildHeroBanner(),
                    const SizedBox(height: 18),

                    // 4. Section Header: Count + Sort Dropdown
                    _buildSectionHeader(filtered.length),
                    const SizedBox(height: 12),
                  ]),
                ),
              ),

              // 5. Responsive 2-Column Grid
              if (allSeriesAsync.isLoading && sourceList.isEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: _buildSkeletonGrid(crossAxisCount, childAspectRatio),
                )
              else if (filtered.isEmpty)
                SliverToBoxAdapter(
                  child: _buildEmptyState(),
                )
              else
                SliverPadding(
                  padding: PKBottomSpacing.edgeInsets(
                    context,
                    horizontal: 16,
                    additionalGap: 24,
                  ),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: childAspectRatio,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildTestSeriesCard(filtered[index]);
                      },
                      childCount: filtered.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // 1. Top Navigation Bar matching reference design
  Widget _buildTopBar(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Back Button
        InkWell(
          onTap: () {
            if (widget.isStandAlone || Navigator.of(context).canPop()) {
              Navigator.of(context).maybePop();
            } else if (widget.onTabSelected != null) {
              widget.onTabSelected!(0);
            } else {
              context.go('/home');
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.arrow_back_rounded,
              color: Color(0xFF1E293B),
              size: 20,
            ),
          ),
        ),

        // Centered Title with Gen-Z Sparkles & Playful Subtitle
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Text('✨ ', style: TextStyle(fontSize: 13)),
                  Text(
                    'Test Series',
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.5,
                    ),
                  ),
                  Text(' ✨', style: TextStyle(fontSize: 13)),
                ],
              ),
              const SizedBox(height: 1),
              const Text(
                'Practice Today, Be Exam Ready!',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                  letterSpacing: -0.1,
                ),
              ),
            ],
          ),
        ),

        // Search Focus Action Button
        InkWell(
          onTap: () {
            _searchFocusNode.requestFocus();
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.search_rounded,
              color: Color(0xFF1E293B),
              size: 20,
            ),
          ),
        ),
      ],
    );
  }

  // 2. Large Rounded Search Field + "All Exams ⌄" Dropdown Control
  Widget _buildSearchAndFilterBar(BuildContext context, List<Map<String, dynamic>> examsList) {
    return Row(
      children: [
        // Rounded Search Bar
        Expanded(
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocusNode,
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search test series...',
                      hintStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF94A3B8)),
                              padding: EdgeInsets.zero,
                              onPressed: () => setState(() => _searchController.clear()),
                            )
                          : null,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 10),

        // "All Exams ⌄" Filter Control
        InkWell(
          onTap: () => _openExamFilterSheet(context, examsList),
          borderRadius: BorderRadius.circular(22),
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: _selectedExamSlug != null ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                width: _selectedExamSlug != null ? 1.5 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.filter_list_rounded,
                  size: 16,
                  color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFF334155),
                ),
                const SizedBox(width: 6),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 82),
                  child: Text(
                    _selectedExamTitle ?? 'All Exams',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFF334155),
                    ),
                  ),
                ),
                const SizedBox(width: 2),
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  size: 18,
                  color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFF64748B),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 3. Gen-Z Motivational Hero Banner
  Widget _buildHeroBanner() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFFEF3C7)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 10,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Image.asset(
          'assets/images/exams/test_series_hero_banner.png',
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _buildFallbackHeroBanner(),
        ),
      ),
    );
  }

  Widget _buildFallbackHeroBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'Small ',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    ),
                    Icon(Icons.workspace_premium_rounded, size: 15, color: Color(0xFFF59E0B)),
                  ],
                ),
                const Text(
                  'Tests\nBig Results',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    height: 1.1,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  '✦ Practice • Analyze • Improve',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                ),
                const Text(
                  'Your Dream Government Job is Closer!',
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.6),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.school_rounded,
              size: 44,
              color: Color(0xFFF59E0B),
            ),
          ),
        ],
      ),
    );
  }

  // 4. Section Header: Dynamic Count + Working Sort Dropdown
  Widget _buildSectionHeader(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Emphasized dynamic count
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '$count ',
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF026BFC),
                  letterSpacing: -0.5,
                ),
              ),
              const TextSpan(
                text: 'Test Series',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.4,
                ),
              ),
            ],
          ),
        ),

        // Sort Dropdown
        PopupMenuButton<String>(
          onSelected: (val) => setState(() => _selectedSort = val),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 4,
          itemBuilder: (context) => [
            _buildSortMenuItem('Most Popular'),
            _buildSortMenuItem('Newest'),
            _buildSortMenuItem('Most Tests'),
            _buildSortMenuItem('A–Z'),
          ],
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x04000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.swap_vert_rounded, size: 16, color: Color(0xFF475569)),
                const SizedBox(width: 4),
                Text(
                  _selectedSort,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF334155),
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF64748B)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  PopupMenuItem<String> _buildSortMenuItem(String text) {
    final isSelected = _selectedSort == text;
    return PopupMenuItem<String>(
      value: text,
      child: Row(
        children: [
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF0F172A),
              ),
            ),
          ),
          if (isSelected)
            const Icon(Icons.check_rounded, color: Color(0xFF026BFC), size: 18),
        ],
      ),
    );
  }

  // 5. Gen-Z Test Series Card
  Widget _buildTestSeriesCard(Map<String, dynamic> item) {
    final title = item['title'] as String;
    final subtitle = item['subtitle'] as String;
    final examTitle = item['examTitle'] as String?;
    final isPaid = item['isPaid'] as bool? ?? false;
    final mocks = item['mocks'] as int;
    final topics = item['topics'] as int;
    final pyqs = item['pyqs'] as int;

    final theme = _resolveCardTheme(title, examTitle);
    final badgeText = (item['badgeText'] as String?) ?? theme.defaultBadge;

    return InkWell(
      onTap: () => _onCardTap(item),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(11),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [theme.bgGradientStart, theme.bgGradientEnd],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: theme.borderColor, width: 1.2),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Top Section: Optional Badge + Emblem + Title
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Row: Badge (if any) + Exam Emblem on right
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (badgeText != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: theme.badgeBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (theme.badgeIcon != null) ...[
                              Icon(theme.badgeIcon, size: 10, color: theme.badgeTextColor),
                              const SizedBox(width: 3),
                            ],
                            Text(
                              badgeText,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: theme.badgeTextColor,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      const SizedBox.shrink(),

                    // Official Exam Emblem
                    _buildCardEmblem(title, examTitle, theme),
                  ],
                ),
                const SizedBox(height: 5),

                // Exam Title
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 1),

                // Subtitle
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),

            // Middle: 3 Statistics Columns
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCol(
                      mocks.toString(),
                      'Full\nMocks',
                      Icons.description_outlined,
                      const Color(0xFF026BFC),
                    ),
                  ),
                  Container(width: 1, height: 22, color: const Color(0xFFCBD5E1).withValues(alpha: 0.6)),
                  Expanded(
                    child: _buildStatCol(
                      topics.toString(),
                      'Topic\nTests',
                      Icons.layers_outlined,
                      const Color(0xFF10B981),
                    ),
                  ),
                  Container(width: 1, height: 22, color: const Color(0xFFCBD5E1).withValues(alpha: 0.6)),
                  Expanded(
                    child: _buildStatCol(
                      pyqs.toString(),
                      'Official\nPYQs',
                      Icons.assignment_outlined,
                      const Color(0xFF8B5CF6),
                    ),
                  ),
                ],
              ),
            ),

            // Bottom Row: Status Badge (Free or Paid) + Action Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Status Badge: ONLY Free or Paid (NEVER PRO / PREMIUM)
                _buildStatusBadge(isPaid),

                // Arrow Action Button matching card theme
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: theme.arrowBg,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: theme.arrowBg.withValues(alpha: 0.28),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.arrow_forward_rounded,
                    color: Colors.white,
                    size: 15,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardEmblem(String title, String? examTitle, _CardTheme theme) {
    final emblemAsset = ExamAssets.getEmblemAsset(title) ?? ExamAssets.getEmblemAsset(examTitle);

    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: emblemAsset != null
          ? Padding(
              padding: const EdgeInsets.all(4),
              child: Image.asset(
                emblemAsset,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => Icon(theme.fallbackIcon, color: theme.iconColor, size: 20),
              ),
            )
          : Icon(theme.fallbackIcon, color: theme.iconColor, size: 20),
    );
  }

  Widget _buildStatCol(String count, String label, IconData icon, Color iconColor) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 11, color: iconColor),
            const SizedBox(width: 3),
            Text(
              count,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 1),
        Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 2,
          style: const TextStyle(
            fontSize: 8.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
            height: 1.1,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(bool isPaid) {
    if (!isPaid) {
      // FREE status badge
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
        decoration: BoxDecoration(
          color: const Color(0xFFD1FAE5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(
              Icons.workspace_premium_rounded,
              size: 12,
              color: Color(0xFF059669),
            ),
            SizedBox(width: 3),
            Text(
              'Free',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: Color(0xFF059669),
              ),
            ),
          ],
        ),
      );
    } else {
      // PAID status badge
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(
              Icons.lock_rounded,
              size: 11,
              color: Color(0xFFD97706),
            ),
            SizedBox(width: 3),
            Text(
              'Paid',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: Color(0xFFD97706),
              ),
            ),
          ],
        ),
      );
    }
  }

  // 6. Skeleton Loading Grid
  Widget _buildSkeletonGrid(int crossAxisCount, double childAspectRatio) {
    return SliverGrid(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: childAspectRatio,
      ),
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 50,
                      height: 16,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ],
                ),
                Container(
                  width: 90,
                  height: 14,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                Container(
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 44,
                      height: 18,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    Container(
                      width: 26,
                      height: 26,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
        childCount: 6,
      ),
    );
  }

  // 7. Empty State
  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.search_off_rounded,
                size: 32,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'No test series found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try another exam or search term.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _searchController.clear();
                  _selectedExamSlug = null;
                  _selectedExamTitle = null;
                });
              },
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Clear Filters'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CardTheme {
  final Color bgGradientStart;
  final Color bgGradientEnd;
  final Color borderColor;
  final Color arrowBg;
  final IconData fallbackIcon;
  final Color iconColor;
  final String? defaultBadge;
  final IconData? badgeIcon;
  final Color badgeBg;
  final Color badgeTextColor;

  const _CardTheme({
    required this.bgGradientStart,
    required this.bgGradientEnd,
    required this.borderColor,
    required this.arrowBg,
    required this.fallbackIcon,
    required this.iconColor,
    this.defaultBadge,
    this.badgeIcon,
    this.badgeBg = const Color(0xFFFFEDD5),
    this.badgeTextColor = const Color(0xFFC2410C),
  });
}
