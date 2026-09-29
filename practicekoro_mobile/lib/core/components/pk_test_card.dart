import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_typography.dart';
import 'pk_button.dart';
import 'pk_card.dart';

/// Test Card matching Web Recommended and Series Test Cards
class PKTestCard extends StatelessWidget {
  final String title;
  final String questionsCount;
  final String duration;
  final String language;
  final String? badge;
  final Color? badgeColor;
  final VoidCallback onStart;
  final bool isProOnly;
  final bool isCompleted;

  const PKTestCard({
    super.key,
    required this.title,
    required this.questionsCount,
    required this.duration,
    this.language = 'বাংলা (Bengali)',
    this.badge,
    this.badgeColor,
    required this.onStart,
    this.isProOnly = false,
    this.isCompleted = false,
  });

  @override
  Widget build(BuildContext context) {
    return PKCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.veryLightBlue,
                      borderRadius: AppRadius.rMd,
                      border: Border.all(color: AppColors.softBlue, width: 1),
                    ),
                    child: const Icon(
                      Icons.description_outlined,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  if (badge != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: (badgeColor ?? AppColors.warning).withValues(alpha: 0.15),
                        borderRadius: AppRadius.rPill,
                      ),
                      child: Text(
                        badge!,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: badgeColor ?? AppColors.warning,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: AppTypography.titleMedium(color: AppColors.textPrimary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _metaItem(Icons.list_alt_rounded, questionsCount),
                  _metaItem(Icons.timer_outlined, duration),
                  _metaItem(Icons.language_rounded, language),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          PKPrimaryButton(
            text: isCompleted ? 'Re-attempt Test' : 'Start Test',
            icon: Icons.arrow_forward_rounded,
            height: 42,
            onPressed: onStart,
          ),
        ],
      ),
    );
  }

  Widget _metaItem(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.secondaryText),
        const SizedBox(width: 4),
        Text(
          text,
          style: AppTypography.bodySmall(color: AppColors.secondaryText),
        ),
      ],
    );
  }
}
