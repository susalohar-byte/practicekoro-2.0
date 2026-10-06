import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/repositories/practice_repository.dart';

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

class _PracticeScreenState extends ConsumerState<PracticeScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  String _selectedCategory = 'all';

  final List<Map<String, String>> _categories = const [
    {'id': 'all', 'label': 'সকল বিষয়'},
    {'id': 'history', 'label': 'ইতিহাস'},
    {'id': 'geography', 'label': 'ভূগোল'},
    {'id': 'science', 'label': 'বিজ্ঞান'},
    {'id': 'math', 'label': 'অঙ্ক'},
    {'id': 'reasoning', 'label': 'যৌক্তিকতা'},
    {'id': 'language', 'label': 'ভাষা'},
    {'id': 'computer', 'label': 'কম্পিউটার'},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final allSubjects = PracticeRepository.defaultSubjects;

    final filtered = allSubjects.where((s) {
      if (_selectedCategory != 'all' && s.category != _selectedCategory) {
        return false;
      }
      if (query.isNotEmpty) {
        final matchesBengali = s.nameBengali.toLowerCase().contains(query);
        final matchesEnglish = s.nameEnglish.toLowerCase().contains(query);
        return matchesBengali || matchesEnglish;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: PKBottomSpacing.edgeInsets(
            context,
            horizontal: 16,
            top: 12,
          ),
          children: [
            // 1. Top Bar
            _buildTopBar(),
            const SizedBox(height: 14),

            // 2. Search Input (if active)
            if (_isSearching) ...[
              _buildSearchInput(),
              const SizedBox(height: 14),
            ],

            // 3. Playful Nimo Mascot Waving Banner
            _buildNimoBanner(),
            const SizedBox(height: 16),

            // 4. Category Filter Chips
            _buildCategoryChips(),
            const SizedBox(height: 16),

            // 5. Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Row(
                    children: [
                      Text(
                        'বিষয়সমূহ',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.3,
                        ),
                      ),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '• Subject Practice',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${filtered.length} টি বিষয়',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF026BFC),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 6. Subjects List / Cards
            ...filtered.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildSubjectCard(item),
                )),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              const Text(
                'Practice',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                  ),
                  child: const Text(
                    'অধ্যায়ভিত্তিক',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFFB45309),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ),
        Row(
          children: [
            InkWell(
              onTap: () {
                setState(() {
                  _isSearching = !_isSearching;
                  if (!_isSearching) _searchController.clear();
                });
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
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  _isSearching ? Icons.close_rounded : Icons.search_rounded,
                  color: const Color(0xFF334155),
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => context.push('/notifications'),
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
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.notifications_none_rounded,
                  color: Color(0xFF334155),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSearchInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF026BFC).withValues(alpha: 0.3), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08026BFC),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (_) => setState(() {}),
        autofocus: true,
        style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: 'বিষয় বা অধ্যায় খুঁজুন (যেমন: ইতিহাস, অঙ্ক)...',
          hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF026BFC), size: 20),
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

  Widget _buildNimoBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFDBEAFE), Color(0xFFE0E7FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBFDBFE), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C026BFC),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Nimo Mascot Waving
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.8),
              shape: BoxShape.circle,
              boxShadow: const [
                BoxShadow(
                  color: Color(0x10000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/nimo_waving.png',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Center(
                  child: Text('🦁', style: TextStyle(fontSize: 36)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Motivational Text
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Practice & Master! ✨',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'বিষয়ভিত্তিক অনুশীলন করো ও প্রস্তুতিকে করো ১০০% মজবুত!',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF334155),
                    height: 1.3,
                  ),
                ),
                SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.bolt_rounded, size: 14, color: Color(0xFFD97706)),
                    SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        'পরীক্ষা-মুক্ত স্বাধীন প্র্যাকটিস',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF026BFC),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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

  Widget _buildCategoryChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: _categories.map((cat) {
          final isSelected = _selectedCategory == cat['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedCategory = cat['id']!;
                });
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF026BFC) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                    width: isSelected ? 1.5 : 1.0,
                  ),
                  boxShadow: [
                    if (isSelected)
                      BoxShadow(
                        color: const Color(0xFF026BFC).withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      )
                    else
                      const BoxShadow(
                        color: Color(0x04000000),
                        blurRadius: 4,
                        offset: Offset(0, 1),
                      ),
                  ],
                ),
                child: Text(
                  cat['label']!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSubjectCard(PracticeSubject item) {
    final progressVal = (item.accuracy / 100.0).clamp(0.0, 1.0);

    return InkWell(
      onTap: () => context.push('/practice/subject/${item.id}'),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Subject Icon or Symbol in Pastel Circle
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: item.bg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: item.symbol != null
                    ? Text(
                        item.symbol!,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: item.color,
                        ),
                      )
                    : Icon(
                        item.icon,
                        color: item.color,
                        size: 24,
                      ),
              ),
            ),
            const SizedBox(width: 14),
            // Subject Title & Meta
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.nameBengali,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.questionCount} Questions • ${item.nameEnglish}',
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
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progressVal,
                            minHeight: 5,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: AlwaysStoppedAnimation<Color>(item.color),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${item.accuracy}% Accuracy',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: item.color,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Icon(
                Icons.arrow_forward_ios_rounded,
                color: Color(0xFF64748B),
                size: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
