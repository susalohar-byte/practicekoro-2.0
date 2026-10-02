import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../datasources/local_storage.dart';

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

    // Default active test series
    return const [
      {
        'id': 'wbp-constable',
        'title': 'WBP Constable Test Series 2026',
        'slug': 'wbp-constable',
      },
      {
        'id': 'kp-constable',
        'title': 'KP Constable Test Series 2026',
        'slug': 'kp-constable',
      },
      {
        'id': 'ssc-gd',
        'title': 'SSC GD Test Series 2026',
        'slug': 'ssc-gd',
      },
      {
        'id': 'wbpsc-clerkship',
        'title': 'WBPSC Clerkship Test Series 2026',
        'slug': 'wbpsc-clerkship',
      },
      {
        'id': 'wbtet-primary',
        'title': 'WBTET Primary Test Series 2026',
        'slug': 'wbtet-primary',
      },
    ];
  }

  /// Calculates and returns test-series-specific leaderboard
  Future<TestSeriesLeaderboardResult> getTestSeriesLeaderboard({
    String? seriesId,
  }) async {
    // 1. Try Supabase RPC
    try {
      final client = Supabase.instance.client;
      final response = await client.rpc(
        'get_test_series_leaderboard',
        params: {'p_series_id': seriesId},
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

    // 2. Offline / Local fallback: Calculate from real local attempts + benchmark candidates
    return _buildLocalSeriesLeaderboard(seriesId);
  }

  TestSeriesLeaderboardResult _buildLocalSeriesLeaderboard(String? seriesId) {
    final targetId = seriesId ?? 'wbp-constable';
    final targetTitle = switch (targetId) {
      'kp-constable' || 'kp_constable_2026' => 'KP Constable Test Series 2026',
      'ssc-gd' || 'ssc_gd_2026' => 'SSC GD Test Series 2026',
      'wbpsc-clerkship' => 'WBPSC Clerkship Test Series 2026',
      'wbtet-primary' => 'WBTET Primary Test Series 2026',
      _ => 'WBP Constable Test Series 2026',
    };

    // Candidate benchmark aspirants
    final benchmarkCandidates = [
      {
        'id': 'cand-1',
        'name': 'Rahul Das',
        'avatar': 'assets/images/performer_rahul.png',
        'district': 'Kolkata',
        'score': 94.0,
        'percentage': 94.0,
        'accuracy': 96.0,
        'tests': 10,
        'time': 1800,
      },
      {
        'id': 'cand-2',
        'name': 'Amit Kumar',
        'avatar': 'assets/images/performer_amit.png',
        'district': 'Howrah',
        'score': 92.0,
        'percentage': 92.0,
        'accuracy': 94.0,
        'tests': 9,
        'time': 1950,
      },
      {
        'id': 'cand-3',
        'name': 'Suman Roy',
        'avatar': 'assets/images/performer_suman.png',
        'district': 'North 24 Parganas',
        'score': 91.0,
        'percentage': 91.0,
        'accuracy': 93.0,
        'tests': 9,
        'time': 2100,
      },
      {
        'id': 'cand-4',
        'name': 'Priya Sharma',
        'avatar': 'assets/images/performer_priya.png',
        'district': 'Hooghly',
        'score': 89.0,
        'percentage': 89.0,
        'accuracy': 91.0,
        'tests': 8,
        'time': 2200,
      },
      {
        'id': 'cand-5',
        'name': 'Sneha Mukherjee',
        'avatar': 'assets/images/performer_sneha.png',
        'district': 'Purba Bardhaman',
        'score': 86.5,
        'percentage': 86.5,
        'accuracy': 89.0,
        'tests': 8,
        'time': 2350,
      },
      {
        'id': 'cand-6',
        'name': 'Ankit Roy',
        'avatar': null,
        'district': 'Nadia',
        'score': 83.0,
        'percentage': 83.0,
        'accuracy': 87.0,
        'tests': 7,
        'time': 2400,
      },
      {
        'id': 'cand-7',
        'name': 'Puja Mondal',
        'avatar': null,
        'district': 'South 24 Parganas',
        'score': 80.5,
        'percentage': 80.5,
        'accuracy': 85.0,
        'tests': 6,
        'time': 2500,
      },
      {
        'id': 'cand-8',
        'name': 'Subhasish Das',
        'avatar': null,
        'district': 'Paschim Medinipur',
        'score': 78.0,
        'percentage': 78.0,
        'accuracy': 82.0,
        'tests': 6,
        'time': 2600,
      },
      {
        'id': 'cand-9',
        'name': 'Debolina Sen',
        'avatar': null,
        'district': 'Bankura',
        'score': 75.0,
        'percentage': 75.0,
        'accuracy': 80.0,
        'tests': 5,
        'time': 2700,
      },
      {
        'id': 'cand-10',
        'name': 'Rohan Ghosh',
        'avatar': null,
        'district': 'Purulia',
        'score': 71.5,
        'percentage': 71.5,
        'accuracy': 78.0,
        'tests': 5,
        'time': 2800,
      },
    ];

    // Check for user's completed attempts
    final userAttempts = LocalStorageService.getAttempts();
    final matchingAttempts = userAttempts.where((a) {
      if (a.testSeriesId != null && a.testSeriesId!.isNotEmpty) {
        return a.testSeriesId == targetId;
      }
      return true; // Match latest if not tagged
    }).toList();

    double? currentUserScore;
    double? currentUserPercentage;
    int? currentUserTests;
    double currentUserAccuracy = 0;
    int currentUserTime = 0;

    if (matchingAttempts.isNotEmpty) {
      currentUserScore = matchingAttempts.fold<double>(0, (s, a) => s + a.score);
      currentUserPercentage = matchingAttempts.fold<double>(0, (s, a) => s + a.percentage) / matchingAttempts.length;
      currentUserAccuracy = matchingAttempts.fold<double>(0, (s, a) => s + a.accuracy) / matchingAttempts.length;
      currentUserTime = matchingAttempts.fold<int>(0, (s, a) => s + a.timeSpentSeconds) ~/ matchingAttempts.length;
      currentUserTests = matchingAttempts.length;
    }

    // Current user display name
    String currentUserName = 'You (Candidate)';
    try {
      final user = Supabase.instance.client.auth.currentUser;
      final meta = user?.userMetadata?['full_name'] as String?;
      if (meta != null && meta.trim().isNotEmpty) {
        currentUserName = meta.trim();
      }
    } catch (_) {}

    final List<Map<String, dynamic>> allRows = [];
    for (final c in benchmarkCandidates) {
      allRows.add({
        'user_id': c['id'],
        'name': c['name'],
        'avatar_url': c['avatar'],
        'district': c['district'],
        'score': c['score'],
        'percentage': c['percentage'],
        'accuracy': c['accuracy'],
        'tests': c['tests'],
        'time': c['time'],
        'is_current_user': false,
      });
    }

    if (currentUserScore != null && currentUserPercentage != null) {
      allRows.add({
        'user_id': 'current-user',
        'name': currentUserName,
        'avatar_url': 'assets/images/student_avatar.png',
        'district': LocalStorageService.getLeaderboardDistrict() ?? 'West Bengal',
        'score': currentUserScore,
        'percentage': currentUserPercentage,
        'accuracy': currentUserAccuracy,
        'tests': currentUserTests ?? 1,
        'time': currentUserTime,
        'is_current_user': true,
      });
    }

    // Consistent ranking rule:
    // Higher score -> better rank
    // If equal, higher percentage -> better rank
    allRows.sort((a, b) {
      final scoreA = (a['score'] as num).toDouble();
      final scoreB = (b['score'] as num).toDouble();
      if ((scoreB - scoreA).abs() > 0.001) {
        return scoreB.compareTo(scoreA);
      }
      final pctA = (a['percentage'] as num).toDouble();
      final pctB = (b['percentage'] as num).toDouble();
      return pctB.compareTo(pctA);
    });

    int? userRank;
    final entries = <TestSeriesLeaderboardEntry>[];
    for (int i = 0; i < allRows.length; i++) {
      final r = allRows[i];
      final rank = i + 1;
      final isCurrent = r['is_current_user'] as bool;
      if (isCurrent) userRank = rank;

      entries.add(TestSeriesLeaderboardEntry(
        rank: rank,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        avatarUrl: r['avatar_url'] as String?,
        district: r['district'] as String?,
        score: (r['score'] as num).toDouble(),
        percentage: (r['percentage'] as num).toDouble(),
        accuracy: (r['accuracy'] as num).toDouble(),
        timeSpentSeconds: (r['time'] as num).toInt(),
        testsCompleted: (r['tests'] as num).toInt(),
        isCurrentUser: isCurrent,
      ));
    }

    return TestSeriesLeaderboardResult(
      seriesId: targetId,
      seriesTitle: targetTitle,
      userRank: userRank,
      totalParticipants: entries.length,
      userScore: currentUserScore,
      userPercentage: currentUserPercentage,
      entries: entries,
    );
  }
}
