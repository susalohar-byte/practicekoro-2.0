import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/leaderboard_repository.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  String _scope = 'All India';
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
    'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur',
    'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong',
    'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas',
    'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman',
    'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur',
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
    Color(0xFF2563EB), Color(0xFF7C3AED), Color(0xFF0F766E),
    Color(0xFFDB2777), Color(0xFFEA580C), Color(0xFF4F46E5),
  ];

  List<Map<String, dynamic>> _visibleStudents(List<LeaderboardEntry> entries) {
    return entries.map((entry) => {
      'name': entry.name,
      'score': entry.averagePercentage,
      'district': entry.district ?? 'India',
      'tests': entry.completedTests,
      'color': _avatarColors[(entry.rank - 1) % _avatarColors.length],
      'rank': entry.rank,
    }).toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FC),
      appBar: AppBar(
        title: const Text('Leaderboard', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.navy)),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          children: [
            _buildScopePicker(),
            if (_scope == 'District') ...[
              const SizedBox(height: 12),
              _buildDistrictPicker(),
            ],
            const SizedBox(height: 18),
            FutureBuilder<List<LeaderboardEntry>>(
              future: _leaderboardFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 80),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (snapshot.hasError) {
                  return _buildMessage(
                    Icons.leaderboard_outlined,
                    'Rankings unavailable',
                    'Sign in and connect to the internet to load rankings.',
                    action: TextButton.icon(
                      onPressed: () => setState(_loadLeaderboard),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Try again'),
                    ),
                  );
                }
                final students = _visibleStudents(snapshot.data ?? const []);
                if (students.isEmpty) {
                  return _buildMessage(
                    Icons.emoji_events_outlined,
                    _scope == 'District' ? 'No rankings for $_district yet' : 'No ranked attempts yet',
                    'Rankings will appear after students complete tests.',
                  );
                }
                return _buildRankings(students);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRankings(List<Map<String, dynamic>> students) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF063585), Color(0xFF0158FC)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.18), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: Row(
                children: [
                  Container(width: 48, height: 48, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFFFD166), size: 28)),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(_scope == 'District' ? '$_district Rankings' : '$_scope Rankings', style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900)), const SizedBox(height: 3), Text(_scope == 'District' ? 'Top performers in your selected district' : 'Compare performance with fellow aspirants', style: const TextStyle(color: Color(0xFFDCE9FF), fontSize: 12))])),
                  Text('${students.length}', style: const TextStyle(color: Colors.white, fontSize: 23, fontWeight: FontWeight.w900)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(children: [const Text('Top performers', style: TextStyle(color: AppColors.navy, fontSize: 17, fontWeight: FontWeight.w900)), const Spacer(), Text(_scope == 'District' ? _district : _scope, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w700))]),
            const SizedBox(height: 12),
            _buildPodium(students),
            if (students.length > 3) ...[
              const SizedBox(height: 20),
              const Text('Leaderboard', style: TextStyle(color: AppColors.navy, fontSize: 16, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              ...students.skip(3).toList().asMap().entries.map((entry) => _buildStudentRow(entry.value, entry.key + 4)),
            ],
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFD9E7FD))),
              child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 18), SizedBox(width: 9), Expanded(child: Text('Rankings are based on completed test performance. Select All India, West Bengal, or a district to change the leaderboard scope.', style: TextStyle(fontSize: 11.5, color: Color(0xFF475569), height: 1.35)))]),
            ),
      ],
    );
  }

  Widget _buildMessage(IconData icon, String title, String message, {Widget? action}) {
    return Container(
      margin: const EdgeInsets.only(top: 40),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(children: [
        Icon(icon, color: AppColors.primary, size: 34),
        const SizedBox(height: 10),
        Text(title, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.navy, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 5),
        Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, height: 1.4)),
        ?action,
      ]),
    );
  }

  Widget _buildScopePicker() {
    const scopes = ['All India', 'West Bengal', 'District'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Row(children: scopes.map((scope) {
        final selected = _scope == scope;
        return Expanded(child: GestureDetector(
          onTap: () => setState(() {
            _scope = scope;
            _loadLeaderboard();
          }),
          child: AnimatedContainer(duration: const Duration(milliseconds: 180), padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 4), decoration: BoxDecoration(color: selected ? AppColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(12)), alignment: Alignment.center, child: Text(scope, maxLines: 1, style: TextStyle(color: selected ? Colors.white : const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w800))),
        ));
      }).toList()),
    );
  }

  Widget _buildDistrictPicker() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFD9E7FD))),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _district,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
          items: _districts.map((district) => DropdownMenuItem(value: district, child: Text(district))).toList(),
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
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFEAF2FF), Colors.white]), borderRadius: BorderRadius.circular(22), border: Border.all(color: const Color(0xFFD9E7FD))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Expanded(child: second == null ? const SizedBox() : _podiumPerson(second, 2, const Color(0xFF94A3B8), 66)),
        const SizedBox(width: 8),
        Expanded(child: _podiumPerson(first, 1, const Color(0xFFF59E0B), 90, champion: true)),
        const SizedBox(width: 8),
        Expanded(child: third == null ? const SizedBox() : _podiumPerson(third, 3, const Color(0xFFCD7F32), 54)),
      ]),
    );
  }

  Widget _podiumPerson(Map<String, dynamic> student, int rank, Color medal, double height, {bool champion = false}) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      if (champion) const Icon(Icons.workspace_premium_rounded, color: Color(0xFFF59E0B), size: 23) else const SizedBox(height: 23),
      const SizedBox(height: 4),
      CircleAvatar(radius: champion ? 24 : 20, backgroundColor: student['color'] as Color, child: Text((student['name'] as String)[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900))),
      const SizedBox(height: 8),
      Text(student['name'] as String, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.navy, fontWeight: FontWeight.w900)),
      Text('${(student['score'] as double).toStringAsFixed(1)}%', style: TextStyle(fontSize: 12, color: champion ? AppColors.primary : const Color(0xFF64748B), fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      Container(height: height, width: double.infinity, decoration: BoxDecoration(color: Colors.white, borderRadius: const BorderRadius.vertical(top: Radius.circular(11)), border: Border.all(color: const Color(0xFFE2E8F0))), alignment: Alignment.center, child: Text('$rank', style: TextStyle(fontSize: champion ? 27 : 20, color: medal.withValues(alpha: 0.7), fontWeight: FontWeight.w900))),
    ]);
  }

  Widget _buildStudentRow(Map<String, dynamic> student, int rank) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE8EDF5))),
      child: Row(children: [
        SizedBox(width: 34, child: Text('#$rank', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w900))),
        CircleAvatar(radius: 18, backgroundColor: student['color'] as Color, child: Text((student['name'] as String)[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
        const SizedBox(width: 11),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(student['name'] as String, style: const TextStyle(fontSize: 13, color: AppColors.navy, fontWeight: FontWeight.w800)), Text('${student['district']} · ${student['tests']} tests', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)))])),
        Text('${(student['score'] as double).toStringAsFixed(1)}%', style: const TextStyle(fontSize: 14, color: AppColors.navy, fontWeight: FontWeight.w900)),
      ]),
    );
  }

}
