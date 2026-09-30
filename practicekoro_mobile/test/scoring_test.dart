import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/question_model.dart';
import 'package:practicekoro_mobile/data/models/test_model.dart';

void main() {
  group('Per-test scoring configuration', () {
    test('preserves an enabled negative-marking value on the test', () {
      final test = MockTestModel(
        id: 'test-enabled',
        title: 'Negative marks enabled',
        slug: 'negative-enabled',
        negativeMarking: 0.5,
      );

      expect(test.negativeMarking, 0.5);
    });

    test('supports a test with no negative marking', () {
      final test = MockTestModel(
        id: 'test-disabled',
        title: 'Negative marks disabled',
        slug: 'negative-disabled',
        negativeMarking: 0,
      );

      expect(test.negativeMarking, 0);
    });

    test('does not default missing test policy to a deduction', () {
      final test = MockTestModel.fromJson({
        'id': 'test-default',
        'title': 'Unset policy',
        'slug': 'unset-policy',
      });

      expect(test.negativeMarking, 0);
    });
  });

  test('provides Bengali question text when preferred', () {
    const question = QuestionModel(
      id: 'q1',
      questionText: 'Question 1',
      questionBengaliText: 'প্রশ্ন ১',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
    );

    expect(question.getLocalizedQuestion(true), 'প্রশ্ন ১');
    expect(question.getLocalizedQuestion(false), 'Question 1');
  });
}
