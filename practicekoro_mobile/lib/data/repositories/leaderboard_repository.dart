import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>((ref) {
  return LeaderboardRepository();
});

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

class TestSeriesLeaderboardEntry {
  final int rank;
  final String userId;
  final String name;
  final String? avatarUrl;
  final String? district;
  final double score;
  final double percentage;
  final double accuracy;
  final int timeSpentSeconds;
  final int testsCompleted;
  final bool isCurrentUser;

  const TestSeriesLeaderboardEntry({
    required this.rank,
    required this.userId,
    required this.name,
    this.avatarUrl,
    this.district,
    required this.score,
    required this.percentage,
    this.accuracy = 0,
    this.timeSpentSeconds = 0,
    required this.testsCompleted,
    required this.isCurrentUser,
  });

  factory TestSeriesLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return TestSeriesLeaderboardEntry(
      rank: (json['rank'] as num).toInt(),
      userId: json['user_id'] as String? ?? '',
      name: json['name'] as String? ?? 'Student',
      avatarUrl: json['avatar_url'] as String?,
      district: json['district'] as String?,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
      timeSpentSeconds: (json['time_spent_seconds'] as num?)?.toInt() ?? 0,
      testsCompleted: (json['tests_completed'] as num?)?.toInt() ?? 1,
      isCurrentUser: (json['is_current_user'] as bool?) ?? false,
    );
  }
}

class TestSeriesLeaderboardResult {
  final String seriesId;
  final String seriesTitle;
  final int? userRank;
  final int totalParticipants;
  final double? userScore;
  final double? userPercentage;
  final List<TestSeriesLeaderboardEntry> entries;

  const TestSeriesLeaderboardResult({
    required this.seriesId,
    required this.seriesTitle,
    this.userRank,
    required this.totalParticipants,
    this.userScore,
    this.userPercentage,
    required this.entries,
  });

  factory TestSeriesLeaderboardResult.fromJson(Map<String, dynamic> json) {
    final rawList = json['rankings'] as List<dynamic>? ?? [];
    return TestSeriesLeaderboardResult(
      seriesId: json['series_id'] as String? ?? '',
      seriesTitle: json['series_title'] as String? ?? 'Test Series Leaderboard',
      userRank: (json['user_rank'] as num?)?.toInt(),
      totalParticipants: (json['total_participants'] as num?)?.toInt() ?? 0,
      userScore: (json['user_score'] as num?)?.toDouble(),
      userPercentage: (json['user_percentage'] as num?)?.toDouble(),
      entries: rawList
          .map((e) => TestSeriesLeaderboardEntry.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
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

  /// Fetches available test series list for the ranking switcher
  Future<List<Map<String, String>>> getAvailableTestSeries() async {
    try {
      final client = Supabase.instance.client;
      final rows = await client
          .from('test_series')
          .select('id, title, slug')
          .eq('is_active', true)
          .order('order_index', ascending: true);
      if (rows.isNotEmpty) {
        return rows
            .map((r) => {
                  'id': (r['id'] as String?) ?? '',
                  'title': (r['title'] as String?) ?? 'Test Series',
                  'slug': (r['slug'] as String?) ?? '',
                })
            .toList();
      }
    } catch (e) {
      debugPrint('Error fetching test series from Supabase: $e');
    }

    return const [];
  }

  /// Calculates and returns test-series-specific leaderboard with optional district filter
  Future<TestSeriesLeaderboardResult> getTestSeriesLeaderboard({
    String? seriesId,
    String? district,
  }) async {
    // 1. Try Supabase RPC
    try {
      final client = Supabase.instance.client;
      final params = <String, dynamic>{'p_series_id': seriesId};
      if (district != null && district.isNotEmpty && district != 'West Bengal') {
        params['p_district'] = district;
      }
      final response = await client.rpc(
        'get_test_series_leaderboard',
        params: params,
      );
      if (response is Map) {
        final res = TestSeriesLeaderboardResult.fromJson(
          Map<String, dynamic>.from(response),
        );
        if (res.entries.isNotEmpty) {
          return res;
        }
      }
    } catch (e) {
      debugPrint('Supabase get_test_series_leaderboard: $e');
    }

    return TestSeriesLeaderboardResult(
      seriesId: seriesId ?? '',
      seriesTitle: 'Test Series Leaderboard',
      totalParticipants: 0,
      entries: const [],
    );
  }

}
