import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_button.dart';
import '../../core/components/pk_card.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/local_storage.dart';

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
    this.totalQuestions = 85,
    this.durationMinutes = 60,
    this.totalMarks = 85.0,
    this.negativeMarks = 0.25,
    this.isPremium = false,
  });

  @override
  State<TestDetailsScreen> createState() => _TestDetailsScreenState();
}

class _TestDetailsScreenState extends State<TestDetailsScreen> {
  bool _agreedToInstructions = true;
  bool _isPro = false;

  @override
  void initState() {
    super.initState();
    _loadUserStatus();
  }

  void _loadUserStatus() {
    final pro = LocalStorageService.isProUser();
    if (mounted) {
      setState(() => _isPro = pro);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool canAttempt = !widget.isPremium || _isPro;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.navy),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Test Instructions',
          style: AppTypography.titleLarge(color: AppColors.navy),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            PKCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: widget.isPremium
                              ? AppColors.warningLight
                              : AppColors.successLight,
                          borderRadius: AppRadius.rPill,
                        ),
                        child: Text(
                          widget.isPremium ? '👑 PRO PASS' : '✓ FREE TEST',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.bold,
                            color: widget.isPremium
                                ? const Color(0xFFB45309)
                                : const Color(0xFF047857),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.veryLightBlue,
                          borderRadius: AppRadius.rPill,
                        ),
                        child: Text(
                          LocalStorageService.isBilingualEnabled() ? 'BILINGUAL (EN/BN)' : 'বাংলা মাধ্যম',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.testTitle,
                    style: AppTypography.headlineMedium(color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Full simulation of latest West Bengal Police Recruitment Board examination pattern with real-time analytics.',
                    style: AppTypography.bodySmall(color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  const SizedBox(height: 16),
                  // 4 Spec counters
                  Row(
                    children: [
                      _specItem('Questions', '${widget.totalQuestions}'),
                      _specItem('Duration', '${widget.durationMinutes}m'),
                      _specItem('Total Marks', '${widget.totalMarks.toInt()}'),
                      _specItem('Negative', '-${widget.negativeMarks}'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Examination Guidelines
            PKCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Important Exam Guidelines',
                    style: AppTypography.titleMedium(color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 12),
                  _ruleRow(
                    Icons.timer_outlined,
                    'Server Clock Sync',
                    'The countdown timer starts immediately once you click Start Test. The test automatically submits when time expires.',
                  ),
                  const SizedBox(height: 12),
                  _ruleRow(
                    Icons.check_circle_outline_rounded,
                    'Marking Scheme',
                    'Each correct answer awards 1 mark. Each incorrect answer deducts 0.25 marks. No penalty for unanswered questions.',
                  ),
                  const SizedBox(height: 12),
                  _ruleRow(
                    Icons.grid_view_rounded,
                    'Question Palette',
                    'Use the question palette to jump to questions. Green: Answered, Amber: Marked for review, Grey: Unvisited.',
                  ),
                  const SizedBox(height: 12),
                  _ruleRow(
                    Icons.refresh_rounded,
                    'Solutions & Ranks',
                    'Immediately upon completion, you will receive your state percentile rank, question explanations, and mistake analysis.',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Terms checkbox
            Row(
              children: [
                Checkbox(
                  value: _agreedToInstructions,
                  activeColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  onChanged: (val) => setState(() => _agreedToInstructions = val ?? true),
                ),
                Expanded(
                  child: Text(
                    'I have read and understood all instructions and agree to begin the timed test.',
                    style: AppTypography.bodySmall(color: AppColors.secondaryText),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(top: BorderSide(color: AppColors.border, width: 1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: canAttempt
              ? PKPrimaryButton(
                  text: 'Start Test Now',
                  icon: Icons.play_arrow_rounded,
                  onPressed: _agreedToInstructions
                      ? () => context.push('/live-test/${widget.testId}')
                      : null,
                )
              : PKPrimaryButton(
                  text: 'Unlock Test with Pro Pass (₹99)',
                  icon: Icons.lock_open_rounded,
                  onPressed: () => context.push('/subscription'),
                ),
        ),
      ),
    );
  }

  Widget _specItem(String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: AppTypography.headlineMedium(color: AppColors.primary).copyWith(fontSize: 17),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.labelSmall(color: AppColors.secondaryText),
          ),
        ],
      ),
    );
  }

  Widget _ruleRow(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.titleSmall(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: AppTypography.bodySmall(color: AppColors.secondaryText),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
