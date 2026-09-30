import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/components/pk_dialog.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isPro = false;
  String _targetExam = 'WBP Constable';
  String _userName = 'Aspirant';
  String _userEmail = '';
  int _testsTaken = 0;
  int _avgAccuracy = 0;
  String _bestScore = '0/100';
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

    String name = 'Aspirant';
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

    String bestScoreStr = '0/100';
    if (attempts.isNotEmpty) {
      double maxSc = 0;
      double maxTm = 100;
      for (final a in attempts) {
        if (a.score >= maxSc) {
          maxSc = a.score;
          maxTm = a.totalMarks > 0 ? a.totalMarks : 100;
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
    final initials = _userName.trim().isNotEmpty
        ? _userName.trim().substring(0, 1).toUpperCase()
        : 'P';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── NATIVE MOBILE TOP HEADER ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Aspirant Profile',
                        style: TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Target exam, study vault & app settings',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
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

            // ── SCROLLABLE NATIVE MOBILE BODY ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  // 1. Indigo-Violet Aspirant Identity Hero Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF0F172A),
                          Color(0xFF1E1B4B),
                          Color(0xFF3142D6),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3142D6).withValues(alpha: 0.2),
                          blurRadius: 18,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.16),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.35),
                                  width: 2,
                                ),
                              ),
                              child: Text(
                                initials,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
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
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w900,
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
                                              ? const Color(0xFFFBBF24)
                                              : Colors.white.withValues(
                                                  alpha: 0.15,
                                                ),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Text(
                                          _isPro ? 'PRO PASS' : 'FREE PLAN',
                                          style: TextStyle(
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w900,
                                            color: _isPro
                                                ? const Color(0xFF0F172A)
                                                : Colors.white,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (_userEmail.isNotEmpty) ...[
                                    const SizedBox(height: 3),
                                    Text(
                                      _userEmail,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFFCBD5E1),
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: [
                                      _buildIdentityBadge(
                                        Icons.track_changes_rounded,
                                        _targetExam,
                                      ),
                                      _buildIdentityBadge(
                                        Icons.location_on_outlined,
                                        district,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.14),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: _buildProfileStatItem(
                                  '$_testsTaken',
                                  'Tests Taken',
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 28,
                                color: Colors.white.withValues(alpha: 0.16),
                              ),
                              Expanded(
                                child: _buildProfileStatItem(
                                  '$_avgAccuracy%',
                                  'Accuracy',
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 28,
                                color: Colors.white.withValues(alpha: 0.16),
                              ),
                              Expanded(
                                child: _buildProfileStatItem(
                                  _bestScore,
                                  'Best Score',
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 28,
                                color: Colors.white.withValues(alpha: 0.16),
                              ),
                              Expanded(
                                child: _buildProfileStatItem(
                                  '${_dayStreak}d',
                                  'Streak',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 2. Pro Pass Upgrade Card
                  if (!_isPro) ...[
                    InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () => context.push('/pricing'),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFFDE68A)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(
                                Icons.workspace_premium_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Upgrade to PracticeKoro Pro Pass',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Unlimited Full Mocks, PYQs & Rank Analytics',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF92400E),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 15,
                              color: Color(0xFFB45309),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 3. Revision & Study Vault (Strictly No Flashcards)
                  const Text(
                    'Study Vault & Rankings',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        _buildMenuTile(
                          icon: Icons.emoji_events_rounded,
                          iconColor: const Color(0xFFD97706),
                          iconBg: const Color(0xFFFFFBEB),
                          title: 'All-India & District Leaderboard',
                          subtitle: 'Compare your rank with top aspirants',
                          onTap: () => context.push('/rank'),
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMenuTile(
                          icon: Icons.bookmark_rounded,
                          iconColor: const Color(0xFF3142D6),
                          iconBg: const Color(0xFFEEF2FF),
                          title: 'Saved Bookmarks',
                          subtitle: '$_bookmarksCount important questions saved',
                          onTap: () => context.push('/bookmarks'),
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMenuTile(
                          icon: Icons.auto_fix_high_rounded,
                          iconColor: const Color(0xFFE11D48),
                          iconBg: const Color(0xFFFFF1F2),
                          title: 'Mistake Notebook',
                          subtitle:
                              '$_mistakesCount incorrect questions to revise',
                          onTap: () => context.push('/mistakes'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 4. App Preferences & Account
                  const Text(
                    'Preferences & Account',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        _buildMenuTile(
                          icon: Icons.tune_rounded,
                          iconColor: const Color(0xFF059669),
                          iconBg: const Color(0xFFECFDF5),
                          title: 'App Settings & Exam Goal',
                          subtitle: 'Language (বাংলা/EN), notifications & goal',
                          onTap: () async {
                            await context.push('/settings');
                            _loadProfileData();
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildMenuTile(
                          icon: Icons.logout_rounded,
                          iconColor: const Color(0xFFE11D48),
                          iconBg: const Color(0xFFFFF1F2),
                          title: 'Sign Out',
                          subtitle: 'Log out of your PracticeKoro account',
                          onTap: _handleLogout,
                        ),
                      ],
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

  Widget _buildIdentityBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFFC7D2FE)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Color(0xFFCBD5E1),
          ),
        ),
      ],
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconBg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          color: Color(0xFF0F172A),
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          fontSize: 11.5,
          color: Color(0xFF64748B),
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: const Icon(
        Icons.arrow_forward_ios_rounded,
        size: 14,
        color: Color(0xFF94A3B8),
      ),
    );
  }
}
