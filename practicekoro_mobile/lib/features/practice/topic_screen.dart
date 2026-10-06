import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/catalog_repository.dart';

class TopicScreen extends ConsumerStatefulWidget {
  final String subjectId;

  const TopicScreen({super.key, required this.subjectId});

  @override
  ConsumerState<TopicScreen> createState() => _TopicScreenState();
}

class _TopicScreenState extends ConsumerState<TopicScreen> {
  int _selectedFilterIndex = 0; // 0: All, 1: Not Started, 2: In Progress, 3: Completed
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  static const List<String> _filters = ['All', 'Not Started', 'In Progress', 'Completed'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _getSubjectName() {
    final s = widget.subjectId.toLowerCase();
    if (s.contains('science')) return 'General Science';
    if (s.contains('history')) return 'History';
    if (s.contains('geography')) return 'Geography';
    if (s.contains('polity')) return 'Indian Polity';
    if (s.contains('economics')) return 'Economics';
    if (s.contains('math')) return 'Mathematics';
    if (s.contains('reasoning')) return 'Reasoning';
    if (s.contains('bengali')) return 'Bengali';
    if (s.contains('english')) return 'English';
    return 'General Science';
  }

  // Pre-configured topic dataset matching Screen 05 in design mockup
  static const List<Map<String, dynamic>> _topicsList = [
    {
      'id': 'heat-temperature',
      'title': 'Heat & Temperature',
      'questions': 120,
      'attempted': 78,
      'progress': 0.65,
      'status': 'in_progress',
      'icon': Icons.thermostat_rounded,
      'color': Color(0xFF8B5CF6),
      'bg': Color(0xFFEDE9FE),
    },
    {
      'id': 'light',
      'title': 'Light',
      'questions': 98,
      'attempted': 32,
      'progress': 0.33,
      'status': 'in_progress',
      'icon': Icons.lightbulb_outline_rounded,
      'color': Color(0xFFEF4444),
      'bg': Color(0xFFFEE2E2),
    },
    {
      'id': 'sound',
      'title': 'Sound',
      'questions': 85,
      'attempted': 36,
      'progress': 0.42,
      'status': 'in_progress',
      'icon': Icons.volume_up_rounded,
      'color': Color(0xFF026BFC),
      'bg': Color(0xFFDBEAFE),
    },
    {
      'id': 'electricity',
      'title': 'Electricity',
      'questions': 110,
      'attempted': 64,
      'progress': 0.58,
      'status': 'in_progress',
      'icon': Icons.bolt_rounded,
      'color': Color(0xFFF59E0B),
      'bg': Color(0xFFFEF3C7),
    },
    {
      'id': 'magnetism',
      'title': 'Magnetism',
      'questions': 90,
      'attempted': 42,
      'progress': 0.46,
      'status': 'in_progress',
      'icon': Icons.all_inclusive_rounded,
      'color': Color(0xFF8B5CF6),
      'bg': Color(0xFFEDE9FE),
    },
    {
      'id': 'atomic-structure',
      'title': 'Atomic Structure',
      'questions': 80,
      'attempted': 0,
      'progress': 0.0,
      'status': 'not_started',
      'icon': Icons.bubble_chart_rounded,
      'color': Color(0xFF06B6D4),
      'bg': Color(0xFFCFFAFE),
    },
  ];

  @override
  Widget build(BuildContext context) {
    final subjectTitle = _getSubjectName();
    final query = _searchController.text.trim().toLowerCase();
    final chaptersAsync = ref.watch(subjectChaptersProvider(widget.subjectId));

    final List<Map<String, dynamic>> sourceList;
    if (chaptersAsync.value != null && chaptersAsync.value!.isNotEmpty) {
      sourceList = chaptersAsync.value!.map((c) => {
        'id': c.slug.isNotEmpty ? c.slug : c.id,
        'title': c.name,
        'questions': 50,
        'attempted': 0,
        'progress': 0.0,
        'status': 'not_started',
        'icon': Icons.menu_book_rounded,
        'color': const Color(0xFF026BFC),
        'bg': const Color(0xFFDBEAFE),
      }).toList();
    } else {
      sourceList = _topicsList;
    }

    final filtered = sourceList.where((t) {
      final title = (t['title'] as String).toLowerCase();
      final status = t['status'] as String;

      if (_selectedFilterIndex == 1 && status != 'not_started') return false;
      if (_selectedFilterIndex == 2 && status != 'in_progress') return false;
      if (_selectedFilterIndex == 3 && status != 'completed') return false;

      if (query.isNotEmpty) {
        return title.contains(query);
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/practice'),
        ),
        title: Text(
          subjectTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isSearching ? Icons.close_rounded : Icons.search_rounded,
              color: const Color(0xFF334155),
              size: 20,
            ),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) _searchController.clear();
              });
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFF026BFC),
        onRefresh: () async {
          ref.invalidate(subjectChaptersProvider(widget.subjectId));
          await ref.read(subjectChaptersProvider(widget.subjectId).future);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. Search Bar (if opened)
            if (_isSearching) ...[
              _buildSearchInput(),
              const SizedBox(height: 12),
            ],

            // 2. Subject Hero Summary Card (Screen 05)
            _buildHeroSummaryCard(subjectTitle),
            const SizedBox(height: 16),

            // 3. Filter Pills
            _buildFilterPills(),
            const SizedBox(height: 16),

            // 4. Topic Cards List
            ...filtered.map((topic) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildTopicCard(topic, subjectTitle),
                )),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (_) => setState(() {}),
        autofocus: true,
        style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
        decoration: InputDecoration(
          hintText: 'Search chapters or topics...',
          hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () => setState(() => _searchController.clear()),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }

  // Hero Summary Card (Screen 05)
  Widget _buildHeroSummaryCard(String title) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFCCFBF1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.science_rounded,
              color: Color(0xFF0D9488),
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  '1,250 Questions',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.all(Radius.circular(3)),
                        child: LinearProgressIndicator(
                          value: 0.65,
                          minHeight: 5,
                          backgroundColor: Color(0xFFE2E8F0),
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF026BFC)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '65%',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Filter Pills (All, Not Started, In Progress, Completed)
  Widget _buildFilterPills() {
    return SizedBox(
      height: 32,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _filters.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final active = i == _selectedFilterIndex;
          return InkWell(
            onTap: () => setState(() => _selectedFilterIndex = i),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: active ? const Color(0xFF026BFC) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: active ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Center(
                child: Text(
                  _filters[i],
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                    color: active ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Topic Card (Screen 05)
  Widget _buildTopicCard(Map<String, dynamic> topic, String subjectTitle) {
    final progress = topic['progress'] as double;
    final pct = (progress * 100).toInt();

    return InkWell(
      onTap: () {
        context.push(
          '/test-details/topic-${topic['id']}?title=${Uri.encodeComponent('$subjectTitle: ${topic['title']}')}',
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: topic['bg'] as Color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                topic['icon'] as IconData,
                color: topic['color'] as Color,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    topic['title'] as String,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${topic['questions']} Questions • ${topic['attempted']} Attempted',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
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
                            backgroundColor: const Color(0xFFE2E8F0),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              progress > 0 ? (topic['color'] as Color) : Colors.transparent,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$pct%',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: topic['color'] as Color,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
