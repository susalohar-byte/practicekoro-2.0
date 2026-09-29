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
  late final List<Map<String, dynamic>> _tests;

  @override
  void initState() {
    super.initState();
    final exam = MockData.exams.firstWhere(
      (item) => item.id == widget.examId || item.slug == widget.examId,
      orElse: () => MockData.exams.first,
    );
    _tests = MockData.mockTests.where((test) => test.examId == exam.id).map((test) {
      final category = switch (test.testType) {
        'full_mock' => 'Full Mock',
        'pyq' => 'PYQ',
        _ => 'Topic Test',
      };
      final isLocked = test.isPremium;
      return {
        'id': test.id,
        'title': test.title,
        'subtitle': '${test.totalQuestions} Questions • ${test.durationMinutes} Minutes',
        'category': category,
        'isLocked': isLocked,
        'tag': category == 'PYQ' ? 'PYQ' : (isLocked ? 'Pro' : 'Free'),
        'iconColor': category == 'PYQ' ? AppColors.cyan : (isLocked ? AppColors.warning : AppColors.primary),
        'iconBg': category == 'PYQ' ? AppColors.cyanLight : (isLocked ? AppColors.warningLight : AppColors.veryLightBlue),
      };
    }).toList();
  }

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
              child: filteredTests.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No tests are available in this category yet.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                        ),
                      ),
                    )
                  : ListView.separated(
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
