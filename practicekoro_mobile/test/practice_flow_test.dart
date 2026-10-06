import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/repositories/practice_repository.dart';
import 'package:practicekoro_mobile/features/practice/practice_screen.dart';
import 'package:practicekoro_mobile/features/practice/subject_detail_screen.dart';
import 'package:practicekoro_mobile/features/practice/topic_detail_screen.dart';
import 'package:practicekoro_mobile/features/practice/topic_test_start_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Practice Flow Repository Tests', () {
    test('PracticeRepository contains all 10 required Bengali subjects', () {
      final repo = PracticeRepository();
      final subjects = PracticeRepository.defaultSubjects;

      expect(subjects.length, 10);
      expect(subjects.any((s) => s.nameBengali == 'ভারতের ইতিহাস'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'পশ্চিমবঙ্গের ইতিহাস'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'ভারতের ভৌগোলিক বৈশিষ্ট্য'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'সাধারণ বিজ্ঞান'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'পরিবেশ ও প্রতিবেশ'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'যৌক্তিক ক্ষমতা (Reasoning)'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'সংখ্যাগত দক্ষতা (Math)'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'বাংলা'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'ইংরেজি'), isTrue);
      expect(subjects.any((s) => s.nameBengali == 'কম্পিউটার জ্ঞান'), isTrue);
    });

    test('PracticeRepository generates dynamic tests with 10 questions per test', () async {
      final repo = PracticeRepository();
      // 50 questions -> 5 tests
      final tests50 = await repo.getTestsForTopic('hist-indus', totalQuestions: 50);
      expect(tests50.length, 5);
      expect(tests50[0].title, 'Test 1');
      expect(tests50[0].questionCount, 10);
      expect(tests50[0].isPaid, isFalse); // Test 1 is always Free
      expect(tests50[1].isPaid, isTrue); // Test 2 is Paid

      // 45 questions -> 5 tests (4 of 10, 1 of 5)
      final tests45 = await repo.getTestsForTopic('hist-vedic', totalQuestions: 45);
      expect(tests45.length, 5);
      expect(tests45[4].questionCount, 5);
    });

    test('PracticeRepository loads curated Bengali questions for Indus Valley', () async {
      final repo = PracticeRepository();
      final questions = await repo.getQuestionsForTopicTest('hist-indus', 1, count: 10);
      expect(questions.length, 10);
      expect(questions.first.questionBengali.isNotEmpty, isTrue);
      expect(questions.first.optionA.isNotEmpty, isTrue);
      expect(questions.first.optionB.isNotEmpty, isTrue);
      expect(questions.first.optionC.isNotEmpty, isTrue);
      expect(questions.first.optionD.isNotEmpty, isTrue);
      expect(questions.first.correctOption.isNotEmpty, isTrue);
      expect(questions.first.explanationBengali.isNotEmpty, isTrue);
    });
  });

  group('Practice Screens Smoke Tests', () {
    testWidgets('PracticeScreen renders Nimo waving banner and subjects', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PracticeScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Practice'), findsOneWidget);
      expect(find.textContaining('Practice & Master!'), findsOneWidget);
      expect(find.text('ভারতের ইতিহাস'), findsOneWidget);
      expect(find.text('পশ্চিমবঙ্গের ইতিহাস'), findsOneWidget);
    });

    testWidgets('SubjectDetailScreen renders Nimo pointing and topic list', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SubjectDetailScreen(subjectId: 'history'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('ভারতের ইতিহাস'), findsOneWidget);
      expect(find.text('Let’s master this subject! 🚀'), findsOneWidget);
      expect(find.text('Topics (অধ্যায়সমূহ)'), findsWidgets);
    });

    testWidgets('TopicDetailScreen renders Nimo thumbs up and dynamic tests', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: TopicDetailScreen(
              topicId: 'hist-indus',
              topicTitle: 'সিন্ধু সভ্যতা',
              subjectTitle: 'ভারতের ইতিহাস',
              totalQuestions: 50,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('সিন্ধু সভ্যতা'), findsOneWidget);
      expect(find.text('চলো প্র্যাকটিস করি! 💪'), findsOneWidget);
      expect(find.text('Tests (মক টেস্টসমূহ)'), findsOneWidget);
      expect(find.text('Test 1'), findsOneWidget);
      expect(find.text('Start Test →'), findsOneWidget);
    });

    testWidgets('TopicTestStartScreen renders test briefing and Start Test button', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: TopicTestStartScreen(
              topicId: 'hist-indus',
              testNumber: 1,
              topicTitle: 'সিন্ধু সভ্যতা',
              subjectTitle: 'ভারতের ইতিহাস',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Ready? You can do it! 🚀'), findsOneWidget);
      expect(find.text('Start Test →'), findsOneWidget);
      expect(find.text('টেস্ট বিবরণী (Test Briefing)'), findsOneWidget);
    });
  });
}
