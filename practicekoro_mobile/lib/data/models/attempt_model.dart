class AttemptAnswerState {
  final String questionId;
  String? selectedOption; // 'A', 'B', 'C', 'D' or null
  bool isMarkedForReview;
  int timeSpentSeconds;

  AttemptAnswerState({
    required this.questionId,
    this.selectedOption,
    this.isMarkedForReview = false,
    this.timeSpentSeconds = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'question_id': questionId,
      'selected_option': selectedOption,
      'is_marked_for_review': isMarkedForReview,
      'time_spent_seconds': timeSpentSeconds,
    };
  }

  factory AttemptAnswerState.fromJson(Map<String, dynamic> json) {
    return AttemptAnswerState(
      questionId: json['question_id'] as String,
      selectedOption: json['selected_option'] as String?,
      isMarkedForReview: (json['is_marked_for_review'] as bool?) ?? false,
      timeSpentSeconds: (json['time_spent_seconds'] as num?)?.toInt() ?? 0,
    );
  }
}

class TestAttemptModel {
  final String id;
  final String userId;
  final String testId;
  final String testTitle;
  final double score;
  final double totalMarks;
  final double percentage;
  final double accuracy;
  final int correctCount;
  final int wrongCount;
  final int skippedCount;
  final int timeSpentSeconds;
  final int totalQuestions;
  final double negativeMarksDeducted;
  final DateTime completedAt;
  final Map<String, AttemptAnswerState> answers;

  const TestAttemptModel({
    required this.id,
    required this.userId,
    required this.testId,
    required this.testTitle,
    required this.score,
    required this.totalMarks,
    required this.percentage,
    required this.accuracy,
    required this.correctCount,
    required this.wrongCount,
    required this.skippedCount,
    required this.timeSpentSeconds,
    required this.totalQuestions,
    this.negativeMarksDeducted = 0,
    required this.completedAt,
    this.answers = const {},
  });

  factory TestAttemptModel.fromJson(Map<String, dynamic> json) {
    final rawAnswers = json['answers'] as Map<String, dynamic>? ?? {};
    final parsedAnswers = rawAnswers.map(
      (k, v) =>
          MapEntry(k, AttemptAnswerState.fromJson(v as Map<String, dynamic>)),
    );

    return TestAttemptModel(
      id: json['id'] as String,
      userId: json['user_id'] as String? ?? 'guest-user',
      testId: json['test_id'] as String,
      testTitle: json['test_title'] as String? ?? 'Mock Test',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      totalMarks: (json['total_marks'] as num?)?.toDouble() ?? 100.0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
      correctCount: (json['correct_count'] as num?)?.toInt() ?? 0,
      wrongCount: (json['wrong_count'] as num?)?.toInt() ?? 0,
      skippedCount: (json['skipped_count'] as num?)?.toInt() ?? 0,
      timeSpentSeconds: (json['time_spent_seconds'] as num?)?.toInt() ?? 0,
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 0,
      negativeMarksDeducted:
          (json['negative_marks_deducted'] as num?)?.toDouble() ?? 0,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : DateTime.now(),
      answers: parsedAnswers,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'test_id': testId,
      'test_title': testTitle,
      'score': score,
      'total_marks': totalMarks,
      'percentage': percentage,
      'accuracy': accuracy,
      'correct_count': correctCount,
      'wrong_count': wrongCount,
      'skipped_count': skippedCount,
      'time_spent_seconds': timeSpentSeconds,
      'total_questions': totalQuestions,
      'negative_marks_deducted': negativeMarksDeducted,
      'completed_at': completedAt.toIso8601String(),
      'answers': answers.map((k, v) => MapEntry(k, v.toJson())),
    };
  }
}
