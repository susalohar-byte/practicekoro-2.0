import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_tab.dart';
import '../../core/components/pk_subject_card.dart';
import '../../core/components/pk_topic_card.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';

class PracticeScreen extends StatefulWidget {
  final String initialTab;

  const PracticeScreen({super.key, this.initialTab = 'subjects'});

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  late String _activeTab;

  @override
  void initState() {
    super.initState();
    _activeTab = const {'subjects', 'topics', 'pyqs'}.contains(widget.initialTab)
        ? widget.initialTab
        : 'subjects';
  }

  final List<Map<String, dynamic>> _subjects = [
    {
      'id': 'math',
      'title': 'Mathematics',
      'questions': '1,240 Questions',
      'color': const Color(0xFF2563EB),
      'symbol': '∑',
    },
    {
      'id': 'reasoning',
      'title': 'Reasoning & Mental Ability',
      'questions': '960 Questions',
      'color': const Color(0xFFF43F5E),
      'symbol': '🎗',
    },
    {
      'id': 'gk',
      'title': 'General Knowledge',
      'questions': '1,520 Questions',
      'color': const Color(0xFF10B981),
      'symbol': '🌐',
    },
    {
      'id': 'english',
      'title': 'English Language',
      'questions': '1,010 Questions',
      'color': const Color(0xFF9333EA),
      'symbol': 'A',
    },
    {
      'id': 'bengali',
      'title': 'Bengali Language & Literature',
      'questions': '820 Questions',
      'color': const Color(0xFFF59E0B),
      'symbol': 'অ',
    },
    {
      'id': 'computer',
      'title': 'Computer Awareness',
      'questions': '640 Questions',
      'color': const Color(0xFF0EA5E9),
      'symbol': '💻',
    },
    {
      'id': 'current-affairs',
      'title': 'Current Affairs (National & WB)',
      'questions': '420 Questions',
      'color': const Color(0xFFEC4899),
      'symbol': '📅',
    },
    {
      'id': 'environment',
      'title': 'Environmental Studies (EVS)',
      'questions': '310 Questions',
      'color': const Color(0xFF14B8A6),
      'symbol': '🌱',
    },
  ];

  final List<Map<String, dynamic>> _topics = [
    {'title': 'Percentage & Profit-Loss', 'questions': '65 Questions', 'progress': 0.75, 'subject': 'math'},
    {'title': 'Time, Speed & Distance', 'questions': '48 Questions', 'progress': 0.50, 'subject': 'math'},
    {'title': 'Indian Constitution & Polity', 'questions': '110 Questions', 'progress': 0.85, 'subject': 'gk'},
    {'title': 'West Bengal Geography', 'questions': '90 Questions', 'progress': 0.60, 'subject': 'gk'},
    {'title': 'Blood Relations & Direction', 'questions': '52 Questions', 'progress': 0.40, 'subject': 'reasoning'},
    {'title': 'English Common Idioms & Phrases', 'questions': '80 Questions', 'progress': 0.65, 'subject': 'english'},
  ];

  final List<Map<String, dynamic>> _pyqPapers = [
    {
      'id': 'test-wbp-002',
      'title': 'WBP Constable PYQ 2024 (Prelims)',
      'subtitle': '85 Questions • 60 Mins • Solved',
      'year': '2024',
      'isPro': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Practice Hub',
          style: AppTypography.headlineMedium(color: AppColors.navy),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
          children: [
            // Quick Revision Cards Row: Mistakes Notebook + Bookmarks + Weak Topics
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _quickActionPill(
                    icon: Icons.cancel_outlined,
                    label: 'Mistakes Notebook',
                    badge: '36 Wrong',
                    color: AppColors.error,
                    bgColor: AppColors.errorLight,
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const SizedBox(width: 10),
                  _quickActionPill(
                    icon: Icons.bookmark_rounded,
                    label: 'Saved Bookmarks',
                    badge: '24 Saved',
                    color: AppColors.purple,
                    bgColor: AppColors.purpleLight,
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const SizedBox(width: 10),
                  _quickActionPill(
                    icon: Icons.trending_down_rounded,
                    label: 'Weak Topics (<70%)',
                    badge: '3 Areas',
                    color: AppColors.warning,
                    bgColor: AppColors.warningLight,
                    onTap: () => setState(() => _activeTab = 'topics'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

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
              ..._subjects.map((subj) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: PKSubjectCard(
                    title: subj['title'] as String,
                    questionsCount: subj['questions'] as String,
                    symbol: subj['symbol'] as String,
                    color: subj['color'] as Color,
                    onTap: () => context.push('/practice/topics/${subj['id']}'),
                  ),
                );
              }),
            ] else if (_activeTab == 'topics') ...[
              ..._topics.map((t) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: PKTopicCard(
                    title: t['title'] as String,
                    questionsCount: t['questions'] as String,
                    progress: t['progress'] as double,
                    onPractice: () => context.push('/practice/topics/${t['subject']}'),
                  ),
                );
              }),
            ] else ...[
              // PYQ Papers
              ..._pyqPapers.map((paper) {
                final isPro = paper['isPro'] as bool;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: PKCard(
                    padding: const EdgeInsets.all(14),
                    onTap: () {
                      final title = Uri.encodeComponent(paper['title'] as String);
                      context.push('/test-details/${paper['id']}?title=$title&isPro=$isPro');
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
                                      style: AppTypography.titleSmall(color: AppColors.navy),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isPro ? AppColors.warningLight : AppColors.veryLightBlue,
                                      borderRadius: AppRadius.rPill,
                                    ),
                                    child: Text(
                                      isPro ? 'Pro' : 'Free',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.bold,
                                        color: isPro ? AppColors.warning : AppColors.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                paper['subtitle'] as String,
                                style: AppTypography.bodySmall(color: AppColors.secondaryText),
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
              decoration: BoxDecoration(color: bgColor, borderRadius: AppRadius.rSm),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: AppTypography.titleSmall(color: AppColors.navy).copyWith(fontSize: 12),
                ),
                Text(
                  badge,
                  style: AppTypography.bodySmall(color: color).copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
