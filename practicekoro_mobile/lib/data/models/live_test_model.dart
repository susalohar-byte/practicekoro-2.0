class LiveTestModel {
  final String id;
  final String title;
  final String examId;
  final String? testSeriesId;
  final String testId;
  final DateTime scheduledStartTime;
  final DateTime scheduledEndTime;
  final int durationMinutes;
  final int totalQuestions;
  final double totalMarks;
  final double negativeMarking;
  final String status; // 'scheduled', 'live', 'completed', 'cancelled'
  final bool isPublished;
  final int enrolledCount;
  final String? examTitle;
  final String? examLogo;
  final bool isUserEnrolled;

  const LiveTestModel({
    required this.id,
    required this.title,
    required this.examId,
    this.testSeriesId,
    required this.testId,
    required this.scheduledStartTime,
    required this.scheduledEndTime,
    this.durationMinutes = 90,
    this.totalQuestions = 100,
    this.totalMarks = 100.0,
    this.negativeMarking = 0.25,
    this.status = 'scheduled',
    this.isPublished = true,
    this.enrolledCount = 0,
    this.examTitle,
    this.examLogo,
    this.isUserEnrolled = false,
  });

  bool get isLiveNow {
    final now = DateTime.now();
    return status == 'live' ||
        (status == 'scheduled' &&
            now.isAfter(scheduledStartTime) &&
            now.isBefore(scheduledEndTime));
  }

  bool get isCompleted {
    return status == 'completed' || DateTime.now().isAfter(scheduledEndTime);
  }

  Duration get timeRemaining {
    final now = DateTime.now();
    if (now.isBefore(scheduledStartTime)) {
      return scheduledStartTime.difference(now);
    } else if (now.isBefore(scheduledEndTime)) {
      return scheduledEndTime.difference(now);
    }
    return Duration.zero;
  }

  factory LiveTestModel.fromJson(Map<String, dynamic> json) {
    return LiveTestModel(
      id: json['id'] as String,
      title: json['title'] as String,
      examId: (json['exam_id'] as String?) ?? '',
      testSeriesId: json['test_series_id'] as String?,
      testId: (json['test_id'] as String?) ?? '',
      scheduledStartTime: json['scheduled_start_time'] != null
          ? DateTime.tryParse(json['scheduled_start_time'] as String) ??
              DateTime.now().add(const Duration(days: 1))
          : DateTime.now().add(const Duration(days: 1)),
      scheduledEndTime: json['scheduled_end_time'] != null
          ? DateTime.tryParse(json['scheduled_end_time'] as String) ??
              DateTime.now().add(const Duration(days: 1, hours: 2))
          : DateTime.now().add(const Duration(days: 1, hours: 2)),
      durationMinutes: (json['duration_minutes'] as num?)?.toInt() ?? 90,
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 100,
      totalMarks: (json['total_marks'] as num?)?.toDouble() ?? 100.0,
      negativeMarking: (json['negative_marking'] as num?)?.toDouble() ?? 0.25,
      status: (json['status'] as String?) ?? 'scheduled',
      isPublished: (json['is_published'] as bool?) ?? true,
      enrolledCount: (json['enrolled_count'] as num?)?.toInt() ?? 0,
      examTitle: json['exam_title'] as String?,
      examLogo: json['exam_logo'] as String?,
      isUserEnrolled: (json['is_user_enrolled'] as bool?) ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'exam_id': examId,
      'test_series_id': testSeriesId,
      'test_id': testId,
      'scheduled_start_time': scheduledStartTime.toIso8601String(),
      'scheduled_end_time': scheduledEndTime.toIso8601String(),
      'duration_minutes': durationMinutes,
      'total_questions': totalQuestions,
      'total_marks': totalMarks,
      'negative_marking': negativeMarking,
      'status': status,
      'is_published': isPublished,
      'enrolled_count': enrolledCount,
      'exam_title': examTitle,
      'exam_logo': examLogo,
      'is_user_enrolled': isUserEnrolled,
    };
  }
}
