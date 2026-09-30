import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/leaderboard_repository.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  String _scope = 'West Bengal';
  String _district = 'Kolkata';
  final _repository = LeaderboardRepository();
  late Future<List<LeaderboardEntry>> _leaderboardFuture;

  @override
  void initState() {
    super.initState();
    final savedDistrict = LocalStorageService.getLeaderboardDistrict();
    if (savedDistrict != null && _districts.contains(savedDistrict)) {
      _district = savedDistrict;
    }
    _loadLeaderboard();
  }

  static const _districts = [
    'Alipurduar',
    'Bankura',
    'Birbhum',
    'Cooch Behar',
    'Dakshin Dinajpur',
    'Darjeeling',
    'Hooghly',
    'Howrah',
    'Jalpaiguri',
    'Jhargram',
    'Kalimpong',
    'Kolkata',
    'Malda',
    'Murshidabad',
    'Nadia',
    'North 24 Parganas',
    'Paschim Bardhaman',
    'Paschim Medinipur',
    'Purba Bardhaman',
    'Purba Medinipur',
    'Purulia',
    'South 24 Parganas',
    'Uttar Dinajpur',
  ];

  String get _scopeKey => switch (_scope) {
    'West Bengal' => 'west_bengal',
    'District' => 'district',
    _ => 'all_india',
  };

  void _loadLeaderboard() {
    _leaderboardFuture = _repository.getLeaderboard(
      scope: _scopeKey,
      district: _scope == 'District' ? _district : null,
    );
  }

  static const _avatarColors = [
    Color(0xFF2563EB),
    Color(0xFF7C3AED),
    Color(0xFF0F766E),
    Color(0xFFDB2777),
    Color(0xFFEA580C),
    Color(0xFF4F46E5),
  ];

  List<Map<String, dynamic>> _visibleStudents(List<LeaderboardEntry> entries) {
    return entries
        .map(
          (entry) => {
            'name': entry.name,
            'score': entry.averagePercentage,
            'district': entry.district ?? 'West Bengal',
            'tests': entry.completedTests,
            'color': _avatarColors[(entry.rank - 1) % _avatarColors.length],
            'rank': entry.rank,
          },
        )
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final completedAttempts = LocalStorageService.getAttempts();
    final userTestCount = completedAttempts.length;
    final userAccuracy = completedAttempts.isEmpty
        ? 0
        : (completedAttempts.fold<double>(0, (s, a) => s + a.accuracy) /
                  completedAttempts.length)
              .round();
    final userAvgScore = completedAttempts.isEmpty
        ? 0.0
        : completedAttempts.fold<double>(0, (s, a) => s + a.score) /
              completedAttempts.length;
    final userStreak = completedAttempts
        .map((a) => a.completedAt.toIso8601String().substring(0, 10))
        .toSet()
        .length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Sticky Header (Matches Website Rank.tsx)
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Row(
                children: [
                  if (Navigator.of(context).canPop()) ...[
                    InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(10),
                      child: const Padding(
                        padding: EdgeInsets.only(right: 10),
                        child: Icon(
                          Icons.arrow_back_rounded,
                          size: 22,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                  ] else ...[
                    InkWell(
                      onTap: () => context.go('/home'),
                      borderRadius: BorderRadius.circular(10),
                      child: const Padding(
                        padding: EdgeInsets.only(right: 10),
                        child: Icon(
                          Icons.arrow_back_rounded,
                          size: 22,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                  ],
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Leaderboard',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.5,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Compete, stay consistent and climb the ranks! 💙',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Scrollable Body
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  // 1. User's Personal Performance Strip (Matches Website Rank.tsx)
                  _buildPersonalStatsCard(
                    tests: userTestCount,
                    avgScore: userAvgScore,
                    accuracy: userAccuracy,
                    streak: userStreak,
                  ),
                  const SizedBox(height: 16),

                  // 2. Scope Picker & District Dropdown
                  _buildScopePicker(),
                  if (_scope == 'District') ...[
                    const SizedBox(height: 10),
                    _buildDistrictPicker(),
                  ],
                  const SizedBox(height: 18),

                  // 3. Live Platform Leaderboard
                  FutureBuilder<List<LeaderboardEntry>>(
                    future: _leaderboardFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState != ConnectionState.done) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 48),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFF0158FC),
                            ),
                          ),
                        );
                      }
                      if (snapshot.hasError) {
                        return _buildMessage(
                          Icons.leaderboard_outlined,
                          'Rankings unavailable',
                          'Sign in and connect to the internet to load live rankings.',
                          action: TextButton.icon(
                            onPressed: () => setState(_loadLeaderboard),
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('Try again'),
                          ),
                        );
                      }
                      final students = _visibleStudents(
                        snapshot.data ?? const [],
                      );
                      if (students.isEmpty) {
                        return _buildMessage(
                          Icons.emoji_events_outlined,
                          _scope == 'District'
                              ? 'No rankings for $_district yet'
                              : 'No ranked attempts yet',
                          'Rankings will appear after students complete mock tests.',
                        );
                      }
                      return _buildRankings(students);
                    },
                  ),

                  // 4. Recent Test Results Section
                  if (completedAttempts.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    _buildMyTestAttemptsSection(completedAttempts),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonalStatsCard({
    required int tests,
    required double avgScore,
    required int accuracy,
    required int streak,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.025),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildStatColumn('$tests', 'Tests'),
          _buildVerticalDivider(),
          _buildStatColumn(avgScore.toStringAsFixed(1), 'Avg Score'),
          _buildVerticalDivider(),
          _buildStatColumn('$accuracy%', 'Accuracy'),
          _buildVerticalDivider(),
          _buildStatColumn('🔥 $streak', 'Streak'),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalDivider() {
    return Container(
      width: 1,
      height: 32,
      color: const Color(0xFFE2E8F0),
    );
  }

  Widget _buildMyTestAttemptsSection(List<TestAttemptModel> attempts) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your Completed Mock Tests',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 12),
        ...attempts.take(10).map((a) {
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.assignment_turned_in_rounded,
                    color: Color(0xFF0158FC),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        a.testTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Score: ${a.score.toStringAsFixed(1)}/${a.totalMarks.toStringAsFixed(0)}  •  Correct: ${a.correctCount}  •  Wrong: ${a.wrongCount}',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${a.accuracy.round()}%',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildRankings(List<Map<String, dynamic>> students) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Top Performers',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
            ),
            const Spacer(),
            Text(
              _scope == 'District' ? _district : _scope,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildPodium(students),
        if (students.length > 3) ...[
          const SizedBox(height: 20),
          const Text(
            'All Rankings',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          ...students
              .skip(3)
              .toList()
              .asMap()
              .entries
              .map((entry) => _buildStudentRow(entry.value, entry.key + 4)),
        ],
      ],
    );
  }

  Widget _buildMessage(
    IconData icon,
    String title,
    String message, {
    Widget? action,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF0158FC), size: 34),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
              height: 1.4,
            ),
          ),
          ?action,
        ],
      ),
    );
  }

  Widget _buildScopePicker() {
    const scopes = ['All India', 'West Bengal', 'District'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: scopes.map((scope) {
          final selected = _scope == scope;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() {
                _scope = scope;
                _loadLeaderboard();
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 9,
                  horizontal: 4,
                ),
                decoration: BoxDecoration(
                  color: selected
                      ? const Color(0xFF0158FC)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  scope,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selected ? Colors.white : const Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDistrictPicker() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _district,
          isExpanded: true,
          icon: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: Color(0xFF0158FC),
          ),
          items: _districts
              .map(
                (district) =>
                    DropdownMenuItem(value: district, child: Text(district)),
              )
              .toList(),
          onChanged: (district) {
            if (district == null) return;
            setState(() => _district = district);
            LocalStorageService.saveLeaderboardDistrict(district);
            setState(_loadLeaderboard);
          },
        ),
      ),
    );
  }

  Widget _buildPodium(List<Map<String, dynamic>> students) {
    final first = students[0];
    final second = students.length > 1 ? students[1] : null;
    final third = students.length > 2 ? students[2] : null;
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 20, 10, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: second == null
                ? const SizedBox()
                : _podiumPerson(second, 2, const Color(0xFF94A3B8), 66),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _podiumPerson(
              first,
              1,
              const Color(0xFFF59E0B),
              90,
              champion: true,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: third == null
                ? const SizedBox()
                : _podiumPerson(third, 3, const Color(0xFFCD7F32), 54),
          ),
        ],
      ),
    );
  }

  Widget _podiumPerson(
    Map<String, dynamic> student,
    int rank,
    Color medal,
    double height, {
    bool champion = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (champion)
          const Icon(
            Icons.workspace_premium_rounded,
            color: Color(0xFFF59E0B),
            size: 23,
          )
        else
          const SizedBox(height: 23),
        const SizedBox(height: 4),
        CircleAvatar(
          radius: champion ? 24 : 20,
          backgroundColor: student['color'] as Color,
          child: Text(
            (student['name'] as String)[0],
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          student['name'] as String,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.navy,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(
          '${(student['score'] as double).toStringAsFixed(1)}%',
          style: TextStyle(
            fontSize: 12,
            color: champion ? const Color(0xFF0158FC) : const Color(0xFF64748B),
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: height,
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                medal.withValues(alpha: champion ? 0.18 : 0.11),
                Colors.white,
              ],
            ),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
            border: Border.all(color: medal.withValues(alpha: 0.25)),
          ),
          alignment: Alignment.center,
          child: Text(
            '$rank',
            style: TextStyle(
              fontSize: champion ? 27 : 20,
              color: medal.withValues(alpha: 0.85),
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStudentRow(Map<String, dynamic> student, int rank) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 34,
            child: Text(
              '#$rank',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          CircleAvatar(
            radius: 18,
            backgroundColor: student['color'] as Color,
            child: Text(
              (student['name'] as String)[0],
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['name'] as String,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  '${student['district']} · ${student['tests']} tests',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${(student['score'] as double).toStringAsFixed(1)}%',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF0F172A),
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
