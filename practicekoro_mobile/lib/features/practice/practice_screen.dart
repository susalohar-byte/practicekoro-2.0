import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../core/widgets/pk_search_filter_bar.dart';

class PracticeScreen extends ConsumerStatefulWidget {
  final String initialTab;
  final ValueChanged<int>? onTabSelected;

  const PracticeScreen({
    super.key,
    this.initialTab = 'subjects',
    this.onTabSelected,
  });

  @override
  ConsumerState<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeSubjectData {
  final String id;
  final String title;
  final String chaptersCount;
  final Color iconBg;
  final Color iconColor;
  final IconData? icon;
  final String? symbol;
  final Color? symbolBg;

  const _PracticeSubjectData({
    required this.id,
    required this.title,
    required this.chaptersCount,
    required this.iconBg,
    required this.iconColor,
    this.icon,
    this.symbol,
    this.symbolBg,
  });
}

class _ContinuePracticeData {
  final String id;
  final String subjectId;
  final String title;
  final String subtitle;
  final int completedQuestions;
  final int totalQuestions;
  final Color iconBg;
  final Color iconColor;
  final IconData icon;

  const _ContinuePracticeData({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.subtitle,
    required this.completedQuestions,
    required this.totalQuestions,
    required this.iconBg,
    required this.iconColor,
    required this.icon,
  });
}

class _QuickPracticeData {
  final String id;
  final String title;
  final String subtitle;
  final Color iconBg;
  final Color iconColor;
  final IconData icon;

  const _QuickPracticeData({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.iconBg,
    required this.iconColor,
    required this.icon,
  });
}

class _PracticeScreenState extends ConsumerState<PracticeScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  int _selectedFilterIndex = 0;

  static const List<String> _subjectFilters = [
    'All Subjects',
    'General Knowledge',
    'Mathematics',
    'Bengali',
    'English',
    'Reasoning',
    'General Science',
    'Computer',
    'Current Affairs',
  ];

  static const List<_PracticeSubjectData> _allSubjects = [
    _PracticeSubjectData(
      id: 'general_knowledge',
      title: 'General Knowledge',
      chaptersCount: '25 Chapters',
      iconBg: Color(0xFFEBF3FF),
      iconColor: Color(0xFF2563EB),
      icon: Icons.article_rounded,
    ),
    _PracticeSubjectData(
      id: 'mathematics',
      title: 'Mathematics',
      chaptersCount: '30 Chapters',
      iconBg: Color(0xFFE6F8EE),
      iconColor: Color(0xFF16A34A),
      icon: Icons.calculate_rounded,
    ),
    _PracticeSubjectData(
      id: 'english',
      title: 'English',
      chaptersCount: '20 Chapters',
      iconBg: Color(0xFFF3E8FF),
      iconColor: Color(0xFF9333EA),
      symbol: 'A',
      symbolBg: Color(0xFF9333EA),
    ),
    _PracticeSubjectData(
      id: 'bengali',
      title: 'Bengali',
      chaptersCount: '25 Chapters',
      iconBg: Color(0xFFFFEDD5),
      iconColor: Color(0xFFEA580C),
      symbol: 'অ',
      symbolBg: Color(0xFFEA580C),
    ),
    _PracticeSubjectData(
      id: 'reasoning',
      title: 'Reasoning',
      chaptersCount: '30 Chapters',
      iconBg: Color(0xFFFFE4E6),
      iconColor: Color(0xFFE11D48),
      icon: Icons.hub_rounded,
    ),
    _PracticeSubjectData(
      id: 'general_science',
      title: 'General Science',
      chaptersCount: '20 Chapters',
      iconBg: Color(0xFFFEF3C7),
      iconColor: Color(0xFFD97706),
      icon: Icons.science_outlined,
    ),
    _PracticeSubjectData(
      id: 'computer_awareness',
      title: 'Computer',
      chaptersCount: '15 Chapters',
      iconBg: Color(0xFFEDE9FE),
      iconColor: Color(0xFF7C3AED),
      icon: Icons.laptop_mac_rounded,
    ),
    _PracticeSubjectData(
      id: 'current_affairs',
      title: 'Current Affairs',
      chaptersCount: '25 Chapters',
      iconBg: Color(0xFFECFDF5),
      iconColor: Color(0xFF10B981),
      icon: Icons.bar_chart_rounded,
    ),
  ];

  static const List<_ContinuePracticeData> _continueItems = [
    _ContinuePracticeData(
      id: 'number_system',
      subjectId: 'mathematics',
      title: 'Number System',
      subtitle: 'Mathematics • WBP Constable',
      completedQuestions: 12,
      totalQuestions: 30,
      iconBg: Color(0xFFE6F8EE),
      iconColor: Color(0xFF16A34A),
      icon: Icons.calculate_rounded,
    ),
    _ContinuePracticeData(
      id: 'indian_history',
      subjectId: 'general_knowledge',
      title: 'Indian History',
      subtitle: 'General Knowledge • WBP Constable',
      completedQuestions: 18,
      totalQuestions: 25,
      iconBg: Color(0xFFEBF3FF),
      iconColor: Color(0xFF2563EB),
      icon: Icons.article_rounded,
    ),
    _ContinuePracticeData(
      id: 'analogy',
      subjectId: 'reasoning',
      title: 'Analogy',
      subtitle: 'Reasoning • WBP Constable',
      completedQuestions: 8,
      totalQuestions: 20,
      iconBg: Color(0xFFFFE4E6),
      iconColor: Color(0xFFE11D48),
      icon: Icons.hub_rounded,
    ),
  ];

  static const List<_QuickPracticeData> _quickPracticeItems = [
    _QuickPracticeData(
      id: 'quick_10',
      title: '10 Questions',
      subtitle: 'Daily Practice',
      iconBg: Color(0xFFE6F8EE),
      iconColor: Color(0xFF16A34A),
      icon: Icons.track_changes_rounded,
    ),
    _QuickPracticeData(
      id: 'quick_25',
      title: '25 Questions',
      subtitle: 'Mixed Practice',
      iconBg: Color(0xFFFFEDD5),
      iconColor: Color(0xFFEA580C),
      icon: Icons.description_rounded,
    ),
    _QuickPracticeData(
      id: 'quick_50',
      title: '50 Questions',
      subtitle: 'Full Practice',
      iconBg: Color(0xFFF3E8FF),
      iconColor: Color(0xFF8B5CF6),
      icon: Icons.emoji_events_rounded,
    ),
  ];

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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final selectedFilter = _subjectFilters[_selectedFilterIndex];

    final filteredSubjects = _allSubjects.where((item) {
      final matchesFilter = _selectedFilterIndex == 0 ||
          item.title.toLowerCase() == selectedFilter.toLowerCase();
      final matchesQuery = query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.chaptersCount.toLowerCase().contains(query);
      return matchesFilter && matchesQuery;
    }).toList();

    final filteredContinueItems = _continueItems.where((item) {
      final matchesQuery = query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.subtitle.toLowerCase().contains(query);
      return matchesQuery;
    }).toList();

    final bool hasNoResults =
        filteredSubjects.isEmpty && filteredContinueItems.isEmpty && query.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5FC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: PKBottomSpacing.edgeInsets(context, horizontal: 16, top: 12),
          children: [
            // ── 1. SCREEN TITLE & SUBTITLE ──
            const Text(
              'Practice',
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
              'Subject-wise practice to strengthen your preparation',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 14),

            // ── 2. SUBJECT CATEGORY FILTER PILLS ──
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _subjectFilters.length,
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
                        _subjectFilters[idx],
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

            // ── 3. CLEAN FULL-WIDTH SEARCH BAR + FILTER BUTTON ROW (REUSABLE COMPONENT) ──
            PKSearchFilterBar(
              controller: _searchController,
              focusNode: _searchFocusNode,
              hintText: 'Search subject or chapter...',
              searchIconColor: const Color(0xFF0877FF),
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
                          color: Color(0xFF0877FF),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Results for "$query"',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0877FF),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${filteredSubjects.length + filteredContinueItems.length})',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0B1F5B),
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

            // Empty state if nothing matches
            if (hasNoResults) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
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
                        color: Color(0xFF0877FF),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'No practice content found',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0B1F5B),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'We couldn\'t find any subjects or chapters matching "$query".',
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
                        backgroundColor: const Color(0xFF0877FF),
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
              ),
            ],

            if (!hasNoResults) ...[
              const SizedBox(height: 18),

              // ── 4. SECTION 1: SUBJECTS (2-COLUMN GRID) ──
              if (filteredSubjects.isNotEmpty) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.menu_book_rounded,
                          size: 19,
                          color: Color(0xFF0B1F5B),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Subjects',
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
                      onTap: () => setState(() {
                        _selectedFilterIndex = 0;
                        _searchController.clear();
                      }),
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

                // 2-Column Responsive Grid Layout
                LayoutBuilder(
                  builder: (context, constraints) {
                    final itemWidth = (constraints.maxWidth - 10) / 2;
                    return Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: filteredSubjects
                          .map((sub) => SizedBox(
                                width: itemWidth,
                                child: _buildSubjectGridCard(context, sub),
                              ))
                          .toList(),
                    );
                  },
                ),
                const SizedBox(height: 22),
              ],

              // ── 5. SECTION 2: CONTINUE PRACTICE ──
              if (filteredContinueItems.isNotEmpty) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.access_time_rounded,
                          size: 19,
                          color: Color(0xFF0B1F5B),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Continue Practice',
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
                      onTap: () {
                        final enc = Uri.encodeComponent('Mathematics');
                        context.push('/practice/topics/mathematics?title=$enc');
                      },
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
                ...filteredContinueItems.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _buildContinuePracticeCard(context, item),
                    )),
                const SizedBox(height: 14),
              ],

              // ── 6. SECTION 3: QUICK PRACTICE ──
              if (query.isEmpty) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.bolt_rounded,
                          size: 21,
                          color: Color(0xFF0877FF),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Quick Practice',
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
                      onTap: () {
                        final enc = Uri.encodeComponent('Quick Practice');
                        context.push('/practice/topics/quick_10?title=$enc');
                      },
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
                SizedBox(
                  height: 60,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _quickPracticeItems.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, idx) {
                      return _buildQuickPracticeCard(context, _quickPracticeItems[idx]);
                    },
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  // ==========================================
  // SUBJECT GRID CARD (2-COLUMN)
  // ==========================================
  Widget _buildSubjectGridCard(BuildContext context, _PracticeSubjectData item) {
    return GestureDetector(
      onTap: () {
        final enc = Uri.encodeComponent(item.title);
        context.push('/practice/topics/${item.id}?title=$enc');
      },
      child: Container(
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
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
            // Icon / Symbol Box
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: item.iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: item.symbol != null
                  ? Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: item.symbolBg ?? item.iconColor,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        item.symbol!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          height: 1,
                        ),
                      ),
                    )
                  : Icon(
                      item.icon,
                      size: 20,
                      color: item.iconColor,
                    ),
            ),
            const SizedBox(width: 8),

            // Title & Chapter count
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0B1F5B),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.chaptersCount,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),

            // Circular Arrow Button
            Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F2FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                size: 13,
                color: Color(0xFF0877FF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // CONTINUE PRACTICE CARD
  // ==========================================
  Widget _buildContinuePracticeCard(BuildContext context, _ContinuePracticeData item) {
    final progress = (item.completedQuestions / item.totalQuestions).clamp(0.0, 1.0);
    return GestureDetector(
      onTap: () {
        final enc = Uri.encodeComponent(item.title);
        context.push('/practice/topics/${item.subjectId}?title=$enc');
      },
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
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Left Icon Box
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: item.iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Icon(
                item.icon,
                size: 22,
                color: item.iconColor,
              ),
            ),
            const SizedBox(width: 12),

            // Middle Details with Progress Bar
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
                  Text(
                    item.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 4.5,
                            backgroundColor: const Color(0xFFE2ECF8),
                            valueColor: const AlwaysStoppedAnimation(Color(0xFF0877FF)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${item.completedQuestions}/${item.totalQuestions} questions',
                        style: const TextStyle(
                          fontSize: 10,
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

            // Right Continue Pill Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFDBEAFE)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Continue',
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
          ],
        ),
      ),
    );
  }

  // ==========================================
  // QUICK PRACTICE CARD (HORIZONTAL)
  // ==========================================
  Widget _buildQuickPracticeCard(BuildContext context, _QuickPracticeData item) {
    return GestureDetector(
      onTap: () {
        final enc = Uri.encodeComponent(item.title);
        context.push('/practice/topics/${item.id}?title=$enc');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: item.iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: Icon(
                item.icon,
                size: 20,
                color: item.iconColor,
              ),
            ),
            const SizedBox(width: 9),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.subtitle,
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
            Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F2FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                size: 11,
                color: Color(0xFF0877FF),
              ),
            ),
          ],
        ),
      ),
    );
  }

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
                  'Filter by Subject',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _subjectFilters.map((f) {
                    final isSel = _subjectFilters[_selectedFilterIndex] == f;
                    return ChoiceChip(
                      label: Text(f),
                      selected: isSel,
                      selectedColor: const Color(0xFF0877FF),
                      backgroundColor: const Color(0xFFF1F5FC),
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : const Color(0xFF0B1F5B),
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) {
                        setState(() => _selectedFilterIndex = _subjectFilters.indexOf(f));
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
