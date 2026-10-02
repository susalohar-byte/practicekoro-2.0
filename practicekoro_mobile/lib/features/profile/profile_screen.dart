import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/components/pk_dialog.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_bottom_spacing.dart';

class ProfileScreen extends StatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const ProfileScreen({super.key, this.onTabSelected});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userName = 'Susanta Lohar';
  String _userEmail = 'susanta@example.com';
  final String _userSubtitle = 'Student • West Bengal';

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  void _loadUserProfile() {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final email = user.email ?? '';
        final metaName = user.userMetadata?['full_name'] as String?;
        if (mounted) {
          setState(() {
            if (metaName != null && metaName.trim().isNotEmpty) {
              _userName = metaName.trim();
            }
            if (email.trim().isNotEmpty) {
              _userEmail = email.trim();
            }
          });
        }
      }
    } catch (_) {}
  }

  void _navigateToTab(int index, String fallbackRoute) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(fallbackRoute);
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await PKDialog.show(
      context,
      title: 'Log Out',
      message: 'Are you sure you want to log out of PracticeKoro?',
      confirmText: 'Log Out',
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

  void _showEditProfileDialog() {
    final nameController = TextEditingController(text: _userName);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Edit Profile',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            color: Color(0xFF0B1F5B),
          ),
        ),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'Full Name',
            hintText: 'Enter your name',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0877FF),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              if (nameController.text.trim().isNotEmpty) {
                setState(() => _userName = nameController.text.trim());
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showFeedbackDialog() {
    final feedbackController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Send Feedback',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            color: Color(0xFF0B1F5B),
          ),
        ),
        content: TextField(
          controller: feedbackController,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Tell us how we can improve PracticeKoro...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0877FF),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Thank you for your feedback!')),
              );
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5FC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: PKBottomSpacing.edgeInsets(context, horizontal: 16, top: 10),
          children: [
            // ── 1. TOP BRAND HEADER BAR ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    // 'P' Blue Logo
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0877FF),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'P',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          height: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 9),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: const TextSpan(
                            children: [
                              TextSpan(
                                text: 'Practice',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0B1F5B),
                                  letterSpacing: -0.4,
                                ),
                              ),
                              TextSpan(
                                text: 'Koro',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0877FF),
                                  letterSpacing: -0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Text(
                          'Practice Today, Progress Tomorrow',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                // Notification Bell with Red Badge '3'
                GestureDetector(
                  onTap: () => context.push('/settings'),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFE8EEF7)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0B1F5B).withValues(alpha: 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.notifications_none_rounded,
                          color: Color(0xFF0B1F5B),
                          size: 20,
                        ),
                      ),
                      Positioned(
                        right: -1,
                        top: -2,
                        child: Container(
                          width: 16,
                          height: 16,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: const Text(
                            '3',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              height: 1,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // ── 2. USER PROFILE HERO CARD ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE5F0FF), Color(0xFFF3F7FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0877FF).withValues(alpha: 0.06),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // User Avatar with Edit Badge
                  Stack(
                    children: [
                      Container(
                        width: 66,
                        height: 66,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2.2),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0B1F5B).withValues(alpha: 0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/student_avatar_hd.png',
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(
                              color: const Color(0xFF0877FF),
                              child: const Icon(
                                Icons.person,
                                color: Colors.white,
                                size: 36,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFFE2ECF8),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0B1F5B).withValues(alpha: 0.08),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.edit_rounded,
                            size: 12,
                            color: Color(0xFF0877FF),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 14),

                  // Name, Email, Role
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _userName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 17.5,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0B1F5B),
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _userEmail,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _userSubtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Edit Profile Button
                  GestureDetector(
                    onTap: _showEditProfileDialog,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFDBEAFE)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0877FF).withValues(alpha: 0.06),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.edit_outlined,
                            size: 13,
                            color: Color(0xFF0877FF),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Edit Profile',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0877FF),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // ── 3. FOUR METRIC STAT TILES ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE8EEF7)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatColumn(
                      icon: Icons.bar_chart_rounded,
                      iconColor: const Color(0xFF10B981),
                      value: '25',
                      label: 'Tests Taken',
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => context.push('/rank'),
                      behavior: HitTestBehavior.opaque,
                      child: _buildStatColumn(
                        icon: Icons.emoji_events_rounded,
                        iconColor: const Color(0xFFF59E0B),
                        value: '1,245',
                        label: 'Rank',
                      ),
                    ),
                  ),
                  Expanded(
                    child: _buildStatColumn(
                      icon: Icons.track_changes_rounded,
                      iconColor: const Color(0xFF0877FF),
                      value: '72%',
                      label: 'Avg. Score',
                    ),
                  ),
                  Expanded(
                    child: _buildStatColumn(
                      icon: Icons.bolt_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      value: '12',
                      label: 'Day Streak',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ── 4. SECTION: MY PROGRESS ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Progress',
                  style: TextStyle(
                    fontSize: 17.5,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                    letterSpacing: -0.4,
                  ),
                ),
                GestureDetector(
                  onTap: () => _navigateToTab(3, '/results'),
                  child: const Row(
                    children: [
                      Text(
                        'View All',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF0877FF),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 15,
                        color: Color(0xFF0877FF),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                // Test History Card
                Expanded(
                  child: _buildProgressCard(
                    icon: Icons.description_rounded,
                    iconBg: const Color(0xFFEBF3FF),
                    iconColor: const Color(0xFF2563EB),
                    title: 'Test History',
                    subtitle: 'View all your test attempts',
                    onTap: () => _navigateToTab(3, '/results'),
                  ),
                ),
                const SizedBox(width: 10),
                // Performance Analysis Card
                Expanded(
                  child: _buildProgressCard(
                    icon: Icons.bar_chart_rounded,
                    iconBg: const Color(0xFFECFDF5),
                    iconColor: const Color(0xFF10B981),
                    title: 'Performance Analysis',
                    subtitle: 'Detailed subject-wise analysis',
                    onTap: () => context.push('/analysis/wbp_mock_01'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Rank & Leaderboard Banner in My Progress
            GestureDetector(
              onTap: () => context.push('/rank'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFFBEB), Colors.white],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.emoji_events_rounded,
                        size: 22,
                        color: Color(0xFFD97706),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Rank & Leaderboard',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0B1F5B),
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'View your rank across Test Series & participants',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 20,
                      color: Color(0xFFD97706),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // ── 5. SECTION: MY SUBSCRIPTIONS ──
            const Text(
              'My Subscriptions',
              style: TextStyle(
                fontSize: 17.5,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0B1F5B),
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => _navigateToTab(1, '/test-series'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE8EEF7)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Crown Icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.workspace_premium_rounded,
                        size: 22,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'My Test Series',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0B1F5B),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Active',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            '2 Active • 1 Completed',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 20,
                      color: Color(0xFF94A3B8),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // ── 6. SECTION: ACCOUNT ──
            const Text(
              'Account',
              style: TextStyle(
                fontSize: 17.5,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0B1F5B),
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE8EEF7)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.emoji_events_rounded,
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFFD97706),
                    title: 'Rank',
                    subtitle: 'View Test Series rankings and leaderboards',
                    onTap: () => context.push('/rank'),
                  ),
                  const Divider(height: 1, indent: 62, endIndent: 14, color: Color(0xFFF1F5FC)),
                  _buildMenuItem(
                    icon: Icons.person_rounded,
                    iconBg: const Color(0xFFF3E8FF),
                    iconColor: const Color(0xFF8B5CF6),
                    title: 'Personal Information',
                    subtitle: 'Update your profile details',
                    onTap: _showEditProfileDialog,
                  ),
                  const Divider(height: 1, indent: 62, endIndent: 14, color: Color(0xFFF1F5FC)),
                  _buildMenuItem(
                    icon: Icons.lock_rounded,
                    iconBg: const Color(0xFFE0F2FE),
                    iconColor: const Color(0xFF0284C7),
                    title: 'Change Password',
                    subtitle: 'Keep your account secure',
                    onTap: () => context.push('/settings'),
                  ),
                  const Divider(height: 1, indent: 62, endIndent: 14, color: Color(0xFFF1F5FC)),
                  _buildMenuItem(
                    icon: Icons.notifications_rounded,
                    iconBg: const Color(0xFFFFE4E6),
                    iconColor: const Color(0xFFF43F5E),
                    title: 'Notifications',
                    subtitle: 'Manage your notification preferences',
                    onTap: () => context.push('/settings'),
                  ),
                  const Divider(height: 1, indent: 62, endIndent: 14, color: Color(0xFFF1F5FC)),
                  _buildMenuItem(
                    icon: Icons.settings_rounded,
                    iconBg: const Color(0xFFFFEDD5),
                    iconColor: const Color(0xFFF97316),
                    title: 'App Settings',
                    subtitle: 'Appearance, language and more',
                    onTap: () => context.push('/settings'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ── 7. SECTION: SUPPORT ──
            const Text(
              'Support',
              style: TextStyle(
                fontSize: 17.5,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0B1F5B),
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE8EEF7)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.help_rounded,
                    iconBg: const Color(0xFFECFDF5),
                    iconColor: const Color(0xFF10B981),
                    title: 'Help & Support',
                    subtitle: 'Get help and contact us',
                    onTap: () => context.push('/support'),
                  ),
                  const Divider(height: 1, indent: 62, endIndent: 14, color: Color(0xFFF1F5FC)),
                  _buildMenuItem(
                    icon: Icons.chat_bubble_rounded,
                    iconBg: const Color(0xFFE0F2FE),
                    iconColor: const Color(0xFF0284C7),
                    title: 'Send Feedback',
                    subtitle: 'Help us improve PracticeKoro',
                    onTap: _showFeedbackDialog,
                  ),
                  const Divider(height: 1, indent: 62, endIndent: 14, color: Color(0xFFF1F5FC)),
                  _buildMenuItem(
                    icon: Icons.logout_rounded,
                    iconBg: const Color(0xFFFFF1F2),
                    iconColor: const Color(0xFFEF4444),
                    title: 'Logout',
                    subtitle: 'Sign out from your account',
                    onTap: _handleLogout,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn({
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Icon(icon, size: 21, color: iconColor),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0B1F5B),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 68,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE8EEF7)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0B1F5B).withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: Icon(icon, size: 19, color: iconColor),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0B1F5B),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: Color(0xFF0877FF),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconBg,
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Icon(icon, size: 19, color: iconColor),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: Color(0xFF0B1F5B),
          letterSpacing: -0.2,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w500,
          color: Color(0xFF64748B),
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right_rounded,
        size: 20,
        color: Color(0xFF94A3B8),
      ),
    );
  }
}
