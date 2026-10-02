import 'dart:convert';
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
import '../datasources/sample_exam_questions.dart';

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

final contentLanguageModeProvider = FutureProvider<String>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.fetchContentLanguageMode();
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
        var query = client.from('tests').select().eq('is_active', true);
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
        .select()
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
        final row = await client.from('tests').select().eq('id', testId).maybeSingle();
        if (row != null) {
          return MockTestModel.fromJson(Map<String, dynamic>.from(row));
        }
      } catch (_) {}
    }
    final allTests = await getMockTests();
    try {
      return allTests.firstWhere((t) => t.id == testId || t.slug == testId);
    } catch (_) {
      for (final seriesId in ['wbp-constable', 'kp-constable', 'wb-tet', 'panchayat']) {
        final generated = SampleExamQuestions.generateTestsForSeries(seriesId, 'Test Series');
        try {
          return generated.firstWhere((t) => t.id == testId || t.slug == testId);
        } catch (_) {}
      }
      return null;
    }
  }

  Future<List<QuestionModel>> getQuestionsForTest(String testId) async {
    final client = _supabase;
    if (client != null) {
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
                  marks: (question['marks'] as num?)?.toDouble() ?? 1,
                  negativeMarks: 0,
                  subjectName: question['subjectName'] as String?,
                  chapterName: question['chapterName'] as String?,
                ),
              )
              .toList();
        }
      } catch (_) {}
    }
    return SampleExamQuestions.defaultQuestions;
  }

  String? get currentUserId => _supabase?.auth.currentUser?.id;

  Future<Map<String, dynamic>> startTestAttempt(String testId) async {
    final client = _supabase;
    if (client != null && client.auth.currentUser != null) {
      try {
        final data = await client.rpc(
          'start_test_attempt',
          params: {'p_test_id': testId},
        );
        if (data is Map) {
          return Map<String, dynamic>.from(data);
        }
      } catch (_) {}
    }
    return {
      'attempt_id': 'att-${DateTime.now().millisecondsSinceEpoch}',
      'start_time': DateTime.now().toIso8601String(),
    };
  }

  Future<void> saveTestAnswers({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
    required int timeSpentSeconds,
  }) async {
    final client = _supabase;
    if (client == null) return;
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

  Future<Map<String, dynamic>> submitTestAttempt({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
    required int timeSpentSeconds,
  }) async {
    final client = _supabase;
    if (client != null && client.auth.currentUser != null) {
      try {
        final data = await client.rpc(
          'submit_test_attempt',
          params: {
            'p_attempt_id': attemptId,
            'p_answers': answers,
            'p_time_spent_seconds': timeSpentSeconds,
          },
        );
        if (data is Map) {
          return Map<String, dynamic>.from(data);
        }
      } catch (_) {}
    }
    return {};
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
    final attempts = LocalStorageService.getAttempts();
    final localAttempt = attempts.isNotEmpty ? attempts.firstWhere((a) => a.id == attemptId, orElse: () => attempts.first) : null;
    final userAnswers = localAttempt?.answers ?? {};

    return SampleExamQuestions.defaultQuestions.map((q) {
      final ans = userAnswers[q.id];
      final sel = ans?.selectedOption ?? (q.questionOrder == 1 ? 'B' : (q.questionOrder == 2 ? 'A' : (q.questionOrder == 3 ? 'C' : null)));
      final isCorr = sel != null && sel.toUpperCase() == q.correctOption.toUpperCase();
      return QuestionModel(
        id: q.id,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        questionBengaliText: q.questionBengaliText,
        imageUrl: q.imageUrl,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        selectedOption: sel,
        isCorrect: isCorr,
        explanation: q.explanation,
        explanationBengali: q.explanationBengali,
        subjectName: q.subjectName,
        chapterName: q.chapterName,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      );
    }).toList();
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
    final response = await client
        .from('chapters')
        .select()
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index', ascending: true);
    return (response as List<dynamic>)
        .map((item) => ChapterModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<LiveTestModel?> getActiveLiveTest() async {
    final client = _supabase;
    if (client != null) {
      // 1. Try public.live_tests table
      try {
        final response = await client
            .from('live_tests')
            .select('*, exams(title, icon_name)')
            .eq('is_published', true)
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
            examLogo: examData?['icon_name'] as String?,
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

  Future<List<TestSeriesModel>> getPopularTestSeries() async {
    final client = _supabase;
    if (client != null) {
      try {
        final response = await client
            .from('test_series')
            .select('*, exams(title, icon_name)')
            .eq('is_active', true)
            .eq('is_popular', true)
            .order('order_index', ascending: true);
        if (response.isNotEmpty) {
          return (response as List<dynamic>).map((item) {
            final m = item as Map<String, dynamic>;
            final examData = m['exams'] as Map<String, dynamic>?;
            return TestSeriesModel(
              id: m['id'] as String,
              examId: (m['exam_id'] as String?) ?? '',
              title: m['title'] as String,
              slug: (m['slug'] as String?) ?? '',
              description: m['description'] as String?,
              iconUrl: m['icon_url'] as String?,
              isPremium: (m['is_premium'] as bool?) ?? false,
              isPopular: (m['is_popular'] as bool?) ?? true,
              orderIndex: (m['order_index'] as num?)?.toInt() ?? 0,
              isActive: (m['is_active'] as bool?) ?? true,
              examTitle: examData?['title'] as String?,
              examLogo: examData?['icon_name'] as String?,
              testCount: (m['test_count'] as num?)?.toInt() ?? 0,
            );
          }).toList();
        }
      } catch (_) {
        // Fallback
      }
    }
    return [];
  }

  Future<TestSeriesModel?> getTestSeriesById(String seriesId) async {
    final client = _supabase;
    if (client == null) return null;
    final row = await client
        .from('test_series')
        .select('*, exams(title, icon_name)')
        .eq('id', seriesId)
        .eq('is_active', true)
        .maybeSingle();
    if (row != null) {
      final exam = row['exams'] as Map<String, dynamic>?;
      final tests = await client
          .from('tests')
          .select('id')
          .eq('test_series_id', seriesId)
          .eq('is_active', true)
          .eq('status', 'published');
      return TestSeriesModel(
        id: row['id'] as String,
        examId: row['exam_id'] as String? ?? '',
        title: row['title'] as String? ?? 'Test Series',
        slug: row['slug'] as String? ?? '',
        description: row['description'] as String?,
        iconUrl: row['icon_url'] as String?,
        isPremium: row['is_premium'] as bool? ?? false,
        isPopular: row['is_popular'] as bool? ?? false,
        orderIndex: (row['order_index'] as num?)?.toInt() ?? 0,
        isActive: row['is_active'] as bool? ?? true,
        examTitle: exam?['title'] as String?,
        examLogo: exam?['icon_name'] as String?,
        testCount: (tests as List<dynamic>).length,
      );
    }
    // Fallback for well-known test series IDs
    final isKp = seriesId.contains('kp');
    final isTet = seriesId.contains('tet');
    final isPanchayat = seriesId.contains('panchayat') || seriesId.contains('wbpsc');
    return TestSeriesModel(
      id: seriesId,
      examId: isKp ? 'kp-constable' : (isTet ? 'wb-tet' : 'wbp-constable'),
      title: isKp
          ? 'KP Constable Test Series 2026'
          : isTet
              ? 'WB TET Test Series 2026'
              : isPanchayat
                  ? 'Panchayat Exam Test Series 2026'
                  : 'WBP Constable Test Series 2026',
      slug: seriesId,
      description:
          'Complete test series for ${isKp ? "Kolkata Police Constable" : isTet ? "West Bengal Primary TET" : "WBP Constable"} 2026 with full mock tests, topic-wise tests and previous year questions. Designed as per latest syllabus and exam pattern.',
      isPopular: true,
      testCount: 60,
    );
  }

  Future<List<MockTestModel>> getTestsForSeries(String seriesId) async {
    final client = _supabase;
    if (client != null) {
      try {
        final rows = await client
            .from('tests')
            .select()
            .eq('test_series_id', seriesId)
            .eq('is_active', true)
            .eq('status', 'published')
            .order('order_index', ascending: true);
        if (rows.isNotEmpty) {
          return (rows as List<dynamic>)
              .map(
                (row) =>
                    MockTestModel.fromJson(Map<String, dynamic>.from(row as Map)),
              )
              .toList();
        }
      } catch (_) {}
    }
    return SampleExamQuestions.generateTestsForSeries(seriesId, 'WBP Constable Test Series 2026');
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
}
