import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/live_test_model.dart';
import '../../data/models/test_series_model.dart';
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
    final examsAsync = ref.watch(homeExamsProvider);
    final popularList = popularSeriesAsync.value ?? <TestSeriesModel>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF3FAFF),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(activeLiveTestProvider);
            ref.invalidate(popularTestSeriesProvider);
            ref.invalidate(homeExamsProvider);
            await Future.delayed(const Duration(milliseconds: 300));
          },
          color: const Color(0xFF0158FC),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 112),
            children: [
              _buildHeader(),
              const SizedBox(height: 10),
              _buildHeroBanner(),
              const SizedBox(height: 12),
              _buildCorePracticeActions(),
              const SizedBox(height: 8),
              liveTestAsync.when(
                data: (liveTest) => liveTest == null
                    ? _buildLiveTestEmptyState()
                    : _buildLiveTestCard(liveTest),
                loading: _buildLiveTestLoadingState,
                error: (_, _) => _buildLiveTestEmptyState(hasError: true),
              ),
              const SizedBox(height: 18),
              _buildPopularExamsSection(
                examsAsync.value ?? const <ExamModel>[],
                isLoading: examsAsync.isLoading,
                hasError: examsAsync.hasError,
              ),
              const SizedBox(height: 16),
              _buildPopularTestSeriesSection(
                popularList,
                isLoading: popularSeriesAsync.isLoading,
                hasError: popularSeriesAsync.hasError,
              ),
              const SizedBox(height: 18),
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
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0877FF), Color(0xFF0060F5)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(11),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0158FC).withValues(alpha: 0.20),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Image.asset(
              'assets/images/logo.png',
              width: 36,
              height: 36,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const Text(
                'P',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 9),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: 'Practice',
                      style: TextStyle(color: Color(0xFF0B1F5B)),
                    ),
                    TextSpan(
                      text: 'Koro',
                      style: TextStyle(color: Color(0xFF0877FF)),
                    ),
                  ],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              Text(
                'Practice Today, Progress Tomorrow',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 9.5,
                  color: Color(0xFF52648A),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        _headerActionButton(
          icon: Icons.search_rounded,
          tooltip: 'Search',
          onTap: _openLiveSearchModal,
        ),
        const SizedBox(width: 8),
        _headerActionButton(
          icon: Icons.notifications_none_rounded,
          tooltip: 'Notifications',
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('No new notifications'),
                duration: Duration(seconds: 2),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
        const SizedBox(width: 8),
        InkWell(
          onTap: () => _handleTabNavigation(4, '/profile'),
          borderRadius: BorderRadius.circular(24),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFDDEAF8)),
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/student_avatar_hd.png',
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) =>
                    const Icon(Icons.person_rounded, color: Color(0xFF0158FC)),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _headerActionButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.82),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white),
          ),
          child: Icon(icon, color: const Color(0xFF0B1F5B), size: 21),
        ),
      ),
    );
  }

  // ==========================================
  // SECTION 2 WIDGET: HERO BANNER
  // ==========================================
  Widget _buildHeroBanner() {
    return Semantics(
      button: true,
      label: 'Start practicing',
      child: InkWell(
        onTap: () => _handleTabNavigation(2, '/practice'),
        borderRadius: BorderRadius.circular(18),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: AspectRatio(
            aspectRatio: 438 / 200,
            child: Image.asset(
              'assets/images/home_hero_banner.png',
              width: double.infinity,
              fit: BoxFit.fill,
              errorBuilder: (_, _, _) => Container(
                color: const Color(0xFFD9EEFF),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.school_rounded,
                  color: Color(0xFF0158FC),
                  size: 54,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // SECTION 3 WIDGET: CORE PRACTICE ACTIONS (4 PASTEL CARDS)
  // ==========================================
  Widget _buildCorePracticeActions() {
    return Row(
      children: [
        Expanded(
          child: _buildPastelActionCard(
            title: 'Mock Test',
            subtitle: 'Full Test Experience',
            icon: Icons.description_rounded,
            iconColor: const Color(0xFF0877FF),
            textColor: const Color(0xFF0B1F5B),
            bgColor: const Color(0xFFEAF5FF),
            borderColor: const Color(0xFFE2F1FF),
            onTap: () => _handleTabNavigation(1, '/test-series'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildPastelActionCard(
            title: 'Topic Practice',
            subtitle: 'Chapter-wise',
            icon: Icons.track_changes_rounded,
            iconColor: const Color(0xFF00B978),
            textColor: const Color(0xFF0B1F5B),
            bgColor: const Color(0xFFE9FFF5),
            borderColor: const Color(0xFFDDF8EC),
            onTap: () => _handleTabNavigation(2, '/practice'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildPastelActionCard(
            title: 'Previous Year',
            subtitle: 'Real Exam Questions',
            icon: Icons.description_rounded,
            iconColor: const Color(0xFFFF6A22),
            textColor: const Color(0xFF0B1F5B),
            bgColor: const Color(0xFFFFF7EB),
            borderColor: const Color(0xFFFFF0D9),
            onTap: () => context.go('/practice?tab=pyqs'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildPastelActionCard(
            title: 'Live Tests',
            subtitle: 'Join & Compete',
            icon: Icons.sensors_rounded,
            iconColor: const Color(0xFFF22550),
            textColor: const Color(0xFF0B1F5B),
            bgColor: const Color(0xFFFFEEF2),
            borderColor: const Color(0xFFFFE3E9),
            onTap: () => _handleTabNavigation(1, '/test-series'),
          ),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(17),
        child: Container(
          height: 110,
          padding: const EdgeInsets.fromLTRB(5, 9, 5, 7),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(17),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconColor,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: iconColor.withValues(alpha: 0.17),
                      blurRadius: 7,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 23),
              ),
              const SizedBox(height: 6),
              Text(
                title,
                maxLines: 1,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  color: textColor,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 1),
              Expanded(
                child: Text(
                  subtitle,
                  maxLines: 1,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 8.5,
                    color: Color(0xFF52648A),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.chevron_right_rounded,
                  color: iconColor,
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // SECTION 4 WIDGET: LIVE TEST
  // ==========================================
  Widget _buildLiveTestCard(LiveTestModel liveTest) {
    final remaining = liveTest.timeRemaining;
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFCF4), Color(0xFFFFF3DB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFFFEAC7)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFB87916).withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final details = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF32649),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.sensors_rounded, color: Colors.white, size: 14),
                    SizedBox(width: 5),
                    Text(
                      'LIVE TEST',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 7),
              Text(
                liveTest.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF0B1F5B),
                  fontSize: 15,
                  height: 1.15,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 7),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_month_rounded,
                    color: Color(0xFF0B1F5B),
                    size: 15,
                  ),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      _formatLiveTestDate(liveTest.scheduledStartTime),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF20366F),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 9),
              Wrap(
                spacing: 9,
                runSpacing: 5,
                children: [
                  _liveTestDetail(
                    Icons.description_outlined,
                    '${liveTest.totalQuestions} Questions',
                  ),
                  _liveTestDetail(
                    Icons.schedule_rounded,
                    '${liveTest.durationMinutes} Minutes',
                  ),
                  _liveTestDetail(Icons.groups_rounded, 'All India Rank'),
                ],
              ),
            ],
          );

          final actions = Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _buildCountdownBox(
                    remaining.inDays.toString().padLeft(2, '0'),
                    'Days',
                  ),
                  const SizedBox(width: 5),
                  _buildCountdownBox(
                    (remaining.inHours % 24).toString().padLeft(2, '0'),
                    'Hours',
                  ),
                  const SizedBox(width: 5),
                  _buildCountdownBox(
                    (remaining.inMinutes % 60).toString().padLeft(2, '0'),
                    'Mins',
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 36,
                child: ElevatedButton(
                  onPressed: () async {
                    final userId = LocalStorageService.getUserId();
                    await ref
                        .read(catalogRepositoryProvider)
                        .joinLiveTest(liveTest.id, userId);
                    if (context.mounted) {
                      context.push('/live-test/${liveTest.testId}');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0877FF),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: EdgeInsets.zero,
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Join Now',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                      SizedBox(width: 5),
                      Icon(Icons.arrow_forward_rounded, size: 15),
                    ],
                  ),
                ),
              ),
            ],
          );

          if (constraints.maxWidth < 350) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [details, const SizedBox(height: 10), actions],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(flex: 6, child: details),
              const SizedBox(width: 10),
              Expanded(flex: 4, child: actions),
            ],
          );
        },
      ),
    );
  }

  String _formatLiveTestDate(DateTime dateTime) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final local = dateTime.toLocal();
    final hour24 = local.hour;
    final hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = hour24 >= 12 ? 'PM' : 'AM';
    return '${weekdays[local.weekday - 1]}, ${local.day} ${months[local.month - 1]} • $hour12:$minute $period';
  }

  Widget _liveTestDetail(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF0B1F5B)),
        const SizedBox(width: 3),
        Text(
          text,
          style: const TextStyle(
            color: Color(0xFF20366F),
            fontSize: 9,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildCountdownBox(String value, String unit) {
    return Container(
      width: 38,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(11),
      ),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF171717),
              fontSize: 13,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(
            unit,
            style: const TextStyle(color: Color(0xFF475569), fontSize: 8),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTestLoadingState() {
    return Container(
      height: 100,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E9),
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFFFEAC7)),
      ),
      child: const Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 12),
          Text(
            'Loading live tests…',
            style: TextStyle(
              color: Color(0xFF0B1F5B),
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTestEmptyState({bool hasError = false}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E9),
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFFFEAC7)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFF32649),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.sensors_rounded,
              color: Colors.white,
              size: 21,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'LIVE TEST',
                  style: TextStyle(
                    color: Color(0xFFF32649),
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  hasError
                      ? 'Live tests are temporarily unavailable.'
                      : 'No live test is scheduled right now.',
                  style: const TextStyle(
                    color: Color(0xFF0B1F5B),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: hasError
                ? () => ref.invalidate(activeLiveTestProvider)
                : () => _handleTabNavigation(1, '/test-series'),
            child: Text(
              hasError ? 'Retry' : 'Explore',
              style: const TextStyle(
                color: Color(0xFF0877FF),
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // SECTION 5 WIDGET: POPULAR EXAMS
  // ==========================================
  String _resolveExamEmblemForExam(ExamModel exam) {
    final key = '${exam.id} ${exam.title} ${exam.slug}'.toLowerCase();
    if (key.contains('railway') ||
        key.contains('rrb') ||
        key.contains('ntpc')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    if (key.contains('tet') ||
        key.contains('teacher') ||
        key.contains('primary')) {
      return 'assets/images/exams/emblem_tet.png';
    }
    if (key.contains('wbssc') || key.contains('slst')) {
      return 'assets/images/exams/emblem_wbssc.png';
    }
    if (key.contains('ssc') || key.contains('cgl') || key.contains('gd')) {
      return 'assets/images/exams/emblem_ssc.png';
    }
    if (key.contains('wbpsc') ||
        key.contains('wbcs') ||
        key.contains('clerkship')) {
      return 'assets/images/exams/emblem_wbpsc.png';
    }
    if (key.contains('wbp') ||
        key.contains('kp') ||
        key.contains('police') ||
        key.contains('constable')) {
      return 'assets/images/exams/emblem_wbp.png';
    }
    return 'assets/images/logo.png';
  }

  Widget _buildPopularExamsSection(
    List<ExamModel> exams, {
    required bool isLoading,
    required bool hasError,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Text('🔥', style: TextStyle(fontSize: 19)),
                SizedBox(width: 7),
                Text(
                  'Popular Exams',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: () => _handleTabNavigation(1, '/test-series'),
              style: TextButton.styleFrom(padding: EdgeInsets.zero),
              child: const Row(
                children: [
                  Text(
                    'See All',
                    style: TextStyle(
                      color: Color(0xFF0877FF),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 3),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 17,
                    color: Color(0xFF0877FF),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (isLoading || hasError || exams.isEmpty)
          _buildHomeSectionMessage(
            isLoading: isLoading,
            hasError: hasError,
            emptyText: 'Popular exams will appear here soon.',
            errorText: 'Exams could not be loaded.',
            onRetry: () => ref.invalidate(homeExamsProvider),
          )
        else
          SizedBox(
            height: 132,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: exams.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final exam = exams[index];
                final colors = <List<Color>>[
                  [const Color(0xFFFFF0F5), const Color(0xFFF7F2FF)],
                  [const Color(0xFFF4F0FF), const Color(0xFFEFF2FF)],
                  [const Color(0xFFFFF8EC), const Color(0xFFFFF3E7)],
                  [const Color(0xFFFFF0F1), const Color(0xFFFFF6F5)],
                  [const Color(0xFFEEF7FF), const Color(0xFFF2FAFF)],
                  [const Color(0xFFE9FFF5), const Color(0xFFF2FFF9)],
                ][index % 6];
                return Semantics(
                  button: true,
                  label: 'Open ${exam.title}',
                  child: InkWell(
                    onTap: () => context.push('/exams/${exam.id}'),
                    borderRadius: BorderRadius.circular(17),
                    child: Container(
                      width: 106,
                      padding: const EdgeInsets.fromLTRB(7, 9, 7, 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: colors,
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(17),
                        border: Border.all(color: Colors.white, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(
                              0xFF1E4A88,
                            ).withValues(alpha: 0.06),
                            blurRadius: 9,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 60,
                            height: 60,
                            child: _buildEmblemImage(
                              _resolveExamEmblemForExam(exam),
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            exam.title,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF0B1F5B),
                              fontSize: 11.5,
                              height: 1.15,
                              fontWeight: FontWeight.w800,
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

  Widget _buildHomeSectionMessage({
    required bool isLoading,
    required bool hasError,
    required String emptyText,
    required String errorText,
    required VoidCallback onRetry,
  }) {
    return Container(
      height: 78,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2EDF8)),
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
            Icon(
              hasError ? Icons.cloud_off_rounded : Icons.auto_stories_rounded,
              color: const Color(0xFF0877FF),
              size: 22,
            ),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              isLoading
                  ? 'Loading…'
                  : hasError
                  ? errorText
                  : emptyText,
              style: const TextStyle(
                color: Color(0xFF425478),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (hasError)
            IconButton(
              tooltip: 'Retry',
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, color: Color(0xFF0877FF)),
            ),
        ],
      ),
    );
  }

  // ==========================================
  // SECTION 6 WIDGET: POPULAR TEST SERIES
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

  Widget _buildEmblemImage(String pathOrUrl, {double size = 52}) {
    if (pathOrUrl.startsWith('http')) {
      return Image.network(
        pathOrUrl,
        width: size,
        height: size,
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) => Image.asset(
          'assets/images/logo.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
        ),
      );
    }
    return Image.asset(
      pathOrUrl,
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => Image.asset(
        'assets/images/logo.png',
        width: size,
        height: size,
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
            const Row(
              children: [
                Icon(
                  Icons.description_outlined,
                  size: 20,
                  color: Color(0xFF0B1F5B),
                ),
                SizedBox(width: 8),
                Text(
                  'Popular Test Series',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0B1F5B),
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: () => _handleTabNavigation(1, '/test-series'),
              style: TextButton.styleFrom(padding: EdgeInsets.zero),
              child: const Row(
                children: [
                  Text(
                    'See All',
                    style: TextStyle(
                      color: Color(0xFF0877FF),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 3),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 17,
                    color: Color(0xFF0877FF),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (isLoading || hasError || seriesList.isEmpty)
          _buildHomeSectionMessage(
            isLoading: isLoading,
            hasError: hasError,
            emptyText: 'Popular test series will appear here soon.',
            errorText: 'Test series could not be loaded.',
            onRetry: () => ref.invalidate(popularTestSeriesProvider),
          )
        else
          SizedBox(
            height: 190,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: seriesList.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final series = seriesList[index];
                final colors = <List<Color>>[
                  [const Color(0xFFFFECF2), const Color(0xFFFFF9FC)],
                  [const Color(0xFFEDEBFF), const Color(0xFFF9F8FF)],
                  [const Color(0xFFFFF1E7), const Color(0xFFFFFBF5)],
                  [const Color(0xFFEAF5FF), const Color(0xFFF8FCFF)],
                ][index % 4];
                final emblemPath = _resolveExamEmblem(series);

                return InkWell(
                  onTap: () => context.push('/exams/${series.examId}'),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    width: 164,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: colors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFDDEBFA)),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF1E4A88,
                          ).withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          right: -12,
                          top: 8,
                          child: Icon(
                            Icons.account_balance_rounded,
                            size: 84,
                            color: Colors.white.withValues(alpha: 0.32),
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Center(
                              child: SizedBox(
                                width: 64,
                                height: 64,
                                child: _buildEmblemImage(emblemPath, size: 64),
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              series.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12.5,
                                height: 1.15,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0B1F5B),
                              ),
                            ),
                            const Spacer(),
                            Row(
                              children: [
                                const Icon(
                                  Icons.calendar_month_rounded,
                                  size: 14,
                                  color: Color(0xFF183775),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    series.testCount > 0
                                        ? '${series.testCount} Tests'
                                        : (series.isPremium
                                              ? 'Premium access'
                                              : 'Free access'),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      color: Color(0xFF40557F),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 9),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    series.isPremium ? 'Premium' : 'Free',
                                    maxLines: 1,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF111B3C),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFB9DEFF),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 16,
                                    color: Color(0xFF0B1F5B),
                                  ),
                                ),
                              ],
                            ),
                          ],
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
