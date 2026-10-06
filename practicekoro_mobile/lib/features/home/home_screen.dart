import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/exam_model.dart';
import '../../data/repositories/catalog_repository.dart';

final homeExamsProvider = FutureProvider<List<ExamModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getExams();
});

class HomeScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const HomeScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

typedef PracticeKoroHomeScreen = HomeScreen;

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _userName = 'Candidate';
  int _bannerIndex = 0;
  Timer? _bannerTimer;
  final PageController _bannerController = PageController();

  @override
  void initState() {
    super.initState();
    _loadUserMeta();
    _startBannerTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(catalogRepositoryProvider).setupRealtimeListeners(ref);
      }
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  void _startBannerTimer() {
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_bannerController.hasClients) return;
      final count = _bannerCount > 0 ? _bannerCount : 3;
      final next = (_bannerIndex + 1) % count;
      _bannerController.animateToPage(
        next,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeInOut,
      );
    });
  }

  Future<void> _loadUserMeta() async {
    final name = LocalStorageService.getUserName();
    if (mounted) {
      setState(() {
        _userName = name.isNotEmpty ? name : 'Candidate';
      });
    }
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    if (hour >= 17 && hour < 21) return 'Good Evening,';
    return 'Good Night,';
  }

  void _navigateToTab(int index, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(route);
    }
  }

  int _bannerCount = 3;

  @override
  Widget build(BuildContext context) {
    final popularSeriesAsync = ref.watch(popularTestSeriesCardsProvider);
    final popularSeries = popularSeriesAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final bannersAsync = ref.watch(heroBannersProvider);
    final banners = bannersAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final popularExamsAsync = ref.watch(popularExamsProvider);
    final popularExams = popularExamsAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final homeExamsAsync = ref.watch(homeExamsProvider);
    final homeExams = homeExamsAsync.asData?.value ?? const <ExamModel>[];
    final continueAttemptsAsync = ref.watch(inProgressAttemptsProvider);
    final continueAttempts = continueAttemptsAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final dailyContentAsync = ref.watch(dailyContentProvider);
    final dailyContent = dailyContentAsync.asData?.value ?? const <String, dynamic>{};

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(popularTestSeriesCardsProvider);
            ref.invalidate(popularExamsProvider);
            ref.invalidate(homeExamsProvider);
            ref.invalidate(allTestSeriesProvider);
            ref.invalidate(heroBannersProvider);
            ref.invalidate(inProgressAttemptsProvider);
            ref.invalidate(dailyContentProvider);
            await _loadUserMeta();
          },
          color: const Color(0xFF026BFC),
          child: ListView(
            padding: PKBottomSpacing.edgeInsets(
              context,
              horizontal: 16,
              top: 10,
            ),
            children: [
              // 1. Top Bar (Brand logo + Search + Notification)
              _buildTopBar(),
              const SizedBox(height: 14),

              // 2. Greeting & Motivation
              _buildGreeting(),
              const SizedBox(height: 16),

              // 3. Promotional Banner Carousel (Admin-controlled)
              _buildBannerCarousel(banners),
              const SizedBox(height: 18),

              // Quick Action Shortcuts: Audio Book, Saved Questions, Rank, Live Tests
              _buildQuickShortcutsSection(),
              const SizedBox(height: 22),

              // 4. Exams Horizontal Shortcut Tiles (Admin-controlled)
              _buildExamsSection(popularExams, homeExams),
              const SizedBox(height: 22),

              // 5. Popular Mock Test Series (Horizontal Carousel, Admin-controlled)
              _buildPopularSeriesSection(popularSeries),
              const SizedBox(height: 22),

              // 6. Continue Practice (Horizontal Small Cards, Live Supabase)
              _buildContinuePracticeSection(continueAttempts),
              const SizedBox(height: 22),

              // 7. Daily Practice (Highlighted Challenge Card, Admin-controlled)
              _buildDailyPracticeSection(dailyContent),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // 1. Top Bar
  Widget _buildTopBar() {
    return Row(
      children: [
        // Brand Name + Official Logo
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset(
                'assets/images/logo-circle.png',
                width: 32,
                height: 32,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFF026BFC),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            RichText(
              text: const TextSpan(
                children: [
                  TextSpan(
                    text: 'Practice',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.6,
                    ),
                  ),
                  TextSpan(
                    text: 'Koro',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF026BFC),
                      letterSpacing: -0.6,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const Spacer(),
        // Search Icon
        InkWell(
          onTap: () => _navigateToTab(1, '/test-series'),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.search_rounded,
              color: Color(0xFF334155),
              size: 19,
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Notification Bell Icon with Dot
        InkWell(
          onTap: () => context.push('/notifications'),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                const Center(
                  child: Icon(
                    Icons.notifications_none_rounded,
                    color: Color(0xFF334155),
                    size: 19,
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 9,
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
          ),
        ),
      ],
    );
  }

  // 2. Greeting Section
  Widget _buildGreeting() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _getTimeGreeting(),
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '$_userName 👋',
          style: const TextStyle(
            fontSize: 23,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.bolt_rounded, size: 15, color: Color(0xFFD97706)),
              SizedBox(width: 5),
              Flexible(
                child: Text(
                  '“Consistency today, success tomorrow.”',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF334155),
                    letterSpacing: -0.1,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _handleBannerTap(String link) {
    if (link.isEmpty) {
      _navigateToTab(1, '/test-series');
      return;
    }
    if (link.startsWith('http://') || link.startsWith('https://')) {
      final uri = Uri.tryParse(link);
      if (uri != null &&
          (uri.host == 'practicekoro.online' || uri.host == 'www.practicekoro.online')) {
        _handleBannerTap(uri.path);
      } else {
        launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
      }
      return;
    }
    if (link.startsWith('/')) {
      if (link == '/pricing' || link == '/subscription') {
        context.push('/subscription');
      } else if (link == '/exams' || link == '/test-series') {
        _navigateToTab(1, '/test-series');
      } else if (link == '/practice') {
        _navigateToTab(2, '/practice');
      } else {
        context.push(link);
      }
      return;
    }
    if (link.startsWith('test-series/') || link.startsWith('exams/')) {
      context.push('/$link');
    } else {
      context.push('/test-series/$link');
    }
  }

  // 3. Hero Promotional Banner Carousel (Admin-controlled)
  Widget _buildBannerCarousel(List<Map<String, dynamic>> banners) {
    final slides = banners.isNotEmpty
        ? banners.map((b) {
            final route = (b['primary_cta_link'] ??
                    b['primaryCtaLink'] ??
                    b['linkUrl'] ??
                    b['link_url'] ??
                    b['route'] ??
                    '/test-series')
                .toString();

            final rawImg = (b['mobile_image_url'] ??
                    b['mobileImageUrl'] ??
                    b['image_url'] ??
                    b['imageUrl'] ??
                    b['image'] ??
                    '')
                .toString();

            final resolvedImg = ImageUrlHelper.resolveAdminImageUrl(rawImg) ?? '';

            return {
              'tag': (b['badge_text'] ?? b['badgeText'] ?? b['badge'] ?? 'Target 2025').toString(),
              'title': (b['title'] ?? 'Mock Test Series').toString(),
              'sub': (b['subtitle'] ?? b['description'] ?? 'Real Exam Pattern • Latest Questions • Detailed Analysis').toString(),
              'cta': (b['primary_cta_text'] ?? b['primaryCtaText'] ?? b['ctaText'] ?? b['cta_text'] ?? 'Start Practicing →').toString(),
              'route': route,
              'image': resolvedImg,
              'theme': (b['theme_gradient'] ?? b['themeGradient'] ?? 'blue').toString(),
              'type': (b['banner_type'] ?? b['bannerType'] ?? 'card').toString(),
            };
          }).toList()
        : [
            {
              'tag': 'Target 2025',
              'title': 'WBP Constable Mock Test Series',
              'sub': 'Real Exam Pattern • Latest Questions • Detailed Analysis',
              'cta': 'Start Practicing →',
              'route': '/test-details/test-wbp-001',
              'image': '',
              'theme': 'blue',
              'type': 'card',
            },
            {
              'tag': 'New Syllabus',
              'title': 'WBSSC Group C & D Full Mocks',
              'sub': 'State-level Rank • Topic & Sectional Tests',
              'cta': 'Explore Tests →',
              'route': '/test-series/wbssc-group-c',
              'image': '',
              'theme': 'emerald',
              'type': 'card',
            },
            {
              'tag': 'Special Series',
              'title': 'Railway NTPC & Food SI PYQs',
              'sub': '10 Years Previous Papers with Explanations',
              'cta': 'Start Now →',
              'route': '/test-series/railway-ntpc',
              'image': '',
              'theme': 'amber',
              'type': 'card',
            },
          ];

    _bannerCount = slides.length;

    return Column(
      children: [
        SizedBox(
          height: 156,
          child: PageView.builder(
            controller: _bannerController,
            itemCount: slides.length,
            onPageChanged: (idx) {
              setState(() {
                _bannerIndex = idx;
              });
            },
            itemBuilder: (context, i) {
              final item = slides[i];
              final isFullImage = item['type'] == 'full_image' &&
                  item['image'] != null &&
                  item['image']!.isNotEmpty;
              final gradientColors = ImageUrlHelper.getThemeGradient(item['theme']);

              return InkWell(
                onTap: () => _handleBannerTap(item['route']!),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradientColors,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: gradientColors.last.withValues(alpha: 0.22),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: isFullImage
                      ? Stack(
                          fit: StackFit.expand,
                          children: [
                            PkAdminImage(
                              imageUrl: item['image'],
                              fit: BoxFit.cover,
                            ),
                            // Subtle gradient bottom scrim
                            Positioned(
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: 60,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.transparent,
                                      Colors.black.withValues(alpha: 0.65),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            if (item['title']!.isNotEmpty && item['title'] != 'Hero Banner')
                              Positioned(
                                left: 14,
                                right: 14,
                                bottom: 10,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['title']!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF026BFC),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Text(
                                        item['cta']!,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        )
                      : Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          child: Row(
                            children: [
                              // Text Info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.16),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: Colors.white.withValues(alpha: 0.28),
                                        ),
                                      ),
                                      child: Text(
                                        item['tag']!,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 0.4,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      item['title']!,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        height: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item['sub']!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.82),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.22),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: Colors.white.withValues(alpha: 0.35),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            item['cta']!,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Emblem or Admin-uploaded logo
                              Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.12),
                                  shape: BoxShape.circle,
                                ),
                                child: ClipOval(
                                  child: PkAdminImage(
                                    imageUrl: item['image'],
                                    fallbackExamTitle: item['title'],
                                    fallbackIcon: Icons.local_police_rounded,
                                    fallbackColor: Colors.white,
                                    width: 72,
                                    height: 72,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        // Dots Indicator
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(slides.length, (idx) {
            final active = idx == _bannerIndex;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 6,
              height: 5,
              decoration: BoxDecoration(
                color: active ? const Color(0xFF026BFC) : const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        ),
      ],
    );
  }

  // Quick Action Shortcuts Section (Audio Book, Saved Questions, Rank, Live Tests)
  Widget _buildQuickShortcutsSection() {
    final shortcuts = [
      {
        'title': 'Audio Book',
        'sub': 'Listen & Learn',
        'icon': Icons.headphones_rounded,
        'iconColor': const Color(0xFF0066FF),
        'gradient': const LinearGradient(
          colors: [Color(0xFF007DFE), Color(0xFF0056D6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        'shadow': const Color(0xFF0066FF),
        'route': '/audio-books',
      },
      {
        'title': 'Saved Questions',
        'sub': 'Bookmarks',
        'icon': Icons.bookmark_outline_rounded,
        'iconColor': const Color(0xFF00994A),
        'gradient': const LinearGradient(
          colors: [Color(0xFF00B75F), Color(0xFF008F47)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        'shadow': const Color(0xFF00B75F),
        'route': '/saved-questions',
      },
      {
        'title': 'Rank',
        'sub': 'Leaderboard',
        'icon': Icons.emoji_events_outlined,
        'iconColor': const Color(0xFFEE5A00),
        'gradient': const LinearGradient(
          colors: [Color(0xFFFF9400), Color(0xFFF05B00)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        'shadow': const Color(0xFFFF9400),
        'route': '/leaderboard',
      },
      {
        'title': 'Live Tests',
        'sub': 'Compete Live',
        'icon': Icons.sensors_rounded,
        'iconColor': const Color(0xFFE91E63),
        'gradient': const LinearGradient(
          colors: [Color(0xFFFF2B6D), Color(0xFFC7155C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        'shadow': const Color(0xFFFF2B6D),
        'route': '/exams',
      },
    ];

    return SizedBox(
      height: 116,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        clipBehavior: Clip.none,
        itemCount: shortcuts.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final s = shortcuts[index];
          final grad = s['gradient'] as LinearGradient;
          final shadowColor = s['shadow'] as Color;
          final iconColor = s['iconColor'] as Color;
          final iconData = s['icon'] as IconData;
          final title = s['title'] as String;
          final sub = s['sub'] as String;
          final route = s['route'] as String;

          return InkWell(
            onTap: () {
              if (title == 'Live Tests') {
                final liveTest = ref.read(activeLiveTestProvider).asData?.value;
                if (liveTest != null && liveTest.testId.isNotEmpty) {
                  context.push(
                    '/test-details/${liveTest.testId}?title=${Uri.encodeComponent(liveTest.title)}&isPro=false',
                  );
                } else {
                  _navigateToTab(1, '/test-series');
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('No live test in progress. Explore available test series!'),
                      duration: Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              } else if (route == '/exams') {
                _navigateToTab(1, '/test-series');
              } else {
                context.push(route);
              }
            },
            borderRadius: BorderRadius.circular(18),
            child: Container(
              width: 172,
              decoration: BoxDecoration(
                gradient: grad,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: shadowColor.withValues(alpha: 0.28),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Stack(
                  children: [
                    // Watermark in bottom right corner
                    Positioned(
                      right: -8,
                      bottom: -12,
                      child: Icon(
                        iconData,
                        size: 76,
                        color: Colors.white.withValues(alpha: 0.16),
                      ),
                    ),
                    // Foreground content
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Top row: rounded squircle icon container & circular chevron button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.06),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Icon(
                                  iconData,
                                  color: iconColor,
                                  size: 21,
                                ),
                              ),
                              Container(
                                width: 26,
                                height: 26,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.chevron_right_rounded,
                                  color: iconColor,
                                  size: 19,
                                ),
                              ),
                            ],
                          ),
                          // Bottom content: Title and Subtitle
                          Expanded(
                            child: Align(
                              alignment: Alignment.bottomLeft,
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.bottomLeft,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      title,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                    const SizedBox(height: 1),
                                    Text(
                                      sub,
                                      style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.85),
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
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
        },
      ),
    );
  }

  // 4. Exams Horizontal Shortcut Tiles (Admin-controlled)
  Widget _buildExamsSection(
    List<Map<String, dynamic>> popularExams,
    List<ExamModel> homeExams,
  ) {
    List<Map<String, dynamic>> exams;
    if (popularExams.isNotEmpty) {
      final palette = [
        {'color': const Color(0xFFEF4444), 'bg': const Color(0xFFFEE2E2), 'icon': Icons.shield_rounded},
        {'color': const Color(0xFF10B981), 'bg': const Color(0xFFD1FAE5), 'icon': Icons.account_balance_rounded},
        {'color': const Color(0xFF026BFC), 'bg': const Color(0xFFDBEAFE), 'icon': Icons.military_tech_rounded},
        {'color': const Color(0xFFEC4899), 'bg': const Color(0xFFFCE7F3), 'icon': Icons.train_rounded},
        {'color': const Color(0xFF8B5CF6), 'bg': const Color(0xFFEDE9FE), 'icon': Icons.family_restroom_rounded},
        {'color': const Color(0xFFF59E0B), 'bg': const Color(0xFFFEF3C7), 'icon': Icons.restaurant_rounded},
      ];
      exams = popularExams.asMap().entries.map((entry) {
        final i = entry.key;
        final e = entry.value;
        final style = palette[i % palette.length];
        final slug = (e['slug'] ?? e['id'] ?? '').toString();
        final title = (e['title'] ?? 'Exam').toString();
        final customRoute = (e['route'] as String?)?.trim();
        final emblemUrl = (e['cardEmblemUrl'] ?? e['cardLogoUrl']) as String?;
        final targetRoute = (customRoute != null &&
                customRoute.isNotEmpty &&
                !customRoute.startsWith('/test-series/') &&
                !customRoute.startsWith('/exams/'))
            ? customRoute
            : '/test-series?exam=${Uri.encodeComponent(slug)}&title=${Uri.encodeComponent(title)}';
        return {
          'title': title,
          'slug': slug,
          'icon': style['icon'] as IconData,
          'color': style['color'] as Color,
          'bg': style['bg'] as Color,
          'route': targetRoute,
          'emblemUrl': emblemUrl,
        };
      }).toList();
    } else if (homeExams.isNotEmpty) {
      final palette = [
        {'color': const Color(0xFFEF4444), 'bg': const Color(0xFFFEE2E2), 'icon': Icons.shield_rounded},
        {'color': const Color(0xFF10B981), 'bg': const Color(0xFFD1FAE5), 'icon': Icons.account_balance_rounded},
        {'color': const Color(0xFF026BFC), 'bg': const Color(0xFFDBEAFE), 'icon': Icons.military_tech_rounded},
        {'color': const Color(0xFFEC4899), 'bg': const Color(0xFFFCE7F3), 'icon': Icons.train_rounded},
        {'color': const Color(0xFF8B5CF6), 'bg': const Color(0xFFEDE9FE), 'icon': Icons.family_restroom_rounded},
        {'color': const Color(0xFFF59E0B), 'bg': const Color(0xFFFEF3C7), 'icon': Icons.restaurant_rounded},
      ];
      exams = homeExams.asMap().entries.map((entry) {
        final i = entry.key;
        final e = entry.value;
        final style = palette[i % palette.length];
        final slug = e.slug.isNotEmpty ? e.slug : e.id;
        return {
          'title': e.title,
          'slug': slug,
          'icon': style['icon'] as IconData,
          'color': style['color'] as Color,
          'bg': style['bg'] as Color,
          'route': '/test-series?exam=${Uri.encodeComponent(slug)}&title=${Uri.encodeComponent(e.title)}',
          'emblemUrl': null,
        };
      }).toList();
    } else {
      exams = [
        {
          'title': 'WBP Constable',
          'slug': 'wbp-constable',
          'icon': Icons.shield_rounded,
          'color': const Color(0xFFEF4444),
          'bg': const Color(0xFFFEE2E2),
          'route': '/test-series?exam=wbp-constable&title=WBP%20Constable',
          'emblemUrl': null,
        },
        {
          'title': 'WBSSC Group C',
          'slug': 'wbssc-group-c',
          'icon': Icons.account_balance_rounded,
          'color': const Color(0xFF10B981),
          'bg': const Color(0xFFD1FAE5),
          'route': '/test-series?exam=wbssc-group-c&title=WBSSC%20Group%20C',
          'emblemUrl': null,
        },
        {
          'title': 'WBSSC Group D',
          'slug': 'wbssc-group-d',
          'icon': Icons.military_tech_rounded,
          'color': const Color(0xFF026BFC),
          'bg': const Color(0xFFDBEAFE),
          'route': '/test-series?exam=wbssc-group-d&title=WBSSC%20Group%20D',
          'emblemUrl': null,
        },
        {
          'title': 'Railway (NTPC)',
          'slug': 'railway-ntpc',
          'icon': Icons.train_rounded,
          'color': const Color(0xFFEC4899),
          'bg': const Color(0xFFFCE7F3),
          'route': '/test-series?exam=railway-ntpc&title=Railway%20NTPC',
          'emblemUrl': null,
        },
        {
          'title': 'ICDS Supervisor',
          'slug': 'icds',
          'icon': Icons.family_restroom_rounded,
          'color': const Color(0xFF8B5CF6),
          'bg': const Color(0xFFEDE9FE),
          'route': '/test-series?exam=icds&title=ICDS%20Supervisor',
          'emblemUrl': null,
        },
        {
          'title': 'Food SI',
          'slug': 'food-si',
          'icon': Icons.restaurant_rounded,
          'color': const Color(0xFFF59E0B),
          'bg': const Color(0xFFFEF3C7),
          'route': '/test-series?exam=food-si&title=Food%20SI',
          'emblemUrl': null,
        },
      ];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFDBEAFE)),
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    color: Color(0xFF026BFC),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Exams',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.4,
                  ),
                ),
              ],
            ),
            InkWell(
              onTap: () => _navigateToTab(1, '/test-series'),
              borderRadius: BorderRadius.circular(8),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Text(
                  'View All →',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF026BFC),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 122,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: exams.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final exam = exams[i];
              return InkWell(
                onTap: () => context.push(exam['route'] as String),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 98,
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x080F172A),
                        blurRadius: 10,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: exam['bg'] as Color,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: (exam['color'] as Color).withValues(alpha: 0.22),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: (exam['color'] as Color).withValues(alpha: 0.12),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(5),
                          child: PkAdminImage(
                            imageUrl: exam['emblemUrl'] as String?,
                            fallbackExamTitle: exam['title'] as String,
                            fallbackIcon: exam['icon'] as IconData,
                            fallbackColor: exam['color'] as Color,
                            width: 32,
                            height: 32,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        exam['title'] as String,
                        maxLines: 2,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                          height: 1.15,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: (exam['bg'] as Color).withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          'Series →',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: exam['color'] as Color,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
            },
          ),
        ),
      ],
    );
  }

  // 5. Popular Mock Test Series (Horizontal Carousel matching reference design)
  Widget _buildPopularSeriesSection(List<Map<String, dynamic>> seriesList) {
    final defaultSeries = [
      {
        'id': 'wbp-constable',
        'title': 'WBP Constable',
        'badgeText': 'Most Popular',
        'mocks': 12,
        'topics': 48,
        'pyqs': 15,
        'route': '/test-series?exam=wbp-constable&title=WBP%20Constable',
      },
      {
        'id': 'railway-ntpc',
        'title': 'Railway (NTPC)',
        'badgeText': 'Trending Now',
        'mocks': 15,
        'topics': 60,
        'pyqs': 25,
        'route': '/test-series?exam=railway-ntpc&title=Railway%20NTPC',
      },
      {
        'id': 'ssc-mts',
        'title': 'SSC MTS',
        'badgeText': null,
        'mocks': 18,
        'topics': 32,
        'pyqs': 14,
        'route': '/test-series?exam=ssc-mts&title=SSC%20MTS',
      },
      {
        'id': 'wbssc-group-c',
        'title': 'WBSSC Group C',
        'badgeText': null,
        'mocks': 10,
        'topics': 35,
        'pyqs': 12,
        'route': '/test-series?exam=wbssc-group-c&title=WBSSC%20Group%20C',
      },
    ];

    final displayList = seriesList.isNotEmpty
        ? seriesList.map((item) {
            final route = (item['route'] as String?)?.trim();
            final seriesId = (item['testSeriesId'] ?? item['id'] ?? 'wbp-constable').toString();
            return {
              'id': seriesId,
              'title': (item['title'] ?? 'Mock Test Series').toString(),
              'badgeText': item['badgeText'] as String?,
              'mocks': (item['fullMockCount'] as num?)?.toInt() ?? 12,
              'topics': (item['topicTestCount'] as num?)?.toInt() ?? 48,
              'pyqs': (item['pyqTestCount'] as num?)?.toInt() ?? 15,
              'route': (route != null && route.isNotEmpty) ? route : '/test-series/$seriesId',
              'logoUrl': (item['cardLogoUrl'] ?? item['cardEmblemUrl']) as String?,
            };
          }).toList()
        : defaultSeries;

    final screenWidth = MediaQuery.of(context).size.width;
    // Responsive card width: ~2 cards visible on mobile with hint of 3rd
    final cardWidth = screenWidth < 500
        ? ((screenWidth - 32 - 10) / 2.05).clamp(172.0, 240.0)
        : (screenWidth < 900 ? ((screenWidth - 32 - 20) / 3.05).clamp(210.0, 270.0) : 280.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🔥 ', style: TextStyle(fontSize: 18)),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: RichText(
                        text: const TextSpan(
                          children: [
                            TextSpan(
                              text: 'Popular ',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
                                letterSpacing: -0.4,
                              ),
                            ),
                            TextSpan(
                              text: 'Test Series',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF026BFC),
                                letterSpacing: -0.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(1, '/test-series'),
              child: const Text(
                'View All →',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF026BFC),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 128,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: displayList.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final item = displayList[i];
              final title = item['title'] as String;
              final tLower = title.toLowerCase();

              // Card styling themes matching media_1791277830724.png
              final LinearGradient gradient;
              final Color borderColor;
              final String bgAsset;
              final String emblemAsset;
              final Color chevronColor;
              final bool isDarkCard;
              final String? badgeText;
              final Color badgeBg;
              final Color badgeTextColor;
              final IconData? badgeIcon;

              if (tLower.contains('wbp') || tLower.contains('police') || tLower.contains('constable')) {
                gradient = const LinearGradient(
                  colors: [Color(0xFF0052D4), Color(0xFF0A2E6E)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                );
                borderColor = const Color(0xFF1E40AF);
                bgAsset = 'assets/images/exams/bg_wbp.png';
                emblemAsset = 'assets/images/exams/emblem_series_wbp.png';
                chevronColor = const Color(0xFF0052D4);
                isDarkCard = true;
                badgeText = (item['badgeText'] as String?) ?? 'Most Popular';
                badgeBg = Colors.black.withValues(alpha: 0.35);
                badgeTextColor = const Color(0xFFFDE047);
                badgeIcon = Icons.workspace_premium_rounded;
              } else if (tLower.contains('railway') || tLower.contains('ntpc') || tLower.contains('rrb')) {
                gradient = const LinearGradient(
                  colors: [Color(0xFF7F1D1D), Color(0xFF450A0A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                );
                borderColor = const Color(0xFF991B1B);
                bgAsset = 'assets/images/exams/bg_railway.png';
                emblemAsset = 'assets/images/exams/logo_railway.png';
                chevronColor = const Color(0xFFDC2626);
                isDarkCard = true;
                badgeText = (item['badgeText'] as String?) ?? 'Trending Now';
                badgeBg = Colors.black.withValues(alpha: 0.35);
                badgeTextColor = const Color(0xFFFCA5A5);
                badgeIcon = Icons.bolt_rounded;
              } else if (tLower.contains('ssc') || tLower.contains('mts')) {
                gradient = const LinearGradient(
                  colors: [Color(0xFFFFF4DC), Color(0xFFFCE39E)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                );
                borderColor = const Color(0xFFFDE68A);
                bgAsset = 'assets/images/exams/bg_ssc.png';
                emblemAsset = 'assets/images/exams/emblem_series_ssc.png';
                chevronColor = const Color(0xFFD97706);
                isDarkCard = false;
                badgeText = item['badgeText'] as String?;
                badgeBg = const Color(0xFFFEF3C7);
                badgeTextColor = const Color(0xFFB45309);
                badgeIcon = null;
              } else {
                gradient = const LinearGradient(
                  colors: [Color(0xFF065F46), Color(0xFF022C22)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                );
                borderColor = const Color(0xFF047857);
                bgAsset = 'assets/images/exams/bg_wbpsc.png';
                emblemAsset = 'assets/images/exams/emblem_wbssc.png';
                chevronColor = const Color(0xFF10B981);
                isDarkCard = true;
                badgeText = item['badgeText'] as String?;
                badgeBg = Colors.black.withValues(alpha: 0.35);
                badgeTextColor = const Color(0xFF6EE7B7);
                badgeIcon = null;
              }

              return InkWell(
                onTap: () => context.push(item['route'] as String? ?? '/test-series/${item['id']}'),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: cardWidth,
                  height: 128,
                  decoration: BoxDecoration(
                    gradient: gradient,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderColor, width: 1.1),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0C000000),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Stack(
                      children: [
                        // Background artwork positioned on right side
                        Positioned(
                          right: -6,
                          top: 0,
                          bottom: 0,
                          width: cardWidth * 0.58,
                          child: ShaderMask(
                            shaderCallback: (rect) {
                              return const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [Colors.transparent, Colors.white],
                              ).createShader(rect);
                            },
                            blendMode: BlendMode.dstIn,
                            child: Opacity(
                              opacity: isDarkCard ? 0.75 : 0.60,
                              child: Image.asset(bgAsset, fit: BoxFit.cover),
                            ),
                          ),
                        ),

                        // Foreground content
                        Padding(
                          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Top Row: Emblem + Title & Badge + Chevron Button
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // Official Emblem
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: isDarkCard ? 0.15 : 0.65),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    padding: const EdgeInsets.all(3),
                                    child: Image.asset(emblemAsset, fit: BoxFit.contain),
                                  ),
                                  const SizedBox(width: 8),

                                  // Badge (if present) & Title
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (badgeText != null)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                            decoration: BoxDecoration(
                                              color: badgeBg,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: FittedBox(
                                              fit: BoxFit.scaleDown,
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  if (badgeIcon != null) ...[
                                                    Icon(badgeIcon, size: 8.5, color: badgeTextColor),
                                                    const SizedBox(width: 2.5),
                                                  ],
                                                  Text(
                                                    badgeText,
                                                    style: TextStyle(
                                                      fontSize: 8,
                                                      fontWeight: FontWeight.w800,
                                                      color: badgeTextColor,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        Text(
                                          title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w900,
                                            color: isDarkCard ? Colors.white : const Color(0xFF0F172A),
                                            letterSpacing: -0.2,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Circular chevron button
                                  Container(
                                    width: 22,
                                    height: 22,
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Color(0x18000000),
                                          blurRadius: 3,
                                          offset: Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                    child: Icon(
                                      Icons.chevron_right_rounded,
                                      size: 16,
                                      color: chevronColor,
                                    ),
                                  ),
                                ],
                              ),

                              // Bottom Translucent Stats Strip
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isDarkCard
                                      ? Colors.black.withValues(alpha: 0.38)
                                      : Colors.white.withValues(alpha: 0.65),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                                    children: [
                                    _buildPopularStatItem(
                                      '${item['mocks']}',
                                      'Full Mocks',
                                      Icons.description_outlined,
                                      isDarkCard ? const Color(0xFF60A5FA) : const Color(0xFF026BFC),
                                      isDarkCard,
                                    ),
                                    Container(
                                      width: 1,
                                      height: 16,
                                      color: (isDarkCard ? Colors.white : const Color(0xFFCBD5E1)).withValues(alpha: 0.25),
                                    ),
                                    _buildPopularStatItem(
                                      '${item['topics']}',
                                      'Topic Tests',
                                      Icons.layers_outlined,
                                      isDarkCard ? const Color(0xFF34D399) : const Color(0xFF10B981),
                                      isDarkCard,
                                    ),
                                    Container(
                                      width: 1,
                                      height: 16,
                                      color: (isDarkCard ? Colors.white : const Color(0xFFCBD5E1)).withValues(alpha: 0.25),
                                    ),
                                    _buildPopularStatItem(
                                      '${item['pyqs']}',
                                      'Official PYQs',
                                      Icons.assignment_outlined,
                                      isDarkCard ? const Color(0xFFA78BFA) : const Color(0xFF8B5CF6),
                                      isDarkCard,
                                    ),
                                  ],
                                ),
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
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPopularStatItem(String count, String label, IconData icon, Color iconColor, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 10, color: iconColor),
        const SizedBox(width: 2.5),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              count,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                height: 1.0,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 6.5,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white.withValues(alpha: 0.78) : const Color(0xFF64748B),
                height: 1.0,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // 6. Continue Practice (Horizontal Small Cards, Live Supabase)
  Widget _buildContinuePracticeSection(List<Map<String, dynamic>> continueAttempts) {
    final continueItems = continueAttempts.isNotEmpty
        ? continueAttempts.map((attempt) {
            final test = attempt['tests'] as Map<String, dynamic>?;
            final subjectName = test?['subjects']?['name'] ??
                test?['exams']?['title'] ??
                'General Practice';
            final testTitle = test?['title'] ?? 'Practice Test';
            final totalQ = (test?['total_questions'] as num?)?.toInt() ?? 20;
            final answeredQ = (attempt['_answered_count'] as num?)?.toInt() ?? 0;
            final progress = totalQ > 0 ? (answeredQ / totalQ).clamp(0.0, 1.0) : 0.5;
            final testId = (attempt['test_id'] ?? test?['id'] ?? '').toString();

            return {
              'subject': subjectName.toString(),
              'topic': testTitle.toString(),
              'progressText': '$answeredQ / $totalQ Questions',
              'progress': progress,
              'icon': Icons.science_rounded,
              'iconColor': const Color(0xFF10B981),
              'iconBg': const Color(0xFFD1FAE5),
              'route': '/test-runner/$testId?attemptId=${attempt['id']}',
            };
          }).toList()
        : [
            {
              'subject': 'General Science',
              'topic': 'Heat & Temperature',
              'progressText': '18 / 30 Questions',
              'progress': 0.60,
              'icon': Icons.science_rounded,
              'iconColor': const Color(0xFF10B981),
              'iconBg': const Color(0xFFD1FAE5),
              'route': '/practice/topics/general-science',
            },
            {
              'subject': 'History',
              'topic': 'Modern India',
              'progressText': '12 / 25 Questions',
              'progress': 0.48,
              'icon': Icons.auto_stories_rounded,
              'iconColor': const Color(0xFF026BFC),
              'iconBg': const Color(0xFFDBEAFE),
              'route': '/practice/topics/history',
            },
            {
              'subject': 'Mathematics',
              'topic': 'Percentage',
              'progressText': '15 / 20 Questions',
              'progress': 0.75,
              'icon': Icons.calculate_rounded,
              'iconColor': const Color(0xFF8B5CF6),
              'iconBg': const Color(0xFFEDE9FE),
              'route': '/practice/topics/mathematics',
            },
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Expanded(
              child: Row(
                children: [
                  Icon(Icons.history_rounded, size: 18, color: Color(0xFF0F172A)),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Continue Practice',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(2, '/practice'),
              child: const Text(
                'View All →',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF026BFC),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 104,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: continueItems.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final item = continueItems[i];
              return InkWell(
                onTap: () => context.push(item['route'] as String),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: 220,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
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
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: item['iconBg'] as Color,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          item['icon'] as IconData,
                          color: item['iconColor'] as Color,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              item['subject'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            Text(
                              item['topic'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(3),
                              child: LinearProgressIndicator(
                                value: item['progress'] as double,
                                minHeight: 4,
                                backgroundColor: const Color(0xFFE2E8F0),
                                valueColor: AlwaysStoppedAnimation<Color>(item['iconColor'] as Color),
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              item['progressText'] as String,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF94A3B8),
                        size: 18,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // 7. Daily Practice (Highlighted Challenge Card, Admin-controlled)
  Widget _buildDailyPracticeSection(Map<String, dynamic> dailyContent) {
    final challengeTitle = (dailyContent['challenge_title'] ??
            dailyContent['challengeTitle'] ??
            dailyContent['title'] ??
            "Today's Challenge")
        .toString();
    final challengeSubtitle = (dailyContent['challenge_subtitle'] ??
            dailyContent['challengeSubtitle'] ??
            dailyContent['subtitle'] ??
            "20 Questions • 15 Minutes")
        .toString();
    final xp = (dailyContent['xp'] ?? dailyContent['reward_xp'] ?? "+10 XP").toString();
    final level = (dailyContent['level'] ?? dailyContent['difficulty'] ?? "Moderate").toString();
    final tagsList = dailyContent['tags'] is List
        ? (dailyContent['tags'] as List).map((t) => t.toString()).toList()
        : <String>['Mixed Topics', level];
    final testId = (dailyContent['test_id'] ?? dailyContent['testId'] ?? 'test-wbp-001').toString();
    final actionText = (dailyContent['cta_text'] ?? dailyContent['ctaText'] ?? 'Start Now').toString();
    final route = (dailyContent['action_route'] ?? dailyContent['route'] ?? '/live-test/$testId').toString();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              '🎯 Daily Practice',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFFCE7F3),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'New',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFDB2777),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      challengeTitle,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      xp,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                challengeSubtitle,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 12),
              // Tags row
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: tagsList.map((tag) {
                  final isLevel = tag.toLowerCase() == level.toLowerCase();
                  return _buildTagPill(
                    tag,
                    isLevel ? const Color(0xFFD1FAE5) : const Color(0xFFDBEAFE),
                    isLevel ? const Color(0xFF065F46) : const Color(0xFF1E40AF),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              // CTA Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push(route),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        actionText,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_rounded, size: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTagPill(String text, Color bg, Color textCol) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: textCol,
        ),
      ),
    );
  }
}
