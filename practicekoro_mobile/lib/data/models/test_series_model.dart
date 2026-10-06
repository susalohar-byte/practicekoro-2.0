class TestSeriesModel {
  final String id;
  final String examId;
  final String title;
  final String slug;
  final String? description;
  final String? iconUrl;
  final bool isPremium;
  final bool isPopular;
  final int orderIndex;
  final bool isActive;
  final String? examTitle;
  final String? examLogo;
  final int testCount;
  final int fullMockCount;
  final int topicTestCount;
  final int pyqTestCount;
  final String? examCategory;

  const TestSeriesModel({
    required this.id,
    required this.examId,
    required this.title,
    required this.slug,
    this.description,
    this.iconUrl,
    this.isPremium = false,
    this.isPopular = false,
    this.orderIndex = 0,
    this.isActive = true,
    this.examTitle,
    this.examLogo,
    this.testCount = 0,
    this.fullMockCount = 0,
    this.topicTestCount = 0,
    this.pyqTestCount = 0,
    this.examCategory,
  });

  factory TestSeriesModel.fromJson(Map<String, dynamic> json) {
    final examData = json['exams'] as Map<String, dynamic>?;
    final total = (json['test_count'] as num?)?.toInt() ?? 0;
    final fCount = (json['full_mock_count'] as num?)?.toInt() ?? 0;
    final tCount = (json['topic_test_count'] as num?)?.toInt() ?? 0;
    final pCount = (json['pyq_test_count'] as num?)?.toInt() ?? 0;

    return TestSeriesModel(
      id: json['id'] as String,
      examId: (json['exam_id'] as String?) ?? '',
      title: json['title'] as String,
      slug: (json['slug'] as String?) ?? '',
      description: json['description'] as String?,
      iconUrl: json['icon_url'] as String?,
      isPremium: (json['is_premium'] as bool?) ?? false,
      isPopular: (json['is_popular'] as bool?) ?? (json['is_featured'] as bool?) ?? false,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      isActive: (json['is_active'] as bool?) ?? true,
      examTitle: json['exam_title'] as String? ?? examData?['title'] as String?,
      examLogo: json['exam_logo'] as String? ?? examData?['icon_name'] as String?,
      examCategory: json['exam_category'] as String? ?? examData?['category'] as String?,
      testCount: total,
      fullMockCount: fCount,
      topicTestCount: tCount,
      pyqTestCount: pCount,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'title': title,
      'slug': slug,
      'description': description,
      'icon_url': iconUrl,
      'is_premium': isPremium,
      'is_popular': isPopular,
      'order_index': orderIndex,
      'is_active': isActive,
      'exam_title': examTitle,
      'exam_logo': examLogo,
      'exam_category': examCategory,
      'test_count': testCount,
      'full_mock_count': fullMockCount,
      'topic_test_count': topicTestCount,
      'pyq_test_count': pyqTestCount,
    };
  }
}
