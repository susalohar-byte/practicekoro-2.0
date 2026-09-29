import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/exam_model.dart';
import '../models/subject_model.dart';
import '../models/test_model.dart';
import '../models/question_model.dart';
import '../models/test_series_model.dart';
import '../models/live_test_model.dart';
import '../datasources/local_storage.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository();
});

final activeLiveTestProvider = FutureProvider<LiveTestModel?>((ref) async {
  final repo = ref.watch(catalogRepositoryProvider);
  return repo.getActiveLiveTest();
});

final popularTestSeriesProvider = FutureProvider<List<TestSeriesModel>>((ref) async {
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

  Future<List<MockTestModel>> getMockTests({String? examId, String? testType}) async {
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

  Future<MockTestModel?> getTestById(String testId) async {
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
      try {
        final response = await client
            .from('test_questions')
            .select('marks, negative_marks, question_order, questions(*)')
            .eq('test_id', testId)
            .order('question_order', ascending: true);

        if (response.isNotEmpty) {
          return (response as List<dynamic>).map((item) {
            final q = item['questions'] as Map<String, dynamic>;
            return QuestionModel(
              id: q['id'] as String,
              questionOrder: (item['question_order'] as num?)?.toInt() ?? 1,
              questionText: q['question_text'] as String,
              questionBengaliText: q['question_bengali_text'] as String?,
              imageUrl: q['image_url'] as String?,
              optionA: q['option_a'] as String,
              optionB: q['option_b'] as String,
              optionC: q['option_c'] as String,
              optionD: q['option_d'] as String,
              correctOption: q['correct_option'] as String,
              explanation: q['explanation'] as String?,
              explanationBengali: q['explanation_bengali'] as String?,
              marks: (item['marks'] as num?)?.toDouble() ?? 1.0,
              negativeMarks: (item['negative_marks'] as num?)?.toDouble() ?? 0.25,
            );
          }).toList();
        }
      } catch (_) {
        // Fallback
      }
    }
    return [];
  }

  Future<LiveTestModel?> getActiveLiveTest() async {
    final client = _supabase;
    if (client != null) {
      try {
        final response = await client
            .from('live_tests')
            .select('*, exams(title, icon_name)')
            .eq('is_published', true)
            .inFilter('status', ['live', 'scheduled'])
            .order('scheduled_start_time', ascending: true)
            .limit(1);
        if (response.isNotEmpty) {
          final item = (response as List<dynamic>).first as Map<String, dynamic>;
          final examData = item['exams'] as Map<String, dynamic>?;
          return LiveTestModel(
            id: item['id'] as String,
            title: item['title'] as String,
            examId: (item['exam_id'] as String?) ?? '',
            testSeriesId: item['test_series_id'] as String?,
            testId: (item['test_id'] as String?) ?? '',
            scheduledStartTime: item['scheduled_start_time'] != null
                ? DateTime.tryParse(item['scheduled_start_time'] as String) ?? DateTime.now()
                : DateTime.now(),
            scheduledEndTime: item['scheduled_end_time'] != null
                ? DateTime.tryParse(item['scheduled_end_time'] as String) ??
                    DateTime.now().add(const Duration(hours: 2))
                : DateTime.now().add(const Duration(hours: 2)),
            durationMinutes: (item['duration_minutes'] as num?)?.toInt() ?? 90,
            totalQuestions: (item['total_questions'] as num?)?.toInt() ?? 100,
            totalMarks: (item['total_marks'] as num?)?.toDouble() ?? 100.0,
            negativeMarking: (item['negative_marking'] as num?)?.toDouble() ?? 0.25,
            status: (item['status'] as String?) ?? 'scheduled',
            isPublished: (item['is_published'] as bool?) ?? true,
            enrolledCount: (item['enrolled_count'] as num?)?.toInt() ?? 0,
            examTitle: examData?['title'] as String?,
            examLogo: examData?['icon_name'] as String?,
          );
        }
      } catch (_) {
        // Fallback
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

  Future<bool> joinLiveTest(String liveTestId, String? userId) async {
    final client = _supabase;
    if (client != null && userId != null) {
      try {
        await client.from('live_test_participations').upsert({
          'live_test_id': liveTestId,
          'user_id': userId,
          'joined_at': DateTime.now().toIso8601String(),
          'status': 'registered',
        });
        return true;
      } catch (_) {
        return false;
      }
    }
    return true;
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
          final val = response['value'].toString().replaceAll('"', '').trim().toLowerCase();
          final mode = val == 'bilingual' ? 'bilingual' : 'bengali_only';
          await LocalStorageService.setContentLanguageMode(mode);
          return mode;
        }
      } catch (_) {}
    }
    return LocalStorageService.getContentLanguageMode();
  }
}
