import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_dialog.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/local_storage.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _targetExam = 'WBP Constable';
  bool _dailyReminder = true;
  bool _examAlerts = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() {
    final exam = LocalStorageService.getSelectedExam();
    if (mounted && exam != null) {
      setState(() => _targetExam = exam);
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await PKDialog.show(
      context,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your PracticeKoro account?',
      confirmText: 'Sign Out',
      icon: Icons.logout_rounded,
      iconColor: AppColors.error,
    );

    if (confirmed == true && mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'Settings & Preferences',
          style: AppTypography.titleLarge(color: AppColors.navy),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Target Exam
            PKCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.warningLight,
                          borderRadius: AppRadius.rMd,
                        ),
                        child: const Icon(Icons.track_changes_rounded, color: AppColors.warning, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Primary Target Exam',
                              style: AppTypography.titleMedium(color: AppColors.textPrimary),
                            ),
                            Text(
                              'Curates your home feed and recommended mocks',
                              style: AppTypography.bodySmall(color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      'WBP Constable',
                      'WBPSC Clerkship',
                      'KP SI & Constable',
                      'Primary TET',
                      'Railway NTPC',
                      'SSC GD',
                    ].map((exam) {
                      final isSelected = _targetExam == exam;
                      return InkWell(
                        onTap: () async {
                          setState(() => _targetExam = exam);
                          await LocalStorageService.setSelectedExam(exam);
                        },
                        borderRadius: AppRadius.rMd,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary : AppColors.surfaceMuted,
                            borderRadius: AppRadius.rMd,
                            border: Border.all(
                              color: isSelected ? AppColors.primary : AppColors.border,
                            ),
                          ),
                          child: Text(
                            exam,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 3. Notification Preferences
            PKCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Notifications',
                    style: AppTypography.titleMedium(color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    activeTrackColor: AppColors.primary,
                    title: Text(
                      'Daily Mock Test Reminder',
                      style: AppTypography.titleSmall(color: AppColors.textPrimary),
                    ),
                    subtitle: Text(
                      'Receive daily motivation & practice alerts at 8:00 AM',
                      style: AppTypography.bodySmall(color: AppColors.secondaryText),
                    ),
                    value: _dailyReminder,
                    onChanged: (val) => setState(() => _dailyReminder = val),
                  ),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    activeTrackColor: AppColors.primary,
                    title: Text(
                      'Exam & Result Updates',
                      style: AppTypography.titleSmall(color: AppColors.textPrimary),
                    ),
                    subtitle: Text(
                      'Official West Bengal job notifications and admit card releases',
                      style: AppTypography.bodySmall(color: AppColors.secondaryText),
                    ),
                    value: _examAlerts,
                    onChanged: (val) => setState(() => _examAlerts = val),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 4. Logout Card
            InkWell(
              onTap: _handleLogout,
              borderRadius: AppRadius.rXl,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: AppRadius.rXl,
                  border: Border.all(color: AppColors.errorLight),
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.logout_rounded, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Sign Out of PracticeKoro',
                      style: AppTypography.titleSmall(color: AppColors.error),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            Center(
              child: Text(
                'PracticeKoro 2.0 • Build 2026.09 (Unified Mobile)',
                style: AppTypography.bodySmall(color: AppColors.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
