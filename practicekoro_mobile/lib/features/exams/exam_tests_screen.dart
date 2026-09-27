import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_chip.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/mock_data.dart';

class ExamTestsScreen extends StatefulWidget {
  final String examId;

  const ExamTestsScreen({super.key, required this.examId});

  @override
  State<ExamTestsScreen> createState() => _ExamTestsScreenState();
}

class _ExamTestsScreenState extends State<ExamTestsScreen> {
  int _selectedFilterIndex = 0;
  final List<String> _filters = ['All Tests', 'Full Mock', 'Topic Test', 'PYQ'];

  String get _seriesTitle {
    try {
      final match = MockData.exams.firstWhere(
        (e) => e.id == widget.examId || e.slug == widget.examId,
      );
      return match.title;
    } catch (_) {
      switch (widget.examId) {
        case 'kp-si':
        case 'kp-police-si':
          return 'Kolkata Police SI';
        case 'ssc-gd':
          return 'SSC GD Constable';
        default:
          return 'WBP Constable';
      }
    }
  }

  final List<Map<String, dynamic>> _tests = [
    {
      'id': 'test-wbp-001',
      'title': 'Full Mock Test 01',
      'subtitle': '85 Questions • 60 Minutes',
      'category': 'Full Mock',
      'isLocked': false,
      'tag': 'Free',
      'iconColor': AppColors.primary,
      'iconBg': AppColors.veryLightBlue,
    },
    {
      'id': 'test-wbp-002',
      'title': 'Full Mock Test 02',
      'subtitle': '85 Questions • 60 Minutes',
      'category': 'Full Mock',
      'isLocked': true,
      'tag': 'Pro',
      'iconColor': AppColors.warning,
      'iconBg': AppColors.warningLight,
    },
    {
      'id': 'test-topic-gk-01',
      'title': 'General Knowledge - 01',
      'subtitle': '25 Questions • 20 Minutes',
      'category': 'Topic Test',
      'isLocked': false,
      'tag': 'Topic',
      'iconColor': AppColors.success,
      'iconBg': AppColors.successLight,
    },
    {
      'id': 'test-topic-gk-02',
      'title': 'General Knowledge - 02',
      'subtitle': '25 Questions • 20 Minutes',
      'category': 'Topic Test',
      'isLocked': true,
      'tag': 'Pro',
      'iconColor': AppColors.warning,
      'iconBg': AppColors.warningLight,
    },
    {
      'id': 'test-topic-reas-01',
      'title': 'Reasoning - 01',
      'subtitle': '25 Questions • 20 Minutes',
      'category': 'Topic Test',
      'isLocked': false,
      'tag': 'Topic',
      'iconColor': AppColors.purple,
      'iconBg': AppColors.purpleLight,
    },
    {
      'id': 'test-topic-reas-02',
      'title': 'Reasoning - 02',
      'subtitle': '25 Questions • 20 Minutes',
      'category': 'Topic Test',
      'isLocked': true,
      'tag': 'Pro',
      'iconColor': AppColors.warning,
      'iconBg': AppColors.warningLight,
    },
    {
      'id': 'pyq-wbp-2021',
      'title': 'Previous Year Paper 2021',
      'subtitle': '85 Questions • 60 Minutes',
      'category': 'PYQ',
      'isLocked': false,
      'tag': 'PYQ',
      'iconColor': AppColors.cyan,
      'iconBg': AppColors.cyanLight,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final activeFilter = _filters[_selectedFilterIndex];
    final filteredTests = _tests.where((t) {
      if (activeFilter == 'All Tests') return true;
      return t['category'] == activeFilter;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.navy),
          onPressed: () => context.pop(),
        ),
        title: Text(
          _seriesTitle,
          style: AppTypography.headlineMedium(color: AppColors.navy),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Series Summary Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.veryLightBlue,
                          borderRadius: AppRadius.rPill,
                        ),
                        child: Text(
                          '${_tests.length} Total Tests Available',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Filter Chips Row
                  SizedBox(
                    height: 36,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _filters.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final filter = _filters[index];
                        return PKChip(
                          label: filter,
                          isSelected: _selectedFilterIndex == index,
                          onTap: () => setState(() => _selectedFilterIndex = index),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: AppColors.borderSubtle),

            // Tests List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: filteredTests.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final t = filteredTests[index];
                  final isLocked = t['isLocked'] as bool;
                  final tag = t['tag'] as String?;

                  return PKCard(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    onTap: () {
                      final titleEncoded = Uri.encodeComponent(t['title'] as String);
                      context.push('/test-details/${t['id']}?title=$titleEncoded&isPro=$isLocked');
                    },
                    child: Row(
                      children: [
                        // Left Soft Icon
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: t['iconBg'] as Color,
                            borderRadius: AppRadius.rMd,
                          ),
                          child: Icon(
                            Icons.description_outlined,
                            color: t['iconColor'] as Color,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Title & Subtitle + Tag
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      t['title'] as String,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.titleSmall(color: AppColors.navy),
                                    ),
                                  ),
                                  if (tag != null) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isLocked ? AppColors.warningLight : AppColors.veryLightBlue,
                                        borderRadius: AppRadius.rPill,
                                      ),
                                      child: Text(
                                        tag,
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.bold,
                                          color: isLocked ? AppColors.warning : AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                t['subtitle'] as String,
                                style: AppTypography.bodySmall(color: AppColors.secondaryText),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Action: Blue "Start" button or Lock icon
                        if (isLocked)
                          IconButton(
                            onPressed: () => context.push('/subscription'),
                            icon: const Icon(
                              Icons.lock_outline_rounded,
                              size: 20,
                              color: AppColors.warning,
                            ),
                          )
                        else
                          ElevatedButton(
                            onPressed: () {
                              final titleEncoded = Uri.encodeComponent(t['title'] as String);
                              context.push('/test-details/${t['id']}?title=$titleEncoded&isPro=false');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              shape: RoundedRectangleBorder(
                                borderRadius: AppRadius.rMd,
                              ),
                            ),
                            child: const Text(
                              'Start',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
