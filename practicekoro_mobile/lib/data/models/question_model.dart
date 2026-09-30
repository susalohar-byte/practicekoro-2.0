class QuestionModel {
  final String id;
  final int questionOrder;
  final String questionText;
  final String? questionBengaliText;
  final String? imageUrl;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String correctOption; // 'A', 'B', 'C', 'D'
  final String? explanation;
  final String? explanationBengali;
  final double marks;
  final double negativeMarks;
  final String? subjectName;
  final String? chapterName;
  final String? selectedOption;
  final bool? isCorrect;

  const QuestionModel({
    required this.id,
    this.questionOrder = 1,
    required this.questionText,
    this.questionBengaliText,
    this.imageUrl,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    this.correctOption = 'A',
    this.explanation,
    this.explanationBengali,
    this.marks = 1.0,
    this.negativeMarks = 0,
    this.subjectName,
    this.chapterName,
    this.selectedOption,
    this.isCorrect,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['id'] as String,
      questionOrder: (json['question_order'] as num?)?.toInt() ?? 1,
      questionText:
          json['question_text'] as String? ??
          json['questionText'] as String? ??
          '',
      questionBengaliText:
          json['question_bengali_text'] as String? ??
          json['questionBengaliText'] as String?,
      imageUrl: json['image_url'] as String? ?? json['imageUrl'] as String?,
      optionA: json['option_a'] as String? ?? json['optionA'] as String? ?? '',
      optionB: json['option_b'] as String? ?? json['optionB'] as String? ?? '',
      optionC: json['option_c'] as String? ?? json['optionC'] as String? ?? '',
      optionD: json['option_d'] as String? ?? json['optionD'] as String? ?? '',
      correctOption:
          json['correct_option'] as String? ??
          json['correctOption'] as String? ??
          'A',
      explanation: json['explanation'] as String?,
      explanationBengali:
          json['explanation_bengali'] as String? ??
          json['explanationBengali'] as String?,
      marks: (json['marks'] as num?)?.toDouble() ?? 1.0,
      negativeMarks: (json['negative_marks'] as num?)?.toDouble() ?? 0,
      subjectName:
          json['subject_name'] as String? ?? json['subjectName'] as String?,
      chapterName:
          json['chapter_name'] as String? ?? json['chapterName'] as String?,
      selectedOption:
          json['selectedOption'] as String? ??
          json['selected_option'] as String?,
      isCorrect: json['isCorrect'] as bool? ?? json['is_correct'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question_order': questionOrder,
      'question_text': questionText,
      'question_bengali_text': questionBengaliText,
      'image_url': imageUrl,
      'option_a': optionA,
      'option_b': optionB,
      'option_c': optionC,
      'option_d': optionD,
      'correct_option': correctOption,
      'explanation': explanation,
      'explanation_bengali': explanationBengali,
      'marks': marks,
      'negative_marks': negativeMarks,
      'subject_name': subjectName,
      'chapter_name': chapterName,
      'selectedOption': selectedOption,
      'isCorrect': isCorrect,
    };
  }

  /// Returns question in preferred language, gracefully falling back
  String getLocalizedQuestion(bool preferBengali) {
    if (preferBengali &&
        questionBengaliText != null &&
        questionBengaliText!.trim().isNotEmpty) {
      return questionBengaliText!;
    }
    return questionText;
  }

  /// Returns explanation in preferred language, gracefully falling back
  String? getLocalizedExplanation(bool preferBengali) {
    if (preferBengali &&
        explanationBengali != null &&
        explanationBengali!.trim().isNotEmpty) {
      return explanationBengali;
    }
    return explanation;
  }

  String getOption(String key) {
    switch (key.toUpperCase()) {
      case 'A':
        return optionA;
      case 'B':
        return optionB;
      case 'C':
        return optionC;
      case 'D':
        return optionD;
      default:
        return '';
    }
  }
}
