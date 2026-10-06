import 'package:flutter/material.dart';
import '../../core/constants/wb_districts.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/leaderboard_repository.dart';

class LeaderboardScreen extends StatefulWidget {
  final String? initialSeriesId;
  final String? initialSeriesTitle;
  final String? initialTestTitle;
  final int? initialRank;
  final int? initialParticipants;
  final String? initialDistrict;
  final int? initialLocationScope; // 0: West Bengal, 1: District

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
  int _selectedScope = 0; // 0: West Bengal, 1: District
  String _selectedDistrict = 'Kolkata';
  final String _selectedSeriesId = 'wbp-constable';

  late Future<TestSeriesLeaderboardResult> _leaderboardFuture;

  @override
  void initState() {
    super.initState();
    if (widget.initialLocationScope != null) {
      _selectedScope = widget.initialLocationScope!;
    }
    _selectedDistrict = widget.initialDistrict ?? LocalStorageService.getLeaderboardDistrict();
    if (_selectedDistrict.isEmpty) _selectedDistrict = 'Kolkata';

    _leaderboardFuture = _fetchData();
  }

  Future<TestSeriesLeaderboardResult> _fetchData() {
    final districtParam = _selectedScope == 1 ? _selectedDistrict : null;
    return _repository.getTestSeriesLeaderboard(
      seriesId: _selectedSeriesId,
      district: districtParam,
    );
  }

  void _onScopeChanged(int scope) {
    if (_selectedScope == scope && scope != 1) return;
    if (scope == 1 && _selectedScope == 1) {
      _showDistrictPicker(context);
      return;
    }
    setState(() {
      _selectedScope = scope;
      _leaderboardFuture = _fetchData();
    });
  }

  void _showDistrictPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Text(
                  'Select District',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),
              Expanded(
                child: ListView.builder(
                  itemCount: kWestBengalDistricts.length,
                  itemBuilder: (context, idx) {
                    final d = kWestBengalDistricts[idx];
                    final isSel = d == _selectedDistrict;
                    return ListTile(
                      title: Text(
                        d,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSel ? FontWeight.w800 : FontWeight.w500,
                          color: isSel ? const Color(0xFF026BFC) : const Color(0xFF334155),
                        ),
                      ),
                      trailing: isSel ? const Icon(Icons.check_circle_rounded, color: Color(0xFF026BFC)) : null,
                      onTap: () {
                        setState(() {
                          _selectedDistrict = d;
                          _selectedScope = 1;
                          _leaderboardFuture = _fetchData();
                        });
                        Navigator.pop(ctx);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Navigator.of(context).canPop()
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
        title: const Text(
          'My Rank',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF0F172A), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Rank report shared!')),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Scope Filter Toggle: [West Bengal] | [District: Kolkata ▾]
          _buildScopeFilter(),
          const SizedBox(height: 16),

          // 2. Your Rank Hero Card (Screen 10)
          _buildYourRankHeroCard(),
          const SizedBox(height: 14),

          // 3. 3-Metric Row: Score | Accuracy | Time
          _buildThreeMetricsRow(),
          const SizedBox(height: 16),

          // 4. Rank Trend Chart Card (Screen 10)
          _buildRankTrendChartCard(),
          const SizedBox(height: 18),

          // 5. Top Performers Leaderboard List (Screen 10)
          _buildTopPerformersSection(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // Scope Filter Toggle
  Widget _buildScopeFilter() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => _onScopeChanged(0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _selectedScope == 0 ? const Color(0xFF026BFC) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  'West Bengal',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: _selectedScope == 0 ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => _onScopeChanged(1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _selectedScope == 1 ? const Color(0xFF026BFC) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'District: $_selectedDistrict',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: _selectedScope == 1 ? Colors.white : const Color(0xFF475569),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_drop_down_rounded,
                      size: 18,
                      color: _selectedScope == 1 ? Colors.white : const Color(0xFF475569),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Your Rank Hero Card (Screen 10)
  Widget _buildYourRankHeroCard() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.military_tech_rounded, color: Color(0xFFF59E0B), size: 22),
                  SizedBox(width: 6),
                  Text(
                    'Your Rank',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              // Rank Improvement Badge (Screen 10)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.arrow_upward_rounded, size: 12, color: Color(0xFF16A34A)),
                    SizedBox(width: 2),
                    Text(
                      '1,202',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            '#1,248',
            style: TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.w900,
              color: Color(0xFF026BFC),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'Among 18,452 candidates',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your rank improved by 1,202 positions!',
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF16A34A),
            ),
          ),
        ],
      ),
    );
  }

  // 3-Metric Row: Score | Accuracy | Time (Screen 10)
  Widget _buildThreeMetricsRow() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildMetricCol('72', 'Your Score', const Color(0xFF0F172A)),
          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
          _buildMetricCol('78%', 'Accuracy', const Color(0xFF10B981)),
          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
          _buildMetricCol('32m 18s', 'Time', const Color(0xFF0F172A)),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String value, String label, Color valColor) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: valColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  // Rank Trend Chart Card (Screen 10)
  Widget _buildRankTrendChartCard() {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Rank Trend',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 16),
          // Custom Painted Line Chart
          SizedBox(
            height: 110,
            width: double.infinity,
            child: CustomPaint(
              painter: _RankTrendPainter(),
            ),
          ),
          const SizedBox(height: 8),
          // Test labels
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Test 01', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              Text('Test 02', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              Text('Test 03', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              Text('Test 04', style: TextStyle(fontSize: 10, color: Color(0xFF026BFC), fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }

  // Top Performers Section (Screen 10)
  Widget _buildTopPerformersSection() {
    return FutureBuilder<TestSeriesLeaderboardResult>(
      future: _leaderboardFuture,
      builder: (context, snapshot) {
        final entries = (snapshot.hasData && snapshot.data!.entries.isNotEmpty)
            ? snapshot.data!.entries
            : null;

        final performers = entries != null
            ? entries.take(3).map((e) => {
                'rank': '${e.rank}',
                'name': e.name,
                'score': '${e.score.toInt()}',
                'badge': e.rank == 1
                    ? 'gold'
                    : (e.rank == 2 ? 'silver' : 'bronze'),
              }).toList()
            : [
                {'rank': '1', 'name': 'Rohan Das', 'score': '96', 'badge': 'gold'},
                {'rank': '2', 'name': 'Arijit Sen', 'score': '94', 'badge': 'silver'},
                {'rank': '3', 'name': 'Surojit Roy', 'score': '92', 'badge': 'bronze'},
              ];

        final userEntry = entries?.firstWhere(
          (e) => e.isCurrentUser,
          orElse: () => const TestSeriesLeaderboardEntry(
            rank: 1248,
            userId: 'user-01',
            name: 'Susanta',
            score: 72,
            percentage: 72,
            testsCompleted: 14,
            isCurrentUser: true,
          ),
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Top Performers',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 10),
            // Top 3 list
            ...performers.map((p) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildPerformerRow(
                    rank: p['rank']!,
                    name: p['name']!,
                    score: p['score']!,
                    badge: p['badge']!,
                    isYou: false,
                  ),
                )),
            const SizedBox(height: 6),
            // Student's Own Highlighted Row (Screen 10)
            _buildPerformerRow(
              rank: userEntry != null ? '${userEntry.rank}' : '1,248',
              name: userEntry != null ? '${userEntry.name} (You)' : 'Susanta (You)',
              score: userEntry != null ? '${userEntry.score.toInt()}' : '72',
              badge: 'you',
              isYou: true,
            ),
          ],
        );
      },
    );
  }

  Widget _buildPerformerRow({
    required String rank,
    required String name,
    required String score,
    required String badge,
    required bool isYou,
  }) {
    Color rankBg = const Color(0xFFF1F5F9);
    Color rankColor = const Color(0xFF475569);

    if (badge == 'gold') {
      rankBg = const Color(0xFFFEF3C7);
      rankColor = const Color(0xFFD97706);
    } else if (badge == 'silver') {
      rankBg = const Color(0xFFE2E8F0);
      rankColor = const Color(0xFF475569);
    } else if (badge == 'bronze') {
      rankBg = const Color(0xFFFFEDD5);
      rankColor = const Color(0xFFC2410C);
    } else if (isYou) {
      rankBg = const Color(0xFFEFF6FF);
      rankColor = const Color(0xFF026BFC);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isYou ? const Color(0xFFEFF6FF) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isYou ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rankBg,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                rank,
                style: TextStyle(
                  fontSize: rank.length > 3 ? 9.5 : 12,
                  fontWeight: FontWeight.w800,
                  color: rankColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              name,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isYou ? FontWeight.w800 : FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
          Text(
            score,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom Painter for Rank Trend Line Chart matching Screen 10
class _RankTrendPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final points = [
      Offset(16, size.height * 0.85), // Test 1: 2,450
      Offset(size.width * 0.36, size.height * 0.70), // Test 2: 2,100
      Offset(size.width * 0.68, size.height * 0.42), // Test 3: 1,580
      Offset(size.width - 16, size.height * 0.15), // Test 4: 1,248
    ];

    final labels = ['2,450', '2,100', '1,580', '1,248'];

    final linePaint = Paint()
      ..color = const Color(0xFF026BFC)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    final dotPaint = Paint()
      ..color = const Color(0xFF026BFC)
      ..style = PaintingStyle.fill;

    final whitePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    // Draw line connecting points
    final path = Path();
    path.moveTo(points[0].dx, points[0].dy);
    for (int i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(path, linePaint);

    // Draw circles and text labels
    for (int i = 0; i < points.length; i++) {
      final p = points[i];
      canvas.drawCircle(p, 5, dotPaint);
      canvas.drawCircle(p, 2.5, whitePaint);

      final textSpan = TextSpan(
        text: labels[i],
        style: TextStyle(
          fontSize: 9.5,
          fontWeight: i == 3 ? FontWeight.w800 : FontWeight.w600,
          color: i == 3 ? const Color(0xFF026BFC) : const Color(0xFF64748B),
        ),
      );
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(p.dx - (textPainter.width / 2), p.dy - 16),
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
