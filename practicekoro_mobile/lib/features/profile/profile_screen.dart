import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
  String _userName = 'Student';
  String _userEmail = '';
  int _testsTaken = 0;
  int _avgAccuracy = 0;
  int _bookmarksCount = 0;
  int _mistakesCount = 0;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  void _loadProfileData() {
    final isPro = LocalStorageService.isProUser();
    final exam = LocalStorageService.getSelectedExam();
    final attempts = LocalStorageService.getAttempts();
    final bookmarksCount = LocalStorageService.getBookmarks().length;
    final mistakesCount = attempts.fold<int>(
      0,
      (sum, attempt) => sum + attempt.wrongCount,
    );

    String name = 'Student';
    String email = '';
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        email = user.email ?? '';
        final metaName = user.userMetadata?['full_name'] as String?;
        if (metaName != null && metaName.trim().isNotEmpty) {
          name = metaName.trim();
        } else if (email.isNotEmpty) {
          name = email.split('@').first;
        }
      }
    } catch (_) {}

    final testsCount = attempts.length;
    final avgAcc = attempts.isEmpty
        ? 0
        : (attempts.map((a) => a.accuracy).reduce((a, b) => a + b) /
                  attempts.length)
              .round();

    if (mounted) {
      setState(() {
        _isPro = isPro;
        if (exam != null) _targetExam = exam;
        _userName = name;
        _userEmail = email;
        _testsTaken = testsCount;
        _avgAccuracy = avgAcc;
        _bookmarksCount = bookmarksCount;
        _mistakesCount = mistakesCount;
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
      try {
        await Supabase.instance.client.auth.signOut();
      } catch (_) {}
      if (mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final initial = _userName.isNotEmpty ? _userName[0].toUpperCase() : 'S';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Profile',
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
            // Branded profile summary
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.navy.withValues(alpha: 0.16),
                    blurRadius: 18,
                    offset: const Offset(0, 7),
                  ),
                ],
              ),
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
                        child: Text(
                          initial,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    _userName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppTypography.titleLarge(
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _isPro
                                        ? AppColors.warningLight
                                        : Colors.white.withValues(alpha: 0.14),
                                    borderRadius: AppRadius.rPill,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        _isPro ? '👑' : '⭐',
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                      const SizedBox(width: 3),
                                      Text(
                                        _isPro ? 'Pro Pass' : 'Free Plan',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: _isPro
                                              ? AppColors.warning
                                              : Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (_userEmail.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                _userEmail,
                                style: AppTypography.bodySmall(
                                  color: Colors.white.withValues(alpha: 0.75),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),
                  Divider(
                    height: 1,
                    color: Colors.white.withValues(alpha: 0.22),
                  ),
                  const SizedBox(height: 14),

                  // 3 Stats Counter Row: Tests Attempted, Accuracy, Streak
                  Row(
                    children: [
                      _buildProfileStat(
                        '$_testsTaken',
                        'Tests Taken',
                        Colors.white,
                      ),
                      Container(
                        width: 1,
                        height: 36,
                        color: Colors.white.withValues(alpha: 0.22),
                      ),
                      _buildProfileStat(
                        '$_avgAccuracy%',
                        'Avg Accuracy',
                        Colors.white,
                      ),
                      Container(
                        width: 1,
                        height: 36,
                        color: Colors.white.withValues(alpha: 0.22),
                      ),
                      _buildProfileStat(
                        '$_bookmarksCount',
                        'Saved',
                        Colors.white,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            _sectionLabel('Your preparation'),
            const SizedBox(height: 10),

            // Target Exam Card
            PKCard(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              borderColor: AppColors.softBlue,
              borderRadius: BorderRadius.circular(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.veryLightBlue,
                      borderRadius: AppRadius.rMd,
                    ),
                    child: const Icon(
                      Icons.track_changes_rounded,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Target Exam',
                          style: AppTypography.labelSmall(
                            color: AppColors.secondaryText,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _targetExam,
                          style: AppTypography.titleSmall(
                            color: AppColors.navy,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      await context.push<void>(
                        '/exam-selection',
                        extra: 'profile',
                      );
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
              borderColor: AppColors.borderSubtle,
              borderRadius: BorderRadius.circular(20),
              child: Column(
                children: [
                  _sectionLabel('Your account', horizontal: 16, vertical: 15),
                  _buildMenuItem(
                    icon: Icons.bookmark_rounded,
                    iconColor: AppColors.purple,
                    iconBgColor: AppColors.purpleLight,
                    title: 'Saved Questions (Bookmarks)',
                    badge: '$_bookmarksCount',
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const Divider(
                    height: 1,
                    indent: 56,
                    color: AppColors.borderSubtle,
                  ),
                  _buildMenuItem(
                    icon: Icons.error_outline_rounded,
                    iconColor: AppColors.error,
                    iconBgColor: AppColors.errorLight,
                    title: 'Incorrect Questions (Mistakes)',
                    badge: '$_mistakesCount',
                    onTap: () => context.push('/saved-questions'),
                  ),
                  const Divider(
                    height: 1,
                    indent: 56,
                    color: AppColors.borderSubtle,
                  ),
                  _buildMenuItem(
                    icon: Icons.bar_chart_rounded,
                    iconColor: AppColors.primary,
                    iconBgColor: AppColors.veryLightBlue,
                    title: 'Leaderboard & Rank',
                    onTap: () => context.go('/results'),
                  ),
                  const Divider(
                    height: 1,
                    indent: 56,
                    color: AppColors.borderSubtle,
                  ),
                  _buildMenuItem(
                    icon: Icons.workspace_premium_rounded,
                    iconColor: AppColors.warning,
                    iconBgColor: AppColors.warningLight,
                    title: 'Pro Pass Subscription',
                    trailingText: _isPro ? 'Active' : 'Upgrade',
                    onTap: () => context.push('/subscription'),
                  ),
                  const Divider(
                    height: 1,
                    indent: 56,
                    color: AppColors.borderSubtle,
                  ),
                  _buildMenuItem(
                    icon: Icons.settings_rounded,
                    iconColor: AppColors.navy,
                    iconBgColor: AppColors.veryLightBlue,
                    title: 'Settings & Preferences',
                    onTap: () => context.push('/settings'),
                  ),
                  const Divider(
                    height: 1,
                    indent: 56,
                    color: AppColors.borderSubtle,
                  ),
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
              borderRadius: BorderRadius.circular(20),
              onTap: _handleLogout,
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: AppRadius.rMd,
                  ),
                  child: const Icon(
                    Icons.logout_rounded,
                    color: AppColors.error,
                    size: 20,
                  ),
                ),
                title: Text(
                  'Log Out',
                  style: AppTypography.titleSmall(color: AppColors.error),
                ),
                trailing: const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.error,
                  size: 20,
                ),
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
            style: AppTypography.headlineMedium(
              color: color,
            ).copyWith(fontSize: 18),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.bodySmall(
              color: Colors.white.withValues(alpha: 0.78),
            ).copyWith(fontSize: 10.5),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(
    String label, {
    double horizontal = 0,
    double vertical = 0,
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: horizontal, vertical: vertical),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          label,
          style: AppTypography.titleSmall(
            color: AppColors.navy,
          ).copyWith(fontSize: 14),
        ),
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
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
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
                color: trailingText == 'Active'
                    ? AppColors.success
                    : AppColors.primary,
              ),
            ),
            const SizedBox(width: 6),
          ],
          const Icon(
            Icons.chevron_right_rounded,
            color: AppColors.secondaryText,
            size: 20,
          ),
        ],
      ),
    );
  }
}
