import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/attempt_model.dart';
import 'package:practicekoro_mobile/features/subscription/payment_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LocalStorageService Privacy & Security Tests', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      await LocalStorageService.init();
    });

    test('clearUserSession clears user sensitive data and test caches', () async {
      await LocalStorageService.saveUserId('test_uid_123');
      await LocalStorageService.saveUserEmail('student@example.com');
      await LocalStorageService.saveUserName('Susanta Lohar');
      await LocalStorageService.saveTargetExam('wbp_constable');
      await LocalStorageService.saveLeaderboardDistrict('Bankura');
      await LocalStorageService.toggleBookmark('q_1001');
      await LocalStorageService.setProUser(true);

      expect(LocalStorageService.isLoggedIn(), isTrue);
      expect(LocalStorageService.getUserEmail(), 'student@example.com');
      expect(LocalStorageService.getBookmarks(), contains('q_1001'));
      expect(LocalStorageService.isProUser(), isTrue);

      await LocalStorageService.clearUserSession();

      expect(LocalStorageService.isLoggedIn(), isFalse);
      expect(LocalStorageService.getUserEmail(), isNull);
      expect(LocalStorageService.getBookmarks(), isEmpty);
      expect(LocalStorageService.isProUser(), isFalse);
      expect(LocalStorageService.getTargetExam(), isNull);
    });

    test('saveAttempt caps saved offline attempts at 50', () async {
      for (int i = 0; i < 60; i++) {
        await LocalStorageService.saveAttempt(
          TestAttemptModel(
            id: 'attempt_$i',
            testId: 'test_1',
            testTitle: 'Test Title $i',
            userId: 'user_1',
            score: i.toDouble(),
            totalMarks: 100,
            percentage: i.toDouble(),
            accuracy: 80,
            correctCount: 10,
            wrongCount: 2,
            skippedCount: 3,
            totalQuestions: 15,
            timeSpentSeconds: 600,
            negativeMarksDeducted: 0.5,
            completedAt: DateTime.now(),
            answers: const {},
            testSeriesId: 'ts_1',
            testSeriesTitle: 'TS Title',
          ),
        );
      }

      final saved = LocalStorageService.getAttempts();
      expect(saved.length, equals(50));
      expect(saved.first.id, equals('attempt_59'));
    });
  });

  group('PaymentScreen Widget Tests', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      await LocalStorageService.init();
    });

    testWidgets('PaymentScreen renders plan details and payment methods', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PaymentScreen(
              planId: '1_year',
              planTitle: '1 Year Full Access Plan',
              originalPrice: 499,
            ),
          ),
        ),
      );

      await tester.pump();

      expect(find.text('Payment'), findsOneWidget);
      expect(find.text('1 Year Full Access Plan'), findsOneWidget);
      expect(find.text('₹499'), findsWidgets);
      expect(find.text('Apply Coupon Code'), findsOneWidget);
      expect(find.text('Payment Method'), findsOneWidget);
      expect(find.text('Razorpay'), findsOneWidget);
    });
  });
}
