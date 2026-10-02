import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../core/widgets/pk_search_filter_bar.dart';
import 'widgets/test_series_card.dart';

class ExamsCatalogScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const ExamsCatalogScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<ExamsCatalogScreen> createState() => _ExamsCatalogScreenState();
}

class _ExamsCatalogScreenState extends ConsumerState<ExamsCatalogScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  int _selectedFilterIndex = 0;
  String _selectedSort = 'Popular';

  static const List<String> _filters = [
    'All Exams',
    'State Exams',
    'Central Exams',
    'Teaching',
    'Railway',
    'Police',
  ];

  static const List<TestSeriesItemData> _allSeriesList = [
    TestSeriesItemData(
      id: 'wbp_constable_2026',
      category: 'Police',
      title: 'WBP Constable Test Series 2026',
      subtitle: 'Complete test series with latest pattern & syllabus',
      fullMockCount: 60,
      topicTestCount: 40,
      pyqTestCount: 20,
      syllabus: 'Full Syllabus',
      emblemType: 'wbp_series',
      iconGradient: [Color(0xFFFFF7E6), Color(0xFFFDE8C4)],
      assetPath: 'assets/images/exams/emblem_series_wbp.png',
    ),
    TestSeriesItemData(
      id: 'kp_constable_2026',
      category: 'Police',
      title: 'KP Constable Test Series 2026',
      subtitle: 'Chapter-wise & full length mock tests',
      fullMockCount: 50,
      topicTestCount: 35,
      pyqTestCount: 15,
      syllabus: 'Full Syllabus',
      emblemType: 'kp_series',
      iconGradient: [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
      assetPath: 'assets/images/exams/emblem_series_kp.png',
    ),
    TestSeriesItemData(
      id: 'ssc_gd_2026',
      category: 'Central Exams',
      title: 'SSC GD Test Series 2026',
      subtitle: 'Latest pattern | Tier 1 complete preparation',
      fullMockCount: 75,
      topicTestCount: 50,
      pyqTestCount: 25,
      syllabus: 'Full Syllabus',
      emblemType: 'ssc_series',
      iconGradient: [Color(0xFFF87171), Color(0xFFDC2626)],
      assetPath: 'assets/images/exams/emblem_series_ssc.png',
    ),
    TestSeriesItemData(
      id: 'railway_ntpc_2026',
      category: 'Railway',
      title: 'Railway NTPC Test Series 2026',
      subtitle: 'Topic-wise & full length mock tests',
      fullMockCount: 60,
      topicTestCount: 40,
      pyqTestCount: 20,
      syllabus: 'Full Syllabus',
      emblemType: 'railway_series',
      iconGradient: [Color(0xFFEFF6FF), Color(0xFFDBEAFE)],
      assetPath: 'assets/images/exams/emblem_railway.png',
    ),
    TestSeriesItemData(
      id: 'wbssc_2026',
      category: 'State Exams',
      title: 'WBSSC Test Series 2026',
      subtitle: 'Complete syllabus coverage with model tests',
      fullMockCount: 50,
      topicTestCount: 35,
      pyqTestCount: 15,
      syllabus: 'Full Syllabus',
      emblemType: 'wbssc_series',
      iconGradient: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
      assetPath: 'assets/images/exams/emblem_wbssc.png',
    ),
    TestSeriesItemData(
      id: 'wb_tet_2026',
      category: 'Teaching',
      title: 'WB Primary TET Test Series 2026',
      subtitle: 'CDP, Bengali, English, Math & EVS mock tests',
      fullMockCount: 45,
      topicTestCount: 35,
      pyqTestCount: 15,
      syllabus: 'Full Syllabus',
      emblemType: 'tet_series',
      iconGradient: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
      assetPath: 'assets/images/exams/emblem_tet.png',
    ),
    TestSeriesItemData(
      id: 'ssc_chsl_2026',
      category: 'Central Exams',
      title: 'SSC CHSL Test Series 2026',
      subtitle: 'Tier 1 & Tier 2 comprehensive mock tests',
      fullMockCount: 65,
      topicTestCount: 45,
      pyqTestCount: 25,
      syllabus: 'Full Syllabus',
      emblemType: 'ssc_series',
      iconGradient: [Color(0xFFFFE4E6), Color(0xFFFECDD3)],
      assetPath: 'assets/images/exams/emblem_series_ssc.png',
    ),
    TestSeriesItemData(
      id: 'wbp_si_2026',
      category: 'Police',
      title: 'WBP Sub-Inspector Test Series 2026',
      subtitle: 'Prelims & Mains exam oriented preparation',
      fullMockCount: 55,
      topicTestCount: 35,
      pyqTestCount: 20,
      syllabus: 'Full Syllabus',
      emblemType: 'wbp_series',
      iconGradient: [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
      assetPath: 'assets/images/exams/emblem_series_wbp.png',
    ),
    TestSeriesItemData(
      id: 'rrb_group_d_2026',
      category: 'Railway',
      title: 'RRB Group D Test Series 2026',
      subtitle: 'Complete CBT preparation with past papers',
      fullMockCount: 70,
      topicTestCount: 45,
      pyqTestCount: 25,
      syllabus: 'Full Syllabus',
      emblemType: 'railway_series',
      iconGradient: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
      assetPath: 'assets/images/exams/emblem_railway.png',
    ),
  ];

  static const List<_PopularTestItem> _popularTestsList = [
    _PopularTestItem(
      id: 'wbp_constable_2026',
      title: 'WBP Constable Test Series 2026',
      category: 'Police',
      badgeText: 'Bestseller',
      badgeIcon: '⭐',
      badgeBg: Color(0xFFFFEDD5),
      badgeColor: Color(0xFFC2410C),
      iconGradient: [Color(0xFFFFF3D6), Color(0xFFFDE68A)],
      assetPath: 'assets/images/exams/emblem_series_wbp.png',
      bgImageAsset: 'assets/images/series_wbp_bg.png',
      bgGradient: [Color(0xFFFFF8EC), Color(0xFFFEF3C7)],
      shadowColor: Color(0x1AD97706),
    ),
    _PopularTestItem(
      id: 'kp_constable_2026',
      title: 'KP Constable Test Series 2026',
      category: 'Police',
      badgeText: 'Most Popular',
      badgeIcon: '👑',
      badgeBg: Color(0xFFEDE9FE),
      badgeColor: Color(0xFF7C3AED),
      iconGradient: [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
      assetPath: 'assets/images/exams/emblem_series_kp.png',
      bgImageAsset: 'assets/images/series_kp_bg.png',
      bgGradient: [Color(0xFFF5F3FF), Color(0xFFEDE9FE)],
      shadowColor: Color(0x1A7C3AED),
    ),
    _PopularTestItem(
      id: 'ssc_gd_2026',
      title: 'SSC GD Constable Test Series 2026',
      category: 'Central Exams',
      badgeText: 'Bestseller',
      badgeIcon: '⭐',
      badgeBg: Color(0xFFFFE4E6),
      badgeColor: Color(0xFFE11D48),
      iconGradient: [Color(0xFFFFE4E6), Color(0xFFFECDD3)],
      assetPath: 'assets/images/exams/emblem_series_ssc.png',
      bgImageAsset: 'assets/images/series_ssc_bg.png',
      bgGradient: [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
      shadowColor: Color(0x1AE11D48),
    ),
    _PopularTestItem(
      id: 'railway_ntpc_2026',
      title: 'Railway NTPC Test Series 2026',
      category: 'Railway',
      badgeText: 'Trending',
      badgeIcon: '⭐',
      badgeBg: Color(0xFFEFF6FF),
      badgeColor: Color(0xFF0066FF),
      iconGradient: [Color(0xFFEFF6FF), Color(0xFFDBEAFE)],
      assetPath: 'assets/images/exams/emblem_railway.png',
      bgGradient: [Color(0xFFF0F7FF), Color(0xFFE0EFFF)],
      shadowColor: Color(0x1A0066FF),
    ),
    _PopularTestItem(
      id: 'wb_tet_2026',
      title: 'WB Primary TET Test Series 2026',
      category: 'Teaching',
      badgeText: 'Most Popular',
      badgeIcon: '⭐',
      badgeBg: Color(0xFFFEF3C7),
      badgeColor: Color(0xFFB45309),
      iconGradient: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
      assetPath: 'assets/images/exams/emblem_tet.png',
      bgGradient: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
      shadowColor: Color(0x1AB45309),
    ),
    _PopularTestItem(
      id: 'wbssc_2026',
      title: 'WBSSC Test Series 2026',
      category: 'State Exams',
      badgeText: 'Popular',
      badgeIcon: '⭐',
      badgeBg: Color(0xFFECFDF5),
      badgeColor: Color(0xFF059669),
      iconGradient: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
      assetPath: 'assets/images/exams/emblem_wbssc.png',
      bgGradient: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
      shadowColor: Color(0x1A059669),
    ),
  ];

  final ScrollController _mainScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _mainScrollController.dispose();
    super.dispose();
  }

  void _scrollToAllTestSeries() {
    if (_selectedFilterIndex != 0) {
      setState(() {
        _selectedFilterIndex = 0;
      });
    }
    if (_searchController.text.isNotEmpty) {
      _searchController.clear();
      setState(() {});
    }
    if (_mainScrollController.hasClients) {
      _mainScrollController.animateTo(
        340.0,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final selectedFilter = _filters[_selectedFilterIndex];

    // Filter test series by category and search query
    final filteredList = _allSeriesList.where((item) {
      final matchesCategory = _selectedFilterIndex == 0 ||
          (selectedFilter == 'State Exams' &&
              (item.category == 'State Exams' || item.category == 'Teaching')) ||
          (selectedFilter == 'Central Exams' &&
              item.category == 'Central Exams') ||
          (selectedFilter == 'Railway' && item.category == 'Railway') ||
          (selectedFilter == 'Police' && item.category == 'Police') ||
          (selectedFilter == 'Teaching' && item.category == 'Teaching');

      final matchesQuery = query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.subtitle.toLowerCase().contains(query) ||
          item.category.toLowerCase().contains(query);

      return matchesCategory && matchesQuery;
    }).toList();

    // Filter popular tests by category and search query
    final filteredPopular = _popularTestsList.where((item) {
      final matchesCategory = _selectedFilterIndex == 0 ||
          (selectedFilter == 'State Exams' && item.category.contains('State')) ||
          (selectedFilter == 'Central Exams' && item.category.contains('Central')) ||
          (selectedFilter == 'Railway' && item.category.contains('Railway')) ||
          (selectedFilter == 'Police' && item.category.contains('Police')) ||
          (selectedFilter == 'Teaching' && item.category.contains('Teaching'));

      final matchesQuery = query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.category.toLowerCase().contains(query);

      return matchesCategory && matchesQuery;
    }).toList();

    // Sorting
    if (_selectedSort == 'Most Tests') {
      filteredList.sort((a, b) => b.totalTestsCount.compareTo(a.totalTestsCount));
    } else if (_selectedSort == 'Alphabetical (A-Z)') {
      filteredList.sort((a, b) => a.title.compareTo(b.title));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5FC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          controller: _mainScrollController,
          padding: PKBottomSpacing.edgeInsets(context, horizontal: 16, top: 12),
          children: [
            // ── 1. EXISTING PAGE HEADER ──
            _buildPageHeader(),
            const SizedBox(height: 14),

            // ── 2. SEARCH + FILTER SECTION ──
            _buildSearchAndFilter(query, filteredList.length),
            const SizedBox(height: 18),

            // ── 2.5. POPULAR TESTS SECTION ──
            if (filteredPopular.isNotEmpty) ...[
              _buildPopularTestsSection(filteredPopular),
              const SizedBox(height: 20),
            ],

            // ── 3. ALL TEST SERIES SECTION ──
            _buildAllTestSeriesHeader(),
            const SizedBox(height: 14),

            // All Test Series Cards List
            if (filteredList.isEmpty)
              _buildEmptyState(query)
            else
              ...filteredList.asMap().entries.map((entry) {
                final isLast = entry.key == filteredList.length - 1;
                return Padding(
                  padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
                  child: TestSeriesCard(item: entry.value),
                );
              }),
          ],
        ),
      ),
    );
  }

  // ──────────────────────────────────────────
  // 1. PAGE HEADER (TITLE, SUBTITLE & CATEGORY PILLS)
  // ──────────────────────────────────────────
  Widget _buildPageHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Test Series',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF07194A),
            letterSpacing: -0.6,
            height: 1.15,
          ),
        ),
        const SizedBox(height: 3),
        const Text(
          'Choose the right test series and boost your preparation',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w500,
            color: Color(0xFF52648A),
          ),
        ),
        const SizedBox(height: 14),

        // Category Filter Pills
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
                    color: isSelected ? const Color(0xFF0066FF) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF0066FF)
                          : const Color(0xFFE2ECF8),
                    ),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: const Color(0xFF0066FF).withValues(alpha: 0.25),
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
      ],
    );
  }

  // ──────────────────────────────────────────
  // 2. SEARCH & FILTER SECTION
  // ──────────────────────────────────────────
  Widget _buildSearchAndFilter(String query, int resultCount) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PKSearchFilterBar(
          controller: _searchController,
          focusNode: _searchFocusNode,
          hintText: 'Search test series (e.g. WBP, SSC, TET...)',
          searchIconColor: const Color(0xFF0066FF),
          isFilterActive: _selectedFilterIndex != 0,
          onFilterTap: () => _showFilterSheet(context),
          onChanged: (_) => setState(() {}),
          onClear: () => setState(() {}),
        ),

        // Active Search Feedback Pill
        if (query.isNotEmpty) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.search_rounded,
                      size: 13,
                      color: Color(0xFF0066FF),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Results for "$query"',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0066FF),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '($resultCount)',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF07194A),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () {
                  _searchController.clear();
                  setState(() {});
                },
                child: const Text(
                  'Clear',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFEF4444),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  // ──────────────────────────────────────────
  // 2.5. POPULAR TEST SERIES SECTION (MATCHING REFERENCE UI)
  // 🔥 Popular Test Series            See All →
  // ──────────────────────────────────────────
  Widget _buildPopularTestsSection(List<_PopularTestItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Header: 🔥 Popular Test Series       See All → ──
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '🔥',
                    style: TextStyle(fontSize: 22),
                  ),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Popular Test Series',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 20.5,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF07194A),
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: _scrollToAllTestSeries,
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0066FF),
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: Color(0xFF0066FF),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // ── Horizontal Carousel (Single Row, Wide Cards) ──
        LayoutBuilder(
          builder: (context, constraints) {
            final availableWidth = constraints.maxWidth;
            final isCompact = availableWidth < 600;
            const gap = 10.0;

            // Desktop/tablet: show ~2 to 3 cards in visible area
            // Mobile: compact cards with visible portion of next card to indicate horizontal scrolling
            final cardWidth = isCompact
                ? (availableWidth * 0.68).clamp(225.0, 275.0)
                : ((availableWidth - gap * 2) / 2.7).clamp(260.0, 340.0);

            final cardHeight = isCompact ? 84.0 : 88.0;

            return SizedBox(
              height: cardHeight,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: gap),
                itemBuilder: (context, idx) {
                  return _buildPopularCard(
                    items[idx],
                    cardWidth: cardWidth,
                    cardHeight: cardHeight,
                    isCompact: isCompact,
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildPopularCard(
    _PopularTestItem item, {
    required double cardWidth,
    required double cardHeight,
    required bool isCompact,
  }) {
    final emblemSize = isCompact ? 48.0 : 52.0;
    final arrowSize = isCompact ? 30.0 : 34.0;
    final arrowIconSize = isCompact ? 15.0 : 17.0;
    final titleFontSize = isCompact ? 12.5 : 13.5;

    return Semantics(
      label: '${item.title} ${item.badgeText}',
      button: true,
      child: GestureDetector(
        onTap: () => context.push('/test-series/${item.id}'),
        behavior: HitTestBehavior.opaque,
        child: Container(
          width: cardWidth,
          height: cardHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.90),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: item.shadowColor,
                blurRadius: 8,
                offset: const Offset(0, 2.5),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Soft pastel background image or fallback gradient
                if (item.bgImageAsset != null)
                  Image.asset(
                    item.bgImageAsset!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: item.bgGradient,
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                    ),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: item.bgGradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),

                // Card contents in a single horizontal row
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: isCompact ? 9 : 12,
                    vertical: isCompact ? 6 : 8,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // 1. Square Icon / Emblem on the left
                      Container(
                        width: emblemSize,
                        height: emblemSize,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: item.iconGradient,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(13),
                          border: Border.all(color: Colors.white, width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 5,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(4.5),
                        child: Image.asset(
                          item.assetPath,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const Icon(
                            Icons.school_rounded,
                            size: 20,
                            color: Color(0xFF0066FF),
                          ),
                        ),
                      ),
                      SizedBox(width: isCompact ? 8 : 10),

                      // 2. Middle column: Badge on top + Title below (NO subtitle/metadata)
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Pill badge
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: item.badgeBg,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      item.badgeIcon,
                                      style: const TextStyle(fontSize: 9.5),
                                    ),
                                    const SizedBox(width: 3),
                                    Text(
                                      item.badgeText,
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w800,
                                        color: item.badgeColor,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 3.5),

                            // Exam Title (e.g. WBP Constable Test Series 2026)
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Text(
                                item.title,
                                maxLines: 1,
                                style: TextStyle(
                                  fontSize: titleFontSize,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF07194A),
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: isCompact ? 5 : 7),

                      // 3. Right: Circular arrow button
                      Container(
                        width: arrowSize,
                        height: arrowSize,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0EDFF),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0066FF).withValues(alpha: 0.10),
                              blurRadius: 5,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          size: arrowIconSize,
                          color: const Color(0xFF0066FF),
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
    );
  }

  // ──────────────────────────────────────────
  // 3. ALL TEST SERIES HEADER (MATCHING REFERENCE UI)
  // [Document Icon] All Test Series        Sort by: Popular ↓
  // ──────────────────────────────────────────
  Widget _buildAllTestSeriesHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Left: Dark navy document icon container + Heading
        Expanded(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFF07194A),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.article_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Flexible(
                child: Text(
                  'All Test Series',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF07194A),
                    letterSpacing: -0.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),

        // Right: Sort by: Popular ↓
        GestureDetector(
          onTap: () => _showSortSheet(context),
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Sort by: ',
                  style: TextStyle(
                    fontSize: 13.5,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  _selectedSort,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: Color(0xFF0066FF),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  size: 19,
                  color: Color(0xFF0066FF),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ──────────────────────────────────────────
  // EMPTY STATE
  // ──────────────────────────────────────────
  Widget _buildEmptyState(String query) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8EEF7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF07194A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.search_off_rounded,
              size: 32,
              color: Color(0xFF0066FF),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'No test series found',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF07194A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            query.isNotEmpty
                ? 'We couldn\'t find any test series matching "$query".'
                : 'No test series available for the selected category.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12.5,
              color: Color(0xFF64748B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              setState(() {
                _searchController.clear();
                _selectedFilterIndex = 0;
              });
            },
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Reset All Filters'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0066FF),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────
  // SORT BOTTOM SHEET
  // ──────────────────────────────────────────
  void _showSortSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final options = ['Popular', 'Most Tests', 'Alphabetical (A-Z)'];
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Sort Test Series',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF07194A),
                  ),
                ),
                const SizedBox(height: 12),
                ...options.map((opt) {
                  final isSel = _selectedSort == opt;
                  return ListTile(
                    title: Text(
                      opt,
                      style: TextStyle(
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        color: isSel ? const Color(0xFF0066FF) : const Color(0xFF07194A),
                      ),
                    ),
                    trailing: isSel
                        ? const Icon(Icons.check_rounded, color: Color(0xFF0066FF))
                        : null,
                    onTap: () {
                      setState(() => _selectedSort = opt);
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

  // ──────────────────────────────────────────
  // CATEGORY FILTER BOTTOM SHEET
  // ──────────────────────────────────────────
  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Filter by Category',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF07194A),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _filters.map((f) {
                    final isSel = _filters[_selectedFilterIndex] == f;
                    return ChoiceChip(
                      label: Text(f),
                      selected: isSel,
                      selectedColor: const Color(0xFF0066FF),
                      backgroundColor: const Color(0xFFF1F5FC),
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : const Color(0xFF07194A),
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) {
                        setState(() => _selectedFilterIndex = _filters.indexOf(f));
                        Navigator.pop(ctx);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PopularTestItem {
  final String id;
  final String title;
  final String category;
  final String badgeText;
  final String badgeIcon;
  final Color badgeBg;
  final Color badgeColor;
  final List<Color> iconGradient;
  final String assetPath;
  final String? bgImageAsset;
  final List<Color> bgGradient;
  final Color shadowColor;

  const _PopularTestItem({
    required this.id,
    required this.title,
    required this.category,
    required this.badgeText,
    required this.badgeIcon,
    required this.badgeBg,
    required this.badgeColor,
    required this.iconGradient,
    required this.assetPath,
    this.bgImageAsset,
    required this.bgGradient,
    required this.shadowColor,
  });
}
