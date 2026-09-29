import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_pill_tabs.dart';

class TopicScreen extends StatefulWidget {
  final String subjectId;

  const TopicScreen({super.key, required this.subjectId});

  @override
  State<TopicScreen> createState() => _TopicScreenState();
}

class _TopicScreenState extends State<TopicScreen> {
  int _selectedFilterIndex = 0;
  final List<String> _filters = ['All Topics', 'Weak', 'Attempted'];

  String get _subjectTitle {
    switch (widget.subjectId.toLowerCase()) {
      case 'math':
        return 'Mathematics';
      case 'reasoning':
        return 'Reasoning & Mental Ability';
      case 'gk':
        return 'General Knowledge';
      case 'english':
        return 'English Language';
      case 'bengali':
        return 'Bengali Language';
      case 'computer':
        return 'Computer Awareness';
      case 'current-affairs':
        return 'Current Affairs';
      case 'environment':
        return 'Environmental Studies';
      default:
        return widget.subjectId.replaceAll('-', ' ').toUpperCase();
    }
  }

  final List<Map<String, dynamic>> _topics = [
    {
      'title': 'Number System',
      'questions': 'Practice Set',
      'icon': Icons.pin_rounded,
      'color': AppColors.gold,
      'bgColor': AppColors.goldLight,
    },
    {
      'title': 'Simplification',
      'questions': 'Practice Set',
      'icon': Icons.calculate_outlined,
      'color': AppColors.purple,
      'bgColor': AppColors.purpleLight,
    },
    {
      'title': 'Percentage',
      'questions': 'Practice Set',
      'icon': Icons.percent_rounded,
      'color': AppColors.primary,
      'bgColor': AppColors.primaryLight,
    },
    {
      'title': 'Profit & Loss',
      'questions': 'Practice Set',
      'icon': Icons.sell_rounded,
      'color': AppColors.error,
      'bgColor': AppColors.errorLight,
    },
    {
      'title': 'Ratio & Proportion',
      'questions': 'Practice Set',
      'icon': Icons.pie_chart_rounded,
      'color': AppColors.orange,
      'bgColor': AppColors.orangeLight,
    },
    {
      'title': 'Average',
      'questions': 'Practice Set',
      'icon': Icons.bar_chart_rounded,
      'color': AppColors.cyan,
      'bgColor': AppColors.cyanLight,
    },
    {
      'title': 'Time & Work',
      'questions': 'Practice Set',
      'icon': Icons.hourglass_bottom_rounded,
      'color': AppColors.success,
      'bgColor': AppColors.successLight,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.calculate_rounded, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _subjectTitle,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.navy,
                  ),
                ),
                const Text(
                  'Chapter Practice',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text(
              'Change',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 12),

            // Filter Pills
            PKPillTabs(
              tabs: _filters,
              selectedIndex: _selectedFilterIndex,
              onTabSelected: (idx) => setState(() => _selectedFilterIndex = idx),
            ),

            const SizedBox(height: 12),

            // Topics List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                itemCount: _topics.length,
                itemBuilder: (context, index) {
                  final topic = _topics[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () {
                        context.push('/live-test/test-wbp-001');
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: topic['bgColor'] as Color,
                                borderRadius: BorderRadius.circular(10),
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
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.navy,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    topic['questions'] as String,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.textMuted,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
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
