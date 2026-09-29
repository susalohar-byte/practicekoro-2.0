import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/live_test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';

class HomeScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const HomeScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

typedef PracticeKoroHomeScreen = HomeScreen;

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, dynamic>> _searchableItems = [];

  @override
  void dispose() {
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
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        autofocus: true,
                        decoration: InputDecoration(
                          hintText: 'Search mock tests, exams, subjects...',
                          hintStyle: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF94A3B8),
                          ),
                          prefixIcon: const Icon(
                            Icons.search_rounded,
                            color: Color(0xFF64748B),
                            size: 20,
                          ),
                          suffixIcon: _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(
                                    Icons.clear_rounded,
                                    size: 18,
                                    color: Color(0xFF64748B),
                                  ),
                                  onPressed: () {
                                    _searchController.clear();
                                    setModalState(() {});
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                        onChanged: (_) => setModalState(() {}),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
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
              const SizedBox(height: 12),
              Text(
                '${results.length} Results Found',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: results.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.search_off_rounded,
                              size: 48,
                              color: Color(0xFFCBD5E1),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'No tests or topics found for "$query"',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: results.length,
                        separatorBuilder: (_, _) =>
                            const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        itemBuilder: (context, idx) {
                          final item = results[idx];
                          final isTest = item['category'] == 'test';
                          final isSeries = item['category'] == 'series';

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isTest
                                    ? const Color(0xFFEFF6FF)
                                    : isSeries
                                    ? const Color(0xFFFEF3C7)
                                    : const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isTest
                                    ? Icons.assignment_outlined
                                    : isSeries
                                    ? Icons.layers_outlined
                                    : Icons.menu_book_outlined,
                                color: isTest
                                    ? const Color(0xFF0158FC)
                                    : isSeries
                                    ? const Color(0xFFD97706)
                                    : const Color(0xFF10B981),
                                size: 20,
                              ),
                            ),
                            title: Text(
                              item['title'] as String,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            subtitle: Text(
                              item['type'] as String,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0158FC),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Open',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
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

  Widget _buildSearchFilterChip(
    String label,
    void Function(void Function()) setModalState,
  ) {
    final isSelected =
        _searchController.text.trim().toLowerCase() == label.toLowerCase();
    return InkWell(
      onTap: () {
        setModalState(() {
          if (isSelected) {
            _searchController.clear();
          } else {
            _searchController.text = label;
          }
        });
      },
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0158FC) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF0158FC)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final liveTestAsync = ref.watch(activeLiveTestProvider);
    final popularSeriesAsync = ref.watch(popularTestSeriesProvider);

    final List<TestSeriesModel> popularList = popularSeriesAsync.value ?? [];

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(activeLiveTestProvider);
            ref.invalidate(popularTestSeriesProvider);
            await Future.delayed(const Duration(milliseconds: 300));
          },
          color: const Color(0xFF0158FC),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 96),
            children: [
              // ==========================================
              // SECTION 1: HEADER
              // ==========================================
              _buildHeader(),
              const SizedBox(height: 16),

              // ==========================================
              // SECTION 2: HERO BANNER
              // ==========================================
              _buildHeroBanner(),
              const SizedBox(height: 18),

              // ==========================================
              // SECTION 3: CORE PRACTICE ACTIONS (4 PASTEL CARDS)
              // ==========================================
              _buildCorePracticeActions(),
              const SizedBox(height: 20),

              // ==========================================
              // SECTION 4: LIVE TEST
              // ==========================================
              liveTestAsync.when(
                data: (liveTest) => liveTest == null
                    ? _buildLiveTestEmptyState()
                    : _buildLiveTestCard(liveTest),
                loading: _buildLiveTestLoadingState,
                error: (_, _) => _buildLiveTestEmptyState(hasError: true),
              ),
              const SizedBox(height: 22),

              // ==========================================
              // SECTION 5: POPULAR TEST SERIES
              // ==========================================
              _buildPopularTestSeriesSection(
                popularList,
                isLoading: popularSeriesAsync.isLoading,
                hasError: popularSeriesAsync.hasError,
              ),
              const SizedBox(height: 22),

              // ==========================================
              // SECTION 6: QUICK STUDY TOOLS
              // ==========================================
              _buildQuickStudyToolsSection(),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // SECTION 1 WIDGET: HEADER
  // ==========================================
  Widget _buildHeader() {
    return Row(
      children: [
        // Left: Blue P logo box
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0158FC), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0158FC).withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.asset(
              'assets/images/logo.png',
              width: 38,
              height: 38,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const Text(
                'P',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),

        // Brand Text & Tagline
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'PracticeKoro',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: -0.4,
              ),
            ),
            Text(
              'EXAM PREPARATION',
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0284C7),
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
        const Spacer(),

        // Search Action Icon Button
        InkWell(
          onTap: _openLiveSearchModal,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            ),
            child: const Icon(
              Icons.search_rounded,
              size: 19,
              color: Color(0xFF64748B),
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Notification Bell Icon
        InkWell(
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('No new notifications'),
                duration: Duration(seconds: 2),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
          borderRadius: BorderRadius.circular(18),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            ),
            child: const Icon(
              Icons.notifications_none_rounded,
              size: 20,
              color: Color(0xFF64748B),
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Student Avatar
        InkWell(
          onTap: () => _handleTabNavigation(4, '/profile'),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/student_avatar_hd.png',
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  color: const Color(0xFFEFF6FF),
                  child: const Icon(
                    Icons.person,
                    color: Color(0xFF0158FC),
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ==========================================
  // SECTION 2 WIDGET: HERO BANNER
  // ==========================================
  Widget _buildHeroBanner() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // Background Decorative Circles
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.06),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 10, 16),
              child: Row(
                children: [
                  // Left: Text content and CTA button
                  Expanded(
                    flex: 6,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Practice Smart',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.4,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Get Closer to Your Dream Job',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 14),
                        InkWell(
                          onTap: () => _handleTabNavigation(2, '/practice'),
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.10),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Start Practicing',
                                  style: TextStyle(
                                    color: Color(0xFF1D4ED8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 14,
                                  color: Color(0xFF1D4ED8),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Right: 3D Student illustration
                  Expanded(
                    flex: 4,
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: Image.asset(
                        'assets/images/home_hero_banner.png',
                        height: 110,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.school_rounded,
                          size: 70,
                          color: Colors.white70,
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
    );
  }

  // ==========================================
  // SECTION 3 WIDGET: CORE PRACTICE ACTIONS (4 PASTEL CARDS)
  // ==========================================
  Widget _buildCorePracticeActions() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildPastelActionCard(
                title: 'Test Series',
                subtitle: 'Full length tests',
                icon: Icons.assignment_outlined,
                iconColor: const Color(0xFF2563EB),
                textColor: const Color(0xFF1E3A8A),
                bgColor: const Color(0xFFEFF6FF),
                borderColor: const Color(0xFFDBEAFE),
                onTap: () => _handleTabNavigation(1, '/test-series'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPastelActionCard(
                title: 'Topic Practice',
                subtitle: 'Chapter-wise Qs',
                icon: Icons.track_changes_rounded,
                iconColor: const Color(0xFF9333EA),
                textColor: const Color(0xFF581C87),
                bgColor: const Color(0xFFFAF5FF),
                borderColor: const Color(0xFFF3E8FF),
                onTap: () => _handleTabNavigation(2, '/practice'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildPastelActionCard(
                title: 'Previous Year Questions',
                subtitle: 'Solved 2018-2024',
                icon: Icons.history_rounded,
                iconColor: const Color(0xFF059669),
                textColor: const Color(0xFF065F46),
                bgColor: const Color(0xFFECFDF5),
                borderColor: const Color(0xFFD1FAE5),
                onTap: () => context.go('/practice?tab=pyqs'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPastelActionCard(
                title: 'Performance',
                subtitle: 'Rank & analysis',
                icon: Icons.insights_rounded,
                iconColor: const Color(0xFFD97706),
                textColor: const Color(0xFF92400E),
                bgColor: const Color(0xFFFFFBEB),
                borderColor: const Color(0xFFFEF3C7),
                onTap: () => _handleTabNavigation(3, '/results'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPastelActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color textColor,
    required Color bgColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: 1.2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: iconColor.withValues(alpha: 0.12),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
                color: textColor,
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // SECTION 4 WIDGET: LIVE TEST CARD
  // ==========================================
  Widget _buildLiveTestCard(LiveTestModel liveTest) {
    final now = DateTime.now();
    final isLiveNow =
        now.isAfter(liveTest.scheduledStartTime) &&
        now.isBefore(liveTest.scheduledEndTime);
    final Duration diff = isLiveNow
        ? (liveTest.scheduledEndTime.isAfter(now)
              ? liveTest.scheduledEndTime.difference(now)
              : Duration.zero)
        : (liveTest.scheduledStartTime.isAfter(now)
              ? liveTest.scheduledStartTime.difference(now)
              : Duration.zero);

    final daysStr = diff.inDays.toString().padLeft(2, '0');
    final hoursStr = (diff.inHours % 24).toString().padLeft(2, '0');
    final minsStr = (diff.inMinutes % 60).toString().padLeft(2, '0');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A), // Dark slate/navy
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E293B), width: 1.4),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Red LIVE TEST badge + Dynamic Countdown Timer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Red LIVE TEST badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4.5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text(
                      'LIVE TEST',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
              ),

              // Countdown timer in dark rounded boxes: 03 Days : 14 Hours : 22 Mins
              Row(
                children: [
                  _buildCountdownBox(daysStr, 'Days'),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 3),
                    child: Text(
                      ':',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  _buildCountdownBox(hoursStr, 'Hours'),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 3),
                    child: Text(
                      ':',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  _buildCountdownBox(minsStr, 'Mins'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Live Test Title
          Text(
            liveTest.title,
            style: const TextStyle(
              fontSize: 16.5,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),

          // Metadata row: 90 Mins • 100 Questions • 100 Marks
          Row(
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 14,
                color: Color(0xFF94A3B8),
              ),
              const SizedBox(width: 4),
              Text(
                '${liveTest.durationMinutes} Mins',
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFFCBD5E1),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 14),
              const Icon(
                Icons.assignment_outlined,
                size: 14,
                color: Color(0xFF94A3B8),
              ),
              const SizedBox(width: 4),
              Text(
                '${liveTest.totalQuestions} Questions',
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFFCBD5E1),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 14),
              const Icon(
                Icons.military_tech_outlined,
                size: 14,
                color: Color(0xFF94A3B8),
              ),
              const SizedBox(width: 4),
              Text(
                '${liveTest.totalMarks.toInt()} Marks',
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFFCBD5E1),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Bottom row: Enrolled Students + Join Now Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Enrolled count
              Row(
                children: [
                  const Icon(
                    Icons.people_alt_outlined,
                    size: 15,
                    color: Color(0xFF94A3B8),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    '${liveTest.enrolledCount} Students Registered',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),

              // Join Now CTA
              InkWell(
                onTap: () async {
                  final userId = LocalStorageService.getUserId();
                  ref
                      .read(catalogRepositoryProvider)
                      .joinLiveTest(liveTest.id, userId);
                  context.push('/live-test/${liveTest.testId}');
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8.5,
                  ),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2563EB), Color(0xFF0284C7)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Join Now',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 14,
                        color: Colors.white,
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

  Widget _buildCountdownBox(String val, String unit) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF334155), width: 0.8),
      ),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: '$val ',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                fontFamily: 'monospace',
              ),
            ),
            TextSpan(
              text: unit,
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 8.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveTestLoadingState() {
    return Container(
      height: 104,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Row(
        children: [
          SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Color(0xFF60A5FA),
            ),
          ),
          SizedBox(width: 12),
          Text(
            'Checking for live tests…',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTestEmptyState({bool hasError = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E293B), width: 1.2),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.live_tv_rounded,
              color: Color(0xFF60A5FA),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'LIVE TEST',
                  style: TextStyle(
                    color: Color(0xFF93C5FD),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.7,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  hasError
                      ? 'Live tests are temporarily unavailable.'
                      : 'No live test is scheduled right now.',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            tooltip: hasError ? 'Try again' : 'Browse test series',
            onPressed: hasError
                ? () => ref.invalidate(activeLiveTestProvider)
                : () => _handleTabNavigation(1, '/test-series'),
            icon: Icon(
              hasError ? Icons.refresh_rounded : Icons.arrow_forward_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // SECTION 5 WIDGET: POPULAR TEST SERIES
  // ==========================================
  String _resolveExamEmblem(TestSeriesModel series) {
    if (series.iconUrl != null && series.iconUrl!.trim().isNotEmpty) {
      final url = series.iconUrl!.trim();
      if (url.startsWith('http') || url.startsWith('assets/')) {
        return url;
      }
    }

    final idLower = series.examId.toLowerCase();
    final titleLower = '${series.title} ${series.examTitle ?? ''}'
        .toLowerCase();

    if (idLower.contains('wbp') ||
        idLower.contains('kp') ||
        titleLower.contains('wbp') ||
        titleLower.contains('police') ||
        titleLower.contains('constable')) {
      return 'assets/images/exams/emblem_wbp.png';
    }
    if (idLower.contains('wbpsc') ||
        idLower.contains('wbcs') ||
        titleLower.contains('wbpsc') ||
        titleLower.contains('clerkship') ||
        titleLower.contains('wbcs') ||
        titleLower.contains('food')) {
      return 'assets/images/exams/emblem_wbpsc.png';
    }
    if (idLower.contains('railway') ||
        idLower.contains('rrb') ||
        titleLower.contains('railway') ||
        titleLower.contains('rrb') ||
        titleLower.contains('group d') ||
        titleLower.contains('ntpc')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    if (idLower.contains('tet') ||
        titleLower.contains('tet') ||
        titleLower.contains('primary') ||
        titleLower.contains('teach')) {
      return 'assets/images/exams/emblem_tet.png';
    }
    if (idLower.contains('wbssc') ||
        titleLower.contains('wbssc') ||
        titleLower.contains('slst')) {
      return 'assets/images/exams/emblem_wbssc.png';
    }
    if (idLower.contains('ssc') ||
        titleLower.contains('ssc') ||
        titleLower.contains('cgl') ||
        titleLower.contains('gd')) {
      return 'assets/images/exams/emblem_ssc.png';
    }
    return 'assets/images/logo.png';
  }

  Widget _buildEmblemImage(String pathOrUrl) {
    if (pathOrUrl.startsWith('http')) {
      return Image.network(
        pathOrUrl,
        width: 52,
        height: 52,
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) => Image.asset(
          'assets/images/logo.png',
          width: 52,
          height: 52,
          fit: BoxFit.contain,
        ),
      );
    }
    return Image.asset(
      pathOrUrl,
      width: 52,
      height: 52,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => Image.asset(
        'assets/images/logo.png',
        width: 52,
        height: 52,
        fit: BoxFit.contain,
      ),
    );
  }

  Widget _buildPopularTestSeriesSection(
    List<TestSeriesModel> seriesList, {
    required bool isLoading,
    required bool hasError,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '🔥 Popular Test Series',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: () => _handleTabNavigation(1, '/test-series'),
              child: const Row(
                children: [
                  Text(
                    'See All',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 14,
                    color: Color(0xFF0158FC),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (isLoading || hasError || seriesList.isEmpty)
          Container(
            height: 82,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.1),
            ),
            child: Row(
              children: [
                if (isLoading)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: Icon(
                      hasError
                          ? Icons.cloud_off_rounded
                          : Icons.auto_stories_rounded,
                      color: const Color(0xFF2563EB),
                      size: 21,
                    ),
                  ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    isLoading
                        ? 'Loading test series…'
                        : hasError
                        ? 'Test series could not be loaded.'
                        : 'Popular test series will appear here soon.',
                    style: const TextStyle(
                      color: Color(0xFF475569),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (!isLoading)
                  IconButton(
                    tooltip: hasError ? 'Try again' : 'Browse test series',
                    onPressed: hasError
                        ? () => ref.invalidate(popularTestSeriesProvider)
                        : () => _handleTabNavigation(1, '/test-series'),
                    icon: Icon(
                      hasError
                          ? Icons.refresh_rounded
                          : Icons.arrow_forward_rounded,
                      color: const Color(0xFF2563EB),
                      size: 19,
                    ),
                  ),
              ],
            ),
          )
        else
          // Horizontal scrolling cards with the exam emblem on the left.
          SizedBox(
            height: 86,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: seriesList.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final series = seriesList[index];
                final emblemPath = _resolveExamEmblem(series);

                return InkWell(
                  onTap: () => context.push('/exams/${series.examId}'),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 236,
                    height: 86,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 11,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFE2E8F0),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF0F172A,
                          ).withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 58,
                          height: 58,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(17),
                            border: Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          alignment: Alignment.center,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: _buildEmblemImage(emblemPath),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                series.title,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                  height: 1.25,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 5),
                              Align(
                                alignment: Alignment.centerRight,
                                child: Container(
                                  width: 22,
                                  height: 22,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFEFF6FF),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 13,
                                    color: Color(0xFF0158FC),
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
              },
            ),
          ),
      ],
    );
  }

  // ==========================================
  // SECTION 6 WIDGET: QUICK STUDY TOOLS
  // ==========================================
  Widget _buildQuickStudyToolsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Study Tools',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStudyToolCard(
                title: 'Weak Topics',
                subtitle: 'Target areas',
                icon: Icons.track_changes_outlined,
                iconColor: const Color(0xFFEF4444),
                bgColor: const Color(0xFFFEF2F2),
                borderColor: const Color(0xFFFEE2E2),
                onTap: () => _handleTabNavigation(2, '/practice'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildStudyToolCard(
                title: 'Study Notes',
                subtitle: 'Summaries',
                icon: Icons.menu_book_outlined,
                iconColor: const Color(0xFF10B981),
                bgColor: const Color(0xFFECFDF5),
                borderColor: const Color(0xFFD1FAE5),
                onTap: () => _handleTabNavigation(2, '/practice'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStudyToolCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1.1),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: iconColor.withValues(alpha: 0.15),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
