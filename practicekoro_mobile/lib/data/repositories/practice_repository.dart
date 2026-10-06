import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/question_model.dart';

/// Models for the Playful Gen-Z Practice Flow
class PracticeSubject {
  final String id;
  final String nameBengali;
  final String nameEnglish;
  final int questionCount;
  final int attemptedCount;
  final int accuracy;
  final Color color;
  final Color bg;
  final IconData icon;
  final String? symbol;
  final String category; // 'gk', 'history', 'geography', 'science', 'math', 'reasoning', 'language', 'computer'

  const PracticeSubject({
    required this.id,
    required this.nameBengali,
    required this.nameEnglish,
    required this.questionCount,
    this.attemptedCount = 0,
    this.accuracy = 0,
    required this.color,
    required this.bg,
    required this.icon,
    this.symbol,
    required this.category,
  });
}

class PracticeTopic {
  final String id;
  final String subjectId;
  final String nameBengali;
  final String nameEnglish;
  final int questionCount;
  final int orderIndex;

  const PracticeTopic({
    required this.id,
    required this.subjectId,
    required this.nameBengali,
    required this.nameEnglish,
    required this.questionCount,
    required this.orderIndex,
  });
}

class PracticeTopicTest {
  final String topicId;
  final int testNumber;
  final String title;
  final int questionCount;
  final double totalMarks;
  final int durationMinutes;
  final double negativeMarks;
  final bool isPaid;
  final String status; // 'not_started', 'in_progress', 'completed'
  final double? score;
  final int? accuracy;
  final String? lastAttemptId;

  const PracticeTopicTest({
    required this.topicId,
    required this.testNumber,
    required this.title,
    required this.questionCount,
    this.totalMarks = 10.0,
    this.durationMinutes = 10,
    this.negativeMarks = 0.25,
    this.isPaid = false,
    this.status = 'not_started',
    this.score,
    this.accuracy,
    this.lastAttemptId,
  });
}

class PracticeQuestion {
  final String id;
  final int questionOrder;
  final String questionBengali;
  final String? questionEnglish;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String correctOption; // 'A', 'B', 'C', 'D'
  final String explanationBengali;
  final String? explanationEnglish;
  final double marks;
  final double negativeMarks;

  const PracticeQuestion({
    required this.id,
    required this.questionOrder,
    required this.questionBengali,
    this.questionEnglish,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.correctOption,
    required this.explanationBengali,
    this.explanationEnglish,
    this.marks = 1.0,
    this.negativeMarks = 0.25,
  });

  QuestionModel toQuestionModel({String? selectedOption, bool? isCorrect}) {
    return QuestionModel(
      id: id,
      questionOrder: questionOrder,
      questionText: questionEnglish ?? questionBengali,
      questionBengaliText: questionBengali,
      optionA: optionA,
      optionB: optionB,
      optionC: optionC,
      optionD: optionD,
      correctOption: correctOption,
      explanation: explanationEnglish,
      explanationBengali: explanationBengali,
      marks: marks,
      negativeMarks: negativeMarks,
      selectedOption: selectedOption,
      isCorrect: isCorrect,
    );
  }
}

class PracticeAttemptResult {
  final String attemptId;
  final String topicId;
  final int testNumber;
  final String topicTitle;
  final String subjectTitle;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int unattemptedCount;
  final double score;
  final double totalMarks;
  final int accuracy;
  final int timeSpentSeconds;
  final DateTime completedAt;
  final Map<int, String?> userAnswers; // questionIndex -> selectedOption ('A'/'B'/'C'/'D'/null)
  final List<PracticeQuestion> questions;

  const PracticeAttemptResult({
    required this.attemptId,
    required this.topicId,
    required this.testNumber,
    required this.topicTitle,
    required this.subjectTitle,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.unattemptedCount,
    required this.score,
    required this.totalMarks,
    required this.accuracy,
    required this.timeSpentSeconds,
    required this.completedAt,
    required this.userAnswers,
    required this.questions,
  });

  Map<String, dynamic> toJson() {
    return {
      'attemptId': attemptId,
      'topicId': topicId,
      'testNumber': testNumber,
      'topicTitle': topicTitle,
      'subjectTitle': subjectTitle,
      'totalQuestions': totalQuestions,
      'correctCount': correctCount,
      'wrongCount': wrongCount,
      'unattemptedCount': unattemptedCount,
      'score': score,
      'totalMarks': totalMarks,
      'accuracy': accuracy,
      'timeSpentSeconds': timeSpentSeconds,
      'completedAt': completedAt.toIso8601String(),
      'userAnswers': userAnswers.map((k, v) => MapEntry(k.toString(), v)),
      'questions': questions.map((q) => {
        'id': q.id,
        'questionOrder': q.questionOrder,
        'questionBengali': q.questionBengali,
        'questionEnglish': q.questionEnglish,
        'optionA': q.optionA,
        'optionB': q.optionB,
        'optionC': q.optionC,
        'optionD': q.optionD,
        'correctOption': q.correctOption,
        'explanationBengali': q.explanationBengali,
        'marks': q.marks,
        'negativeMarks': q.negativeMarks,
      }).toList(),
    };
  }

  factory PracticeAttemptResult.fromJson(Map<String, dynamic> json) {
    final rawAnswers = json['userAnswers'] as Map<String, dynamic>? ?? {};
    final answersMap = <int, String?>{};
    rawAnswers.forEach((k, v) {
      final keyInt = int.tryParse(k);
      if (keyInt != null) {
        answersMap[keyInt] = v as String?;
      }
    });

    final rawQuestions = json['questions'] as List<dynamic>? ?? [];
    final questionsList = rawQuestions.map((item) {
      final m = item as Map<String, dynamic>;
      return PracticeQuestion(
        id: m['id'] as String,
        questionOrder: (m['questionOrder'] as num?)?.toInt() ?? 1,
        questionBengali: m['questionBengali'] as String? ?? '',
        questionEnglish: m['questionEnglish'] as String?,
        optionA: m['optionA'] as String? ?? '',
        optionB: m['optionB'] as String? ?? '',
        optionC: m['optionC'] as String? ?? '',
        optionD: m['optionD'] as String? ?? '',
        correctOption: m['correctOption'] as String? ?? 'A',
        explanationBengali: m['explanationBengali'] as String? ?? '',
        marks: (m['marks'] as num?)?.toDouble() ?? 1.0,
        negativeMarks: (m['negativeMarks'] as num?)?.toDouble() ?? 0.25,
      );
    }).toList();

    return PracticeAttemptResult(
      attemptId: json['attemptId'] as String? ?? 'att-${DateTime.now().millisecondsSinceEpoch}',
      topicId: json['topicId'] as String? ?? '',
      testNumber: (json['testNumber'] as num?)?.toInt() ?? 1,
      topicTitle: json['topicTitle'] as String? ?? '',
      subjectTitle: json['subjectTitle'] as String? ?? '',
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 10,
      correctCount: (json['correctCount'] as num?)?.toInt() ?? 0,
      wrongCount: (json['wrongCount'] as num?)?.toInt() ?? 0,
      unattemptedCount: (json['unattemptedCount'] as num?)?.toInt() ?? 0,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 10.0,
      accuracy: (json['accuracy'] as num?)?.toInt() ?? 0,
      timeSpentSeconds: (json['timeSpentSeconds'] as num?)?.toInt() ?? 0,
      completedAt: DateTime.tryParse(json['completedAt'] as String? ?? '') ?? DateTime.now(),
      userAnswers: answersMap,
      questions: questionsList,
    );
  }
}

final practiceRepositoryProvider = Provider<PracticeRepository>((ref) {
  return PracticeRepository();
});

class PracticeRepository {
  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  // 10 Required Bengali Subjects
  static const List<PracticeSubject> defaultSubjects = [
    PracticeSubject(
      id: 'history',
      nameBengali: 'ভারতের ইতিহাস',
      nameEnglish: 'Indian History',
      questionCount: 320,
      attemptedCount: 140,
      accuracy: 68,
      color: Color(0xFFD97706),
      bg: Color(0xFFFEF3C7),
      icon: Icons.auto_stories_rounded,
      category: 'history',
    ),
    PracticeSubject(
      id: 'wb-history',
      nameBengali: 'পশ্চিমবঙ্গের ইতিহাস',
      nameEnglish: 'History of Bengal',
      questionCount: 180,
      attemptedCount: 65,
      accuracy: 62,
      color: Color(0xFFE11D48),
      bg: Color(0xFFFFE4E6),
      icon: Icons.account_balance_rounded,
      category: 'history',
    ),
    PracticeSubject(
      id: 'geography',
      nameBengali: 'ভারতের ভৌগোলিক বৈশিষ্ট্য',
      nameEnglish: 'Indian Geography',
      questionCount: 260,
      attemptedCount: 110,
      accuracy: 58,
      color: Color(0xFF16A34A),
      bg: Color(0xFFDCFCE7),
      icon: Icons.public_rounded,
      category: 'geography',
    ),
    PracticeSubject(
      id: 'science',
      nameBengali: 'সাধারণ বিজ্ঞান',
      nameEnglish: 'General Science',
      questionCount: 350,
      attemptedCount: 190,
      accuracy: 72,
      color: Color(0xFF0D9488),
      bg: Color(0xFFCCFBF1),
      icon: Icons.science_rounded,
      category: 'science',
    ),
    PracticeSubject(
      id: 'environment',
      nameBengali: 'পরিবেশ ও প্রতিবেশ',
      nameEnglish: 'Environmental Science',
      questionCount: 150,
      attemptedCount: 45,
      accuracy: 64,
      color: Color(0xFF059669),
      bg: Color(0xFFD1FAE5),
      icon: Icons.eco_rounded,
      category: 'science',
    ),
    PracticeSubject(
      id: 'reasoning',
      nameBengali: 'যৌক্তিক ক্ষমতা (Reasoning)',
      nameEnglish: 'Reasoning & Logic',
      questionCount: 280,
      attemptedCount: 130,
      accuracy: 75,
      color: Color(0xFFCA8A04),
      bg: Color(0xFFFEF9C3),
      icon: Icons.psychology_rounded,
      category: 'reasoning',
    ),
    PracticeSubject(
      id: 'math',
      nameBengali: 'সংখ্যাগত দক্ষতা (Math)',
      nameEnglish: 'Elementary Mathematics',
      questionCount: 310,
      attemptedCount: 160,
      accuracy: 70,
      color: Color(0xFF4F46E5),
      bg: Color(0xFFEEF2FF),
      icon: Icons.calculate_rounded,
      category: 'math',
    ),
    PracticeSubject(
      id: 'bengali',
      nameBengali: 'বাংলা',
      nameEnglish: 'Bengali Literature & Grammar',
      questionCount: 220,
      attemptedCount: 95,
      accuracy: 80,
      symbol: 'অ',
      color: Color(0xFF026BFC),
      bg: Color(0xFFDBEAFE),
      icon: Icons.menu_book_rounded,
      category: 'language',
    ),
    PracticeSubject(
      id: 'english',
      nameBengali: 'ইংরেজি',
      nameEnglish: 'General English',
      questionCount: 200,
      attemptedCount: 80,
      accuracy: 55,
      symbol: 'Aa',
      color: Color(0xFF9333EA),
      bg: Color(0xFFF3E8FF),
      icon: Icons.translate_rounded,
      category: 'language',
    ),
    PracticeSubject(
      id: 'computer',
      nameBengali: 'কম্পিউটার জ্ঞান',
      nameEnglish: 'Computer Knowledge',
      questionCount: 160,
      attemptedCount: 50,
      accuracy: 78,
      color: Color(0xFF0284C7),
      bg: Color(0xFFE0F2FE),
      icon: Icons.computer_rounded,
      category: 'computer',
    ),
  ];

  // Default Topics by Subject ID
  static const Map<String, List<PracticeTopic>> defaultTopics = {
    'history': [
      PracticeTopic(id: 'hist-indus', subjectId: 'history', nameBengali: 'সিন্ধু সভ্যতা', nameEnglish: 'Indus Valley Civilization', questionCount: 50, orderIndex: 1),
      PracticeTopic(id: 'hist-vedic', subjectId: 'history', nameBengali: 'বৈদিক যুগ ও ধর্মীয় আন্দোলন', nameEnglish: 'Vedic Period & Religions', questionCount: 45, orderIndex: 2),
      PracticeTopic(id: 'hist-mahajanapada', subjectId: 'history', nameBengali: 'মহাজনপদ ও মগধ সাম্রাজ্য', nameEnglish: 'Mahajanapadas & Magadha', questionCount: 60, orderIndex: 3),
      PracticeTopic(id: 'hist-maurya', subjectId: 'history', nameBengali: 'মৌর্য সাম্রাজ্য ও অশোক', nameEnglish: 'Maurya Empire & Ashoka', questionCount: 55, orderIndex: 4),
      PracticeTopic(id: 'hist-gupta', subjectId: 'history', nameBengali: 'গুপ্ত সাম্রাজ্য ও সুবর্ণযুগ', nameEnglish: 'Gupta Empire & Golden Age', questionCount: 50, orderIndex: 5),
      PracticeTopic(id: 'hist-sultanate', subjectId: 'history', nameBengali: 'দিল্লি সুলতানি যুগ', nameEnglish: 'Delhi Sultanate', questionCount: 40, orderIndex: 6),
      PracticeTopic(id: 'hist-mughal', subjectId: 'history', nameBengali: 'মুঘল সাম্রাজ্য', nameEnglish: 'Mughal Empire', questionCount: 50, orderIndex: 7),
      PracticeTopic(id: 'hist-freedom', subjectId: 'history', nameBengali: 'ভারতের স্বাধীনতা সংগ্রাম ও গান্ধিজী', nameEnglish: 'Freedom Movement & Gandhi', questionCount: 60, orderIndex: 8),
    ],
    'wb-history': [
      PracticeTopic(id: 'wbh-shashanka', subjectId: 'wb-history', nameBengali: 'শশাঙ্ক ও প্রাচীন গৌড় রাজ্য', nameEnglish: 'Shashanka & Ancient Gauda', questionCount: 30, orderIndex: 1),
      PracticeTopic(id: 'wbh-pala-sena', subjectId: 'wb-history', nameBengali: 'পাল ও সেন রাজবংশ', nameEnglish: 'Pala & Sena Dynasties', questionCount: 40, orderIndex: 2),
      PracticeTopic(id: 'wbh-renaissance', subjectId: 'wb-history', nameBengali: 'বাংলার নবজাগরণ ও সমাজ সংস্কার', nameEnglish: 'Bengal Renaissance', questionCount: 45, orderIndex: 3),
      PracticeTopic(id: 'wbh-revolts', subjectId: 'wb-history', nameBengali: 'নীল বিদ্রোহ ও সাঁওতাল বিদ্রোহ', nameEnglish: 'Indigo & Santhal Rebellions', questionCount: 35, orderIndex: 4),
      PracticeTopic(id: 'wbh-freedom', subjectId: 'wb-history', nameBengali: 'স্বাধীনতা সংগ্রামে বাংলার বিপ্লবীরা', nameEnglish: 'Revolutionaries of Bengal', questionCount: 50, orderIndex: 5),
    ],
    'geography': [
      PracticeTopic(id: 'geo-relief', subjectId: 'geography', nameBengali: 'ভারতের ভূপ্রকৃতি ও হিমালয় পর্বতমালা', nameEnglish: 'Physiography & Himalayas', questionCount: 60, orderIndex: 1),
      PracticeTopic(id: 'geo-rivers', subjectId: 'geography', nameBengali: 'ভারতের নদ-নদী ও জলপ্রপাত', nameEnglish: 'Rivers & Waterfalls of India', questionCount: 55, orderIndex: 2),
      PracticeTopic(id: 'geo-climate', subjectId: 'geography', nameBengali: 'জলবায়ু ও দক্ষিণ-পশ্চিম মৌসুমি বায়ু', nameEnglish: 'Climate & Monsoon', questionCount: 45, orderIndex: 3),
      PracticeTopic(id: 'geo-soil-forest', subjectId: 'geography', nameBengali: 'মৃত্তিকা ও স্বাভাবিক উদ্ভিদ', nameEnglish: 'Soils & Natural Vegetation', questionCount: 50, orderIndex: 4),
      PracticeTopic(id: 'geo-wb', subjectId: 'geography', nameBengali: 'পশ্চিমবঙ্গের ভূগোল ও সীমানা', nameEnglish: 'Geography of West Bengal', questionCount: 50, orderIndex: 5),
    ],
    'science': [
      PracticeTopic(id: 'sci-heat', subjectId: 'science', nameBengali: 'তাপ ও তাপমাত্রা (Heat & Temp)', nameEnglish: 'Heat & Temperature', questionCount: 50, orderIndex: 1),
      PracticeTopic(id: 'sci-light', subjectId: 'science', nameBengali: 'আলো ও আলোকবিদ্যা (Optics & Light)', nameEnglish: 'Light & Optics', questionCount: 50, orderIndex: 2),
      PracticeTopic(id: 'sci-sound', subjectId: 'science', nameBengali: 'শব্দ ও তরঙ্গ (Sound & Waves)', nameEnglish: 'Sound & Waves', questionCount: 40, orderIndex: 3),
      PracticeTopic(id: 'sci-electricity', subjectId: 'science', nameBengali: 'তড়িৎ ও চুম্বকত্ব (Electricity)', nameEnglish: 'Electricity & Magnetism', questionCount: 50, orderIndex: 4),
      PracticeTopic(id: 'sci-atomic', subjectId: 'science', nameBengali: 'পদার্থ ও পরমাণুর গঠন (Atomic Structure)', nameEnglish: 'Atomic Structure', questionCount: 45, orderIndex: 5),
      PracticeTopic(id: 'sci-cell', subjectId: 'science', nameBengali: 'কোষ ও বংশগতি (Cell Biology)', nameEnglish: 'Cell & Genetics', questionCount: 50, orderIndex: 6),
      PracticeTopic(id: 'sci-physiology', subjectId: 'science', nameBengali: 'মানবদেহ ও ভিটামিন (Human Physiology)', nameEnglish: 'Human Physiology & Vitamins', questionCount: 65, orderIndex: 7),
    ],
    'environment': [
      PracticeTopic(id: 'env-ecosystem', subjectId: 'environment', nameBengali: 'বাস্তুতন্ত্র ও খাদ্যশৃঙ্খল', nameEnglish: 'Ecosystem & Food Web', questionCount: 40, orderIndex: 1),
      PracticeTopic(id: 'env-pollution', subjectId: 'environment', nameBengali: 'পরিবেশ দূষণ ও সংরক্ষণ', nameEnglish: 'Pollution & Conservation', questionCount: 45, orderIndex: 2),
      PracticeTopic(id: 'env-parks', subjectId: 'environment', nameBengali: 'জাতীয় উদ্যান ও অভয়ারণ্য', nameEnglish: 'National Parks & Sanctuaries', questionCount: 50, orderIndex: 3),
      PracticeTopic(id: 'env-climate', subjectId: 'environment', nameBengali: 'জলবায়ু পরিবর্তন ও গ্লোবাল ওয়ার্মিং', nameEnglish: 'Climate Change & Global Warming', questionCount: 35, orderIndex: 4),
    ],
    'reasoning': [
      PracticeTopic(id: 'reas-analogy', subjectId: 'reasoning', nameBengali: 'সাদৃশ্য ও শ্রেণীকরণ (Analogy)', nameEnglish: 'Analogy & Classification', questionCount: 50, orderIndex: 1),
      PracticeTopic(id: 'reas-coding', subjectId: 'reasoning', nameBengali: 'কোডিং ও ডিকোডিং (Coding-Decoding)', nameEnglish: 'Coding & Decoding', questionCount: 50, orderIndex: 2),
      PracticeTopic(id: 'reas-blood', subjectId: 'reasoning', nameBengali: 'রক্তের সম্পর্ক (Blood Relations)', nameEnglish: 'Blood Relations', questionCount: 40, orderIndex: 3),
      PracticeTopic(id: 'reas-series', subjectId: 'reasoning', nameBengali: 'সংখ্যাক্রম ও বর্ণমালা (Series)', nameEnglish: 'Number & Letter Series', questionCount: 50, orderIndex: 4),
      PracticeTopic(id: 'reas-direction', subjectId: 'reasoning', nameBengali: 'দিকনির্ণয় ও দূরত্ব (Direction Sense)', nameEnglish: 'Direction & Distance', questionCount: 40, orderIndex: 5),
    ],
    'math': [
      PracticeTopic(id: 'math-number', subjectId: 'math', nameBengali: 'সংখ্যাতত্ত্ব ও বিভাজ্যতা (Number System)', nameEnglish: 'Number System', questionCount: 50, orderIndex: 1),
      PracticeTopic(id: 'math-lcm', subjectId: 'math', nameBengali: 'ল.সা.গু ও গ.সা.গু (LCM & HCF)', nameEnglish: 'LCM & HCF', questionCount: 40, orderIndex: 2),
      PracticeTopic(id: 'math-percent', subjectId: 'math', nameBengali: 'শতকরা (Percentage)', nameEnglish: 'Percentage', questionCount: 50, orderIndex: 3),
      PracticeTopic(id: 'math-profit', subjectId: 'math', nameBengali: 'লাভ ও ক্ষতি (Profit & Loss)', nameEnglish: 'Profit & Loss', questionCount: 50, orderIndex: 4),
      PracticeTopic(id: 'math-interest', subjectId: 'math', nameBengali: 'সরল ও চক্রবৃদ্ধি সুদ (Interest)', nameEnglish: 'Simple & Compound Interest', questionCount: 45, orderIndex: 5),
      PracticeTopic(id: 'math-time-work', subjectId: 'math', nameBengali: 'সময় ও কার্য (Time & Work)', nameEnglish: 'Time & Work', questionCount: 40, orderIndex: 6),
      PracticeTopic(id: 'math-time-dist', subjectId: 'math', nameBengali: 'সময় ও দূরত্ব (Speed & Distance)', nameEnglish: 'Speed, Time & Distance', questionCount: 45, orderIndex: 7),
    ],
    'bengali': [
      PracticeTopic(id: 'ben-grammar', subjectId: 'bengali', nameBengali: 'ধ্বনি, বর্ণ ও বানান শুদ্ধি', nameEnglish: 'Phonetics & Spelling', questionCount: 45, orderIndex: 1),
      PracticeTopic(id: 'ben-sandhi', subjectId: 'bengali', nameBengali: 'সন্ধি ও সমাস', nameEnglish: 'Sandhi & Samas', questionCount: 50, orderIndex: 2),
      PracticeTopic(id: 'ben-vocab', subjectId: 'bengali', nameBengali: 'সমার্থক ও বিপরীত শব্দ', nameEnglish: 'Synonyms & Antonyms', questionCount: 50, orderIndex: 3),
      PracticeTopic(id: 'ben-idioms', subjectId: 'bengali', nameBengali: 'বাগধারা ও প্রবাদ-প্রবচন', nameEnglish: 'Bengali Idioms & Proverbs', questionCount: 45, orderIndex: 4),
      PracticeTopic(id: 'ben-literature', subjectId: 'bengali', nameBengali: 'বাংলা সাহিত্য ও বিশিষ্ট রচয়িতা', nameEnglish: 'Bengali Literature & Authors', questionCount: 50, orderIndex: 5),
    ],
    'english': [
      PracticeTopic(id: 'eng-prepositions', subjectId: 'english', nameBengali: 'Appropriate Prepositions', nameEnglish: 'Appropriate Prepositions', questionCount: 50, orderIndex: 1),
      PracticeTopic(id: 'eng-tenses', subjectId: 'english', nameBengali: 'Tenses & Voice Change', nameEnglish: 'Tenses & Voice Change', questionCount: 40, orderIndex: 2),
      PracticeTopic(id: 'eng-vocab', subjectId: 'english', nameBengali: 'Synonyms & Antonyms', nameEnglish: 'Synonyms & Antonyms', questionCount: 50, orderIndex: 3),
      PracticeTopic(id: 'eng-idioms', subjectId: 'english', nameBengali: 'Idioms & Phrases', nameEnglish: 'Idioms & Phrases', questionCount: 40, orderIndex: 4),
      PracticeTopic(id: 'eng-subst', subjectId: 'english', nameBengali: 'One Word Substitution', nameEnglish: 'One Word Substitution', questionCount: 45, orderIndex: 5),
    ],
    'computer': [
      PracticeTopic(id: 'comp-basics', subjectId: 'computer', nameBengali: 'কম্পিউটারের প্রজন্ম ও ইতিহাস', nameEnglish: 'Generations & History', questionCount: 40, orderIndex: 1),
      PracticeTopic(id: 'comp-hardware', subjectId: 'computer', nameBengali: 'হার্ডওয়্যার ও মেমরি (RAM/ROM)', nameEnglish: 'Hardware & Memory', questionCount: 40, orderIndex: 2),
      PracticeTopic(id: 'comp-ms-office', subjectId: 'computer', nameBengali: 'MS Office (Word, Excel, PPT)', nameEnglish: 'MS Office Suite', questionCount: 45, orderIndex: 3),
      PracticeTopic(id: 'comp-internet', subjectId: 'computer', nameBengali: 'ইন্টারনেট ও সাইবার নিরাপত্তা', nameEnglish: 'Internet & Cyber Security', questionCount: 40, orderIndex: 4),
    ],
  };

  /// Get subject by ID
  PracticeSubject getSubject(String subjectId) {
    final cleanId = subjectId.toLowerCase().replaceAll('wbp-', '');
    return defaultSubjects.firstWhere(
      (s) => s.id == cleanId || s.id == subjectId,
      orElse: () {
        // Fallback search
        for (final s in defaultSubjects) {
          if (cleanId.contains(s.id) || s.id.contains(cleanId)) return s;
        }
        return defaultSubjects.first;
      },
    );
  }

  /// Get all topics for a subject (merges Supabase chapters with defaults)
  Future<List<PracticeTopic>> getTopicsForSubject(String subjectId) async {
    final cleanId = subjectId.toLowerCase().replaceAll('wbp-', '');
    final fallbackList = defaultTopics[cleanId] ??
        defaultTopics[subjectId] ??
        defaultTopics['history']!;

    final client = _supabase;
    if (client != null) {
      try {
        final res = await client
            .from('chapters')
            .select('id, name, slug, subject_id, order_index')
            .or('subject_id.eq.$subjectId,subject_id.eq.wbp-$cleanId,subject_id.eq.$cleanId')
            .eq('is_active', true)
            .order('order_index', ascending: true);
        if (res.isNotEmpty) {
          return (res as List<dynamic>).map((item) {
            final name = item['name'] as String? ?? 'অধ্যায়';
            // Extract Bengali part if formatted like "Indus Valley (সিন্ধু সভ্যতা)"
            String benName = name;
            String engName = name;
            final match = RegExp(r'\((.*?)\)').firstMatch(name);
            if (match != null) {
              benName = match.group(1)?.trim() ?? name;
              engName = name.split('(').first.trim();
            }
            return PracticeTopic(
              id: item['id'] as String,
              subjectId: subjectId,
              nameBengali: benName,
              nameEnglish: engName,
              questionCount: 50,
              orderIndex: (item['order_index'] as num?)?.toInt() ?? 1,
            );
          }).toList();
        }
      } catch (_) {}
    }

    return fallbackList;
  }

  /// Get specific topic by ID
  Future<PracticeTopic?> getTopicById(String topicId) async {
    for (final list in defaultTopics.values) {
      for (final t in list) {
        if (t.id == topicId || topicId.contains(t.id)) {
          return t;
        }
      }
    }
    // Also try Supabase
    final client = _supabase;
    if (client != null) {
      try {
        final row = await client
            .from('chapters')
            .select()
            .or('id.eq.$topicId,slug.eq.$topicId')
            .maybeSingle();
        if (row != null) {
          final name = row['name'] as String? ?? 'অধ্যায়';
          String benName = name;
          String engName = name;
          final match = RegExp(r'\((.*?)\)').firstMatch(name);
          if (match != null) {
            benName = match.group(1)?.trim() ?? name;
            engName = name.split('(').first.trim();
          }
          return PracticeTopic(
            id: row['id'] as String,
            subjectId: row['subject_id'] as String? ?? 'history',
            nameBengali: benName,
            nameEnglish: engName,
            questionCount: 50,
            orderIndex: (row['order_index'] as num?)?.toInt() ?? 1,
          );
        }
      } catch (_) {}
    }
    return defaultTopics['history']!.first;
  }

  /// Generate Tests dynamically for a topic (10 questions per test)
  Future<List<PracticeTopicTest>> getTestsForTopic(String topicId, {int totalQuestions = 50}) async {
    final prefs = await SharedPreferences.getInstance();
    final testCount = (totalQuestions / 10).ceil().clamp(1, 10);
    final List<PracticeTopicTest> tests = [];

    for (int i = 1; i <= testCount; i++) {
      final qCount = (i == testCount && totalQuestions % 10 != 0) ? (totalQuestions % 10) : 10;
      final key = 'pk_practice_attempt_${topicId}_$i';
      final cachedJson = prefs.getString(key);

      String status = 'not_started';
      double? score;
      int? accuracy;
      String? attemptId;

      if (cachedJson != null) {
        try {
          final data = jsonDecode(cachedJson) as Map<String, dynamic>;
          status = 'completed';
          score = (data['score'] as num?)?.toDouble();
          accuracy = (data['accuracy'] as num?)?.toInt();
          attemptId = data['attemptId'] as String?;
        } catch (_) {}
      }

      // Test 1 is always Free, subsequent can be Paid or Free
      final isPaid = i > 1;

      tests.add(
        PracticeTopicTest(
          topicId: topicId,
          testNumber: i,
          title: 'Test $i',
          questionCount: qCount,
          totalMarks: qCount * 1.0,
          durationMinutes: qCount,
          negativeMarks: 0.25,
          isPaid: isPaid,
          status: status,
          score: score,
          accuracy: accuracy,
          lastAttemptId: attemptId,
        ),
      );
    }

    return tests;
  }

  /// Load Questions for a specific topic test (10 Questions)
  Future<List<PracticeQuestion>> getQuestionsForTopicTest(String topicId, int testNumber, {int count = 10}) async {
    final client = _supabase;
    if (client != null) {
      try {
        final offset = (testNumber - 1) * count;
        final res = await client
            .from('questions')
            .select('id, question_text, question_bengali_text, option_a, option_b, option_c, option_d, correct_option, explanation, explanation_bengali, marks, negative_marks')
            .eq('chapter_id', topicId)
            .range(offset, offset + count - 1);
        if (res.isNotEmpty) {
          int order = 1;
          return (res as List<dynamic>).map((q) {
            return PracticeQuestion(
              id: q['id'] as String,
              questionOrder: order++,
              questionBengali: q['question_bengali_text'] as String? ?? q['question_text'] as String? ?? '',
              questionEnglish: q['question_text'] as String?,
              optionA: q['option_a'] as String? ?? '',
              optionB: q['option_b'] as String? ?? '',
              optionC: q['option_c'] as String? ?? '',
              optionD: q['option_d'] as String? ?? '',
              correctOption: q['correct_option'] as String? ?? 'A',
              explanationBengali: q['explanation_bengali'] as String? ?? q['explanation'] as String? ?? '',
              marks: (q['marks'] as num?)?.toDouble() ?? 1.0,
              negativeMarks: (q['negative_marks'] as num?)?.toDouble() ?? 0.25,
            );
          }).toList();
        }
      } catch (_) {}
    }

    // Curated high-yield question bank fallback per topic
    return _getCuratedQuestions(topicId, testNumber, count);
  }

  /// Save Practice Attempt Result locally and to Supabase
  Future<void> saveAttemptResult(PracticeAttemptResult result) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'pk_practice_attempt_${result.topicId}_${result.testNumber}';
    final resultJson = jsonEncode(result.toJson());
    await prefs.setString(key, resultJson);

    // Save latest attempt ID key for quick review retrieval
    await prefs.setString('pk_practice_last_result_${result.attemptId}', resultJson);

    // If user is signed in to Supabase, push attempt to Supabase
    final client = _supabase;
    final user = client?.auth.currentUser;
    if (client != null && user != null) {
      try {
        await client.from('test_attempts').insert({
          'id': result.attemptId,
          'user_id': user.id,
          'test_id': 'test-${result.topicId}-${result.testNumber}',
          'status': 'completed',
          'start_time': DateTime.now().subtract(Duration(seconds: result.timeSpentSeconds)).toIso8601String(),
          'end_time': result.completedAt.toIso8601String(),
          'time_spent_seconds': result.timeSpentSeconds,
          'score': result.score,
          'total_marks': result.totalMarks,
          'correct_count': result.correctCount,
          'wrong_count': result.wrongCount,
          'skipped_count': result.unattemptedCount,
          'accuracy': result.accuracy.toDouble(),
        });
      } catch (_) {
        // Fallback: gracefully ignore if mock test ID doesn't have foreign key in tests table
      }
    }
  }

  /// Retrieve Practice Attempt Result
  Future<PracticeAttemptResult?> getAttemptResult(String topicId, int testNumber) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'pk_practice_attempt_${topicId}_$testNumber';
    final jsonStr = prefs.getString(key);
    if (jsonStr != null) {
      try {
        final data = jsonDecode(jsonStr) as Map<String, dynamic>;
        return PracticeAttemptResult.fromJson(data);
      } catch (_) {}
    }
    return null;
  }

  /// Retrieve Practice Attempt Result by ID
  Future<PracticeAttemptResult?> getAttemptResultById(String attemptId) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('pk_practice_last_result_$attemptId');
    if (jsonStr != null) {
      try {
        final data = jsonDecode(jsonStr) as Map<String, dynamic>;
        return PracticeAttemptResult.fromJson(data);
      } catch (_) {}
    }
    return null;
  }

  /// Rich curated competitive exam questions generator
  List<PracticeQuestion> _getCuratedQuestions(String topicId, int testNumber, int count) {
    final tid = topicId.toLowerCase();

    if (tid.contains('indus') || tid.contains('সিন্ধু')) {
      return _indusValleyQuestions(testNumber, count);
    } else if (tid.contains('vedic') || tid.contains('বৈদিক')) {
      return _vedicAgeQuestions(testNumber, count);
    } else if (tid.contains('maurya') || tid.contains('মৌর্য')) {
      return _mauryaQuestions(testNumber, count);
    } else if (tid.contains('heat') || tid.contains('তাপ')) {
      return _heatAndTemperatureQuestions(testNumber, count);
    } else if (tid.contains('light') || tid.contains('আলো')) {
      return _lightAndOpticsQuestions(testNumber, count);
    } else if (tid.contains('cell') || tid.contains('কোষ')) {
      return _cellBiologyQuestions(testNumber, count);
    } else if (tid.contains('river') || tid.contains('নদী')) {
      return _riversOfIndiaQuestions(testNumber, count);
    } else if (tid.contains('number') || tid.contains('সংখ্যা')) {
      return _numberSystemQuestions(testNumber, count);
    } else if (tid.contains('percent') || tid.contains('শতকরা')) {
      return _percentageQuestions(testNumber, count);
    } else if (tid.contains('sandhi') || tid.contains('সন্ধি')) {
      return _bengaliGrammarQuestions(testNumber, count);
    }

    // Default universal high-yield competitive question set
    return _universalCompetitiveQuestions(topicId, testNumber, count);
  }

  List<PracticeQuestion> _indusValleyQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'indus_q1',
        questionOrder: 1,
        questionBengali: 'হরপ্পা সভ্যতা কোন নদীর তীরে অবস্থিত ছিল?',
        questionEnglish: 'On the banks of which river was Harappa located?',
        optionA: 'সিন্ধু (Indus)',
        optionB: 'রাভি বা ইরাবতী (Ravi)',
        optionC: 'ঘর্ঘরা (Ghaggar)',
        optionD: 'ভোগাবর (Bhogava)',
        correctOption: 'B',
        explanationBengali: 'হরপ্পা সভ্যতা আধুনিক পাকিস্তানের পাঞ্জাব প্রদেশের মন্টগোমারি (বর্তমান শাহিওয়াল) জেলায় ইরাবতী বা রাভি নদীর তীরে অবস্থিত। ১৯২১ সালে দয়ারাম সাহানি এটি আবিষ্কার করেন।',
      ),
      const PracticeQuestion(
        id: 'indus_q2',
        questionOrder: 2,
        questionBengali: 'মহেঞ্জোদাড়ো কথাটির অর্থ কী?',
        questionEnglish: 'What is the meaning of the word Mohenjo-daro?',
        optionA: 'জীবিতদের শহর',
        optionB: 'মৃতের স্তূপ (Mound of the Dead)',
        optionC: 'কালো চুড়ি',
        optionD: 'মহান দুর্গ',
        correctOption: 'B',
        explanationBengali: 'সিন্ধি ভাষায় মহেঞ্জোদাড়ো শব্দের অর্থ হলো ‘মৃতের স্তূপ’। ১৯২২ সালে রাখালদাস বন্দ্যোপাধ্যায় সিন্ধু নদের তীরে মহেঞ্জোদাড়ো আবিষ্কার করেন।',
      ),
      const PracticeQuestion(
        id: 'indus_q3',
        questionOrder: 3,
        questionBengali: 'সিন্ধু সভ্যতার বিখ্যাত বৃহৎ স্নানাগারটি (Great Bath) কোথায় পাওয়া গেছে?',
        questionEnglish: 'Where was the famous Great Bath of the Indus Valley found?',
        optionA: 'হরপ্পা',
        optionB: 'লোথাল',
        optionC: 'মহেঞ্জোদাড়ো',
        optionD: 'কালিবঙ্গান',
        correctOption: 'C',
        explanationBengali: 'মহেঞ্জোদাড়োতে বিখ্যাত আয়তাকার বৃহৎ স্নানাগারটি আবিষ্কৃত হয়েছে। এর পরিমাপ ছিল ৩৯ ফুট দীর্ঘ, ২৩ ফুট প্রশস্ত এবং ৮ ফুট গভীর। এটি জলনিরোধক করতে বিটুমিন ব্যবহার করা হয়েছিল।',
      ),
      const PracticeQuestion(
        id: 'indus_q4',
        questionOrder: 4,
        questionBengali: 'সিন্ধু সভ্যতার প্রাচীনতম সামুদ্রিক বন্দর (Dockyard) কোনটি ছিল?',
        questionEnglish: 'Which was the earliest port/dockyard of the Indus Civilization?',
        optionA: 'ধোলাভিরা',
        optionB: 'লোথাল (Lothal)',
        optionC: 'চানহুদারো',
        optionD: 'সুরকোটাদা',
        correctOption: 'B',
        explanationBengali: 'গুজরাটের ভোগাবর নদীর তীরে অবস্থিত লোথাল ছিল সিন্ধু সভ্যতার প্রধান সামুদ্রিক বন্দর ও পোতাশ্রয়। এখানে বিশ্বের প্রাচীনতম কৃত্রিম ডকইয়ার্ডের সন্ধান পাওয়া গেছে।',
      ),
      const PracticeQuestion(
        id: 'indus_q5',
        questionOrder: 5,
        questionBengali: 'সিন্ধু সভ্যতার মানুষেরা কোন ধাতুর ব্যবহার জানত না?',
        questionEnglish: 'Which metal was unknown to the people of the Indus Civilization?',
        optionA: 'তামা (Copper)',
        optionB: 'ব্রোঞ্জ (Bronze)',
        optionC: 'সোনা (Gold)',
        optionD: 'লোহা (Iron)',
        correctOption: 'D',
        explanationBengali: 'সিন্ধু সভ্যতা ছিল ব্রোঞ্জ যুগের সভ্যতা। তারা তামা, ব্রোঞ্জ, রূপা এবং সোনার ব্যবহার জানত কিন্তু লোহার ব্যবহার তাদের সম্পূর্ণ অজানা ছিল। বৈদিক যুগে এসে লোহার প্রচলন ঘটে।',
      ),
      const PracticeQuestion(
        id: 'indus_q6',
        questionOrder: 6,
        questionBengali: 'কালিবঙ্গান (Kalibangan) স্থানটি ভারতের কোন রাজ্যে অবস্থিত?',
        questionEnglish: 'In which Indian state is Kalibangan located?',
        optionA: 'গুজরাট',
        optionB: 'রাজস্থান',
        optionC: 'পাঞ্জাব',
        optionD: 'হরিয়ানা',
        correctOption: 'B',
        explanationBengali: 'কালিবঙ্গান রাজস্থানের হনুমানগড় জেলায় ঘর্ঘরা নদীর তীরে অবস্থিত। কালিবঙ্গান কথাটির অর্থ ‘কালো চুড়ি’। এখানে লাঙল চষা জমির প্রাচীনতম প্রমাণ পাওয়া গেছে।',
      ),
      const PracticeQuestion(
        id: 'indus_q7',
        questionOrder: 7,
        questionBengali: 'নর্তকীর বিখ্যাত ব্রোঞ্জের মূর্তিটি (Dancing Girl) কোথায় আবিষ্কৃত হয়েছিল?',
        questionEnglish: 'Where was the bronze statue of the Dancing Girl discovered?',
        optionA: 'মহেঞ্জোদাড়ো',
        optionB: 'হরপ্পা',
        optionC: 'বনওয়ালি',
        optionD: 'ধোলাভিরা',
        correctOption: 'A',
        explanationBengali: 'লস্ট-ওয়াক্স (Lost-wax) পদ্ধতিতে তৈরি বিখ্যাত ‘ড্যান্সিং গার্ল’ মূর্তিটি মহেঞ্জোদাড়োয় এইচ. আর. অঞ্চলে আবিষ্কৃত হয়। এটি জাতীয় জাদুঘর, নতুন দিল্লিতে সংরক্ষিত আছে।',
      ),
      const PracticeQuestion(
        id: 'indus_q8',
        questionOrder: 8,
        questionBengali: 'ভারতের হরিয়ানায় অবস্থিত বৃহত্তম সিন্ধু সভ্যতার প্রত্নক্ষেত্র কোনটি?',
        questionEnglish: 'Which is the largest Indus Valley site in India (Haryana)?',
        optionA: 'রাখিগড়ি (Rakhigarhi)',
        optionB: 'বনওয়ালি',
        optionC: 'রোপার',
        optionD: 'আলমগীরপুর',
        correctOption: 'A',
        explanationBengali: 'হরিয়ানার হিসার জেলায় অবস্থিত রাখিগড়ি হলো ভারত উপমহাদেশের বৃহত্তম সিন্ধু সভ্যতার প্রত্নস্থল। সম্প্রতি এখানে আধুনিক গবেষণার মাধ্যমে বহু গুরুত্বপূর্ণ তথ্য উন্মোচিত হয়েছে।',
      ),
      const PracticeQuestion(
        id: 'indus_q9',
        questionOrder: 9,
        questionBengali: 'সিন্ধু সভ্যতার সিলমোহরগুলি (Seals) প্রধানত কী উপাদান দিয়ে তৈরি হত?',
        questionEnglish: 'What material were Indus seals primarily made of?',
        optionA: 'টেরাকোটা',
        optionB: 'স্টিয়াটাইট (Steatite/Soft stone)',
        optionC: 'তামা',
        optionD: 'লোহা',
        correctOption: 'B',
        explanationBengali: 'সিন্ধু সভ্যতার অধিকাংশ বর্গাকার সিলমোহর নরম সাদা পাথর বা স্টিয়াটাইট (Steatite) দিয়ে তৈরি করা হত। এগুলির ওপর পশুপাখির ছবি ও এখনো পাঠোদ্ধার না হওয়া লিপি খোদাই থাকত।',
      ),
      const PracticeQuestion(
        id: 'indus_q10',
        questionOrder: 10,
        questionBengali: 'ঘোড়ার অস্থির অবশিষ্টাংশ সিন্ধু সভ্যতার কোন স্থানটিতে পাওয়া গেছে?',
        questionEnglish: 'Remains of horse bones have been found at which Indus site?',
        optionA: 'সুরকোটাদা (Surkotada)',
        optionB: 'ধোলাভিরা',
        optionC: 'চানহুদারো',
        optionD: 'কালিবঙ্গান',
        correctOption: 'A',
        explanationBengali: 'গুজরাটের কচ্ছ অঞ্চলে অবস্থিত সুরকোটাদায় জে. পি. যোশী ১৯৭৪ সালে ঘোড়ার অস্থির অবশিষ্টাংশ আবিষ্কার করেন, যা সিন্ধু সভ্যতায় একটি অনন্য আবিষ্কার।',
      ),
    ];

    // Shift or shuffle slightly based on testNumber to create unique test experiences
    final start = ((testNumber - 1) * 2) % all.length;
    final List<PracticeQuestion> result = [];
    for (int i = 0; i < count; i++) {
      final item = all[(start + i) % all.length];
      result.add(
        PracticeQuestion(
          id: '${item.id}_t$testNumber',
          questionOrder: i + 1,
          questionBengali: item.questionBengali,
          questionEnglish: item.questionEnglish,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correctOption: item.correctOption,
          explanationBengali: item.explanationBengali,
          marks: 1.0,
          negativeMarks: 0.25,
        ),
      );
    }
    return result;
  }

  List<PracticeQuestion> _vedicAgeQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'vedic_q1',
        questionOrder: 1,
        questionBengali: 'প্রাচীনতম বেদ কোনটি?',
        optionA: 'সামবেদ',
        optionB: 'ঋগ্বেদ',
        optionC: 'যজুর্বেদ',
        optionD: 'অথর্ববেদ',
        correctOption: 'B',
        explanationBengali: 'ঋগ্বেদ হলো মানবজাতির প্রাচীনতম ধর্মগ্রন্থ। এতে ১০টি মন্ডল ও ১,০২৮টি সূক্ত (Hymns) রয়েছে। গায়ত্রী মন্ত্র ঋগ্বেদের ৩য় মন্ডলে বর্ণিত আছে।',
      ),
      const PracticeQuestion(
        id: 'vedic_q2',
        questionOrder: 2,
        questionBengali: 'ভারতীয় ধ্রুপদী সঙ্গীতের উৎস কোন বেদকে বলা হয়?',
        optionA: 'ঋগ্বেদ',
        optionB: 'যজুর্বেদ',
        optionC: 'সামবেদ',
        optionD: 'অথর্ববেদ',
        correctOption: 'C',
        explanationBengali: 'সামবেদকে ভারতীয় ধ্রুপদী সঙ্গীত ও সুরের আদি উৎস বলা হয়। ‘সাম’ শব্দের অর্থ সুর বা গান। যজ্ঞের সময় এই মন্ত্রগুলি সুরেলা উচ্চারণে গাওয়া হত।',
      ),
      const PracticeQuestion(
        id: 'vedic_q3',
        questionOrder: 3,
        questionBengali: '‘সত্যমেব জয়তে’ বাক্যটি কোন উপনিষদ থেকে গৃহীত হয়েছে?',
        optionA: 'মুন্ডক উপনিষদ (Mundaka Upanishad)',
        optionB: 'কঠ উপনিষদ',
        optionC: 'ছান্দোগ্য উপনিষদ',
        optionD: 'কেন উপনিষদ',
        correctOption: 'A',
        explanationBengali: 'ভারতের জাতীয় নীতিবাক্য ‘সত্যমেব জয়তে’ মুন্ডক উপনিষদ থেকে গৃহীত হয়েছে। এর অর্থ ‘সত্যেরই জয় হয়’।',
      ),
      const PracticeQuestion(
        id: 'vedic_q4',
        questionOrder: 4,
        questionBengali: 'বৈদিক যুগে কর সংগ্রহকারী কর্মকর্তাকে কী বলা হতো?',
        optionA: 'সেনানী',
        optionB: 'ভাগদুগ্ধ (Bhagadugha)',
        optionC: 'গ্রামণী',
        optionD: 'সংগ্রহীতৃ',
        correctOption: 'B',
        explanationBengali: 'পরবর্তী বৈদিক যুগে রাজকোষে প্রজাদের কাছ থেকে উৎপন্ন ফসলের অংশ বা রাজস্ব সংগ্রহকারী প্রধান রাজকর্মচারীকে ‘ভাগদুগ্ধ’ বলা হতো।',
      ),
      const PracticeQuestion(
        id: 'vedic_q5',
        questionOrder: 5,
        questionBengali: 'গৌতম বুদ্ধ কোথায় তাঁর প্রথম ধর্মোপদেশ (ধর্মচক্র প্রবর্তন) দিয়েছিলেন?',
        optionA: 'বোধগয়া',
        optionB: 'সারনাথ (Sarnath)',
        optionC: 'কুশীনগর',
        optionD: 'লুম্বিনী',
        correctOption: 'B',
        explanationBengali: 'দিব্যজ্ঞান লাভের পর গৌতম বুদ্ধ বারাণসীর কাছে সারনাথের মৃগদাবে তাঁর পাঁচজন শিষ্যকে প্রথম ধর্মোপদেশ দেন। বৌদ্ধ ইতিহাসে এটি ‘ধর্মচক্র প্রবর্তন’ নামে খ্যাত।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'vedic_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _mauryaQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'maurya_q1',
        questionOrder: 1,
        questionBengali: 'মৌর্য সাম্রাজ্যের প্রতিষ্ঠাতা কে ছিলেন?',
        optionA: 'চন্দ্রগুপ্ত মৌর্য',
        optionB: 'বিন্দুসার',
        optionC: 'সম্রাট অশোক',
        optionD: 'বৃহদ্রথ',
        correctOption: 'A',
        explanationBengali: '৩২২ খ্রিস্টপূর্বাব্দে চাণক্য বা কৌটিল্যের সহায়তায় নন্দবংশের শেষ রাজা ধননন্দকে পরাজিত করে চন্দ্রগুপ্ত মৌর্য মৌর্য সাম্রাজ্য প্রতিষ্ঠা করেন।',
      ),
      const PracticeQuestion(
        id: 'maurya_q2',
        questionOrder: 2,
        questionBengali: 'বিখ্যাত গ্রন্থ ‘ইন্ডিকা’ (Indica) কে রচনা করেছিলেন?',
        optionA: 'কৌটিল্য',
        optionB: 'মেগাস্থিনিস (Megasthenes)',
        optionC: 'প্লিনি',
        optionD: 'হিউয়েন সাং',
        correctOption: 'B',
        explanationBengali: 'গ্রিক রাষ্ট্রদূত মেগাস্থিনিস গ্রিক শাসক সেলুকাস নিকেতরের দূত হিসেবে চন্দ্রগুপ্ত মৌর্যের রাজসভায় এসে পাটলীপুত্র ও মৌর্য প্রশাসন সম্পর্কে ‘ইন্ডিকা’ রচনা করেন।',
      ),
      const PracticeQuestion(
        id: 'maurya_q3',
        questionOrder: 3,
        questionBengali: 'সম্রাট অশোকের শিলালিপিগুলি মূলত কোন লিপিতে খোদাই করা ছিল?',
        optionA: 'ব্রাহ্মী ও খরোষ্ঠী',
        optionB: 'দেবনাগরী',
        optionC: 'সংস্কৃত',
        optionD: 'তামিল',
        correctOption: 'A',
        explanationBengali: 'সম্রাট অশোকের বেশিরভাগ শিলালিপি প্রাকৃত ভাষায় এবং ব্রাহ্মী লিপিতে খোদিত ছিল। উত্তর-পশ্চিম সীমান্তের শিলালিপি খরোষ্ঠী ও অ্যারামাইক লিপিতে পাওয়া গেছে। ১৮৩৭ সালে জেমস প্রিন্সেপ অশোকের ব্রাহ্মী লিপির পাঠোদ্ধার করেন।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'maurya_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _heatAndTemperatureQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'heat_q1',
        questionOrder: 1,
        questionBengali: 'সেলসিয়াস ও ফারেনহাইট স্কেলে কোন তাপমাত্রায় উভয় স্কেলের পাঠ একই হয়?',
        optionA: '৪০°',
        optionB: '-৪০° (-40°)',
        optionC: '০°',
        optionD: '১০০°',
        correctOption: 'B',
        explanationBengali: 'C/5 = (F-32)/9 সমীকরণ অনুসারে, যখন C = F = -40° হয়, তখন উভয় স্কেলে একই মান প্রদর্শিত হয়।',
      ),
      const PracticeQuestion(
        id: 'heat_q2',
        questionOrder: 2,
        questionBengali: 'SI পদ্ধতিতে তাপমাত্রার একক কী?',
        optionA: 'সেলসিয়াস',
        optionB: 'ফারেনহাইট',
        optionC: 'কেলভিন (Kelvin)',
        optionD: 'ক্যালোরি',
        correctOption: 'C',
        explanationBengali: 'আন্তর্জাতিক পদ্ধতিতে (SI) তাপমাত্রার পরম একক হলো কেলভিন (K)। অন্যদিকে তাপের SI একক হলো জুল (Joule)।',
      ),
      const PracticeQuestion(
        id: 'heat_q3',
        questionOrder: 3,
        questionBengali: 'জলের ঘনত্ব কোন তাপমাত্রায় সর্বাধিক হয়?',
        optionA: '০° সেলসিয়াস',
        optionB: '৪° সেলসিয়াস (4°C)',
        optionC: '১০০° সেলসিয়াস',
        optionD: '-৪° সেলসিয়াস',
        correctOption: 'B',
        explanationBengali: 'জলের ব্যতিক্রমী প্রসারণের জন্য ৪ ডিগ্রি সেলসিয়াস তাপমাত্রায় জলের ঘনত্ব সর্বাধিক (১ গ্রাম/ঘন সেমি) হয় এবং আয়তন সর্বনিম্ন হয়।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'heat_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _lightAndOpticsQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'light_q1',
        questionOrder: 1,
        questionBengali: 'মরুভূমির মরীচিকা (Mirage) আলোর কোন ঘটনার জন্য সৃষ্টি হয়?',
        optionA: 'প্রতিফলন',
        optionB: 'অভ্যন্তরীণ পূর্ণ প্রতিফলন (Total Internal Reflection)',
        optionC: 'বিচ্ছুরণ',
        optionD: 'অপবর্তন',
        correctOption: 'B',
        explanationBengali: 'মরুভূমির উত্তপ্ত বালুকাময় অঞ্চলে আলোর অভ্যন্তরীণ পূর্ণ প্রতিফলনের ফলেই পথিকের চোখে দৃষ্টিবিভ্রম বা মরীচিকা সৃষ্টি হয়। অপটিক্যাল ফাইবারও এই নীতিতে কাজ করে।',
      ),
      const PracticeQuestion(
        id: 'light_q2',
        questionOrder: 2,
        questionBengali: 'গাড়ির রিয়ার ভিউ মিরর (Rear-view mirror) হিসেবে কোন দর্পণ ব্যবহৃত হয়?',
        optionA: 'উত্তল দর্পণ (Convex mirror)',
        optionB: 'অবতল দর্পণ (Concave mirror)',
        optionC: 'সমতল দর্পণ',
        optionD: 'পরবলয়িক দর্পণ',
        correctOption: 'A',
        explanationBengali: 'উত্তল দর্পণ সর্বদা খর্বাকৃতি ও সোজা প্রতিবিম্ব তৈরি করে এবং বিস্তৃত দৃষ্টিসীমা প্রদান করে বলে যানবাহনের চালকের দেখার দর্পণ হিসেবে উত্তল দর্পণ ব্যবহার করা হয়।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'light_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _cellBiologyQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'cell_q1',
        questionOrder: 1,
        questionBengali: 'কোষের শক্তিঘর (Powerhouse of the Cell) কাকে বলা হয়?',
        optionA: 'রাইবোজোম',
        optionB: 'লাইসোজোম',
        optionC: 'মাইটোকনড্রিয়া (Mitochondria)',
        optionD: 'গলগি বডি',
        correctOption: 'C',
        explanationBengali: 'মাইটোকনড্রিয়াতে শ্বসনের মাধ্যমে ATP অণু উৎপন্ন হয় যা কোষে শক্তি সরবরাহ করে। তাই একে কোষের শক্তিঘর বলা হয়।',
      ),
      const PracticeQuestion(
        id: 'cell_q2',
        questionOrder: 2,
        questionBengali: 'কোষের ‘আত্মঘাতী থলি’ (Suicide Bag) নামে পরিচিত কোনটি?',
        optionA: 'লাইসোজোম (Lysosome)',
        optionB: 'রাইবোজোম',
        optionC: 'সেন্ট্রোজোম',
        optionD: 'প্লাস্টিড',
        correctOption: 'A',
        explanationBengali: 'লাইসোজোমের হাইড্রোলাইটিক উৎসেচক ক্ষতিগ্রস্ত বা মৃত কোষকে পরিপাক করে ধ্বংস করতে পারে, তাই একে সুইসাইড ব্যাগ বলা হয়।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'cell_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _riversOfIndiaQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'riv_q1',
        questionOrder: 1,
        questionBengali: 'ভারতের দীর্ঘতম নদী কোনটি?',
        optionA: 'গঙ্গা (Ganga)',
        optionB: 'গো দাবরী',
        optionC: 'ব্রহ্মপুত্র',
        optionD: 'সিন্ধু',
        correctOption: 'A',
        explanationBengali: 'গঙ্গা হলো ভারতের জাতীয় এবং দীর্ঘতম নদী (দৈর্ঘ্য প্রায় ২,৫২৫ কিমি)। এটি উত্তরাখণ্ডের গঙ্গোত্রী হিমবাহের গোমুখ গুহা থেকে উৎপন্ন হয়েছে।',
      ),
      const PracticeQuestion(
        id: 'riv_q2',
        questionOrder: 2,
        questionBengali: 'দক্ষিণ ভারতের গঙ্গা কাকে বলা হয়?',
        optionA: 'কৃষ্ণা',
        optionB: 'গোদাবরী (Godavari)',
        optionC: 'কাবেরী',
        optionD: 'মহানদী',
        correctOption: 'B',
        explanationBengali: 'গোদাবরী নদীকে তার বিশাল আকার ও প্রাচীন আধ্যাত্মিক মর্যাদার জন্য ‘বৃদ্ধ গঙ্গা’ বা দক্ষিণ ভারতের গঙ্গা বলা হয়। এটি দক্ষিণ ভারতের দীর্ঘতম নদী।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'riv_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _numberSystemQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'num_q1',
        questionOrder: 1,
        questionBengali: 'ক্ষুদ্রতম মৌলিক সংখ্যা (Prime Number) কোনটি?',
        optionA: '০ (Zero)',
        optionB: '১ (One)',
        optionC: '২ (Two)',
        optionD: '৩ (Three)',
        correctOption: 'C',
        explanationBengali: '২ হলো একমাত্র জোড় মৌলিক সংখ্যা এবং ক্ষুদ্রতম মৌলিক সংখ্যা। ১ সংখ্যাটি মৌলিক বা যৌগিক কোনোটিই নয়।',
      ),
      const PracticeQuestion(
        id: 'num_q2',
        questionOrder: 2,
        questionBengali: 'প্রথম ১০টি স্বাভাবিক সংখ্যার সমষ্টি কত?',
        optionA: '৪৫',
        optionB: '৫৫ (55)',
        optionC: '৫০',
        optionD: '৬০',
        correctOption: 'B',
        explanationBengali: 'প্রথম n স্বাভাবিক সংখ্যার যোগফল = n(n+1)/2 = 10(11)/2 = 110/2 = 55।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'num_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _percentageQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'pct_q1',
        questionOrder: 1,
        questionBengali: 'একটি সংখ্যার ২৫% হলো ৭৫। সংখ্যাটি কত?',
        optionA: '২০০',
        optionB: '২৫০',
        optionC: '৩০০ (300)',
        optionD: '৪০০',
        correctOption: 'C',
        explanationBengali: 'যদি সংখ্যাটি x হয়, তবে x এর ২৫% = ৭৫। অর্থাৎ x × (২৫/১০০) = ৭৫ => x = ৭৫ × ৪ = ৩০০।',
      ),
      const PracticeQuestion(
        id: 'pct_q2',
        questionOrder: 2,
        questionBengali: 'কোনো দ্রব্যের মূল্য ২০% বৃদ্ধি পেল। খরচ অপরিবর্তিত রাখতে ব্যবহার শতকরা কত কমাতে হবে?',
        optionA: '১৬⅔% (16.67%)',
        optionB: '২০%',
        optionC: '২৫%',
        optionD: '১৫%',
        correctOption: 'A',
        explanationBengali: 'ফর্মুলা: [r / (100 + r)] × 100% = [20 / 120] × 100% = (1/6) × 100% = 16⅔% বা 16.67%।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'pct_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _bengaliGrammarQuestions(int testNumber, int count) {
    final all = [
      const PracticeQuestion(
        id: 'ben_q1',
        questionOrder: 1,
        questionBengali: '‘বিদ্যালয়’ শব্দটির সঠিক সন্ধি বিচ্ছেদ কোনটি?',
        optionA: 'বিদ্যা + লয়',
        optionB: 'বিদ্যা + আলয় (Vidya + Alaya)',
        optionC: 'বিদ + আলয়',
        optionD: 'বিদ্ + দ্যালয়',
        correctOption: 'B',
        explanationBengali: 'আ-কারান্ত বা অ-কারান্ত শব্দের পর আ-কারান্ত শব্দ যুক্ত হলে আকার হয়। যথা: বিদ্যা + আলয় = বিদ্যালয়।',
      ),
      const PracticeQuestion(
        id: 'ben_q2',
        questionOrder: 2,
        questionBengali: '‘অগাধ জলের মাছ’ এই বাগধারাটির সঠিক অর্থ কী?',
        optionA: 'খুবই চালাক ও চতুর ব্যক্তি',
        optionB: 'শান্তশিষ্ট ব্যক্তি',
        optionC: 'সহজ সরল মানুষ',
        optionD: 'বিপদের মধ্যে থাকা লোক',
        correctOption: 'A',
        explanationBengali: 'বাংলায় ‘অগাধ জলের মাছ’ বাগধারার প্রচলিত অর্থ হলো অত্যন্ত কূটবুদ্ধিসম্পন্ন, গভীর জ্ঞানী অথবা অতীব চালাক ব্যক্তি।',
      ),
    ];
    return List.generate(count, (i) {
      final item = all[i % all.length];
      return PracticeQuestion(
        id: 'ben_${item.id}_$i',
        questionOrder: i + 1,
        questionBengali: item.questionBengali,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanationBengali: item.explanationBengali,
      );
    });
  }

  List<PracticeQuestion> _universalCompetitiveQuestions(String topicId, int testNumber, int count) {
    return List.generate(count, (i) {
      final qNum = (testNumber - 1) * count + (i + 1);
      return PracticeQuestion(
        id: 'gen_${topicId}_$qNum',
        questionOrder: i + 1,
        questionBengali: 'প্রশ্ন $qNum: নিচের কোনটি সঠিক তথ্য বা বিবৃতি?',
        optionA: 'বিকল্প ক: এটি একটি প্রমাণিত ঐতিহাসিক ও ভৌগোলিক তথ্য',
        optionB: 'বিকল্প খ: এটি দ্বিতীয় প্রাসঙ্গিক বিকল্প',
        optionC: 'বিকল্প গ: এটি তৃতীয় সম্ভাবনাময় বিকল্প',
        optionD: 'বিকল্প ঘ: উপরের সবকটি সঠিক',
        correctOption: 'A',
        explanationBengali: 'সঠিক উত্তর হলো বিকল্প (A)। পরীক্ষায় এই ধরনের প্রশ্ন বারবার জিজ্ঞাসা করা হয় এবং নিয়মিত অনুশীলনের মাধ্যমে সঠিক দক্ষতা বৃদ্ধি পায়।',
      );
    });
  }
}
