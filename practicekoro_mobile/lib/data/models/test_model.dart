class MockTestModel {
  final String id;
  final String? examId;
  final String? subjectId;
  final String? chapterId;
  final String title;
  final String slug;
  final String? description;
  final String testType; // 'full_mock', 'chapter_mock', 'subject_mock', 'pyq'
  final int durationMinutes;
  final int totalQuestions;
  final double totalMarks;
  final double passingMarks;
  final double negativeMarking;
  final bool isPremium;
  final int? year;
  final int orderIndex;
  final bool isActive;
  final String? examTitle;
  final String? subjectName;
  final String? chapterName;

  const MockTestModel({
    required this.id,
    this.examId,
    this.subjectId,
    this.chapterId,
    required this.title,
    required this.slug,
    this.description,
    this.testType = 'full_mock',
    this.durationMinutes = 60,
    this.totalQuestions = 100,
    this.totalMarks = 100.0,
    this.passingMarks = 40.0,
    this.negativeMarking = 0,
    this.isPremium = false,
    this.year,
    this.orderIndex = 0,
    this.isActive = true,
    this.examTitle,
    this.subjectName,
    this.chapterName,
  });

  factory MockTestModel.fromJson(Map<String, dynamic> json) {
    return MockTestModel(
      id: json['id'] as String,
      examId: json['exam_id'] as String?,
      subjectId: json['subject_id'] as String?,
      chapterId: json['chapter_id'] as String?,
      title: json['title'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      testType: (json['test_type'] as String?) ?? 'full_mock',
      durationMinutes: (json['duration_minutes'] as num?)?.toInt() ?? 60,
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 100,
      totalMarks: (json['total_marks'] as num?)?.toDouble() ?? 100.0,
      passingMarks: (json['passing_marks'] as num?)?.toDouble() ?? 40.0,
      negativeMarking: (json['negative_marking'] as num?)?.toDouble() ?? 0,
      isPremium: (json['is_premium'] as bool?) ?? false,
      year: (json['year'] as num?)?.toInt(),
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      isActive: (json['is_active'] as bool?) ?? true,
      examTitle: json['exam_title'] as String?,
      subjectName: json['subject_name'] as String?,
      chapterName: json['chapter_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'subject_id': subjectId,
      'chapter_id': chapterId,
      'title': title,
      'slug': slug,
      'description': description,
      'test_type': testType,
      'duration_minutes': durationMinutes,
      'total_questions': totalQuestions,
      'total_marks': totalMarks,
      'passing_marks': passingMarks,
      'negative_marking': negativeMarking,
      'is_premium': isPremium,
      'year': year,
      'order_index': orderIndex,
      'is_active': isActive,
      'exam_title': examTitle,
      'subject_name': subjectName,
      'chapter_name': chapterName,
    };
  }

  String get typeLabel {
    switch (testType) {
      case 'full_mock':
        return 'Full Mock';
      case 'pyq':
        return year != null ? 'PYQ $year' : 'PYQ';
      case 'subject_mock':
        return 'Subject Mock';
      case 'chapter_mock':
        return 'Topic Test';
      default:
        return 'Mock Test';
    }
  }
}
