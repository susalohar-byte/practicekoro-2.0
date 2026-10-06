import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/exam_assets.dart';
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

class _TestSeriesDetailScreenState extends ConsumerState<TestSeriesDetailScreen> {
  TestSeriesModel? _series;
  List<MockTestModel> _tests = [];
  bool _isLoading = true;
  int _selectedTabIndex = 0; // 0: Tests, 1: About, 2: Subjects, 3: Syllabus

  final List<String> _tabs = ['Tests', 'About', 'Subjects', 'Syllabus'];

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

  String _getSeriesTitle() {
    if (_series != null && _series!.title.isNotEmpty) return _series!.title;
    final id = widget.seriesId.toLowerCase();
    if (id.contains('wbp')) return 'WBP Constable';
    if (id.contains('group-c')) return 'WBSSC Group C';
    if (id.contains('group-d')) return 'WBSSC Group D';
    if (id.contains('railway')) return 'Railway (NTPC)';
    if (id.contains('icds')) return 'ICDS';
    if (id.contains('food')) return 'Food SI';
    return 'WBP Constable';
  }

  @override
  Widget build(BuildContext context) {
    final title = _getSeriesTitle();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/test-series'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF0F172A), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Series link copied to clipboard!')),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF026BFC)))
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                // 1. Header Card (Emblem, Title, Badges, 3 Stats)
                _buildHeaderCard(title),
                const SizedBox(height: 16),

                // 2. Tabs: Tests | About | Subjects | Syllabus
                _buildTabsBar(),
                const SizedBox(height: 16),

                // Tab Content
                if (_selectedTabIndex == 0) ...[
                  // 3. Full Mock Tests Section
                  _buildFullMockTestsSection(title),
                  const SizedBox(height: 16),

                  // 4. Expandable Sub-sections (Subject Tests, Topic Tests, Official PYQs)
                  _buildAccordionTile(
                    icon: Icons.menu_book_rounded,
                    title: 'Subject Tests',
                    subtitle: '6 Subjects',
                    onTap: () => context.push('/practice'),
                  ),
                  const SizedBox(height: 10),
                  _buildAccordionTile(
                    icon: Icons.checklist_rounded,
                    title: 'Topic Tests',
                    subtitle: '48 Topics',
                    onTap: () => context.push('/practice'),
                  ),
                  const SizedBox(height: 10),
                  _buildAccordionTile(
                    icon: Icons.history_edu_rounded,
                    title: 'Official PYQs',
                    subtitle: '(2019 - 2024)',
                    onTap: () => context.push('/test-details/test-wbp-001?title=Official+PYQ+2023'),
                  ),
                ] else if (_selectedTabIndex == 1) ...[
                  _buildAboutSection(title),
                ] else if (_selectedTabIndex == 2) ...[
                  _buildSubjectsListSection(),
                ] else ...[
                  _buildSyllabusSection(title),
                ],

                const SizedBox(height: 32),
              ],
            ),
    );
  }

  // 1. Header Card (Screen 03)
  Widget _buildHeaderCard(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Large Shield / Emblem Container
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFDC2626).withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Builder(
              builder: (context) {
                final emblem = ExamAssets.getEmblemAsset(title);
                if (emblem != null) {
                  return Padding(
                    padding: const EdgeInsets.all(12),
                    child: Image.asset(
                      emblem,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const Center(
                        child: Icon(
                          Icons.shield_rounded,
                          color: Colors.white,
                          size: 42,
                        ),
                      ),
                    ),
                  );
                }
                return const Center(
                  child: Icon(
                    Icons.shield_rounded,
                    color: Colors.white,
                    size: 42,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          // Title
          Text(
            title,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Complete Test Series',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 12),
          // Badges: PRO & Most Popular
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.workspace_premium_rounded, size: 14, color: Color(0xFFB45309)),
                    SizedBox(width: 4),
                    Text(
                      'PRO',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEDE9FE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFDDD6FE)),
                ),
                child: const Text(
                  'Most Popular',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF6D28D9),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          // Stats Row: 12 Full Mocks | 48 Topic Tests | 15 Official PYQs
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildHeaderStat('12', 'Full Mocks'),
                Container(width: 1, height: 24, color: const Color(0xFFE2E8F0)),
                _buildHeaderStat('48', 'Topic Tests'),
                Container(width: 1, height: 24, color: const Color(0xFFE2E8F0)),
                _buildHeaderStat('15', 'Official PYQs'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  // 2. Tabs Bar (Tests, About, Subjects, Syllabus)
  Widget _buildTabsBar() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_tabs.length, (i) {
          final active = i == _selectedTabIndex;
          return InkWell(
            onTap: () => setState(() => _selectedTabIndex = i),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: active ? const Color(0xFF026BFC) : Colors.transparent,
                    width: 2.5,
                  ),
                ),
              ),
              child: Text(
                _tabs[i],
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: active ? const Color(0xFF026BFC) : const Color(0xFF64748B),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // 3. Full Mock Tests Section (Screen 03)
  Widget _buildFullMockTestsSection(String title) {
    final mockList = _tests.isNotEmpty
        ? _tests
            .map((t) => {
                  'id': t.id,
                  'title': t.title,
                  'sub':
                      '${t.totalQuestions} Qs • ${t.durationMinutes} Mins • ${t.totalMarks} Marks',
                  'isFree': !t.isPremium,
                })
            .toList()
        : [
            {
              'id': 'test-wbp-001',
              'title': 'Full Mock Test 01',
              'sub': '85 Qs • 60 Mins • 85 Marks',
              'isFree': true,
            },
      {
        'id': 'test-wbp-002',
        'title': 'Full Mock Test 02',
        'sub': '85 Qs • 60 Mins • 85 Marks',
        'isFree': false,
      },
      {
        'id': 'test-wbp-003',
        'title': 'Full Mock Test 03',
        'sub': '85 Qs • 60 Mins • 85 Marks',
        'isFree': false,
      },
      {
        'id': 'test-wbp-004',
        'title': 'Full Mock Test 04',
        'sub': '85 Qs • 60 Mins • 85 Marks',
        'isFree': false,
      },
      {
        'id': 'test-wbp-005',
        'title': 'Full Mock Test 05',
        'sub': '85 Qs • 60 Mins • 85 Marks',
        'isFree': false,
      },
      {
        'id': 'test-wbp-006',
        'title': 'Full Mock Test 06',
        'sub': '85 Qs • 60 Mins • 85 Marks',
        'isFree': false,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Full Mock Tests',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            Text(
              '${mockList.length} Tests',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...mockList.map((test) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildMockTestRow(test, title),
            )),
      ],
    );
  }

  Widget _buildMockTestRow(Map<String, dynamic> test, String seriesTitle) {
    final isFree = test['isFree'] as bool;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.article_outlined,
              color: Color(0xFF475569),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  test['title'] as String,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  test['sub'] as String,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          if (isFree)
            ElevatedButton(
              onPressed: () {
                context.push(
                  '/test-details/${test['id']}?title=${Uri.encodeComponent(test['title'] as String)}',
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                minimumSize: const Size(0, 32),
              ),
              child: const Text(
                'Start',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
            )
          else
            InkWell(
              onTap: () => context.push('/subscription'),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.workspace_premium_rounded, size: 13, color: Color(0xFFB45309)),
                    SizedBox(width: 3),
                    Text(
                      'PRO',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // 4. Accordion Section Tiles
  Widget _buildAccordionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: const Color(0xFF026BFC), size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  // About Tab
  Widget _buildAboutSection(String title) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About $title Test Series',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'This complete test series is strictly based on the latest West Bengal examination pattern. Contains full-length mock tests, subject-wise practice, and verified previous years questions with comprehensive bilingual solutions.',
            style: TextStyle(
              fontSize: 13,
              height: 1.5,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 16),
          _buildFeatureBullet('Real Exam Interface with strict timers'),
          _buildFeatureBullet('Negative Marking (0.25) simulation'),
          _buildFeatureBullet('Statewide Rank & District-wise performance benchmark'),
          _buildFeatureBullet('Concise Short Notes & high-yield revision points'),
        ],
      ),
    );
  }

  Widget _buildFeatureBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF334155)),
            ),
          ),
        ],
      ),
    );
  }

  // Subjects Tab
  Widget _buildSubjectsListSection() {
    final subjects = [
      {'name': 'General Knowledge', 'tests': '16 Tests', 'icon': Icons.public_rounded},
      {'name': 'General Science', 'tests': '12 Tests', 'icon': Icons.science_rounded},
      {'name': 'Mathematics', 'tests': '14 Tests', 'icon': Icons.calculate_rounded},
      {'name': 'Reasoning', 'tests': '10 Tests', 'icon': Icons.psychology_rounded},
      {'name': 'English', 'tests': '8 Tests', 'icon': Icons.translate_rounded},
    ];

    return Column(
      children: subjects.map((s) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Icon(s['icon'] as IconData, color: const Color(0xFF026BFC), size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  s['name'] as String,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                ),
              ),
              Text(
                s['tests'] as String,
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      )).toList(),
    );
  }

  // Syllabus Tab
  Widget _buildSyllabusSection(String title) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Official Syllabus Overview',
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),
          _buildSyllabusItem('General Awareness & GK', '25 Marks • Current Affairs, Indian History, Geography, Polity'),
          _buildSyllabusItem('Elementary Mathematics', '25 Marks • Arithmetic, Number System, Mensuration (10th Std)'),
          _buildSyllabusItem('Reasoning & Logical Analysis', '25 Marks • Coding-Decoding, Series, Syllogism, Blood Relations'),
          _buildSyllabusItem('English Language', '10 Marks • Vocabulary, Grammar, Idioms, Fill in the blanks'),
        ],
      ),
    );
  }

  Widget _buildSyllabusItem(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
          const SizedBox(height: 2),
          Text(desc, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        ],
      ),
    );
  }
}
