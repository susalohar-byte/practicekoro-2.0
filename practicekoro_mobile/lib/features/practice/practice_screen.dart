import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_topic_card.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
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
            'year': '${p.year ?? ""}',
            'isPro': p.isPremium,
          };
        }).toList();
      });
    }
  }

  static const List<Map<String, dynamic>> _subjects = [
    {
      'id': 'math',
      'title': 'Mathematics',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFF2563EB),
      'symbol': '∑',
    },
    {
      'id': 'reasoning',
      'title': 'Reasoning & Mental Ability',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFFF43F5E),
      'symbol': '🎗',
    },
    {
      'id': 'gk',
      'title': 'General Knowledge',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFF10B981),
      'symbol': '🌐',
    },
    {
      'id': 'english',
      'title': 'English Language',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFF9333EA),
      'symbol': 'A',
    },
    {
      'id': 'bengali',
      'title': 'Bengali Language & Literature',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFFF59E0B),
      'symbol': 'অ',
    },
    {
      'id': 'computer',
      'title': 'Computer Awareness',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFF0EA5E9),
      'symbol': '💻',
    },
    {
      'id': 'current-affairs',
      'title': 'Current Affairs (National & WB)',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFFEC4899),
      'symbol': '📅',
    },
    {
      'id': 'environment',
      'title': 'Environmental Studies (EVS)',
      'questions': 'Topic-wise Practice',
      'color': Color(0xFF14B8A6),
      'symbol': '🌱',
    },
  ];

  static const List<Map<String, dynamic>> _topics = [
    {
      'title': 'Percentage & Profit-Loss',
      'questions': 'Practice Set',
      'progress': 0.0,
      'subject': 'math',
    },
    {
      'title': 'Time, Speed & Distance',
      'questions': 'Practice Set',
      'progress': 0.0,
      'subject': 'math',
    },
    {
      'title': 'Indian Constitution & Polity',
      'questions': 'Practice Set',
      'progress': 0.0,
      'subject': 'gk',
    },
    {
      'title': 'West Bengal Geography',
      'questions': 'Practice Set',
      'progress': 0.0,
      'subject': 'gk',
    },
    {
      'title': 'Blood Relations & Direction',
      'questions': 'Practice Set',
      'progress': 0.0,
      'subject': 'reasoning',
    },
    {
      'title': 'English Common Idioms & Phrases',
      'questions': 'Practice Set',
      'progress': 0.0,
      'subject': 'english',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final attempts = LocalStorageService.getAttempts();
    final totalWrong = attempts.fold<int>(0, (sum, a) => sum + a.wrongCount);
    final bookmarksCount = LocalStorageService.getBookmarks().length;
    final avgAccuracy = attempts.isEmpty
        ? 0
        : (attempts.fold<double>(0, (s, a) => s + a.accuracy) / attempts.length)
              .round();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Sticky Header
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Practice',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.5,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Strengthen your concepts with topic-wise questions & PYQs.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Scrollable Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  // 1. Light Blue Hero Banner ("Practice Smarter" - Matches Website Practice.tsx)
                  _buildPracticeSmarterHero(),
                  const SizedBox(height: 22),

                  // 2. Choose What You Want to Practice (5 Mode Cards - Matches Website Practice.tsx)
                  const Text(
                    'Choose what you want to practice',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPracticeModesSection(
                    bookmarksCount: bookmarksCount,
                    totalWrong: totalWrong,
                  ),
                  const SizedBox(height: 24),

                  // 3. Select Exam & Subject Header + Segmented Tabs (Matches Website Practice.tsx)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Select Exam & Subject',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.3,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildSegmentedTab('subjects', 'Subjects'),
                            _buildSegmentedTab('topics', 'Topics'),
                            _buildSegmentedTab('pyqs', 'PYQ'),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Active Tab Content
                  if (_activeTab == 'subjects')
                    _buildSubjectGrid(avgAccuracy)
                  else if (_activeTab == 'topics')
                    ..._topics.map((t) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: PKTopicCard(
                          title: t['title'] as String,
                          questionsCount: t['questions'] as String,
                          progress: t['progress'] as double,
                          onPractice: () => context.push(
                            '/practice/topics/${t['subject']}',
                          ),
                        ),
                      );
                    })
                  else ...[
                    if (_pyqPapers.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'No previous year papers available yet.',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ..._pyqPapers.map((paper) {
                      final isPro = paper['isPro'] as bool;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: PKCard(
                          padding: const EdgeInsets.all(14),
                          onTap: () {
                            final title = Uri.encodeComponent(
                              paper['title'] as String,
                            );
                            context.push(
                              '/test-details/${paper['id']}?title=$title&isPro=$isPro',
                            );
                          },
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.veryLightBlue,
                                  borderRadius: AppRadius.rMd,
                                ),
                                child: const Icon(
                                  Icons.history_edu_rounded,
                                  color: AppColors.primary,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            paper['title'] as String,
                                            style: AppTypography.titleSmall(
                                              color: AppColors.navy,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isPro
                                                ? AppColors.warningLight
                                                : AppColors.veryLightBlue,
                                            borderRadius: AppRadius.rPill,
                                          ),
                                          child: Text(
                                            isPro ? 'Pro' : 'Free',
                                            style: TextStyle(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.bold,
                                              color: isPro
                                                  ? AppColors.warning
                                                  : AppColors.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      paper['subtitle'] as String,
                                      style: AppTypography.bodySmall(
                                        color: AppColors.secondaryText,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right_rounded,
                                color: AppColors.secondaryText,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // 1. PRACTICE SMARTER HERO BANNER (Matches Website Practice.tsx)
  // ===========================================================================
  Widget _buildPracticeSmarterHero() {
    const pills = [
      {'icon': Icons.menu_book_rounded, 'label': 'Chapter-wise Practice'},
      {'icon': Icons.track_changes_rounded, 'label': 'Topic-wise Practice'},
      {'icon': Icons.description_outlined, 'label': 'Previous Year Questions'},
      {'icon': Icons.bookmark_border_rounded, 'label': 'Saved Questions'},
      {'icon': Icons.auto_awesome_rounded, 'label': 'Detailed Solutions'},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8F4FF), Color(0xFFEEF7FF), Color(0xFFDFF0FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFCCE4FB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Practice Smarter',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Strengthen your concepts with topic-wise questions, previous year papers, and smart revision tools.',
            style: TextStyle(
              fontSize: 12.5,
              color: Color(0xFF475569),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: pills.map((p) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFDBEAFE)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      p['icon'] as IconData,
                      size: 13.5,
                      color: const Color(0xFF0158FC),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      p['label'] as String,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 2. FIVE PRACTICE MODE CARDS (Matches Website Practice.tsx)
  // ===========================================================================
  Widget _buildPracticeModesSection({
    required int bookmarksCount,
    required int totalWrong,
  }) {
    final modes = [
      {
        'title': 'Subject Practice',
        'sub': 'Practice questions by subject',
        'icon': Icons.menu_book_rounded,
        'bg': const Color(0xFFEFF6FF),
        'fg': const Color(0xFF0158FC),
        'active': _activeTab == 'subjects',
        'onTap': () => setState(() => _activeTab = 'subjects'),
      },
      {
        'title': 'Topic Practice',
        'sub': 'Focus on specific chapters',
        'icon': Icons.track_changes_rounded,
        'bg': const Color(0xFFECFDF5),
        'fg': const Color(0xFF059669),
        'active': _activeTab == 'topics',
        'onTap': () => setState(() => _activeTab = 'topics'),
      },
      {
        'title': 'Previous Year Questions',
        'sub': 'Solve real exam papers',
        'icon': Icons.description_outlined,
        'bg': const Color(0xFFFFFBEB),
        'fg': const Color(0xFFD97706),
        'active': _activeTab == 'pyqs',
        'onTap': () => setState(() => _activeTab = 'pyqs'),
      },
      {
        'title': 'Saved Questions',
        'sub': '$bookmarksCount Bookmarked Qs',
        'icon': Icons.bookmark_rounded,
        'bg': const Color(0xFFF5F3FF),
        'fg': const Color(0xFF7C3AED),
        'active': false,
        'onTap': () => context.push('/saved-questions'),
      },
      {
        'title': 'Incorrect Questions',
        'sub': '$totalWrong Mistakes to review',
        'icon': Icons.cancel_outlined,
        'bg': const Color(0xFFFFF1F2),
        'fg': const Color(0xFFE11D48),
        'active': false,
        'onTap': () => context.push('/saved-questions'),
      },
    ];

    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: modes.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, idx) {
          final m = modes[idx];
          final isActive = m['active'] as bool;
          return InkWell(
            onTap: m['onTap'] as VoidCallback,
            borderRadius: BorderRadius.circular(18),
            child: Container(
              width: 158,
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isActive
                      ? const Color(0xFF0158FC)
                      : const Color(0xFFE2E8F0),
                  width: isActive ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.025),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: m['bg'] as Color,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      m['icon'] as IconData,
                      color: m['fg'] as Color,
                      size: 20,
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        m['title'] as String,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        m['sub'] as String,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSegmentedTab(String key, String label) {
    final isSelected = _activeTab == key;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0158FC) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // 3. SUBJECT GRID (Matches Website Practice.tsx Subject Cards)
  // ===========================================================================
  Widget _buildSubjectGrid(int avgAccuracy) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _subjects.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        mainAxisExtent: 158,
      ),
      itemBuilder: (context, index) {
        final subject = _subjects[index];
        final color = subject['color'] as Color;
        return InkWell(
          onTap: () => context.push('/practice/topics/${subject['id']}'),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.025),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
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
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        subject['symbol'] as String,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    Text(
                      '$avgAccuracy%',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  subject['title'] as String,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    height: 1.2,
                  ),
                ),
                const Spacer(),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: avgAccuracy / 100.0,
                    minHeight: 5,
                    backgroundColor: const Color(0xFFF1F5F9),
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
                const SizedBox(height: 8),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Practice Now',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 14,
                      color: Color(0xFF0158FC),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
