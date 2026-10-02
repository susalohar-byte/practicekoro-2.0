import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/leaderboard_repository.dart';

class LeaderboardScreen extends StatefulWidget {
  final String? initialSeriesId;
  final String? initialSeriesTitle;

  const LeaderboardScreen({
    super.key,
    this.initialSeriesId,
    this.initialSeriesTitle,
  });

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final _repository = LeaderboardRepository();

  List<Map<String, String>> _availableSeries = [];
  String _selectedSeriesId = 'wbp-constable';
  String _selectedSeriesTitle = 'WBP Constable Test Series 2026';

  late Future<TestSeriesLeaderboardResult> _leaderboardFuture;
  bool _isLoadingSeries = true;

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

    _leaderboardFuture = _repository.getTestSeriesLeaderboard(
      seriesId: _selectedSeriesId,
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
      _leaderboardFuture = _repository.getTestSeriesLeaderboard(
        seriesId: _selectedSeriesId,
      );
    });
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
            // ── TOP APP BAR / HEADER ──
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Leaderboard',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0B1F5B),
                            letterSpacing: -0.3,
                          ),
                        ),
                        SizedBox(height: 1),
                        Text(
                          'Compete, stay consistent and climb the ranks! 💙',
                          style: TextStyle(
                            fontSize: 11,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _fetchLeaderboard,
                    tooltip: 'Refresh',
                    icon: const Icon(
                      Icons.refresh_rounded,
                      color: Color(0xFF0877FF),
                    ),
                  ),
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
                            // ── ACTIVE TEST SERIES & USER STATUS CARD ──
                            _buildSeriesHeaderCard(data),

                            const SizedBox(height: 16),

                            // ── SECTION HEADER ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(
                                      Icons.leaderboard_rounded,
                                      size: 18,
                                      color: Color(0xFF0877FF),
                                    ),
                                    SizedBox(width: 6),
                                    Text(
                                      'Ranking List',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF0B1F5B),
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Text(
                                    '${data.totalParticipants} Participants',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 10),

                            // ── RANKING LIST ROWS ──
                            ...data.entries.map((entry) => _buildRankRow(entry)),

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
  // TEST SERIES PERFORMANCE BANNER CARD
  // ===========================================================================
  Widget _buildSeriesHeaderCard(TestSeriesLeaderboardResult data) {
    final rankText = data.userRank != null ? '#${data.userRank}' : 'Not Ranked';
    final rankSubtext = data.userRank != null
        ? 'Among ${data.totalParticipants} students'
        : 'Complete a test to get ranked';

    final scoreText = data.userPercentage != null
        ? '${data.userPercentage!.toStringAsFixed(1)}%'
        : '—';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0B1F5B), Color(0xFF133488), Color(0xFF0877FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F5B).withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.stars_rounded,
                      size: 13,
                      color: Color(0xFFFBBF24),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'TEST SERIES RANKING',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.6,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              const Icon(
                Icons.emoji_events_rounded,
                size: 26,
                color: Color(0xFFFBBF24),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            data.seriesTitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.18),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'YOUR RANK',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.7,
                          color: Color(0xFF93C5FD),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        rankText,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        rankSubtext,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 44,
                  color: Colors.white.withValues(alpha: 0.2),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AVG SCORE',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.7,
                        color: Color(0xFF93C5FD),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      scoreText,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF34D399),
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      '${data.totalParticipants} attempted',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // INDIVIDUAL RANKING LIST ROW
  // ===========================================================================
  Widget _buildRankRow(TestSeriesLeaderboardEntry entry) {
    final isTop1 = entry.rank == 1;
    final isTop2 = entry.rank == 2;
    final isTop3 = entry.rank == 3;
    final isCurrentUser = entry.isCurrentUser;

    // Rank badge colors
    final Color badgeBg;
    final Color badgeTextColor;
    if (isTop1) {
      badgeBg = const Color(0xFFFEF3C7);
      badgeTextColor = const Color(0xFFD97706);
    } else if (isTop2) {
      badgeBg = const Color(0xFFF1F5F9);
      badgeTextColor = const Color(0xFF475569);
    } else if (isTop3) {
      badgeBg = const Color(0xFFFFEDD5);
      badgeTextColor = const Color(0xFFC2410C);
    } else {
      badgeBg = const Color(0xFFF8FAFC);
      badgeTextColor = const Color(0xFF64748B);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isCurrentUser ? const Color(0xFFEFF6FF) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrentUser
              ? const Color(0xFF0877FF)
              : const Color(0xFFE8EEF7),
          width: isCurrentUser ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isCurrentUser
                ? const Color(0xFF0877FF).withValues(alpha: 0.12)
                : const Color(0xFF0B1F5B).withValues(alpha: 0.02),
            blurRadius: isCurrentUser ? 10 : 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // ── RANK NUMBER BADGE ──
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: badgeBg,
              shape: BoxShape.circle,
              border: isTop1
                  ? Border.all(color: const Color(0xFFFBBF24), width: 1.5)
                  : null,
            ),
            alignment: Alignment.center,
            child: isTop1
                ? const Icon(
                    Icons.workspace_premium_rounded,
                    size: 18,
                    color: Color(0xFFD97706),
                  )
                : Text(
                    '${entry.rank}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: badgeTextColor,
                    ),
                  ),
          ),
          const SizedBox(width: 12),

          // ── STUDENT AVATAR ──
          _buildAvatar(entry),
          const SizedBox(width: 12),

          // ── STUDENT NAME & DISTRICT / BADGE ──
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        entry.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight:
                              isCurrentUser ? FontWeight.w900 : FontWeight.w800,
                          color: isCurrentUser
                              ? const Color(0xFF0877FF)
                              : const Color(0xFF0B1F5B),
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    if (isCurrentUser) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 1.5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0877FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(
                            fontSize: 8.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  entry.district != null && entry.district!.isNotEmpty
                      ? entry.district!
                      : '${entry.testsCompleted} ${entry.testsCompleted == 1 ? "test" : "tests"} completed',
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // ── SCORE / PERCENTAGE BADGE ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isTop1
                  ? const Color(0xFFECFDF5)
                  : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isTop1
                    ? const Color(0xFFA7F3D0)
                    : const Color(0xFFBFDBFE),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${entry.percentage.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    color: isTop1
                        ? const Color(0xFF059669)
                        : const Color(0xFF0877FF),
                  ),
                ),
                Text(
                  '${entry.score.toStringAsFixed(entry.score % 1 == 0 ? 0 : 1)} pts',
                  style: const TextStyle(
                    fontSize: 9.5,
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
