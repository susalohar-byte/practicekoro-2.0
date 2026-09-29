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
  });

  factory TestSeriesModel.fromJson(Map<String, dynamic> json) {
    return TestSeriesModel(
      id: json['id'] as String,
      examId: (json['exam_id'] as String?) ?? '',
      title: json['title'] as String,
      slug: (json['slug'] as String?) ?? '',
      description: json['description'] as String?,
      iconUrl: json['icon_url'] as String?,
      isPremium: (json['is_premium'] as bool?) ?? false,
      isPopular: (json['is_popular'] as bool?) ?? false,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      isActive: (json['is_active'] as bool?) ?? true,
      examTitle: json['exam_title'] as String?,
      examLogo: json['exam_logo'] as String?,
      testCount: (json['test_count'] as num?)?.toInt() ?? 0,
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
      'test_count': testCount,
    };
  }
}
