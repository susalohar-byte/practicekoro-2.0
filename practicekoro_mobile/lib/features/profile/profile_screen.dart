import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_dialog.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../data/datasources/local_storage.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isPro = false;
  String _targetExam = 'WBP Constable';

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  void _loadProfileData() {
    final isPro = LocalStorageService.isProUser();
    final exam = LocalStorageService.getSelectedExam();
    if (mounted) {
      setState(() {
        _isPro = isPro;
        if (exam != null) _targetExam = exam;
      });
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await PKDialog.show(
      context,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of PracticeKoro?',
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
        scrolledUnderElevation: 0,
        title: Text(
          'My Profile',
          style: AppTypography.headlineMedium(color: AppColors.navy),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.navy),
            onPressed: () => context.push('/settings'),
            tooltip: 'Settings',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
          children: [
            // User Profile Card
            PKCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [Color(0xFF0158FC), Color(0xFF0198FD)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'S',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Susanta Lohar',
                                  style: AppTypography.titleLarge(color: AppColors.navy),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _isPro ? AppColors.warningLight : AppColors.veryLightBlue,
                                    borderRadius: AppRadius.rPill,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(_isPro ? '👑' : '⭐', style: const TextStyle(fontSize: 10)),
                                      const SizedBox(width: 3),
                                      Text(
                                        _isPro ? 'Pro Pass' : 'Free Plan',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: _isPro ? AppColors.warning : AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'susanta@practicekoro.in',
                              style: AppTypography.bodySmall(color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),
                  const Divider(height: 1, color: AppColors.borderSubtle),
                  const SizedBox(height: 14),

                  // 3 Stats Counter Row: Tests Attempted, Accuracy, Streak
                  Row(
                    children: [
                      _buildProfileStat('12', 'Tests Taken', AppColors.primary),
                      Container(width: 1, height: 36, color: AppColors.border),
                      _buildProfileStat('68%', 'Avg Accuracy', AppColors.success),
                      Container(width: 1, height: 36, color: AppColors.border),
                      _buildProfileStat('15 🔥', 'Day Streak', AppColors.warning),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Target Exam Card
            PKCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.veryLightBlue,
                      borderRadius: AppRadius.rMd,
                    ),
                    child: const Icon(Icons.track_changes_rounded, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Target Exam',
                          style: AppTypography.labelSmall(color: AppColors.secondaryText),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _targetExam,
                          style: AppTypography.titleSmall(color: AppColors.navy),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      await context.push<void>('/exam-selection', extra: 'profile');
                      _loadProfileData();
                    },
                    child: Text(
                      'Change',
                      style: AppTypography.titleSmall(color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Main Menu Options List
            PKCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.bookmark_rounded,
                    iconColor: AppColors.purple,
                    iconBgColor: AppColors.purpleLight,
                    title: 'Saved Questions (Bookmarks)',
                    badge: '24',
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const Divider(height: 1, indent: 56, color: AppColors.borderSubtle),
                  _buildMenuItem(
                    icon: Icons.error_outline_rounded,
                    iconColor: AppColors.error,
                    iconBgColor: AppColors.errorLight,
                    title: 'Incorrect Questions (Mistakes)',
                    badge: '36',
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const Divider(height: 1, indent: 56, color: AppColors.borderSubtle),
                  _buildMenuItem(
                    icon: Icons.bar_chart_rounded,
                    iconColor: AppColors.primary,
                    iconBgColor: AppColors.veryLightBlue,
                    title: 'Statewide Leaderboard & Rank',
                    onTap: () => context.go('/results'),
                  ),
                  const Divider(height: 1, indent: 56, color: AppColors.borderSubtle),
                  _buildMenuItem(
                    icon: Icons.workspace_premium_rounded,
                    iconColor: AppColors.warning,
                    iconBgColor: AppColors.warningLight,
                    title: 'Pro Pass Subscription',
                    trailingText: _isPro ? 'Active' : 'Upgrade',
                    onTap: () => context.push('/subscription'),
                  ),
                  const Divider(height: 1, indent: 56, color: AppColors.borderSubtle),
                  _buildMenuItem(
                    icon: Icons.settings_rounded,
                    iconColor: AppColors.navy,
                    iconBgColor: AppColors.veryLightBlue,
                    title: 'Settings & Preferences',
                    onTap: () => context.push('/settings'),
                  ),
                  const Divider(height: 1, indent: 56, color: AppColors.borderSubtle),
                  _buildMenuItem(
                    icon: Icons.headset_mic_rounded,
                    iconColor: AppColors.cyan,
                    iconBgColor: AppColors.cyanLight,
                    title: 'Student Helpdesk & Support',
                    onTap: () => context.push('/support'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Logout Card
            PKCard(
              padding: EdgeInsets.zero,
              borderColor: AppColors.errorLight,
              onTap: _handleLogout,
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: AppRadius.rMd,
                  ),
                  child: const Icon(Icons.logout_rounded, color: AppColors.error, size: 20),
                ),
                title: Text(
                  'Log Out',
                  style: AppTypography.titleSmall(color: AppColors.error),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.error, size: 20),
              ),
            ),

            const SizedBox(height: 20),
            Center(
              child: Text(
                'PracticeKoro v2.0 • Made with ❤️ in West Bengal',
                style: AppTypography.bodySmall(color: AppColors.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileStat(String value, String label, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: AppTypography.headlineMedium(color: color).copyWith(fontSize: 18),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.bodySmall(color: AppColors.secondaryText),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    String? badge,
    String? trailingText,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconBgColor,
          borderRadius: AppRadius.rMd,
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: AppTypography.titleSmall(color: AppColors.navy),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.veryLightBlue,
                borderRadius: AppRadius.rPill,
              ),
              child: Text(
                badge,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
            const SizedBox(width: 6),
          ],
          if (trailingText != null) ...[
            Text(
              trailingText,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: trailingText == 'Active' ? AppColors.success : AppColors.primary,
              ),
            ),
            const SizedBox(width: 6),
          ],
          const Icon(Icons.chevron_right_rounded, color: AppColors.secondaryText, size: 20),
        ],
      ),
    );
  }
}
