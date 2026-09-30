import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_topic_card.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/subject_model.dart';
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
  List<SubjectModel> _subjects = [];

  @override
  void initState() {
    super.initState();
    _activeTab =
        const {'subjects', 'topics', 'pyqs'}.contains(widget.initialTab)
        ? widget.initialTab
        : 'subjects';
    _loadPyqPapers();
    _loadSubjects();
  }

  Future<void> _loadSubjects() async {
    final examId = LocalStorageService.getTargetExam();
    final subjects = await ref
        .read(catalogRepositoryProvider)
        .getSubjects(examId: examId);
    if (mounted) setState(() => _subjects = subjects);
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
    final streakDays = attempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;
    final bookmarksCount = LocalStorageService.getBookmarks().length;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FF),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Sticky Header
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(
                              0xFF0158FC,
                            ).withValues(alpha: 0.18),
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.asset(
                            'assets/images/logo-circle.png',
                            width: 28,
                            height: 28,
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => const Icon(
                              Icons.menu_book_rounded,
                              size: 20,
                              color: Color(0xFF0158FC),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Practice',
                            style: TextStyle(
                              fontSize: 21,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(height: 1),
                          Text(
                            'Topic-wise questions, PYQs & smart revision.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
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
                          '$totalWrong Mistakes',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFE11D48),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Text(
                          '$bookmarksCount Saved',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0158FC),
                          ),
                        ),
                      ),
                    ],
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
                  // 1. Stitch Navy-to-Electric-Blue Hero Banner ("Practice Smarter" - Matches Website Practice.tsx)
                  _buildPracticeSmarterHero(),
                  const SizedBox(height: 22),

                  // 2. Choose What You Want to Practice (5 Mode Cards - Matches Website Practice.tsx)
                  const Text(
                    'Choose what you want to practice',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
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
                            fontWeight: FontWeight.w900,
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
                    _buildSubjectGrid()
                  else if (_activeTab == 'topics')
                    if (_subjects.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No subjects are available for your target exam yet.',
                          textAlign: TextAlign.center,
                        ),
                      )
                    else
                      ..._subjects.map(
                        (subject) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: PKTopicCard(
                            title: subject.name,
                            questionsCount: 'Browse available topics and tests',
                            progress: 0,
                            onPractice: () =>
                                context.push('/practice/topics/${subject.id}'),
                          ),
                        ),
                      )
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

                  const SizedBox(height: 24),
                  // 4. Your Practice Activity 2x2 Bento Card (Synced with Database/Attempts)
                  _buildPracticeActivityCard(
                    questionsPracticed: questionsPracticed,
                    accuracyPct: avgAccuracyPct,
                    subjectsCount: _subjects.length,
                    streakDays: streakDays,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // 1. PRACTICE SMARTER HERO BANNER (Matches Website Practice.tsx Stitch 2.0)
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
          colors: [Color(0xFF0B1F44), Color(0xFF0158FC), Color(0xFF0198FD)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0158FC).withValues(alpha: 0.22),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.24)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.auto_awesome_rounded,
                  size: 13,
                  color: Color(0xFFFCD34D),
                ),
                SizedBox(width: 5),
                Text(
                  'DAILY REVISION & TOPIC MASTERY',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 0.6,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Practice Smarter',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Strengthen your concepts with topic-wise questions, previous year papers, and smart revision tools.',
            style: TextStyle(
              fontSize: 12.5,
              color: Color(0xFFDBEAFE),
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
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.22),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      p['icon'] as IconData,
                      size: 13.5,
                      color: const Color(0xFFFCD34D),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      p['label'] as String,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
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
      height: 116,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: modes.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, idx) {
          final m = modes[idx];
          final isActive = m['active'] as bool;
          return InkWell(
            onTap: m['onTap'] as VoidCallback,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 162,
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isActive
                      ? const Color(0xFF0158FC)
                      : const Color(0xFFE2E8F0),
                  width: isActive ? 1.8 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isActive
                        ? const Color(0xFF0158FC).withValues(alpha: 0.12)
                        : const Color(0xFF0F172A).withValues(alpha: 0.025),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
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
                      borderRadius: BorderRadius.circular(12),
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
                          fontWeight: FontWeight.w600,
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
          gradient: isSelected
              ? const LinearGradient(
                  colors: [Color(0xFF0158FC), Color(0xFF0198FD)],
                )
              : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w800,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // 3. SUBJECT GRID (Matches Website Practice.tsx Subject Cards)
  // ===========================================================================
  Widget _buildSubjectGrid() {
    const colors = [
      Color(0xFF0158FC),
      Color(0xFFF43F5E),
      Color(0xFF10B981),
      Color(0xFF9333EA),
      Color(0xFFF59E0B),
      Color(0xFF0EA5E9),
    ];
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
        final color = colors[index % colors.length];
        return InkWell(
          onTap: () => context.push('/practice/topics/${subject.id}'),
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
                        subject.name.isEmpty
                            ? '?'
                            : subject.name.substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF64748B),
                      size: 18,
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  subject.name,
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

  // ===========================================================================
  // 4. YOUR PRACTICE ACTIVITY (Matches Website Practice.tsx Section 5)
  // ===========================================================================
  Widget _buildPracticeActivityCard({
    required int questionsPracticed,
    required int accuracyPct,
    required int subjectsCount,
    required int streakDays,
  }) {
    final stats = [
      {
        'value': '$questionsPracticed',
        'label': 'Questions Practiced',
        'icon': Icons.description_outlined,
        'bg': const Color(0xFFEFF6FF),
        'fg': const Color(0xFF0158FC),
      },
      {
        'value': '$accuracyPct%',
        'label': 'Accuracy',
        'icon': Icons.check_circle_outline_rounded,
        'bg': const Color(0xFFECFDF5),
        'fg': const Color(0xFF059669),
      },
      {
        'value': '$subjectsCount',
        'label': 'Subjects Active',
        'icon': Icons.layers_outlined,
        'bg': const Color(0xFFF5F3FF),
        'fg': const Color(0xFF7C3AED),
      },
      {
        'value': '$streakDays',
        'label': 'Day Streak',
        'icon': Icons.local_fire_department_rounded,
        'bg': const Color(0xFFFFFBEB),
        'fg': const Color(0xFFD97706),
      },
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F44).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.insights_rounded, size: 18, color: Color(0xFF0158FC)),
              SizedBox(width: 8),
              Text(
                'Your Practice Activity',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: stats.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              mainAxisExtent: 74,
            ),
            itemBuilder: (context, idx) {
              final s = stats[idx];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: s['bg'] as Color,
                        borderRadius: BorderRadius.circular(11),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        s['icon'] as IconData,
                        color: s['fg'] as Color,
                        size: 19,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s['value'] as String,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              height: 1.1,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            s['label'] as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
