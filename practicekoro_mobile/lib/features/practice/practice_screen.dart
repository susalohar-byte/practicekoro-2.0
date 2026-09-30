import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/catalog_repository.dart';

class PracticeScreen extends ConsumerStatefulWidget {
  final String initialTab;

  const PracticeScreen({super.key, this.initialTab = 'subjects'});

  @override
  ConsumerState<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends ConsumerState<PracticeScreen> {
  late String _activeTab;
  List<Map<String, dynamic>> _pyqPapers = [];

  static const List<Map<String, dynamic>> _topicDrills = [
    {
      'id': 'indian_constitution',
      'title': 'Indian Constitution & Polity',
      'subject': 'General Knowledge',
      'questions': 50,
      'difficulty': 'Moderate',
      'color': Color(0xFF10B981),
    },
    {
      'id': 'wb_geography',
      'title': 'Geography of West Bengal & India',
      'subject': 'General Knowledge',
      'questions': 45,
      'difficulty': 'Easy',
      'color': Color(0xFF10B981),
    },
    {
      'id': 'ratio_proportion',
      'title': 'Ratio, Proportion & Partnership',
      'subject': 'Mathematics',
      'questions': 40,
      'difficulty': 'Moderate',
      'color': Color(0xFF3142D6),
    },
    {
      'id': 'percentage_profit',
      'title': 'Percentage, Profit & Loss',
      'subject': 'Mathematics',
      'questions': 45,
      'difficulty': 'Moderate',
      'color': Color(0xFF3142D6),
    },
    {
      'id': 'time_work',
      'title': 'Time & Work, Pipe & Cistern',
      'subject': 'Mathematics',
      'questions': 35,
      'difficulty': 'Hard',
      'color': Color(0xFF3142D6),
    },
    {
      'id': 'number_series',
      'title': 'Number & Alphabet Series',
      'subject': 'GI & Reasoning',
      'questions': 40,
      'difficulty': 'Easy',
      'color': Color(0xFFF59E0B),
    },
    {
      'id': 'coding_decoding',
      'title': 'Coding-Decoding & Analogy',
      'subject': 'GI & Reasoning',
      'questions': 40,
      'difficulty': 'Moderate',
      'color': Color(0xFFF59E0B),
    },
    {
      'id': 'english_grammar',
      'title': 'Prepositions, Tense & Voice Change',
      'subject': 'English',
      'questions': 50,
      'difficulty': 'Moderate',
      'color': Color(0xFF8B5CF6),
    },
  ];

  @override
  void initState() {
    super.initState();
    _activeTab =
        const {'subjects', 'topics', 'pyqs'}.contains(widget.initialTab)
        ? widget.initialTab
        : 'subjects';
    _loadPyqPapers();
  }

  Future<void> _loadPyqPapers() async {
    final repo = ref.read(catalogRepositoryProvider);
    final pyqs = await repo.getMockTests(testType: 'pyq');
    if (mounted) {
      setState(() {
        _pyqPapers = pyqs.map((p) {
          return {
            'id': p.id,
            'title': p.title,
            'subtitle':
                '${p.totalQuestions} Questions • ${p.durationMinutes} Mins',
            'year': '${p.year ?? "PYQ"}',
            'isPro': p.isPremium,
          };
        }).toList();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final attempts = LocalStorageService.getAttempts();
    final totalCorrect = attempts.fold<int>(0, (sum, a) => sum + a.correctCount);
    final totalWrong = attempts.fold<int>(0, (sum, a) => sum + a.wrongCount);
    final questionsPracticed = totalCorrect + totalWrong;
    final avgAccuracyPct = attempts.isEmpty
        ? 0
        : (attempts.fold<double>(0, (s, a) => s + a.accuracy) / attempts.length)
              .round();
    final bookmarksCount = LocalStorageService.getBookmarks().length;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── NATIVE MOBILE TOP HEADER ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Practice & PYQ Hub',
                        style: TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Subject drills, past papers & mistake revision',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.push('/mistakes'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 9,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFECDD3)),
                          ),
                          child: Text(
                            '$totalWrong Wrong',
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFE11D48),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () => context.push('/bookmarks'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 9,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFC7D2FE)),
                          ),
                          child: Text(
                            '$bookmarksCount Saved',
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF3142D6),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // ── SCROLLABLE NATIVE MOBILE BODY ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  // 1. Indigo-Violet Instant Drill Hero Card
                  _buildInstantDrillCard(
                    questionsPracticed: questionsPracticed,
                    avgAccuracyPct: avgAccuracyPct,
                  ),
                  const SizedBox(height: 20),

                  // 2. 2x2 Quick Practice Modes Bento (Strictly No Flashcards)
                  const Text(
                    'Practice Modes',
                    style: TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPracticeModesBento(
                    totalWrong: totalWrong,
                    bookmarksCount: bookmarksCount,
                  ),
                  const SizedBox(height: 22),

                  // 3. Segmented Pill Switcher (Subjects | Topics | PYQ Papers)
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        _buildTabPill('subjects', 'Subjects'),
                        _buildTabPill('topics', 'Topic Drills'),
                        _buildTabPill('pyqs', 'PYQ Papers'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 4. Active Tab Content
                  if (_activeTab == 'subjects') _buildSubjectsList(),
                  if (_activeTab == 'topics') _buildTopicsList(),
                  if (_activeTab == 'pyqs') _buildPyqsList(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstantDrillCard({
    required int questionsPracticed,
    required int avgAccuracyPct,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF3142D6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3142D6).withValues(alpha: 0.22),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '⚡ RAPID MCQ ENGINE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFFDE047),
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Text(
                '$questionsPracticed Solved • $avgAccuracyPct% Acc.',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFC7D2FE),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Daily 15-Minute Speed Drill',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Instant explanation after every question in Bengali & English.',
            style: TextStyle(
              fontSize: 12.5,
              color: Color(0xFFCBD5E1),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.push(
                    '/topic-practice/mixed_drill?title=Mixed%20Speed%20Drill',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF3142D6),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Icon(Icons.bolt_rounded, size: 18),
                  label: const Text(
                    'Start 15-Q Drill',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _activeTab = 'pyqs'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.28),
                    ),
                    backgroundColor: Colors.white.withValues(alpha: 0.08),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Icon(Icons.history_edu_rounded, size: 18),
                  label: const Text(
                    'Solve PYQ',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPracticeModesBento({
    required int totalWrong,
    required int bookmarksCount,
  }) {
    final modes = [
      {
        'title': 'Topic Drills',
        'subtitle': 'Chapter-wise MCQs',
        'badge': '50+ Topics',
        'icon': Icons.track_changes_rounded,
        'color': const Color(0xFF3142D6),
        'bg': const Color(0xFFEEF2FF),
        'onTap': () => setState(() => _activeTab = 'topics'),
      },
      {
        'title': 'PYQ Archive',
        'subtitle': 'Official past papers',
        'badge': '2018–2025',
        'icon': Icons.history_edu_rounded,
        'color': const Color(0xFF059669),
        'bg': const Color(0xFFECFDF5),
        'onTap': () => setState(() => _activeTab = 'pyqs'),
      },
      {
        'title': 'Mistake Notebook',
        'subtitle': 'Re-attempt wrong Qs',
        'badge': '$totalWrong Qs',
        'icon': Icons.auto_fix_high_rounded,
        'color': const Color(0xFFE11D48),
        'bg': const Color(0xFFFFF1F2),
        'onTap': () => context.push('/mistakes'),
      },
      {
        'title': 'Saved Bookmarks',
        'subtitle': 'Important exam Qs',
        'badge': '$bookmarksCount Saved',
        'icon': Icons.bookmark_rounded,
        'color': const Color(0xFFD97706),
        'bg': const Color(0xFFFFFBEB),
        'onTap': () => context.push('/bookmarks'),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: modes.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.38,
      ),
      itemBuilder: (context, idx) {
        final m = modes[idx];
        final color = m['color'] as Color;
        final bg = m['bg'] as Color;

        return InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: m['onTap'] as VoidCallback,
          child: Container(
            padding: const EdgeInsets.all(14),
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Icon(
                        m['icon'] as IconData,
                        size: 19,
                        color: color,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        m['badge'] as String,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  m['title'] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  m['subtitle'] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTabPill(String key, String label) {
    final isSelected = _activeTab == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF3142D6) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
              color: isSelected ? Colors.white : const Color(0xFF475569),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSubjectsList() {
    final defaultSubjects = [
      {
        'id': 'gk',
        'name': 'General Knowledge & Current Affairs',
        'topics': 'History, Polity, Geography, Science & Static GK',
        'count': '1,500+ MCQs',
        'icon': Icons.public_rounded,
        'color': const Color(0xFF10B981),
        'bg': const Color(0xFFECFDF5),
      },
      {
        'id': 'math',
        'name': 'Elementary Mathematics',
        'topics': 'Arithmetic, Ratio, Percentage, Profit-Loss & Mensuration',
        'count': '1,200+ MCQs',
        'icon': Icons.calculate_rounded,
        'color': const Color(0xFF3142D6),
        'bg': const Color(0xFFEEF2FF),
      },
      {
        'id': 'reasoning',
        'name': 'General Intelligence & Reasoning',
        'topics': 'Number Series, Coding-Decoding, Blood Relation & Puzzles',
        'count': '1,000+ MCQs',
        'icon': Icons.psychology_rounded,
        'color': const Color(0xFFF59E0B),
        'bg': const Color(0xFFFFFBEB),
      },
      {
        'id': 'english',
        'name': 'General English',
        'topics': 'Grammar, Vocabulary, Idioms, Voice & Narration',
        'count': '950+ MCQs',
        'icon': Icons.translate_rounded,
        'color': const Color(0xFF8B5CF6),
        'bg': const Color(0xFFF5F3FF),
      },
      {
        'id': 'bengali',
        'name': 'সাধারণ বাংলা (Bengali Grammar)',
        'topics': 'সন্ধি, সমাস, কারক, বাগধারা ও এক কথায় প্রকাশ',
        'count': '800+ MCQs',
        'icon': Icons.menu_book_rounded,
        'color': const Color(0xFFE11D48),
        'bg': const Color(0xFFFFF1F2),
      },
    ];

    return Column(
      children: defaultSubjects.map((s) {
        final color = s['color'] as Color;
        final bg = s['bg'] as Color;
        final name = s['name'] as String;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () {
              final enc = Uri.encodeComponent(name);
              context.push('/topic-practice/${s['id']}?title=$enc');
            },
            child: Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(s['icon'] as IconData, color: color, size: 23),
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
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: bg,
                                borderRadius: BorderRadius.circular(7),
                              ),
                              child: Text(
                                s['count'] as String,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: color,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          s['topics'] as String,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 15,
                    color: Color(0xFF94A3B8),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTopicsList() {
    return Column(
      children: _topicDrills.map((t) {
        final color = t['color'] as Color;
        final title = t['title'] as String;
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () {
              final enc = Uri.encodeComponent(title);
              context.push('/topic-practice/${t['id']}?title=$enc');
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 40,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(6),
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
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${t['subject']} • ${t['questions']} MCQs • ${t['difficulty']}',
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Drill',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF3142D6),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPyqsList() {
    final papers = _pyqPapers.isNotEmpty
        ? _pyqPapers
        : [
            {
              'id': 'wbp_pyq_2024',
              'title': 'WBP Constable Preliminary Official Paper',
              'subtitle': '100 Questions • 60 Mins',
              'year': '2024',
              'isPro': false,
            },
            {
              'id': 'wbpsc_clerk_pyq',
              'title': 'WBPSC Clerkship Part-I Official Paper',
              'subtitle': '100 Questions • 90 Mins',
              'year': '2024',
              'isPro': false,
            },
            {
              'id': 'tet_pyq_2023',
              'title': 'WB Primary TET Official Question Paper',
              'subtitle': '150 Questions • 150 Mins',
              'year': '2023',
              'isPro': false,
            },
          ];

    return Column(
      children: papers.map((p) {
        final title = p['title'] as String;
        final isPro = p['isPro'] as bool? ?? false;
        final enc = Uri.encodeComponent(title);
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () =>
                context.push('/test-details/${p['id']}?title=$enc&isPro=$isPro'),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Text(
                      (p['year'] as String).isNotEmpty
                          ? p['year'] as String
                          : 'PYQ',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFD97706),
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
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          p['subtitle'] as String,
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3142D6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Solve',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
