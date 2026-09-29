import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_tab.dart';
import '../../core/components/pk_topic_card.dart';
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

  final List<Map<String, dynamic>> _subjects = [
    {
      'id': 'math',
      'title': 'Mathematics',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFF2563EB),
      'symbol': '∑',
    },
    {
      'id': 'reasoning',
      'title': 'Reasoning & Mental Ability',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFFF43F5E),
      'symbol': '🎗',
    },
    {
      'id': 'gk',
      'title': 'General Knowledge',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFF10B981),
      'symbol': '🌐',
    },
    {
      'id': 'english',
      'title': 'English Language',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFF9333EA),
      'symbol': 'A',
    },
    {
      'id': 'bengali',
      'title': 'Bengali Language & Literature',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFFF59E0B),
      'symbol': 'অ',
    },
    {
      'id': 'computer',
      'title': 'Computer Awareness',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFF0EA5E9),
      'symbol': '💻',
    },
    {
      'id': 'current-affairs',
      'title': 'Current Affairs (National & WB)',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFFEC4899),
      'symbol': '📅',
    },
    {
      'id': 'environment',
      'title': 'Environmental Studies (EVS)',
      'questions': 'Topic-wise Practice',
      'color': const Color(0xFF14B8A6),
      'symbol': '🌱',
    },
  ];

  final List<Map<String, dynamic>> _topics = [
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

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Practice',
          style: AppTypography.headlineMedium(color: AppColors.navy),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
          children: [
            _buildPracticeHero(),
            const SizedBox(height: 16),
            // Quick Revision Cards Row: Mistakes Notebook + Bookmarks + Weak Topics
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _quickActionPill(
                    icon: Icons.cancel_outlined,
                    label: 'Mistakes Notebook',
                    badge: '$totalWrong Wrong',
                    color: AppColors.error,
                    bgColor: AppColors.errorLight,
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const SizedBox(width: 10),
                  _quickActionPill(
                    icon: Icons.bookmark_rounded,
                    label: 'Saved Bookmarks',
                    badge: '$bookmarksCount Saved',
                    color: AppColors.purple,
                    bgColor: AppColors.purpleLight,
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const SizedBox(width: 10),
                  _quickActionPill(
                    icon: Icons.trending_down_rounded,
                    label: 'Weak Topics (<70%)',
                    badge: 'Review',
                    color: AppColors.warning,
                    bgColor: AppColors.warningLight,
                    onTap: () => setState(() => _activeTab = 'topics'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            Text(
              _activeTab == 'subjects'
                  ? 'Build your fundamentals'
                  : _activeTab == 'topics'
                  ? 'Focus by topic'
                  : 'Learn from past papers',
              style: AppTypography.titleLarge(color: AppColors.navy),
            ),
            const SizedBox(height: 4),
            Text(
              _activeTab == 'subjects'
                  ? 'Choose a subject to start a focused session.'
                  : _activeTab == 'topics'
                  ? 'Pick a topic and practise at your pace.'
                  : 'Previous exam papers with solutions.',
              style: AppTypography.bodySmall(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 14),

            // Tab bar: Subjects / Topics / PYQ
            PKTab<String>(
              values: const ['subjects', 'topics', 'pyqs'],
              selectedValue: _activeTab,
              labelBuilder: (v) {
                switch (v) {
                  case 'subjects':
                    return 'Subjects';
                  case 'topics':
                    return 'Topic Tests';
                  case 'pyqs':
                    return 'Previous Year (PYQ)';
                  default:
                    return '';
                }
              },
              onSelected: (v) => setState(() => _activeTab = v),
            ),

            const SizedBox(height: 16),

            // Active Tab Content
            if (_activeTab == 'subjects') ...[
              const SizedBox(height: 14),
              _buildSubjectGrid(),
            ] else if (_activeTab == 'topics') ...[
              const SizedBox(height: 14),
              ..._topics.map((t) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: PKTopicCard(
                    title: t['title'] as String,
                    questionsCount: t['questions'] as String,
                    progress: t['progress'] as double,
                    onPractice: () =>
                        context.push('/practice/topics/${t['subject']}'),
                  ),
                );
              }),
            ] else ...[
              const SizedBox(height: 14),
              // PYQ Papers
              if (_pyqPapers.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(
                    child: Text(
                      'No previous year papers available yet.',
                      style: TextStyle(
                        color: AppColors.secondaryText,
                        fontSize: 13,
                      ),
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
    );
  }

  Widget _buildPracticeHero() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(24),
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
                    'MAKE EVERY SESSION COUNT',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.7,
                    ),
                  ),
                ),
                const SizedBox(height: 9),
                const Text(
                  'Learn. Practise. Improve.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Build confidence one question at a time.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.82),
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
            ),
            child: const Icon(
              Icons.menu_book_rounded,
              color: Color(0xFFD9E7FD),
              size: 27,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 520 ? 3 : 2;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _subjects.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 11,
            mainAxisSpacing: 11,
            childAspectRatio: 1.06,
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
                  border: Border.all(color: AppColors.borderSubtle),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.navy.withValues(alpha: 0.035),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppColors.veryLightBlue,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            subject['symbol'] as String,
                            style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              color: color,
                            ),
                          ),
                        ),
                        const Spacer(),
                        const Icon(
                          Icons.arrow_outward_rounded,
                          size: 17,
                          color: AppColors.textMuted,
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(
                      subject['title'] as String,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.titleSmall(color: AppColors.navy),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subject['questions'] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySmall(
                        color: AppColors.secondaryText,
                      ).copyWith(fontSize: 10.5),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _quickActionPill({
    required IconData icon,
    required String label,
    required String badge,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.rLg,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: AppRadius.rLg,
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: AppRadius.rSm,
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: AppTypography.titleSmall(
                    color: AppColors.navy,
                  ).copyWith(fontSize: 12),
                ),
                Text(
                  badge,
                  style: AppTypography.bodySmall(
                    color: color,
                  ).copyWith(fontWeight: FontWeight.bold, fontSize: 10.5),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
