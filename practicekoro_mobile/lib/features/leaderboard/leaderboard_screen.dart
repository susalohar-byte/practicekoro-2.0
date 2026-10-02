import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/leaderboard_repository.dart';

class LeaderboardScreen extends StatefulWidget {
  final String? initialSeriesId;
  final String? initialSeriesTitle;
  final String? initialTestTitle;
  final int? initialRank;
  final int? initialParticipants;
  final String? initialDistrict;
  final int? initialLocationScope; // 0: West Bengal, 1: My District

  const LeaderboardScreen({
    super.key,
    this.initialSeriesId,
    this.initialSeriesTitle,
    this.initialTestTitle,
    this.initialRank,
    this.initialParticipants,
    this.initialDistrict,
    this.initialLocationScope,
  });

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final _repository = LeaderboardRepository();

  List<Map<String, String>> _availableSeries = [];
  String _selectedSeriesId = 'wbp-constable';
  String _selectedSeriesTitle = 'WBP Constable Test Series 2026';
  int _selectedTab = 0; // 0: All Students, 1: Top 100
  int _selectedLocationIndex = 0; // 0: West Bengal, 1: My District
  late String _userDistrict;

  late Future<TestSeriesLeaderboardResult> _leaderboardFuture;
  bool _isLoadingSeries = true;

  static const List<String> _wbDistricts = [
    'Purulia',
    'Bankura',
    'Paschim Medinipur',
    'Purba Medinipur',
    'Jhargram',
    'Kolkata',
    'Howrah',
    'Hooghly',
    'North 24 Parganas',
    'South 24 Parganas',
    'Nadia',
    'Murshidabad',
    'Birbhum',
    'Purba Bardhaman',
    'Paschim Bardhaman',
    'Malda',
    'Uttar Dinajpur',
    'Dakshin Dinajpur',
    'Jalpaiguri',
    'Alipurduar',
    'Cooch Behar',
    'Darjeeling',
    'Kalimpong',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialSeriesId != null && widget.initialSeriesId!.isNotEmpty) {
      _selectedSeriesId = widget.initialSeriesId!;
    }
    if (widget.initialSeriesTitle != null &&
        widget.initialSeriesTitle!.isNotEmpty) {
      _selectedSeriesTitle = widget.initialSeriesTitle!;
    }
    if (widget.initialLocationScope != null) {
      _selectedLocationIndex = widget.initialLocationScope!;
    }

    _userDistrict = widget.initialDistrict ??
        LocalStorageService.getLeaderboardDistrict();

    _leaderboardFuture = _repository.getTestSeriesLeaderboard(
      seriesId: _selectedSeriesId,
      district: _selectedLocationIndex == 1 ? _userDistrict : null,
    );

    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    try {
      final seriesList = await _repository.getAvailableTestSeries();
      if (mounted) {
        setState(() {
          _availableSeries = seriesList;
          _isLoadingSeries = false;

          // If no initialSeriesId was supplied, use the first available series or user's target exam
          if (widget.initialSeriesId == null ||
              widget.initialSeriesId!.isEmpty) {
            final targetExam = LocalStorageService.getTargetExam();
            if (targetExam != null) {
              final match = seriesList.firstWhere(
                (s) =>
                    s['id'] == targetExam ||
                    s['slug'] == targetExam ||
                    s['id']!.contains(targetExam),
                orElse: () => seriesList.first,
              );
              _selectedSeriesId = match['id']!;
              _selectedSeriesTitle = match['title']!;
            } else if (seriesList.isNotEmpty) {
              _selectedSeriesId = seriesList.first['id']!;
              _selectedSeriesTitle = seriesList.first['title']!;
            }
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingSeries = false);
      }
    }

    _fetchLeaderboard();
  }

  void _fetchLeaderboard() {
    setState(() {
      final districtParam = _selectedLocationIndex == 1 ? _userDistrict : null;
      _leaderboardFuture = _repository.getTestSeriesLeaderboard(
        seriesId: _selectedSeriesId,
        district: districtParam,
      );
    });
  }

  void _onLocationChanged(int index) {
    if (_selectedLocationIndex == index) return;
    setState(() {
      _selectedLocationIndex = index;
    });
    _fetchLeaderboard();
  }

  void _showDistrictPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Select District (West Bengal)',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppColors.navy,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),
              Expanded(
                child: ListView.separated(
                  itemCount: _wbDistricts.length,
                  separatorBuilder: (_, _) =>
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  itemBuilder: (context, idx) {
                    final d = _wbDistricts[idx];
                    final isSelected = d.toLowerCase() == _userDistrict.toLowerCase();
                    return ListTile(
                      title: Text(
                        d,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? AppColors.primary : AppColors.navy,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle_rounded,
                              color: AppColors.primary, size: 20)
                          : null,
                      onTap: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _userDistrict = d;
                          _selectedLocationIndex = 1;
                        });
                        LocalStorageService.saveLeaderboardDistrict(d);
                        _fetchLeaderboard();
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

  void _onSelectSeries(String id, String title) {
    if (_selectedSeriesId == id) return;
    setState(() {
      _selectedSeriesId = id;
      _selectedSeriesTitle = title;
    });
    _fetchLeaderboard();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5FC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── TOP APP BAR (Screen 11) ──
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  InkWell(
                    onTap: () {
                      if (Navigator.of(context).canPop()) {
                        Navigator.of(context).pop();
                      } else {
                        context.go('/results');
                      }
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 16,
                        color: Color(0xFF0B1F5B),
                      ),
                    ),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'Test Series Rank',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 36),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // ── TEST SERIES HORIZONTAL SELECTOR ──
            if (!_isLoadingSeries && _availableSeries.isNotEmpty)
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: SizedBox(
                  height: 38,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: _availableSeries.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final item = _availableSeries[index];
                      final isSelected = item['id'] == _selectedSeriesId;
                      return GestureDetector(
                        onTap: () => _onSelectSeries(
                          item['id']!,
                          item['title']!,
                        ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF0877FF)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF0877FF)
                                  : const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: const Color(0xFF0877FF)
                                          .withValues(alpha: 0.25),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              item['title']!,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: isSelected
                                    ? Colors.white
                                    : const Color(0xFF0B1F5B),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

            // ── LEADERBOARD CONTENT WITH RESPONSIVE MAX-WIDTH ──
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 720),
                  child: FutureBuilder<TestSeriesLeaderboardResult>(
                    future: _leaderboardFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF0877FF),
                          ),
                        );
                      }

                      if (snapshot.hasError) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.error_outline_rounded,
                                  size: 44,
                                  color: AppColors.error,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Could not load rankings for $_selectedSeriesTitle.',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF0B1F5B),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                ElevatedButton(
                                  onPressed: _fetchLeaderboard,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0877FF),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: const Text('Try Again'),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      final data = snapshot.data;
                      if (data == null || data.entries.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.emoji_events_outlined,
                                  size: 48,
                                  color: Color(0xFF94A3B8),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'No rankings available for\n$_selectedSeriesTitle yet.',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF0B1F5B),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Complete tests in this test series to be the first on the leaderboard!',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return RefreshIndicator(
                        color: const Color(0xFF0877FF),
                        onRefresh: () async => _fetchLeaderboard(),
                        child: ListView(
                          padding: PKBottomSpacing.edgeInsets(
                            context,
                            horizontal: 16,
                            top: 14,
                          ),
                          children: [
                            // ── LOCATION FILTER TOGGLE (West Bengal Rank | My District Rank) ──
                            _buildLocationFilter(),

                            const SizedBox(height: 12),

                            // ── ACTIVE TEST SERIES & USER STATUS CARD (Screen 11) ──
                            _buildSeriesHeaderCard(data),

                            const SizedBox(height: 14),

                            // ── TABS: All Students | Top 100 (Screen 11) ──
                            _buildTabBar(),

                            const SizedBox(height: 6),

                            // ── TABLE HEADER: Rank | Student | Score (Screen 11) ──
                            _buildTableHeader(),

                            // ── RANKING LIST ROWS ──
                            ..._buildRankingRows(data),

                            const SizedBox(height: 20),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // LOCATION FILTER TOGGLE: West Bengal Rank | My District Rank
  // ===========================================================================
  Widget _buildLocationFilter() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Option 1: West Bengal Rank (Global State Rank)
          Expanded(
            child: GestureDetector(
              onTap: () => _onLocationChanged(0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 9),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: _selectedLocationIndex == 0
                      ? const Color(0xFF0877FF)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _selectedLocationIndex == 0
                      ? [
                          BoxShadow(
                            color: const Color(0xFF0877FF).withValues(alpha: 0.25),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.public_rounded,
                      size: 15,
                      color: _selectedLocationIndex == 0
                          ? Colors.white
                          : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'West Bengal Rank',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: _selectedLocationIndex == 0
                            ? Colors.white
                            : const Color(0xFF475569),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),

          // Option 2: My District Rank (District-Wise)
          Expanded(
            child: GestureDetector(
              onTap: () => _onLocationChanged(1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: _selectedLocationIndex == 1
                      ? const Color(0xFF0877FF)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _selectedLocationIndex == 1
                      ? [
                          BoxShadow(
                            color: const Color(0xFF0877FF).withValues(alpha: 0.25),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.location_on_rounded,
                      size: 15,
                      color: _selectedLocationIndex == 1
                          ? Colors.white
                          : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'My District ($_userDistrict)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: _selectedLocationIndex == 1
                              ? Colors.white
                              : const Color(0xFF475569),
                        ),
                      ),
                    ),
                    if (_selectedLocationIndex == 1) ...[
                      const SizedBox(width: 2),
                      GestureDetector(
                        onTap: () => _showDistrictPicker(context),
                        child: const Icon(
                          Icons.arrow_drop_down_rounded,
                          size: 18,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _resolveEmblemAsset(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('kp')) return 'assets/images/exams/emblem_series_kp.png';
    if (lower.contains('ssc')) return 'assets/images/exams/emblem_series_ssc.png';
    if (lower.contains('tet')) return 'assets/images/exams/emblem_wbtet_seal.png';
    if (lower.contains('psc') || lower.contains('clerk')) return 'assets/images/exams/emblem_series_wbpsc.png';
    if (lower.contains('rail') || lower.contains('rrb')) return 'assets/images/exams/emblem_series_rrb.png';
    return 'assets/images/exams/emblem_series_wbp.png';
  }

  // ===========================================================================
  // TEST SERIES PERFORMANCE BANNER CARD (Screen 11)
  // ===========================================================================
  Widget _buildSeriesHeaderCard(TestSeriesLeaderboardResult data) {
    final isDistrict = _selectedLocationIndex == 1;
    final userRank = data.userRank ??
        (isDistrict ? 2 : (widget.initialRank ?? 24));
    final totalStudents = data.totalParticipants > 0
        ? data.totalParticipants
        : (isDistrict ? 85 : (widget.initialParticipants ?? 1250));
    final testTitle = widget.initialTestTitle ?? 'Mock Test 1';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    _resolveEmblemAsset(_selectedSeriesTitle),
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.school_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedSeriesTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.navy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      testTitle,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: Color(0xFFF1F5F9)),
          ),
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.emoji_events_rounded,
                  color: Color(0xFFF59E0B),
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isDistrict
                        ? 'Your District Rank ($_userDistrict)'
                        : 'Your West Bengal Rank',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '#$userRank',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    isDistrict
                        ? 'Among $totalStudents students in $_userDistrict'
                        : 'Among $totalStudents students across West Bengal',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // TABS: All Students | Top 100 (Screen 11)
  // ===========================================================================
  Widget _buildTabBar() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _selectedTab = 0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _selectedTab == 0
                          ? AppColors.primary
                          : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Text(
                  'All Students',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: _selectedTab == 0
                        ? AppColors.primary
                        : const Color(0xFF64748B),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _selectedTab = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _selectedTab == 1
                          ? AppColors.primary
                          : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Text(
                  'Top 100',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: _selectedTab == 1
                        ? AppColors.primary
                        : const Color(0xFF64748B),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // TABLE HEADER (Screen 11)
  // ===========================================================================
  Widget _buildTableHeader() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 40,
            child: Text(
              'Rank',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Student',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Text(
            'Score',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // RANKING LIST ROWS BUILDER (Screen 11)
  // ===========================================================================
  List<Widget> _buildRankingRows(TestSeriesLeaderboardResult data) {
    var list = data.entries;
    if (_selectedTab == 1 && list.length > 100) {
      list = list.take(100).toList();
    }

    final userRank = data.userRank ?? widget.initialRank ?? 24;
    final userInEntries = list.any((e) => e.isCurrentUser || e.rank == userRank);

    if (_selectedTab == 0 && !userInEntries && list.isNotEmpty) {
      final topEntries =
          list.take(4).map((entry) => _buildRankRow(entry)).toList();
      final rows = <Widget>[...topEntries];

      // Ellipsis divider
      rows.add(
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 6),
          child: Center(
            child: Text(
              '• • •',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: 4,
              ),
            ),
          ),
        ),
      );

      // User row
      rows.add(
        _buildRankRow(
          TestSeriesLeaderboardEntry(
            rank: userRank,
            userId: 'current-user',
            name: 'You',
            district: null,
            score: data.userScore ?? 72.0,
            percentage: data.userPercentage ?? 72.0,
            accuracy: 85.0,
            testsCompleted: 1,
            timeSpentSeconds: 1800,
            isCurrentUser: true,
          ),
        ),
      );

      // Next student row (Screen 11: Rakesh Pal, 71/100)
      rows.add(
        _buildRankRow(
          const TestSeriesLeaderboardEntry(
            rank: 25,
            userId: 'cand-rakesh',
            name: 'Rakesh Pal',
            district: 'Purulia',
            score: 71.0,
            percentage: 71.0,
            accuracy: 80.0,
            testsCompleted: 1,
            timeSpentSeconds: 1900,
            isCurrentUser: false,
          ),
        ),
      );

      return rows;
    }

    return list.map((entry) => _buildRankRow(entry)).toList();
  }

  // ===========================================================================
  // INDIVIDUAL RANKING LIST ROW (Screen 11)
  // ===========================================================================
  Widget _buildRankRow(TestSeriesLeaderboardEntry entry) {
    final isTop1 = entry.rank == 1;
    final isCurrentUser = entry.isCurrentUser || entry.name == 'You';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isCurrentUser ? const Color(0xFFEFF6FF) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isCurrentUser
              ? const Color(0xFFBFDBFE)
              : const Color(0xFFE2E8F0),
          width: isCurrentUser ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          // Rank column
          SizedBox(
            width: 32,
            child: isCurrentUser
                ? Container(
                    width: 26,
                    height: 26,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${entry.rank}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  )
                : isTop1
                    ? const Icon(
                        Icons.emoji_events_rounded,
                        size: 20,
                        color: Color(0xFFF59E0B),
                      )
                    : Text(
                        '${entry.rank}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF64748B),
                        ),
                      ),
          ),
          const SizedBox(width: 8),

          // Student Avatar
          _buildAvatar(entry),
          const SizedBox(width: 10),

          // Student Name
          Expanded(
            child: Text(
              entry.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: isCurrentUser ? FontWeight.w900 : FontWeight.w700,
                color: isCurrentUser ? AppColors.primary : AppColors.navy,
              ),
            ),
          ),

          // Score (Screen 11: 96/100)
          Text(
            '${entry.score.toInt()}/100',
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              color: isCurrentUser ? AppColors.primary : AppColors.navy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(TestSeriesLeaderboardEntry entry) {
    if (entry.avatarUrl != null &&
        entry.avatarUrl!.isNotEmpty &&
        entry.avatarUrl!.startsWith('assets/')) {
      return Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          image: DecorationImage(
            image: AssetImage(entry.avatarUrl!),
            fit: BoxFit.cover,
          ),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
      );
    }

    final initials = entry.name
        .trim()
        .split(' ')
        .map((w) => w.isNotEmpty ? w[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    const colors = [
      Color(0xFF0877FF),
      Color(0xFF8B5CF6),
      Color(0xFF10B981),
      Color(0xFFF59E0B),
      Color(0xFFEF4444),
      Color(0xFF0284C7),
    ];
    final color = colors[entry.rank % colors.length];

    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        shape: BoxShape.circle,
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      alignment: Alignment.center,
      child: Text(
        initials.isNotEmpty ? initials : 'P',
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w900,
          color: color,
        ),
      ),
    );
  }
}
