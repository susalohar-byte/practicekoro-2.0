import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';

class HomeScreen extends StatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const HomeScreen({super.key, this.onTabSelected});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

typedef PracticeKoroHomeScreen = HomeScreen;

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  final PageController _bannerController = PageController();
  int _currentBannerPage = 0;
  Timer? _bannerTimer;
  String _targetExam = 'WBP Constable';

  final List<Map<String, dynamic>> _searchableItems = [
    {'title': 'WBP Constable Full Mock 01', 'type': 'Mock Test', 'route': '/live-test/test-wbp-001', 'category': 'test'},
    {'title': 'WBP Constable Full Mock 02', 'type': 'Mock Test', 'route': '/live-test/test-wbp-001', 'category': 'test'},
    {'title': 'WBP Constable PYQ 2021 Solved', 'type': 'PYQ Paper', 'route': '/live-test/test-wbp-001', 'category': 'pyq'},
    {'title': 'General Knowledge Special', 'type': 'Subject Test', 'route': '/practice/topics/gk', 'category': 'subject'},
    {'title': 'Mathematics Practice', 'type': 'Subject Test', 'route': '/practice/topics/math', 'category': 'subject'},
    {'title': 'Reasoning Speed Test', 'type': 'Subject Test', 'route': '/practice/topics/reasoning', 'category': 'subject'},
    {'title': 'WBPSC Clerkship Mock Series', 'type': 'Exam Series', 'route': '/exams/wbpsc-clerkship', 'category': 'exam'},
    {'title': 'SSC GD Constable Series', 'type': 'Exam Series', 'route': '/exams/ssc-gd', 'category': 'exam'},
    {'title': 'Railway Group D Practice', 'type': 'Exam Series', 'route': '/exams/railway-group-d', 'category': 'exam'},
  ];

  @override
  void initState() {
    super.initState();
    final saved = LocalStorageService.getTargetExam();
    if (saved != null && saved.isNotEmpty) {
      _targetExam = saved;
    }
    _startBannerAutoScroll();
  }

  void _startBannerAutoScroll() {
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_bannerController.hasClients) {
        final nextPage = (_currentBannerPage + 1) % 3;
        _bannerController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _handleTabNavigation(int tabIndex, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(tabIndex);
    } else {
      context.go(route);
    }
  }

  void _openLiveSearchModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildLiveSearchSheet(ctx),
    );
  }

  Widget _buildLiveSearchSheet(BuildContext context) {
    return StatefulBuilder(
      builder: (context, setModalState) {
        final query = _searchController.text.trim().toLowerCase();
        final results = query.isEmpty
            ? _searchableItems
            : _searchableItems.where((item) {
                final t = (item['title'] as String).toLowerCase();
                final typ = (item['type'] as String).toLowerCase();
                return t.contains(query) || typ.contains(query);
              }).toList();

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Grab handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Search Input Inside Sheet
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  onChanged: (val) => setModalState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search mock tests, subjects, exams...',
                    hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary, size: 22),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF64748B)),
                            onPressed: () {
                              _searchController.clear();
                              setModalState(() {});
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Quick Filter Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildSearchFilterChip('WBP Constable', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('Mock Test', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('General Knowledge', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('Mathematics', setModalState),
                    const SizedBox(width: 8),
                    _buildSearchFilterChip('PYQ', setModalState),
                  ],
                ),
              ),

              const SizedBox(height: 14),
              Text(
                '${results.length} Results Found',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 8),

              // Search Results List
              Expanded(
                child: results.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_off_rounded, size: 48, color: Color(0xFFCBD5E1)),
                            const SizedBox(height: 10),
                            Text(
                              'No tests or topics found for "$query"',
                              style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: results.length,
                        separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        itemBuilder: (context, idx) {
                          final item = results[idx];
                          final isTest = item['category'] == 'test';
                          final isExam = item['category'] == 'exam';

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isTest
                                    ? const Color(0xFFEFF6FF)
                                    : isExam
                                        ? const Color(0xFFFEF3C7)
                                        : const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isTest
                                    ? Icons.assignment_outlined
                                    : isExam
                                        ? Icons.school_outlined
                                        : Icons.menu_book_outlined,
                                color: isTest
                                    ? AppColors.primary
                                    : isExam
                                        ? const Color(0xFFD97706)
                                        : const Color(0xFF10B981),
                                size: 20,
                              ),
                            ),
                            title: Text(
                              item['title'] as String,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.navy),
                            ),
                            subtitle: Text(
                              item['type'] as String,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Open',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                            onTap: () {
                              Navigator.pop(context);
                              context.push(item['route'] as String);
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchFilterChip(String label, StateSetter setModalState) {
    return GestureDetector(
      onTap: () {
        _searchController.text = label;
        setModalState(() {});
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
        ),
      ),
    );
  }

  void _openSupportWhatsApp() async {
    final uri = Uri.parse('https://wa.me/919547771118?text=Hello%20PracticeKoro%20Support');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            await Future.delayed(const Duration(milliseconds: 300));
            if (mounted) setState(() {});
          },
          color: AppColors.primary,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 90), // Bottom padding for floating navbar
            children: [
              // 1. Top Bar with Official Original Logo
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.asset(
                      'assets/images/logo.png',
                      width: 34,
                      height: 34,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => Container(
                        width: 34,
                        height: 34,
                        color: AppColors.primary,
                        child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'PracticeKoro',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const Spacer(),

                  // Headset / Support Icon (WhatsApp Helpline)
                  IconButton(
                    icon: const Icon(Icons.headset_mic_outlined, size: 22, color: Color(0xFF475569)),
                    onPressed: _openSupportWhatsApp,
                  ),

                  // Notification Bell with Red Dot
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_none_rounded, size: 24, color: Color(0xFF475569)),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Notifications: 3 new mock tests added!'),
                              duration: Duration(seconds: 2),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      ),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: Color(0xFFEF4444),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Profile Avatar
                  GestureDetector(
                    onTap: () => _handleTabNavigation(4, '/profile'),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFEFF6FF),
                        border: Border.all(color: AppColors.primary, width: 1.5),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'S',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // 2. Greeting Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Hi, Susanta! 👋',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppColors.navy,
                          letterSpacing: -0.4,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        "Let's practice and get better today.",
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const Text('✨', style: TextStyle(fontSize: 22)),
                ],
              ),
              const SizedBox(height: 14),

              // 3. Interactive Search Bar
              GestureDetector(
                onTap: _openLiveSearchModal,
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Search tests, topics, exam...',
                          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        ),
                      ),
                      Icon(Icons.tune_rounded, color: Color(0xFF94A3B8), size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 4. Overhauled Responsive Hero Multi-Banner Carousel
              SizedBox(
                height: 168,
                child: PageView(
                  controller: _bannerController,
                  onPageChanged: (idx) => setState(() => _currentBannerPage = idx),
                  children: [
                    // Slide 1: WBP Constable Series
                    _buildBannerCard(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E3A8A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      tag: '🔥 MOST POPULAR',
                      tagColor: const Color(0xFFFEF3C7),
                      tagTextColor: const Color(0xFFD97706),
                      title: '$_targetExam 2024\nFull Mock Series',
                      subtitle: '85 Tests • Bilingual (বাংলা ও Eng)',
                      buttonText: 'Start Now →',
                      iconData: Icons.local_police_rounded,
                      iconBgColor: const Color(0xFF3B82F6),
                      onTap: () => context.push('/exams/wbp-constable'),
                    ),

                    // Slide 2: WBPSC Clerkship Master Series
                    _buildBannerCard(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF064E3B), Color(0xFF0D9488)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      tag: '⭐ NEW LAUNCH',
                      tagColor: const Color(0xFFCCFBF1),
                      tagTextColor: const Color(0xFF0F766E),
                      title: 'WBPSC Clerkship 2024\nComplete Mock Series',
                      subtitle: '50 Tests • Previous 10 Yr PYQs',
                      buttonText: 'Explore Tests →',
                      iconData: Icons.school_rounded,
                      iconBgColor: const Color(0xFF10B981),
                      onTap: () => context.push('/exams/wbpsc-clerkship'),
                    ),

                    // Slide 3: All-Access Pro Pass
                    _buildBannerCard(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF4C1D95), Color(0xFF7C3AED)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      tag: '👑 70% OFF SPECIAL',
                      tagColor: const Color(0xFFEDE9FE),
                      tagTextColor: const Color(0xFF6D28D9),
                      title: 'PracticeKoro Pro Pass\nAll Bengal Exams',
                      subtitle: 'Universal access to all test series',
                      buttonText: 'Get Pro Pass →',
                      iconData: Icons.workspace_premium_rounded,
                      iconBgColor: const Color(0xFFF59E0B),
                      onTap: () => context.push('/subscription'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Carousel Dots Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (idx) {
                  final isCurrent = idx == _currentBannerPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: isCurrent ? 20 : 6,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isCurrent ? AppColors.primary : const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),

              const SizedBox(height: 18),

              // 5. Daily Live Quiz / Today's Challenge Section
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                        ),
                      ),
                      child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              const Text(
                                'LIVE NOW • Ends in 4h',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFB45309),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'Daily GK & Current Affairs',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF78350F),
                            ),
                          ),
                          const Text(
                            '15 Questions • 15 Mins • Free Entry',
                            style: TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => context.push('/live-test/test-wbp-001'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD97706),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      child: const Text('Start Quiz', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // 6. Quick Action Squircle Grid (3x2)
              GridView.count(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.05,
                children: [
                  _buildQuickActionSquircle(
                    label: 'Mock Test',
                    icon: Icons.assignment_outlined,
                    iconColor: const Color(0xFF0158FC),
                    bgColor: const Color(0xFFEFF6FF),
                    onTap: () => _handleTabNavigation(1, '/exams'),
                  ),
                  _buildQuickActionSquircle(
                    label: 'Practice',
                    icon: Icons.menu_book_outlined,
                    iconColor: const Color(0xFF10B981),
                    bgColor: const Color(0xFFECFDF5),
                    onTap: () => _handleTabNavigation(2, '/practice'),
                  ),
                  _buildQuickActionSquircle(
                    label: 'PYQ',
                    icon: Icons.history_edu_outlined,
                    iconColor: const Color(0xFF06B6D4),
                    bgColor: const Color(0xFFECFEFF),
                    onTap: () => context.push('/practice/topics/math'),
                  ),
                  _buildQuickActionSquircle(
                    label: 'Weak Topics',
                    icon: Icons.trending_down_rounded,
                    iconColor: const Color(0xFFF59E0B),
                    bgColor: const Color(0xFFFEF3C7),
                    onTap: () => context.push('/practice/topics/reasoning'),
                  ),
                  _buildQuickActionSquircle(
                    label: 'Saved',
                    icon: Icons.bookmark_border_rounded,
                    iconColor: const Color(0xFFEF4444),
                    bgColor: const Color(0xFFFEF2F2),
                    onTap: () => context.push('/saved-questions'),
                  ),
                  _buildQuickActionSquircle(
                    label: 'Results',
                    icon: Icons.bar_chart_rounded,
                    iconColor: const Color(0xFF8B5CF6),
                    bgColor: const Color(0xFFF5F3FF),
                    onTap: () => _handleTabNavigation(3, '/leaderboard'),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // 7. Popular Bengal Exams Slider Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Popular Bengal Exams',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.navy),
                  ),
                  TextButton(
                    onPressed: () => _handleTabNavigation(1, '/exams'),
                    child: const Text('View All ›', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              SizedBox(
                height: 120,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildPopularExamItem(
                      title: 'WBP Constable',
                      testsCount: '85 Tests',
                      emblemPath: 'assets/images/exams/emblem_wbp.png',
                      onTap: () => context.push('/exams/wbp-constable'),
                    ),
                    _buildPopularExamItem(
                      title: 'WBPSC Clerkship',
                      testsCount: '50 Tests',
                      emblemPath: 'assets/images/exams/emblem_wbpsc.png',
                      onTap: () => context.push('/exams/wbpsc-clerkship'),
                    ),
                    _buildPopularExamItem(
                      title: 'Kolkata Police SI',
                      testsCount: '45 Tests',
                      emblemPath: 'assets/images/exams/emblem_wbp.png',
                      onTap: () => context.push('/exams/kp-police-si'),
                    ),
                    _buildPopularExamItem(
                      title: 'Railway Group D',
                      testsCount: '75 Tests',
                      emblemPath: 'assets/images/exams/emblem_railway.png',
                      onTap: () => context.push('/exams/railway-group-d'),
                    ),
                    _buildPopularExamItem(
                      title: 'SSC GD Constable',
                      testsCount: '60 Tests',
                      emblemPath: 'assets/images/exams/emblem_ssc.png',
                      onTap: () => context.push('/exams/ssc-gd'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 8. Subject-wise Quick Practice Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Subject-wise Practice',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.navy),
                  ),
                  TextButton(
                    onPressed: () => _handleTabNavigation(2, '/practice'),
                    child: const Text('All Subjects ›', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              SizedBox(
                height: 94,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildSubjectPracticePill(
                      subject: 'General Knowledge',
                      count: '1,520 Qs',
                      color: const Color(0xFF2563EB),
                      bgColor: const Color(0xFFEFF6FF),
                      icon: Icons.public_rounded,
                      onTap: () => context.push('/practice/topics/gk'),
                    ),
                    _buildSubjectPracticePill(
                      subject: 'Mathematics',
                      count: '1,240 Qs',
                      color: const Color(0xFF10B981),
                      bgColor: const Color(0xFFECFDF5),
                      icon: Icons.calculate_rounded,
                      onTap: () => context.push('/practice/topics/math'),
                    ),
                    _buildSubjectPracticePill(
                      subject: 'Reasoning',
                      count: '960 Qs',
                      color: const Color(0xFFF59E0B),
                      bgColor: const Color(0xFFFEF3C7),
                      icon: Icons.psychology_rounded,
                      onTap: () => context.push('/practice/topics/reasoning'),
                    ),
                    _buildSubjectPracticePill(
                      subject: 'English Grammar',
                      count: '1,010 Qs',
                      color: const Color(0xFF8B5CF6),
                      bgColor: const Color(0xFFF5F3FF),
                      icon: Icons.translate_rounded,
                      onTap: () => context.push('/practice/topics/gk'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 9. Continue Your Practice Card (With Real Logo & 12/20 Progress)
              const Text(
                'Continue Your Practice',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.navy),
              ),
              const SizedBox(height: 8),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 38,
                            height: 38,
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => Container(
                              width: 38,
                              height: 38,
                              color: AppColors.primary,
                              child: const Icon(Icons.school, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'General Knowledge Practice',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.navy),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Topic Practice • Indian Polity',
                                style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => context.push('/live-test/test-wbp-001'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: const Text('Continue', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('Progress: 12 / 20 Questions', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        Text('60% Done', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: const LinearProgressIndicator(
                        value: 0.6,
                        minHeight: 5,
                        backgroundColor: Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 10. Daily Motivation & Study Tip Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.tips_and_updates_rounded, color: Color(0xFFF59E0B), size: 26),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        '💡 Study Strategy: Consistent 30 minutes daily mock practice yields 3x higher retention than weekend cramming.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBannerCard({
    required Gradient gradient,
    required String tag,
    required Color tagColor,
    required Color tagTextColor,
    required String title,
    required String subtitle,
    required String buttonText,
    required IconData iconData,
    required Color iconBgColor,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Stack(
        children: [
          // Right circular graphic emblem
          Positioned(
            right: 0,
            bottom: 0,
            top: 0,
            child: Center(
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: iconBgColor.withValues(alpha: 0.25),
                ),
                child: Icon(iconData, color: Colors.white.withValues(alpha: 0.9), size: 48),
              ),
            ),
          ),

          // Left Content
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: tagColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tag,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: tagTextColor,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  height: 1.15,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFFE2E8F0),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: onTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        buttonText,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionSquircle({
    required String label,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: iconColor.withValues(alpha: 0.15)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 26),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: iconColor,
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopularExamItem({
    required String title,
    required String testsCount,
    required String emblemPath,
    required VoidCallback onTap,
  }) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Image.asset(
                emblemPath,
                width: 32,
                height: 32,
                errorBuilder: (_, _, _) => const Icon(Icons.school, size: 28, color: AppColors.primary),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.navy),
                  ),
                  Text(
                    testsCount,
                    style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubjectPracticePill({
    required String subject,
    required String count,
    required Color color,
    required Color bgColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 22),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color),
                  ),
                  Text(
                    count,
                    style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
