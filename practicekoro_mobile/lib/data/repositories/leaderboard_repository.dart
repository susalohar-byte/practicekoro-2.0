import 'package:supabase_flutter/supabase_flutter.dart';

class LeaderboardEntry {
  final int rank;
  final String name;
  final double averagePercentage;
  final String? district;
  final int completedTests;

  const LeaderboardEntry({
    required this.rank,
    required this.name,
    required this.averagePercentage,
    required this.district,
    required this.completedTests,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: (json['rank'] as num).toInt(),
      name: json['display_name'] as String? ?? 'Student',
      averagePercentage: (json['average_percentage'] as num).toDouble(),
      district: json['district'] as String?,
      completedTests: (json['tests_count'] as num).toInt(),
    );
  }
}

class LeaderboardRepository {
  Future<List<LeaderboardEntry>> getLeaderboard({
    required String scope,
    String? district,
  }) async {
    final SupabaseClient client;
    try {
      client = Supabase.instance.client;
    } catch (_) {
      throw StateError('Rankings are unavailable while offline.');
    }
    if (client.auth.currentUser == null) {
      throw const AuthException('Sign in to view rankings.');
    }

    final response = await client.rpc(
      'get_app_leaderboard',
      params: {
        'p_scope': scope,
        'p_district': district,
      },
    );

    return (response as List<dynamic>)
        .map((row) => LeaderboardEntry.fromJson(row as Map<String, dynamic>))
        .toList(growable: false);
  }
}
