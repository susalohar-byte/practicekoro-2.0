import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_typography.dart';
import 'pk_card.dart';

/// Progress Card matching Web "Your Progress" Donut Gauge & Legend
class PKProgressCard extends StatelessWidget {
  final double accuracy; // e.g. 78.0
  final int correctCount;
  final int incorrectCount;
  final int skippedCount;
  final VoidCallback? onViewAnalytics;

  const PKProgressCard({
    super.key,
    required this.accuracy,
    required this.correctCount,
    required this.incorrectCount,
    required this.skippedCount,
    this.onViewAnalytics,
  });

  @override
  Widget build(BuildContext context) {
    return PKCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) =>
                _buildHeader(compact: constraints.maxWidth < 350),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              // Circular Donut Gauge
              SizedBox(
                width: 100,
                height: 100,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CircularProgressIndicator(
                        value: (accuracy / 100).clamp(0.0, 1.0),
                        strokeWidth: 9,
                        backgroundColor: AppColors.borderSubtle,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.primary,
                        ),
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${accuracy.toStringAsFixed(0)}%',
                          style: AppTypography.headlineMedium(
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          'ACCURACY',
                          style: AppTypography.labelSmall(
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              // Legend
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _legendRow('Correct', correctCount, AppColors.success),
                    const SizedBox(height: 8),
                    _legendRow('Incorrect', incorrectCount, AppColors.error),
                    const SizedBox(height: 8),
                    _legendRow('Skipped', skippedCount, AppColors.textMuted),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeader({required bool compact}) {
    final title = Text(
      'Your Progress',
      style: AppTypography.headlineMedium(color: AppColors.textPrimary),
    );
    final hasAnalytics = onViewAnalytics != null;
    final analytics = onViewAnalytics == null
        ? const SizedBox.shrink()
        : InkWell(
            onTap: onViewAnalytics,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View Detailed Analytics',
                    style: AppTypography.bodySmall(
                      color: AppColors.primary,
                    ).copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 2),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: AppColors.primary,
                  ),
                ],
              ),
            ),
          );

    if (compact) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          title,
          if (hasAnalytics) ...[
            const SizedBox(height: 3),
            Align(alignment: Alignment.centerRight, child: analytics),
          ],
        ],
      );
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [title, if (hasAnalytics) analytics],
    );
  }

  Widget _legendRow(String label, int count, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 9,
              height: 9,
              decoration: BoxDecoration(
                color: color,
                borderRadius: AppRadius.rPill,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.bodySmall(color: AppColors.secondaryText),
            ),
          ],
        ),
        Text(
          count.toString(),
          style: AppTypography.titleSmall(color: AppColors.textPrimary),
        ),
      ],
    );
  }
}
