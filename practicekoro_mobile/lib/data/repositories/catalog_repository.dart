import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/exam_model.dart';
import '../models/subject_model.dart';
import '../models/test_model.dart';
import '../models/question_model.dart';
import '../models/test_series_model.dart';
import '../models/live_test_model.dart';
import '../models/attempt_model.dart';
import '../datasources/local_storage.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository();
});

final activeLiveTestProvider = FutureProvider<LiveTestModel?>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getActiveLiveTest();
});

final popularTestSeriesProvider = FutureProvider<List<TestSeriesModel>>((
  ref,
) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getPopularTestSeries();
});

final allTestSeriesProvider = FutureProvider<List<TestSeriesModel>>((
  ref,
) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getTestSeries();
});

final popularExamsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  final refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
    ref.invalidateSelf();
  });
  ref.onDispose(refreshTimer.cancel);
  return repo.getPopularExams();
});

final popularTestSeriesCardsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  final refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
    ref.invalidateSelf();
  });
  ref.onDispose(refreshTimer.cancel);
  return repo.getPopularTestSeriesCards();
});

final subjectsProvider = FutureProvider<List<SubjectModel>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getSubjects();
});

final contentLanguageModeProvider = FutureProvider<String>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.fetchContentLanguageMode();
});

final heroBannersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  final refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
    ref.invalidateSelf();
  });
  ref.onDispose(refreshTimer.cancel);
  return repo.getHeroBanners();
});

final dailyContentProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  final refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
    ref.invalidateSelf();
  });
  ref.onDispose(refreshTimer.cancel);
  return repo.getDailyContent();
});

final subscriptionPlansProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getSubscriptionPlans();
});

final notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getNotifications();
});

final subjectChaptersProvider = FutureProvider.family<List<ChapterModel>, String>((ref, subjectId) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getChaptersForSubject(subjectId);
});

/// Emits the current signed-in user id and re-emits on login / logout /
/// session restore, so user-specific providers refetch automatically.
final authUserIdProvider = StreamProvider<String?>((ref) {
  try {
    final auth = Supabase.instance.client.auth;
    return auth.onAuthStateChange
        .map((state) => state.session?.user.id)
        .distinct();
  } catch (_) {
    return Stream.value(null);
  }
});

final inProgressAttemptsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  ref.watch(authUserIdProvider);
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getInProgressAttempts();
});

final topPerformersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  ref.watch(authUserIdProvider);
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getTopPerformers();
});

class CatalogRepository {
  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  Future<List<ExamModel>> getExams() async {
    final client = _supabase;
    if (client != null) {
      try {
        final response = await client
            .from('exams')
            .select()
            .eq('is_active', true)
            .order('order_index', ascending: true);
        if (response.isNotEmpty) {
          return (response as List<dynamic>)
              .map((e) => ExamModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      } catch (_) {
        // Fallback to local mock data
      }
    }
    return [];
  }

  Future<ExamModel?> getExamById(String examId) async {
    final exams = await getExams();
    try {
      return exams.firstWhere((e) => e.id == examId || e.slug == examId);
    } catch (_) {
      return exams.isNotEmpty ? exams.first : null;
    }
  }

  Future<List<SubjectModel>> getSubjects({String? examId}) async {
    final client = _supabase;
    if (client != null) {
      try {
        var query = client.from('subjects').select().eq('is_active', true);
        if (examId != null) {
          query = query.or('exam_id.eq.$examId,exam_id.is.null');
        }
        final response = await query.order('order_index', ascending: true);
        if (response.isNotEmpty) {
          return (response as List<dynamic>)
              .map((e) => SubjectModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      } catch (_) {
        // Fallback
      }
    }
    return [];
  }

  Future<List<MockTestModel>> getMockTests({
    String? examId,
    String? testType,
  }) async {
    final client = _supabase;
    if (client != null) {
      try {
        var query = client
            .from('tests')
            .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
            .eq('is_active', true)
            .eq('status', 'published');
        if (examId != null) {
          query = query.eq('exam_id', examId);
        }
        if (testType != null) {
          query = query.eq('test_type', testType);
        }
        final response = await query.order('order_index', ascending: true);
        if (response.isNotEmpty) {
          return (response as List<dynamic>)
              .map((e) => MockTestModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      } catch (_) {
        // Fallback
      }
    }
    return [];
  }

  Future<List<MockTestModel>> getPracticeTests({
    required String subjectId,
    String? chapterId,
  }) async {
    final client = _supabase;
    if (client == null) return [];
    var query = client
        .from('tests')
        .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
        .eq('is_active', true)
        .eq('status', 'published')
        .eq('subject_id', subjectId)
        .inFilter('test_type', ['chapter_mock', 'subject_mock', 'topic']);
    if (chapterId != null) query = query.eq('chapter_id', chapterId);
    final response = await query.order('order_index', ascending: true);
    return (response as List<dynamic>)
        .map((item) => MockTestModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<MockTestModel?> getTestById(String testId) async {
    final client = _supabase;
    if (client != null) {
      try {
        final row = await client
            .from('tests')
            .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
            .eq('id', testId)
            .maybeSingle();
        if (row != null) {
          return MockTestModel.fromJson(Map<String, dynamic>.from(row));
        }
        final slugRow = await client
            .from('tests')
            .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
            .eq('slug', testId)
            .maybeSingle();
        if (slugRow != null) {
          return MockTestModel.fromJson(Map<String, dynamic>.from(slugRow));
        }
      } catch (_) {}
    }
    final allTests = await getMockTests();
    try {
      return allTests.firstWhere((t) => t.id == testId || t.slug == testId);
    } catch (_) {
      return null;
    }
  }

  Future<List<QuestionModel>> getQuestionsForTest(String testId) async {
    final client = _supabase;
    if (client != null) {
      // 1. Try get_student_exam_questions RPC (secure authenticated route)
      try {
        final response = await client.rpc(
          'get_student_exam_questions',
          params: {'p_test_id': testId},
        );
        if (response is List && response.isNotEmpty) {
          return response
              .whereType<Map<String, dynamic>>()
              .map(
                (question) => QuestionModel(
                  id: question['id'] as String,
                  questionOrder: (question['questionOrder'] as num?)?.toInt() ?? 1,
                  questionText: question['questionText'] as String? ?? '',
                  questionBengaliText: question['questionBengaliText'] as String?,
                  imageUrl: question['imageUrl'] as String?,
                  optionA: question['optionA'] as String? ?? '',
                  optionB: question['optionB'] as String? ?? '',
                  optionC: question['optionC'] as String? ?? '',
                  optionD: question['optionD'] as String? ?? '',
                  correctOption: '',
                  marks: (question['marks'] as num?)?.toDouble() ?? 1.0,
                  negativeMarks: (question['negativeMarks'] as num?)?.toDouble() ?? 0.25,
                  subjectName: question['subjectName'] as String?,
                  chapterName: question['chapterName'] as String?,
                ),
              )
              .toList();
        }
      } catch (error) {
        debugPrint('Failed to load Popular Exam configuration: $error');
        rethrow;
      }

    }
    return [];
  }

  String? get currentUserId => _supabase?.auth.currentUser?.id;

  Future<Map<String, dynamic>> startTestAttempt(String testId) async {
    final client = _supabase;
    if (client == null || client.auth.currentUser == null) {
      throw StateError('Sign in to start this test.');
    }
    final data = await client.rpc(
      'start_test_attempt',
      params: {'p_test_id': testId},
    );
    if (data is! Map || data['attempt_id'] == null) {
      throw StateError('The test attempt could not be started.');
    }
    return Map<String, dynamic>.from(data);
  }

  Future<void> saveTestAnswers({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
    required int timeSpentSeconds,
  }) async {
    final client = _supabase;
    if (client == null || client.auth.currentUser == null) {
      throw StateError('Sign in to save test answers.');
    }
    final saved = await client.rpc(
      'save_test_answers',
      params: {
        'p_attempt_id': attemptId,
        'p_answers': answers,
        'p_time_spent_seconds': timeSpentSeconds,
      },
    );
    if (saved != true) {
      throw StateError(
        'Answers could not be saved. Check your connection and try again.',
      );
    }
  }

  Future<List<Map<String, dynamic>>> getSavedTestAnswers(
    String attemptId,
  ) async {
    final client = _supabase;
    if (client == null) return [];
    final rows = await client
        .from('attempt_answers')
        .select(
          'question_id, selected_option, is_marked_for_review, time_spent_seconds',
        )
        .eq('attempt_id', attemptId);
    return (rows as List<dynamic>)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
  }

  Future<int> getAttemptElapsedSeconds(String attemptId) async {
    final client = _supabase;
    if (client == null || client.auth.currentUser == null) return 0;
    final row = await client
        .from('test_attempts')
        .select('time_spent_seconds')
        .eq('id', attemptId)
        .eq('user_id', client.auth.currentUser!.id)
        .maybeSingle();
    return (row?['time_spent_seconds'] as num?)?.toInt() ?? 0;
  }

  Future<Map<String, dynamic>> submitTestAttempt({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
    required int timeSpentSeconds,
  }) async {
    final client = _supabase;
    if (client == null || client.auth.currentUser == null) {
      throw StateError('Sign in to submit this test.');
    }
    final data = await client.rpc(
      'submit_test_attempt',
      params: {
        'p_attempt_id': attemptId,
        'p_answers': answers,
        'p_time_spent_seconds': timeSpentSeconds,
      },
    );
    if (data is! Map) throw StateError('The test result could not be saved.');
    return Map<String, dynamic>.from(data);
  }

  Future<List<QuestionModel>> getAttemptSolutions(String attemptId) async {
    final client = _supabase;
    if (client != null) {
      try {
        final response = await client.rpc(
          'get_attempt_solutions',
          params: {'p_attempt_id': attemptId},
        );
        if (response is List && response.isNotEmpty) {
          return response
              .whereType<Map<String, dynamic>>()
              .map(
                (question) => QuestionModel(
                  id: question['id'] as String,
                  questionOrder: (question['questionOrder'] as num?)?.toInt() ?? 1,
                  questionText: question['questionText'] as String? ?? '',
                  questionBengaliText: question['questionBengaliText'] as String?,
                  imageUrl: question['imageUrl'] as String?,
                  optionA: question['optionA'] as String? ?? '',
                  optionB: question['optionB'] as String? ?? '',
                  optionC: question['optionC'] as String? ?? '',
                  optionD: question['optionD'] as String? ?? '',
                  correctOption: question['correctOption'] as String? ?? '',
                  selectedOption: question['selectedOption'] as String?,
                  isCorrect: question['isCorrect'] as bool? ?? false,
                  explanation: question['explanation'] as String?,
                  explanationBengali: question['explanationBengali'] as String?,
                  subjectName: question['subjectName'] as String?,
                  chapterName: question['chapterName'] as String?,
                ),
              )
              .toList();
        }
      } catch (_) {}
    }
    return [];
  }

  Future<TestAttemptModel?> getCompletedAttempt(String attemptId) async {
    final client = _supabase;
    if (client == null) return null;
    final row = await client
        .from('test_attempts')
        .select('*, tests(title, total_questions, test_series_id, test_series(title))')
        .eq('id', attemptId)
        .maybeSingle();
    if (row == null || row['status'] != 'completed') return null;

    final answerRows = await client
        .from('attempt_answers')
        .select(
          'question_id, selected_option, is_marked_for_review, time_spent_seconds, marks_awarded',
        )
        .eq('attempt_id', attemptId);
    final answers = <String, dynamic>{};
    var negativeMarksDeducted = 0.0;
    for (final answer in answerRows as List<dynamic>) {
      final item = Map<String, dynamic>.from(answer as Map);
      final questionId = item['question_id'].toString();
      answers[questionId] = {
        'question_id': questionId,
        'selected_option': item['selected_option'],
        'is_marked_for_review': item['is_marked_for_review'],
        'time_spent_seconds': item['time_spent_seconds'],
      };
      final marksAwarded = (item['marks_awarded'] as num?)?.toDouble() ?? 0;
      if (marksAwarded < 0) negativeMarksDeducted += -marksAwarded;
    }

    final result = await client
        .from('test_results')
        .select('percentage, rank, percentile')
        .eq('attempt_id', attemptId)
        .maybeSingle();
    final test = row['tests'] as Map<String, dynamic>?;
    final series = test?['test_series'] as Map<String, dynamic>?;
    final totalMarks = (row['total_marks'] as num?)?.toDouble() ?? 0;
    final score = (row['score'] as num?)?.toDouble() ?? 0;
    return TestAttemptModel.fromJson({
      'id': row['id'],
      'user_id': row['user_id'],
      'test_id': row['test_id'],
      'test_title': test?['title'] ?? 'Test Result',
      'score': score,
      'total_marks': totalMarks,
      'percentage':
          result?['percentage'] ??
          (totalMarks > 0 ? score / totalMarks * 100 : 0),
      'accuracy': row['accuracy'],
      'correct_count': row['correct_count'],
      'wrong_count': row['wrong_count'],
      'skipped_count': row['skipped_count'],
      'time_spent_seconds': row['time_spent_seconds'],
      'total_questions':
          test?['total_questions'] ??
          ((row['correct_count'] as num? ?? 0) +
              (row['wrong_count'] as num? ?? 0) +
              (row['skipped_count'] as num? ?? 0)),
      'completed_at': row['end_time'] ?? row['created_at'],
      'negative_marks_deducted': negativeMarksDeducted,
      'answers': answers,
      'test_series_id': test?['test_series_id'],
      'test_series_title': series?['title'],
    });
  }

  /// Completed attempts for the signed-in student, enriched with Admin-managed
  /// test and series titles. RLS keeps this query scoped to the current student.
  Future<List<TestAttemptModel>> getStudentCompletedAttempts() async {
    final client = _supabase;
    final user = client?.auth.currentUser;
    if (client == null || user == null) return const [];
    final rows = await client
        .from('test_attempts')
        .select('*, tests(title, total_questions, test_series_id, test_series(title))')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('end_time', ascending: false);
    return (rows as List<dynamic>).map((value) {
      final row = Map<String, dynamic>.from(value as Map);
      final test = row['tests'] as Map<String, dynamic>? ?? const {};
      final series = test['test_series'] as Map<String, dynamic>? ?? const {};
      final marks = (row['total_marks'] as num?)?.toDouble() ?? 0;
      final score = (row['score'] as num?)?.toDouble() ?? 0;
      return TestAttemptModel.fromJson({
        'id': row['id'],
        'user_id': row['user_id'],
        'test_id': row['test_id'],
        'test_title': test['title'] ?? 'Test',
        'score': score,
        'total_marks': marks,
        'percentage': marks > 0 ? score / marks * 100 : 0,
        'accuracy': row['accuracy'],
        'correct_count': row['correct_count'],
        'wrong_count': row['wrong_count'],
        'skipped_count': row['skipped_count'],
        'time_spent_seconds': row['time_spent_seconds'],
        'total_questions': test['total_questions'] ?? 0,
        'completed_at': row['end_time'] ?? row['created_at'],
        'test_series_id': test['test_series_id'],
        'test_series_title': series['title'],
      });
    }).toList();
  }

  Future<Map<String, dynamic>?> getAttemptRankings(String attemptId) async {
    final client = _supabase;
    if (client == null || client.auth.currentUser == null) return null;

    final response = await client.rpc(
      'get_attempt_rankings',
      params: {'p_attempt_id': attemptId},
    );
    if (response is! Map) return null;
    return Map<String, dynamic>.from(response);
  }

  Future<List<ChapterModel>> getChaptersForSubject(String subjectId) async {
    final client = _supabase;
    if (client == null) return [];
    try {
      final response = await client
          .from('chapters')
          .select()
          .eq('subject_id', subjectId)
          .eq('is_active', true)
          .order('order_index', ascending: true);
      if (response.isNotEmpty) {
        return (response as List<dynamic>)
            .map((item) => ChapterModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      // If not UUID or not found directly, try finding subject by slug first
      final subj = await client
          .from('subjects')
          .select('id')
          .or('slug.eq.$subjectId,id.eq.$subjectId')
          .maybeSingle();
      if (subj != null && subj['id'] != null) {
        final slugResponse = await client
            .from('chapters')
            .select()
            .eq('subject_id', subj['id'])
            .eq('is_active', true)
            .order('order_index', ascending: true);
        if (slugResponse.isNotEmpty) {
          return (slugResponse as List<dynamic>)
              .map((item) => ChapterModel.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<LiveTestModel?> getActiveLiveTest() async {
    final client = _supabase;
    if (client != null) {
      // 1. Try public.live_tests table
      try {
        final response = await client
            .from('live_tests')
            .select('*, exams(title, icon_name), tests!inner(is_active, status)')
            .eq('is_published', true)
            .eq('tests.is_active', true)
            .eq('tests.status', 'published')
            .inFilter('status', ['live', 'upcoming', 'scheduled'])
            .order('scheduled_start_time', ascending: true)
            .limit(1);
        if (response.isNotEmpty) {
          final item =
              (response as List<dynamic>).first as Map<String, dynamic>;
          final examData = item['exams'] as Map<String, dynamic>?;
          return LiveTestModel(
            id: item['id'] as String,
            title: (item['title'] as String?) ?? 'Live Mock Test',
            examId: (item['exam_id'] as String?) ?? '',
            testSeriesId: item['test_series_id'] as String?,
            testId: (item['test_id'] as String?) ?? '',
            scheduledStartTime: item['scheduled_start_time'] != null
                ? DateTime.tryParse(item['scheduled_start_time'] as String) ??
                      DateTime.now()
                : DateTime.now(),
            scheduledEndTime: item['scheduled_end_time'] != null
                ? DateTime.tryParse(item['scheduled_end_time'] as String) ??
                      DateTime.now().add(const Duration(hours: 2))
                : DateTime.now().add(const Duration(hours: 2)),
            durationMinutes: (item['duration_minutes'] as num?)?.toInt() ?? 90,
            totalQuestions: (item['total_questions'] as num?)?.toInt() ?? 100,
            totalMarks: (item['total_marks'] as num?)?.toDouble() ?? 100.0,
            negativeMarking:
                (item['negative_marking'] as num?)?.toDouble() ?? 0,
            status: (item['status'] as String?) ?? 'scheduled',
            isPublished: (item['is_published'] as bool?) ?? true,
            enrolledCount: (item['enrolled_count'] as num?)?.toInt() ?? 0,
            examTitle: examData?['title'] as String?,
            examLogo: (item['logo'] ?? item['exam_logo'] ?? examData?['icon_name']) as String?,
          );
        }
      } catch (_) {
        // Fallback to app_settings
      }

      // 2. Fallback to public.app_settings ('live_tests_schedule_list')
      try {
        final setting = await client
            .from('app_settings')
            .select('value')
            .eq('id', 'live_tests_schedule_list')
            .maybeSingle();
        if (setting != null && setting['value'] != null) {
          dynamic raw = setting['value'];
          if (raw is String) {
            raw = jsonDecode(raw);
          }
          if (raw is List && raw.isNotEmpty) {
            final now = DateTime.now();
            Map<String, dynamic>? chosen;
            for (final entry in raw) {
              if (entry is Map<String, dynamic>) {
                if (entry['isPublished'] == false || entry['is_published'] == false) continue;
                final st = (entry['status'] as String?) ?? 'upcoming';
                if (st == 'cancelled') continue;
                final startStr =
                    (entry['startAt'] ?? entry['scheduledStartTime'] ?? '')
                        as String;
                final startDt = DateTime.tryParse(startStr) ?? now;
                final dur = (entry['durationMinutes'] as num?)?.toInt() ?? 90;
                final endDt = startDt.add(Duration(minutes: dur));
                if (now.isBefore(endDt) && st != 'ended') {
                  chosen = entry;
                  break;
                }
                chosen ??= entry;
              }
            }
            if (chosen != null) {
              final startStr =
                  (chosen['startAt'] ?? chosen['scheduledStartTime'] ?? '')
                      as String;
              final startDt = DateTime.tryParse(startStr) ?? DateTime.now();
              final dur = (chosen['durationMinutes'] as num?)?.toInt() ?? 90;
              final endDt = startDt.add(Duration(minutes: dur));
              final nowDt = DateTime.now();
              final derivedStatus = nowDt.isBefore(startDt)
                  ? 'scheduled'
                  : (nowDt.isBefore(endDt) ? 'live' : 'completed');

              return LiveTestModel(
                id: (chosen['id'] as String?) ?? 'live-test',
                title: (chosen['title'] as String?) ?? 'Live Mock Test',
                examId: (chosen['examId'] as String?) ?? '',
                testSeriesId: chosen['testSeriesId'] as String?,
                testId: (chosen['testId'] as String?) ?? '',
                scheduledStartTime: startDt,
                scheduledEndTime: endDt,
                durationMinutes: dur,
                totalQuestions:
                    (chosen['totalQuestions'] as num?)?.toInt() ?? 100,
                totalMarks: (chosen['totalMarks'] as num?)?.toDouble() ?? 100.0,
                negativeMarking:
                    (chosen['negativeMarking'] as num?)?.toDouble() ?? 0.25,
                status: derivedStatus,
                isPublished: (chosen['isPublished'] as bool?) ?? true,
                enrolledCount: (chosen['enrolledCount'] as num?)?.toInt() ?? 0,
                examTitle: chosen['examTitle'] as String?,
                examLogo: (chosen['logo'] ?? chosen['examLogo'] ?? chosen['exam_logo']) as String?,
              );
            }
          }
        }
      } catch (_) {
        // Ignore fallback error
      }
    }

    return null;
  }

  Future<List<TestSeriesModel>> getTestSeries({String? examId}) async {
    final client = _supabase;
    if (client != null) {
      try {
        var query = client
            .from('test_series')
            .select('*, exams:exam_id(id, title, category, slug, icon_name), tests(id, test_type, is_active, status)')
            .eq('is_active', true);
        if (examId != null) {
          query = query.eq('exam_id', examId);
        }
        final response = await query.order('order_index', ascending: true);
        if (response.isNotEmpty) {
          return (response as List<dynamic>).map((item) {
            final m = item as Map<String, dynamic>;
            final examData = m['exams'] as Map<String, dynamic>?;
            final rawTests = m['tests'] as List<dynamic>? ?? [];
            final activeTests = rawTests.where((t) {
              final act = t['is_active'] != false;
              final st = t['status'] as String?;
              return act && (st == 'published' || st == null);
            }).toList();

            final total = activeTests.length;
            final fCount = activeTests.where((t) => t['test_type'] == 'full_mock').length;
            final pCount = activeTests.where((t) => t['test_type'] == 'pyq').length;
            final tCount = activeTests.where((t) {
              final ty = t['test_type'] as String?;
              return ty == 'topic' || ty == 'chapter_mock' || ty == 'subject_mock';
            }).length;

            return TestSeriesModel(
              id: m['id'] as String,
              examId: (m['exam_id'] as String?) ?? '',
              title: m['title'] as String,
              slug: (m['slug'] as String?) ?? '',
              description: m['description'] as String?,
              iconUrl: m['icon_url'] as String?,
              isPremium: (m['is_premium'] as bool?) ?? false,
              isPopular: (m['is_popular'] as bool?) ?? (m['is_featured'] as bool?) ?? false,
              orderIndex: (m['order_index'] as num?)?.toInt() ?? 0,
              isActive: (m['is_active'] as bool?) ?? true,
              examTitle: examData?['title'] as String?,
              examLogo: examData?['icon_name'] as String?,
              examCategory: examData?['category'] as String?,
              testCount: total,
              fullMockCount: fCount,
              topicTestCount: tCount,
              pyqTestCount: pCount,
            );
          }).toList();
        }
      } catch (e) {
        debugPrint('getTestSeries error: $e');
      }
    }
    return [];
  }

  Future<List<TestSeriesModel>> getPopularTestSeries() async {
    final all = await getTestSeries();
    final popular = all.where((s) => s.isPopular).toList();
    // Admin-flagged "popular" series take priority. If none are flagged yet,
    // fall back to every active series so the home section never disappears.
    return popular.isNotEmpty ? popular : all;
  }

  Future<TestSeriesModel?> getTestSeriesById(String seriesId) async {
    final all = await getTestSeries();
    if (all.isNotEmpty) {
      for (final s in all) {
        if (s.id == seriesId || s.slug == seriesId) return s;
      }
      for (final s in all) {
        if (s.examId == seriesId ||
            s.examId.replaceAll('-', '_') == seriesId.replaceAll('-', '_')) {
          return s;
        }
      }
      for (final s in all) {
        if (s.id.contains(seriesId) || seriesId.contains(s.id)) return s;
      }
    }

    final client = _supabase;
    if (client != null) {
      try {
        final row = await client
            .from('test_series')
            .select('*, exams:exam_id(id, title, category, slug, icon_name), tests(id, test_type, is_active, status)')
            .or('id.eq.$seriesId,slug.eq.$seriesId')
            .eq('is_active', true)
            .maybeSingle();
        if (row != null) {
          return TestSeriesModel.fromJson(Map<String, dynamic>.from(row));
        }
      } catch (_) {}
    }

    // Check popular test series cards configuration as fallback
    final cards = await getPopularTestSeriesCards();
    final lowerTarget = seriesId.toLowerCase();
    for (final card in cards) {
      final cId = (card['id'] as String? ?? '').toLowerCase();
      final tsId = (card['testSeriesId'] as String? ?? '').toLowerCase();
      final cRoute = (card['route'] as String? ?? '').toLowerCase();
      if (cId == lowerTarget ||
          tsId == lowerTarget ||
          cRoute.endsWith('/$lowerTarget') ||
          (lowerTarget.contains('wbp') && cId.contains('wbp')) ||
          (lowerTarget.contains('kp') && cId.contains('kp')) ||
          (lowerTarget.contains('ssc') && cId.contains('ssc'))) {
        return TestSeriesModel(
          id: (card['testSeriesId'] as String?)?.isNotEmpty == true
              ? card['testSeriesId'] as String
              : (card['id'] as String? ?? seriesId),
          examId: (card['testSeriesId'] as String?)?.isNotEmpty == true
              ? card['testSeriesId'] as String
              : (card['id'] as String? ?? seriesId),
          title: card['title'] as String? ?? 'Test Series',
          slug: (card['testSeriesId'] as String?)?.isNotEmpty == true
              ? card['testSeriesId'] as String
              : (card['id'] as String? ?? seriesId),
          description: card['subtitle'] as String? ?? 'Complete Test Series',
          iconUrl: card['cardLogoUrl'] as String?,
          isPremium: false,
          isPopular: true,
          orderIndex: (card['orderIndex'] as num?)?.toInt() ?? 0,
          isActive: true,
          testCount: (card['fullMockCount'] as num?)?.toInt() ?? 40,
          fullMockCount: (card['fullMockCount'] as num?)?.toInt() ?? 40,
          topicTestCount: (card['topicTestCount'] as num?)?.toInt() ?? 120,
          pyqTestCount: (card['pyqTestCount'] as num?)?.toInt() ?? 25,
        );
      }
    }

    return null;
  }

  Future<List<MockTestModel>> getTestsForSeries(String seriesId) async {
    final client = _supabase;
    TestSeriesModel? series;
    try {
      series = await getTestSeriesById(seriesId);
    } catch (_) {}

    if (client != null) {
      try {
        final targetIds = <String>{seriesId};
        if (series != null) {
          targetIds.add(series.id);
          if (series.slug.isNotEmpty) targetIds.add(series.slug);
        }

        for (final tid in targetIds) {
          final rows = await client
              .from('tests')
              .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
              .eq('test_series_id', tid)
              .eq('is_active', true)
              .eq('status', 'published')
              .order('order_index', ascending: true);
          if (rows.isNotEmpty) {
            return rows
                .map((row) => MockTestModel.fromJson(Map<String, dynamic>.from(row as Map)))
                .toList();
          }
        }
      } catch (e) {
        debugPrint('getTestsForSeries error: $e');
      }
    }

    // Fallback: return tests matching exam or general mock tests
    try {
      final matching = await getMockTests(examId: series?.examId);
      if (matching.isNotEmpty) return matching;
      final general = await getMockTests();
      if (general.isNotEmpty) return general.take(10).toList();
    } catch (_) {}

    return [];
  }

  Future<Map<String, dynamic>> getSeriesAnalytics(String seriesId) async {
    final client = _supabase;
    if (client == null || client.auth.currentUser == null) {
      throw StateError('Sign in to view your test series analytics.');
    }
    final report = await client.rpc(
      'get_test_series_analytics',
      params: {'p_series_id': seriesId},
    );
    if (report is! Map) throw StateError('Series analytics are unavailable.');
    return Map<String, dynamic>.from(report);
  }

  Future<bool> joinLiveTest(String liveTestId, String? userId) async {
    final client = _supabase;
    if (client != null &&
        userId != null &&
        client.auth.currentUser?.id == userId) {
      try {
        await client.from('live_test_participants').upsert({
          'live_test_id': liveTestId,
          'user_id': userId,
          'status': 'registered',
        }, onConflict: 'live_test_id,user_id');
        return true;
      } catch (_) {
        return false;
      }
    }
    return true;
  }

  Future<void> updateLiveTestParticipant({
    required String liveTestId,
    required String attemptId,
    required String status,
    Map<String, dynamic>? result,
  }) async {
    final client = _supabase;
    final userId = client?.auth.currentUser?.id;
    if (client == null || userId == null) return;
    await client.from('live_test_participants').upsert({
      'live_test_id': liveTestId,
      'user_id': userId,
      'attempt_id': attemptId,
      'status': status,
      if (status == 'started') 'joined_at': DateTime.now().toIso8601String(),
      if (status == 'completed')
        'completed_at': DateTime.now().toIso8601String(),
      if (result != null) 'score': result['score'],
      if (result != null) 'accuracy': result['accuracy'],
      if (result != null) 'time_taken': result['time_spent_seconds'],
    }, onConflict: 'live_test_id,user_id');
  }

  Future<String> fetchContentLanguageMode() async {
    final client = _supabase;
    if (client != null) {
      try {
        final response = await client
            .from('app_settings')
            .select('key, value')
            .eq('key', 'content_language_mode')
            .maybeSingle();
        if (response != null && response['value'] != null) {
          final val = response['value']
              .toString()
              .replaceAll('"', '')
              .trim()
              .toLowerCase();
          final mode = val == 'bilingual' ? 'bilingual' : 'bengali_only';
          await LocalStorageService.setContentLanguageMode(mode);
          return mode;
        }
      } catch (_) {}
    }
    return LocalStorageService.getContentLanguageMode();
  }

  static const List<Map<String, dynamic>> _defaultPopularExams = [
    {
      'id': 'popular-wbp-constable',
      'examId': 'wbp-constable',
      'title': 'WBP Constable',
      'slug': 'wbp-constable',
      'route': '/exams/wbp-constable',
      'testsCount': '120+ Tests',
      'cardBadge': '120+ Tests',
      'cardGradientStart': '#0084FF',
      'cardGradientEnd': '#0048C6',
      'cardArrowColor': '#0066FF',
      'cardBgImage': 'assets/images/exam_wbp_bg.png',
      'cardEmblemUrl': 'assets/images/exams/emblem_series_wbp.png',
      'orderIndex': 1,
      'isActive': true,
    },
    {
      'id': 'popular-kp-constable',
      'examId': 'kp-police-si',
      'title': 'KP Constable',
      'slug': 'kolkata-police-si',
      'route': '/exams/kolkata-police-si',
      'testsCount': '100+ Tests',
      'cardBadge': '100+ Tests',
      'cardGradientStart': '#9B27F4',
      'cardGradientEnd': '#5E09BD',
      'cardArrowColor': '#8B5CF6',
      'cardBgImage': 'assets/images/exam_kp_bg.png',
      'cardEmblemUrl': 'assets/images/exams/emblem_series_kp.png',
      'orderIndex': 2,
      'isActive': true,
    },
    {
      'id': 'popular-ssc-gd',
      'examId': 'ssc-gd',
      'title': 'SSC GD',
      'slug': 'ssc-gd',
      'route': '/exams/ssc-gd',
      'testsCount': '150+ Tests',
      'cardBadge': '150+ Tests',
      'cardGradientStart': '#F97316',
      'cardGradientEnd': '#C22B00',
      'cardArrowColor': '#EA580C',
      'cardBgImage': 'assets/images/exam_ssc_bg.png',
      'cardEmblemUrl': 'assets/images/exams/emblem_series_ssc.png',
      'orderIndex': 3,
      'isActive': true,
    },
  ];

  Future<List<Map<String, dynamic>>> getPopularExams() async {
    final client = _supabase;
    List<Map<String, dynamic>> cardsToProcess = List<Map<String, dynamic>>.from(_defaultPopularExams);

    if (client != null) {
      try {
        final setting = await client
            .from('app_settings')
            .select('value')
            .eq('id', 'popular_exams_config')
            .maybeSingle();
        if (setting != null && setting['value'] != null) {
          dynamic raw = setting['value'];
          if (raw is String) raw = jsonDecode(raw);
          if (raw is List && raw.isNotEmpty) {
            final cards = raw
                .whereType<Map<String, dynamic>>()
                .where((card) => card['isActive'] != false)
                .toList();

            final isLegacyDemo = cards.length == 5 &&
                cards.any((c) =>
                    c['id'] == 'popular-primary-tet' &&
                    (c['cardBgImage'] as String? ?? '').contains('popular_exams/bg_'));

            if (!isLegacyDemo && cards.isNotEmpty) {
              cardsToProcess = cards;
            }
          }
        }
      } catch (error) {
        debugPrint('Failed to load Popular Exam configuration from Supabase: $error');
      }

      // Calculate dynamic test counts across tests, junction test_exams, and test_series
      try {
        final tests = await client
            .from('tests')
            .select('id, exam_id, test_series_id')
            .eq('is_active', true)
            .eq('status', 'published');
        final testExams = await client.from('test_exams').select('test_id, exam_id');
        final testSeries = await client.from('test_series').select('id, exam_id');

        final seriesExamMap = <String, String>{};
        if (testSeries.isNotEmpty) {
          for (final row in testSeries) {
            final item = Map<String, dynamic>.from(row as Map);
            if (item['id'] is String && item['exam_id'] is String) {
              seriesExamMap[item['id'] as String] = item['exam_id'] as String;
            }
          }
        }

        final examIdsByTest = <String, Set<String>>{};
        if (tests.isNotEmpty) {
          for (final row in tests) {
            final item = Map<String, dynamic>.from(row as Map);
            final testId = item['id'] as String?;
            if (testId == null) continue;
            final ids = examIdsByTest.putIfAbsent(testId, () => <String>{});
            if (item['exam_id'] is String) ids.add(item['exam_id'] as String);
            final seriesId = item['test_series_id'] as String?;
            if (seriesId != null && seriesExamMap.containsKey(seriesId)) {
              ids.add(seriesExamMap[seriesId]!);
            }
          }
        }
        if (testExams.isNotEmpty) {
          for (final row in testExams) {
            final item = Map<String, dynamic>.from(row as Map);
            final testId = item['test_id'] as String?;
            final examId = item['exam_id'] as String?;
            if (testId != null && examId != null) {
              examIdsByTest.putIfAbsent(testId, () => <String>{}).add(examId);
            }
          }
        }

        cardsToProcess = cardsToProcess.map((card) {
          final examId = card['examId'] as String?;
          if (examId == null) return card;
          final count = examIdsByTest.values.where((ids) => ids.contains(examId)).length;
          final countLabel = count > 0 ? '$count+ Tests' : (card['testsCount'] as String? ?? '0 Tests');
          return {
            ...card,
            'testsCount': countLabel,
            'cardBadge': countLabel,
          };
        }).toList();
      } catch (countError) {
        debugPrint('Dynamic test counting warning: $countError');
      }
    }

    cardsToProcess.sort((a, b) =>
        ((a['orderIndex'] as num?)?.toInt() ?? 0).compareTo(
          (b['orderIndex'] as num?)?.toInt() ?? 0,
        ));
    return cardsToProcess;
  }

  static const List<Map<String, dynamic>> _defaultPopularTestSeries = [
    {
      'id': 'popular-series-wbp',
      'testSeriesId': 'wbp-constable',
      'title': 'WBP Constable',
      'subtitle': 'Complete Test Series',
      'cardGradientStart': '#0066FF',
      'cardGradientEnd': '#0048C6',
      'cardArrowColor': '#1A8CFF',
      'cardBgImage': 'assets/images/series_wbp_bg.png',
      'cardLogoUrl': 'assets/images/exams/emblem_series_wbp.png',
      'orderIndex': 1,
      'route': '/test-series/wbp-constable',
      'isActive': true,
      'fullMockCount': 40,
      'topicTestCount': 120,
      'pyqTestCount': 25,
    },
    {
      'id': 'popular-series-kp',
      'testSeriesId': 'kp-constable',
      'title': 'KP Constable',
      'subtitle': 'Complete Test Series',
      'cardGradientStart': '#6211D8',
      'cardGradientEnd': '#450A99',
      'cardArrowColor': '#8B5CF6',
      'cardBgImage': 'assets/images/series_kp_bg.png',
      'cardLogoUrl': 'assets/images/exams/emblem_series_kp.png',
      'orderIndex': 2,
      'route': '/test-series/kp-constable',
      'isActive': true,
      'fullMockCount': 35,
      'topicTestCount': 110,
      'pyqTestCount': 20,
    },
    {
      'id': 'popular-series-ssc',
      'testSeriesId': 'ssc-gd',
      'title': 'SSC GD',
      'subtitle': 'Complete Test Series',
      'cardGradientStart': '#EA580C',
      'cardGradientEnd': '#C22B00',
      'cardArrowColor': '#FB6F24',
      'cardBgImage': 'assets/images/series_ssc_bg.png',
      'cardLogoUrl': 'assets/images/exams/emblem_series_ssc.png',
      'orderIndex': 3,
      'route': '/test-series/ssc-gd',
      'isActive': true,
      'fullMockCount': 50,
      'topicTestCount': 140,
      'pyqTestCount': 30,
    },
  ];

  Future<List<Map<String, dynamic>>> getPopularTestSeriesCards() async {
    final client = _supabase;
    List<Map<String, dynamic>> cardsToProcess =
        List<Map<String, dynamic>>.from(_defaultPopularTestSeries);

    if (client != null) {
      try {
        final setting = await client
            .from('app_settings')
            .select('value')
            .eq('id', 'popular_test_series_config')
            .maybeSingle();
        if (setting != null && setting['value'] != null) {
          dynamic raw = setting['value'];
          if (raw is String) raw = jsonDecode(raw);
          if (raw is List && raw.isNotEmpty) {
            final cards = raw
                .whereType<Map<String, dynamic>>()
                .where((card) => card['isActive'] != false)
                .toList();
            if (cards.isNotEmpty) {
              cardsToProcess = cards;
            }
          }
        }
      } catch (error) {
        debugPrint('Failed to load Popular Test Series configuration: $error');
      }

      // Calculate dynamic test counts (full mock, topic test, pyq) from database
      try {
        final tests = await client
            .from('tests')
            .select('id, test_series_id, exam_id, test_type')
            .eq('is_active', true)
            .eq('status', 'published');
        final allSeries = await client.from('test_series').select('id, slug, exam_id');

        final seriesIdAliases = <String, Set<String>>{};
        if (allSeries.isNotEmpty) {
          for (final row in allSeries) {
            final item = Map<String, dynamic>.from(row as Map);
            final sId = item['id'] as String?;
            final sSlug = item['slug'] as String?;
            final sExam = item['exam_id'] as String?;
            if (sId != null) {
              final set = seriesIdAliases.putIfAbsent(sId, () => <String>{});
              set.add(sId);
              if (sSlug != null) set.add(sSlug);
              if (sExam != null) set.add(sExam);
              if (sSlug != null) seriesIdAliases.putIfAbsent(sSlug, () => set).addAll(set);
              if (sExam != null) seriesIdAliases.putIfAbsent(sExam, () => set).addAll(set);
            }
          }
        }

        final fullMockCounts = <String, int>{};
        final topicCounts = <String, int>{};
        final pyqCounts = <String, int>{};

        if (tests.isNotEmpty) {
          for (final row in tests) {
            final item = Map<String, dynamic>.from(row as Map);
            final tsId = (item['test_series_id'] as String?) ?? (item['exam_id'] as String?);
            final testType = (item['test_type'] as String? ?? 'full_mock').toLowerCase();
            if (tsId != null) {
              final aliases = seriesIdAliases[tsId] ?? {tsId};
              for (final alias in aliases) {
                if (testType == 'full_mock') {
                  fullMockCounts[alias] = (fullMockCounts[alias] ?? 0) + 1;
                } else if (testType == 'pyq') {
                  pyqCounts[alias] = (pyqCounts[alias] ?? 0) + 1;
                } else {
                  topicCounts[alias] = (topicCounts[alias] ?? 0) + 1;
                }
              }
            }
          }
        }

        cardsToProcess = cardsToProcess.map((card) {
          final tsId = card['testSeriesId'] as String? ?? card['id'] as String?;
          if (tsId == null) return card;
          final fCount = fullMockCounts[tsId];
          final tCount = topicCounts[tsId];
          final pCount = pyqCounts[tsId];
          return {
            ...card,
            if (fCount != null && fCount > 0) 'fullMockCount': fCount,
            if (tCount != null && tCount > 0) 'topicTestCount': tCount,
            if (pCount != null && pCount > 0) 'pyqTestCount': pCount,
          };
        }).toList();
      } catch (countErr) {
        debugPrint('Dynamic test counts calculation warning: $countErr');
      }
    }

    cardsToProcess.sort((a, b) =>
        ((a['orderIndex'] as num?)?.toInt() ?? 0).compareTo(
          (b['orderIndex'] as num?)?.toInt() ?? 0,
        ));
    return cardsToProcess;
  }

  RealtimeChannel? _syncChannel;

  /// Sets up live Supabase Realtime synchronization with Admin Panel
  void setupRealtimeListeners(dynamic ref) {
    final client = _supabase;
    if (client == null || _syncChannel != null) return;
    try {
      _syncChannel = client.channel('pk_mobile_admin_sync');
      _syncChannel!
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'app_settings',
            callback: (_) {
              ref.invalidate(heroBannersProvider);
              ref.invalidate(popularExamsProvider);
              ref.invalidate(popularTestSeriesCardsProvider);
              ref.invalidate(dailyContentProvider);
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'hero_banners',
            callback: (_) {
              ref.invalidate(heroBannersProvider);
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'test_series',
            callback: (_) {
              ref.invalidate(popularTestSeriesCardsProvider);
              ref.invalidate(allTestSeriesProvider);
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'exams',
            callback: (_) {
              ref.invalidate(popularExamsProvider);
            },
          )
          .onBroadcast(
            event: 'banners_updated',
            callback: (_) {
              ref.invalidate(heroBannersProvider);
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Realtime sync setup ignored: $e');
    }
  }

  /// Fetch hero banner(s) from Supabase hero_banners table or app_settings
  Future<List<Map<String, dynamic>>> getHeroBanners() async {
    final client = _supabase;
    if (client != null) {
      // 1. Try public.hero_banners table (active, ordered by display_order)
      try {
        final rows = await client
            .from('hero_banners')
            .select()
            .eq('is_active', true)
            .order('display_order', ascending: true);
        if (rows.isNotEmpty) {
          final list = rows.whereType<Map<String, dynamic>>().toList();
          if (list.isNotEmpty) return list;
        }
      } catch (_) {}

      // 2. Try app_settings 'banners_hero_list' or 'hero_banners_list'
      try {
        final setting = await client
            .from('app_settings')
            .select('value')
            .or('id.eq.banners_hero_list,id.eq.hero_banners_list,key.eq.hero_banners_list')
            .maybeSingle();
        if (setting != null && setting['value'] != null) {
          dynamic raw = setting['value'];
          if (raw is String) raw = jsonDecode(raw);
          if (raw is List && raw.isNotEmpty) {
            final list = raw
                .whereType<Map<String, dynamic>>()
                .where((b) => b['isActive'] != false && b['is_active'] != false)
                .toList();
            list.sort((a, b) {
              final num oa = (a['displayOrder'] ?? a['display_order'] ?? a['order'] ?? 0) as num;
              final num ob = (b['displayOrder'] ?? b['display_order'] ?? b['order'] ?? 0) as num;
              return oa.compareTo(ob);
            });
            if (list.isNotEmpty) return list;
          }
        }
      } catch (_) {}
    }
    return const [];
  }

  /// Fetch daily fact / quote content from app_settings
  Future<Map<String, dynamic>> getDailyContent() async {
    final client = _supabase;
    if (client != null) {
      try {
        final setting = await client
            .from('app_settings')
            .select('value')
            .or('id.eq.daily_content,key.eq.daily_content')
            .maybeSingle();
        if (setting != null && setting['value'] != null) {
          dynamic raw = setting['value'];
          if (raw is String) raw = jsonDecode(raw);
          if (raw is Map<String, dynamic>) {
            return raw;
          }
        }
      } catch (_) {}
    }
    return const {};
  }

  /// Fetch in-progress (incomplete) test attempts for "Continue Practicing" section
  Future<List<Map<String, dynamic>>> getInProgressAttempts() async {
    final client = _supabase;
    if (client != null && client.auth.currentUser != null) {
      try {
        final userId = client.auth.currentUser!.id;
        final response = await client
            .from('test_attempts')
            .select('*, tests(title, test_type, subject_id, exam_id, test_series_id, total_questions, subjects(name), exams(title), test_series(title, slug))')
            .eq('user_id', userId)
            .eq('status', 'in_progress')
            .order('updated_at', ascending: false)
            .limit(5);
        if (response.isNotEmpty) {
          final attempts = response.whereType<Map<String, dynamic>>().toList();
          final attemptIds = attempts.map((attempt) => attempt['id'].toString()).toList();
          final answers = await client
              .from('attempt_answers')
              .select('attempt_id')
              .inFilter('attempt_id', attemptIds);
          final counts = <String, int>{};
          for (final answer in answers as List<dynamic>) {
            final id = (answer as Map<String, dynamic>)['attempt_id'].toString();
            counts[id] = (counts[id] ?? 0) + 1;
          }
          return attempts.map((attempt) => {
            ...attempt,
            '_answered_count': counts[attempt['id'].toString()] ?? 0,
          }).toList();
        }
      } catch (_) {}
    }
    return const [];
  }

  /// Fetch top performers across all exams for the home page section
  Future<List<Map<String, dynamic>>> getTopPerformers({int limit = 4}) async {
    final client = _supabase;
    if (client != null && client.auth.currentUser != null) {
      // West Bengal ranking first (requires a district on the profile);
      // fall back to all-India so the home section still has data.
      for (final scope in const ['west_bengal', 'all_india']) {
        try {
          final response = await client.rpc(
            'get_app_leaderboard',
            params: {'p_scope': scope, 'p_district': null},
          );
          if (response is List && response.isNotEmpty) {
            return response
                .whereType<Map<String, dynamic>>()
                .take(limit)
                .toList();
          }
        } catch (_) {}
      }
    }
    return const [];
  }

  /// Fetch active subscription plans configured in Admin Panel
  Future<List<Map<String, dynamic>>> getSubscriptionPlans() async {
    final client = _supabase;
    if (client != null) {
      try {
        final res = await client
            .from('subscription_plans')
            .select()
            .eq('is_active', true)
            .order('order_index', ascending: true);
        if (res.isNotEmpty) {
          return res.whereType<Map<String, dynamic>>().toList();
        }
      } catch (_) {}
    }
    return const [];
  }

  /// Validate coupon code against Admin-configured coupons
  Future<Map<String, dynamic>?> validateCoupon(String code) async {
    final client = _supabase;
    if (client != null) {
      try {
        final res = await client
            .from('coupons')
            .select()
            .ilike('code', code.trim())
            .eq('is_active', true)
            .maybeSingle();
        if (res != null) {
          return Map<String, dynamic>.from(res);
        }
      } catch (_) {}
    }
    return null;
  }

  /// Fetch broadcast notifications sent from Admin Panel
  Future<List<Map<String, dynamic>>> getNotifications() async {
    final client = _supabase;
    if (client != null) {
      try {
        final res = await client
            .from('notifications')
            .select()
            .order('created_at', ascending: false)
            .limit(30);
        if (res.isNotEmpty) {
          return res.whereType<Map<String, dynamic>>().toList();
        }
      } catch (_) {}
    }
    return const [];
  }

  /// Create Razorpay payment order via Edge Function or database RPC
  Future<Map<String, dynamic>> createPaymentOrder(String planId) async {
    final client = _supabase;
    if (client == null) {
      throw Exception('Supabase client not initialized');
    }

    // 1. Edge Function
    try {
      final res = await client.functions.invoke(
        'create-razorpay-order',
        body: {'planId': planId},
      );
      if (res.data != null && res.data is Map && res.data['order_id'] != null) {
        return Map<String, dynamic>.from(res.data as Map);
      }
      if (res.data != null && res.data is Map && res.data['error'] != null) {
        debugPrint('create-razorpay-order edge function message: ${res.data['error']}');
      }
    } catch (e) {
      debugPrint('create-razorpay-order edge function invoke error: $e');
    }

    // 2. Database RPC fallback
    try {
      final res = await client.rpc('create_razorpay_order', params: {
        'p_plan_id': planId,
      });
      if (res != null && res is Map) {
        return Map<String, dynamic>.from(res);
      }
    } catch (e) {
      debugPrint('create_razorpay_order RPC fallback error: $e');
      throw Exception('Payment order creation failed: $e');
    }

    throw Exception('Failed to create payment order. Please try again.');
  }

  /// Verify Razorpay payment via Edge Function or database RPC
  Future<bool> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
    required String planId,
  }) async {
    final client = _supabase;
    if (client == null) return false;

    // 1. Edge Function
    try {
      final res = await client.functions.invoke(
        'verify-payment',
        body: {
          'orderId': orderId,
          'paymentId': paymentId,
          'signature': signature,
          'planId': planId,
        },
      );
      if (res.data != null && res.data is Map && res.data['success'] == true) {
        await LocalStorageService.setProUser(true);
        return true;
      }
    } catch (e) {
      debugPrint('verify-payment edge function invoke error: $e');
    }

    // 2. RPC fallback
    try {
      final res = await client.rpc('verify_razorpay_payment', params: {
        'p_order_id': orderId,
        'p_payment_id': paymentId,
        'p_signature': signature,
        'p_plan_id': planId,
      });
      if (res != null) {
        await LocalStorageService.setProUser(true);
        return true;
      }
    } catch (e) {
      debugPrint('verify_razorpay_payment RPC error: $e');
    }

    return false;
  }
}
