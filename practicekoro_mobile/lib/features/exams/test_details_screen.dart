import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

/// Screen 4: Test Instructions
/// Faithful reproduction of the PracticeKoro Test Instructions UI.
class TestDetailsScreen extends StatefulWidget {
  final String testId;
  final String testTitle;
  final int totalQuestions;
  final int durationMinutes;
  final double totalMarks;
  final double negativeMarks;
  final bool isPremium;

  const TestDetailsScreen({
    super.key,
    required this.testId,
    this.testTitle = 'Mock Test',
    this.totalQuestions = 100,
    this.durationMinutes = 60,
    this.totalMarks = 100.0,
    this.negativeMarks = 0.25,
    this.isPremium = false,
  });

  @override
  State<TestDetailsScreen> createState() => _TestDetailsScreenState();
}

class _TestDetailsScreenState extends State<TestDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final marksPerQuestion = (widget.totalMarks / (widget.totalQuestions > 0 ? widget.totalQuestions : 1)).toStringAsFixed(0);

    final instructions = [
      'This test contains ${widget.totalQuestions} multiple choice questions (MCQs).',
      'The total time duration is ${widget.durationMinutes} minutes.',
      'Each question carries $marksPerQuestion mark.',
      widget.negativeMarks > 0
          ? '${widget.negativeMarks} negative marks for each wrong answer.'
          : 'There is no negative marking.',
      'You can mark questions for review and come back later.',
      'The timer will not stop once the test starts.',
      'Make sure you have a stable internet connection.',
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.navy),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Test Instructions',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 8),

                  // Center Clipboard Illustration
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFDBEAFE), width: 1.5),
                    ),
                    child: Center(
                      child: Container(
                        width: 48,
                        height: 58,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primary, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 22,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.vertical(bottom: Radius.circular(4)),
                              ),
                            ),
                            const SizedBox(height: 8),
                            _buildClipboardLine(26),
                            const SizedBox(height: 4),
                            _buildClipboardLine(22),
                            const SizedBox(height: 4),
                            _buildClipboardLine(18),
                            const Spacer(),
                            Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Icon(Icons.check_rounded, size: 12, color: Color(0xFF16A34A)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Heading
                  const Text(
                    'Read the instructions carefully',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 3 Spec Pills (Purple, Blue, Amber)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildSpecPill(
                        icon: Icons.description_outlined,
                        label: '${widget.totalQuestions} Questions',
                        color: const Color(0xFF6D28D9),
                        bgColor: const Color(0xFFF5F3FF),
                        borderColor: const Color(0xFFDDD6FE),
                      ),
                      const SizedBox(width: 8),
                      _buildSpecPill(
                        icon: Icons.access_time_rounded,
                        label: '${widget.durationMinutes} Minutes',
                        color: const Color(0xFF1D4ED8),
                        bgColor: const Color(0xFFEFF6FF),
                        borderColor: const Color(0xFFDBEAFE),
                      ),
                      const SizedBox(width: 8),
                      _buildSpecPill(
                        icon: Icons.military_tech_outlined,
                        label: '${widget.totalMarks.toInt()} Marks',
                        color: const Color(0xFFB45309),
                        bgColor: const Color(0xFFFFFBEB),
                        borderColor: const Color(0xFFFDE68A),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Instructions List
                  ...List.generate(instructions.length, (index) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFDBEAFE)),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 3),
                              child: Text(
                                instructions[index],
                                style: const TextStyle(
                                  fontSize: 13,
                                  height: 1.45,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF334155),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),

          // Sticky Bottom CTA Button
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push('/live-test/${widget.testId}');
                },
                icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 22),
                label: const Text(
                  'I Understand, Start Test',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClipboardLine(double width) {
    return Container(
      width: width,
      height: 2.5,
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildSpecPill({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required Color borderColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
