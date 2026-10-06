import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/constants/wb_districts.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/auth_repository.dart';

class ProfileScreen extends StatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const ProfileScreen({super.key, this.onTabSelected});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoggedIn = false;
  bool _isPro = false;
  String _userName = 'Candidate';
  String _userEmail = '';
  String _userPhone = '';
  String _userDistrict = 'Purulia';
  String _userCategory = 'GEN';
  String _userGender = 'NOT_SPECIFIED';

  static const Map<String, String> _categoryLabels = {
    'GEN': 'General / UR',
    'OBC_A': 'OBC-A',
    'OBC_B': 'OBC-B',
    'SC': 'SC',
    'ST': 'ST',
    'EWS': 'EWS',
    'PWD': 'PwD',
    'OTHER': 'Other',
    'NA': 'Prefer not to say',
  };

  static const Map<String, String> _genderLabels = {
    'MALE': 'Male',
    'FEMALE': 'Female',
    'OTHER': 'Other',
    'NOT_SPECIFIED': 'Prefer not to say',
  };

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    // 1. Initial load from local storage
    final localLoggedIn = LocalStorageService.isLoggedIn();
    final localName = LocalStorageService.getUserName();
    final localEmail = LocalStorageService.getUserEmail() ?? '';
    final localPhone = LocalStorageService.getUserPhone() ?? '';
    final localDistrict = LocalStorageService.getUserDistrict() ??
        LocalStorageService.getLeaderboardDistrict();
    final localCategory = LocalStorageService.getUserCategory();
    final localGender = LocalStorageService.getUserGender();
    final localPro = LocalStorageService.isProUser();

    if (mounted) {
      setState(() {
        _isLoggedIn = localLoggedIn;
        _isPro = localPro;
        _userName = localName.isNotEmpty ? localName : 'Candidate';
        _userEmail = localEmail;
        _userPhone = localPhone;
        _userDistrict = localDistrict;
        _userCategory = localCategory;
        _userGender = localGender;
      });
    }

    // 2. Fetch live data from Supabase if logged in
    try {
      final client = Supabase.instance.client;
      final user = client.auth.currentUser;
      if (user != null) {
        await AuthRepository().syncUserProfile(user);
        if (mounted) {
          setState(() {
            _isLoggedIn = true;
            _userName = LocalStorageService.getUserName();
            _userEmail = LocalStorageService.getUserEmail() ?? user.email ?? '';
            _userPhone = LocalStorageService.getUserPhone() ?? user.phone ?? '';
            _userDistrict = LocalStorageService.getUserDistrict() ?? 'Purulia';
            _userCategory = LocalStorageService.getUserCategory();
            _userGender = LocalStorageService.getUserGender();
            _isPro = LocalStorageService.isProUser();
          });
        }
      } else if (!localLoggedIn) {
        if (mounted) {
          setState(() {
            _isLoggedIn = false;
            _userName = 'Guest Candidate';
            _userEmail = '';
            _userPhone = '';
          });
        }
      }
    } catch (_) {}
  }

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _userName);
    final phoneCtrl = TextEditingController(text: _userPhone);
    String selectedDist = kWestBengalDistricts.contains(_userDistrict)
        ? _userDistrict
        : 'Purulia';
    String selectedCat = _categoryLabels.containsKey(_userCategory)
        ? _userCategory
        : 'GEN';
    String selectedGen = _genderLabels.containsKey(_userGender)
        ? _userGender
        : 'NOT_SPECIFIED';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            'Edit Profile & Category',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(Icons.person_outline_rounded,
                        color: Color(0xFF026BFC)),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    prefixIcon: Icon(Icons.phone_outlined,
                        color: Color(0xFF026BFC)),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Preparation District (WB)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedDist,
                      isExpanded: true,
                      items: kWestBengalDistricts.map((d) {
                        return DropdownMenuItem<String>(
                          value: d,
                          child: Text(
                            d,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => selectedDist = val);
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Reservation Category / Caste',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedCat,
                      isExpanded: true,
                      items: _categoryLabels.entries.map((entry) {
                        return DropdownMenuItem<String>(
                          value: entry.key,
                          child: Text(
                            entry.value,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => selectedCat = val);
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Gender',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedGen,
                      isExpanded: true,
                      items: _genderLabels.entries.map((entry) {
                        return DropdownMenuItem<String>(
                          value: entry.key,
                          child: Text(
                            entry.value,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => selectedGen = val);
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel',
                  style: TextStyle(color: Color(0xFF64748B))),
            ),
            ElevatedButton(
              onPressed: () async {
                final newName = nameCtrl.text.trim();
                final newPhone = phoneCtrl.text.trim();
                setState(() {
                  _userName = newName.isNotEmpty ? newName : _userName;
                  _userPhone = newPhone;
                  _userDistrict = selectedDist;
                  _userCategory = selectedCat;
                  _userGender = selectedGen;
                });

                await AuthRepository().updateProfile(
                  fullName: newName,
                  phone: newPhone,
                  district: selectedDist,
                  category: selectedCat,
                  gender: selectedGen,
                );

                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Save Changes',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showCouponDialog() {
    final couponCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Apply Coupon Code',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        content: TextField(
          controller: couponCtrl,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            hintText: 'Enter coupon code (e.g. PK50)',
            prefixIcon: Icon(Icons.confirmation_number_outlined,
                color: Color(0xFF026BFC)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child:
                const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.push('/payment');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF026BFC),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Apply & Redeem',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Confirm Sign Out',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        content: const Text(
          'Are you sure you want to sign out from PracticeKoro? You can log back in anytime.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child:
                const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await AuthRepository().signOut();
              if (mounted) context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Sign Out',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Profile',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined,
                color: Color(0xFF334155), size: 22),
            onPressed: () => context.push('/settings'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: PKBottomSpacing.edgeInsets(
            context,
            horizontal: 16,
            top: 12,
          ),
          children: [
            // 1. Student Info Card (Screen 11)
            _buildStudentInfoCard(),
            const SizedBox(height: 14),

            // 2. Plan Status Card (PRO Plan)
            _buildPlanStatusCard(),
            const SizedBox(height: 18),

            // 3. Profile Menu Items List (Screen 11)
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.bar_chart_rounded,
                    iconBg: const Color(0xFFEFF6FF),
                    iconColor: const Color(0xFF026BFC),
                    title: 'My Performance',
                    onTap: () => context.push('/results'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.history_rounded,
                    iconBg: const Color(0xFFF1F5F9),
                    iconColor: const Color(0xFF475569),
                    title: 'Test History',
                    onTap: () => context.push('/results'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.cancel_outlined,
                    iconBg: const Color(0xFFFEE2E2),
                    iconColor: const Color(0xFFEF4444),
                    title: 'My Wrong Questions',
                    onTap: () => context.push('/solutions/test-wbp-001'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.bookmark_outline_rounded,
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFFD97706),
                    title: 'Bookmarks & Saved Questions',
                    onTap: () => context.push('/saved-questions'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.headphones_rounded,
                    iconBg: const Color(0xFFEFF6FF),
                    iconColor: const Color(0xFF007DFE),
                    title: 'Audio Books & Audio Mocks',
                    onTap: () => context.push('/audio-books'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.local_offer_outlined,
                    iconBg: const Color(0xFFEDE9FE),
                    iconColor: const Color(0xFF7C3AED),
                    title: 'Coupon Code',
                    onTap: _showCouponDialog,
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.notifications_none_rounded,
                    iconBg: const Color(0xFFF1F5F9),
                    iconColor: const Color(0xFF475569),
                    title: 'Notifications',
                    onTap: () => context.push('/notifications'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.help_outline_rounded,
                    iconBg: const Color(0xFFEFF6FF),
                    iconColor: const Color(0xFF026BFC),
                    title: 'Help & Support',
                    onTap: () => context.push('/support'),
                  ),
                  _buildMenuDivider(),
                  _buildMenuItem(
                    icon: Icons.settings_outlined,
                    iconBg: const Color(0xFFF1F5F9),
                    iconColor: const Color(0xFF475569),
                    title: 'Settings',
                    onTap: () => context.push('/settings'),
                  ),
                  _buildMenuDivider(),
                  if (_isLoggedIn)
                    _buildMenuItem(
                      icon: Icons.logout_rounded,
                      iconBg: const Color(0xFFFEE2E2),
                      iconColor: const Color(0xFFDC2626),
                      title: 'Sign Out',
                      textColor: const Color(0xFFDC2626),
                      onTap: _showLogoutDialog,
                    )
                  else
                    _buildMenuItem(
                      icon: Icons.login_rounded,
                      iconBg: const Color(0xFFEFF6FF),
                      iconColor: const Color(0xFF026BFC),
                      title: 'Sign In to Account',
                      textColor: const Color(0xFF026BFC),
                      onTap: () => context.push('/login'),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // 1. Student Info Card (Screen 11)
  Widget _buildStudentInfoCard() {
    if (!_isLoggedIn) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 10,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: Color(0xFF64748B),
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Guest Learner',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Sign in to sync your rank & tests across devices',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () => context.push('/login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Sign In',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar (Circle)
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
              ),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Center(
              child: Icon(Icons.person_rounded, color: Colors.white, size: 32),
            ),
          ),
          const SizedBox(width: 14),
          // Name, Phone/District, Email
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _userName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _userPhone.isNotEmpty
                      ? '$_userPhone • $_userDistrict'
                      : _userDistrict,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                  ),
                ),
                if (_userEmail.isNotEmpty)
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
                const SizedBox(height: 5),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Text(
                        _categoryLabels[_userCategory] ?? 'General / UR',
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                    ),
                    if (_userGender != 'NOT_SPECIFIED')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAF5FF),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFE9D5FF)),
                        ),
                        child: Text(
                          _genderLabels[_userGender] ?? 'Gender',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF7E22CE),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          // Edit Button (Screen 11)
          OutlinedButton(
            onPressed: _showEditProfileDialog,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              side: const BorderSide(color: Color(0xFF026BFC)),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              minimumSize: const Size(0, 32),
            ),
            child: const Text(
              'Edit',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF026BFC),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 2. Plan Status Card (Screen 11)
  Widget _buildPlanStatusCard() {
    return InkWell(
      onTap: () => context.push('/subscription'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _isPro
                    ? const Color(0xFFFEF3C7)
                    : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _isPro
                    ? Icons.workspace_premium_rounded
                    : Icons.lock_open_rounded,
                color: _isPro
                    ? const Color(0xFFD97706)
                    : const Color(0xFF026BFC),
                size: 26,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        _isPro ? 'PRO Plan' : 'Free Plan',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: _isPro
                              ? const Color(0xFFDCFCE7)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _isPro ? 'Active' : 'Basic',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: _isPro
                                ? const Color(0xFF16A34A)
                                : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _isPro
                        ? 'Unlimited access to all tests & PYQs'
                        : 'Unlock 100+ Full Mocks, Official PYQs & Rank',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
              size: 22,
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
    Color? textColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: textColor ?? const Color(0xFF0F172A),
                ),
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFFCBD5E1),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuDivider() {
    return const Divider(
        height: 1, indent: 64, endIndent: 16, color: Color(0xFFF1F5F9));
  }
}
