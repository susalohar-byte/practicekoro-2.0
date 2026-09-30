import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_dialog.dart';
import '../../core/constants/app_colors.dart';
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
  String _bestScore = '0/0';
  int _dayStreak = 0;
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

    String bestScoreStr = '0/0';
    if (attempts.isNotEmpty) {
      double maxSc = 0;
      double maxTm = 100;
      for (final a in attempts) {
        if (a.score >= maxSc) {
          maxSc = a.score;
          maxTm = a.totalMarks;
        }
      }
      bestScoreStr = '${maxSc.round()}/${maxTm.round()}';
    }

    final streakDays = attempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;

    if (mounted) {
      setState(() {
        _isPro = isPro;
        if (exam != null) _targetExam = exam;
        _userName = name;
        _userEmail = email;
        _testsTaken = testsCount;
        _avgAccuracy = avgAcc;
        _bestScore = bestScoreStr;
        _dayStreak = streakDays;
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
    final district =
        LocalStorageService.getLeaderboardDistrict() ?? 'West Bengal';

    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FF),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Sticky Header (Matches Website Profile.tsx)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(
                              0xFF0158FC,
                            ).withValues(alpha: 0.18),
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.asset(
                            'assets/images/logo-circle.png',
                            width: 28,
                            height: 28,
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => const Icon(
                              Icons.person_rounded,
                              size: 20,
                              color: Color(0xFF0158FC),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(
                                  text: 'My ',
                                  style: TextStyle(color: Color(0xFF0F172A)),
                                ),
                                TextSpan(
                                  text: 'Profile',
                                  style: TextStyle(color: Color(0xFF0158FC)),
                                ),
                              ],
                            ),
                            style: TextStyle(
                              fontSize: 21,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(height: 1),
                          Text(
                            'Manage your account & track your progress.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.settings_outlined,
                      color: Color(0xFF0F172A),
                    ),
                    onPressed: () => context.push('/settings'),
                    tooltip: 'Settings',
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Scrollable Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  // 1. Stitch 2.0 Hero Profile Card with Navy-to-Electric-Blue Candidate Identity Header
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF0B1F44,
                          ).withValues(alpha: 0.04),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Top Candidate Identity Strip (#0B1F44 -> #0158FC -> #0198FD)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Color(0xFF0B1F44),
                                Color(0xFF0158FC),
                                Color(0xFF0198FD),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: Image.asset(
                                      'assets/images/logo-circle.png',
                                      width: 20,
                                      height: 20,
                                      fit: BoxFit.contain,
                                      errorBuilder: (_, _, _) => const Icon(
                                        Icons.verified_user_rounded,
                                        size: 16,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 7),
                                  const Text(
                                    'CANDIDATE IDENTITY 2.0',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _isPro
                                      ? const Color(0xFFFEF3C7)
                                      : Colors.white.withValues(alpha: 0.16),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  _isPro ? '👑 Pro Pass' : '⭐ Free Plan',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: _isPro
                                        ? const Color(0xFFD97706)
                                        : Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 68,
                                    height: 68,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: const Color(0xFFDBEAFE),
                                        width: 2.5,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(17.5),
                                      child: Image.asset(
                                        'assets/images/student_avatar_hd.png',
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) => const Icon(
                                          Icons.person_rounded,
                                          size: 32,
                                          color: Color(0xFF0158FC),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _userName,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 19,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        const Text(
                                          'Aspirant | Keep Learning Keep Growing 🌱',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF475569),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Wrap(
                                          spacing: 10,
                                          runSpacing: 4,
                                          children: [
                                            if (_userEmail.isNotEmpty)
                                              _buildMetaTag(
                                                Icons.mail_outline_rounded,
                                                _userEmail,
                                              ),
                                            _buildMetaTag(
                                              Icons.location_on_outlined,
                                              '$district, WB',
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              const SizedBox(height: 10),
                              const Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '"Discipline today creates success tomorrow."',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontStyle: FontStyle.italic,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    '— PracticeKoro',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. 4 Stat Cards (Matches Website Profile.tsx Section 4)
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 2.35,
                    children: [
                      _buildWebsiteStatCard(
                        icon: Icons.description_outlined,
                        iconBg: const Color(0xFFEFF6FF),
                        iconFg: const Color(0xFF0158FC),
                        value: '$_testsTaken',
                        label: 'Tests Attempted',
                      ),
                      _buildWebsiteStatCard(
                        icon: Icons.track_changes_rounded,
                        iconBg: const Color(0xFFFFF1F2),
                        iconFg: const Color(0xFFE11D48),
                        value: '$_avgAccuracy%',
                        label: 'Average Accuracy',
                      ),
                      _buildWebsiteStatCard(
                        icon: Icons.bar_chart_rounded,
                        iconBg: const Color(0xFFF5F3FF),
                        iconFg: const Color(0xFF7C3AED),
                        value: _bestScore,
                        label: 'Best Score',
                      ),
                      _buildWebsiteStatCard(
                        icon: Icons.local_fire_department_rounded,
                        iconBg: const Color(0xFFFFFBEB),
                        iconFg: const Color(0xFFD97706),
                        value: '$_dayStreak',
                        label: 'Day Streak',
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // 3. My Exams / Target Exam Card (Matches Website Profile.tsx Section 6)
                  PKCard(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 13,
                    ),
                    borderColor: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(20),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: AppRadius.rMd,
                          ),
                          child: const Icon(
                            Icons.track_changes_rounded,
                            color: Color(0xFF0158FC),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Primary Target Exam',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _targetExam,
                                style: const TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
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
                          child: const Text(
                            '+ Change Exam',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0158FC),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 4. Account & Study Options Card
                  PKCard(
                    padding: EdgeInsets.zero,
                    borderColor: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(20),
                    child: Column(
                      children: [
                        const Padding(
                          padding: EdgeInsets.fromLTRB(16, 15, 16, 8),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Account & Learning',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                        ),
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
                          color: Color(0xFFF1F5F9),
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
                          color: Color(0xFFF1F5F9),
                        ),
                        _buildMenuItem(
                          icon: Icons.bar_chart_rounded,
                          iconColor: const Color(0xFF0158FC),
                          iconBgColor: const Color(0xFFEFF6FF),
                          title: 'Leaderboard & Rank',
                          onTap: () => context.go('/results'),
                        ),
                        const Divider(
                          height: 1,
                          indent: 56,
                          color: Color(0xFFF1F5F9),
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
                          color: Color(0xFFF1F5F9),
                        ),
                        _buildMenuItem(
                          icon: Icons.settings_rounded,
                          iconColor: const Color(0xFF0F172A),
                          iconBgColor: const Color(0xFFF1F5F9),
                          title: 'Settings & Preferences',
                          onTap: () => context.push('/settings'),
                        ),
                        const Divider(
                          height: 1,
                          indent: 56,
                          color: Color(0xFFF1F5F9),
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

                  // 5. Logout Card
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
                      style: AppTypography.bodySmall(
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaTag(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13.5, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            fontSize: 11.5,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildWebsiteStatCard({
    required IconData icon,
    required Color iconBg,
    required Color iconFg,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: iconFg, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
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
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppTypography.titleSmall(color: const Color(0xFF0F172A)),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: AppRadius.rPill,
              ),
              child: Text(
                badge,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0158FC),
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
                    : const Color(0xFF0158FC),
              ),
            ),
            const SizedBox(width: 6),
          ],
          const Icon(
            Icons.chevron_right_rounded,
            color: Color(0xFF94A3B8),
            size: 20,
          ),
        ],
      ),
    );
  }
}
