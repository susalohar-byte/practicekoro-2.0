import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/question_model.dart';
import 'catalog_repository.dart';

final testRunnerRepositoryProvider = Provider<TestRunnerRepository>((ref) {
  return TestRunnerRepository(ref.read(catalogRepositoryProvider));
});

/// Thin adapter over the shared test-attempt service. Scoring and persistence
/// remain server-owned in the existing catalog/attempt RPCs.
class TestRunnerRepository {
  final CatalogRepository _catalog;

  const TestRunnerRepository(this._catalog);

  Future<Map<String, dynamic>> startAttempt(String testId) =>
      _catalog.startTestAttempt(testId);

  Future<List<QuestionModel>> loadQuestions(String testId) =>
      _catalog.getQuestionsForTest(testId);

  Future<List<Map<String, dynamic>>> loadSavedAnswers(String attemptId) =>
      _catalog.getSavedTestAnswers(attemptId);

  Future<void> saveAnswers({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
    required int timeSpentSeconds,
  }) => _catalog.saveTestAnswers(
    attemptId: attemptId,
    answers: answers,
    timeSpentSeconds: timeSpentSeconds,
  );

  Future<Map<String, dynamic>> submit({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
    required int timeSpentSeconds,
  }) => _catalog.submitTestAttempt(
    attemptId: attemptId,
    answers: answers,
    timeSpentSeconds: timeSpentSeconds,
  );

  Future<List<QuestionModel>> loadSolutions(String attemptId) =>
      _catalog.getAttemptSolutions(attemptId);
}
