import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/practice_repository.dart';

class IndividualQuestionReviewScreen extends ConsumerStatefulWidget {
  final String topicId;
  final int testNumber;
  final int initialQuestionIndex;
  final String? attemptId;
  final String? topicTitle;
  final String? subjectTitle;

  const IndividualQuestionReviewScreen({
    super.key,
    required this.topicId,
    required this.testNumber,
    required this.initialQuestionIndex,
    this.attemptId,
    this.topicTitle,
    this.subjectTitle,
  });

  @override
  ConsumerState<IndividualQuestionReviewScreen> createState() =>
      _IndividualQuestionReviewScreenState();
}

class _IndividualQuestionReviewScreenState
    extends ConsumerState<IndividualQuestionReviewScreen> {
  PracticeAttemptResult? _result;
  bool _isLoading = true;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialQuestionIndex;
    _loadResult();
  }

  Future<void> _loadResult() async {
    final repo = ref.read(practiceRepositoryProvider);
    PracticeAttemptResult? res;
    if (widget.attemptId != null && widget.attemptId!.isNotEmpty) {
      res = await repo.getAttemptResultById(widget.attemptId!);
    }
    res ??= await repo.getAttemptResult(widget.topicId, widget.testNumber);

    if (mounted) {
      setState(() {
        _result = res;
        _isLoading = false;
        if (_result != null &&
            (_currentIndex < 0 || _currentIndex >= _result!.questions.length)) {
          _currentIndex = 0;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF026BFC))),
      );
    }

    final res = _result;
    if (res == null || res.questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Question Solution')),
        body: const Center(child: Text('সমাধানের তথ্য পাওয়া যায়নি')),
      );
    }

    final q = res.questions[_currentIndex];
    final selectedOption = res.userAnswers[_currentIndex];
    final correctOption = q.correctOption.trim().toUpperCase();

    final isUnattempted = selectedOption == null || selectedOption.isEmpty;
    final isCorrect = !isUnattempted && selectedOption.trim().toUpperCase() == correctOption;

    Color badgeBg = const Color(0xFFF1F5F9);
    Color badgeColor = const Color(0xFF64748B);
    String badgeText = 'Skipped / ছেড়ে দেওয়া';
    IconData badgeIcon = Icons.remove_circle_outline_rounded;

    if (isCorrect) {
      badgeBg = const Color(0xFFDCFCE7);
      badgeColor = const Color(0xFF16A34A);
      badgeText = 'Correct ✓ (+1.0)';
      badgeIcon = Icons.check_circle_rounded;
    } else if (!isUnattempted) {
      badgeBg = const Color(0xFFFFE4E6);
      badgeColor = const Color(0xFFE11D48);
      badgeText = 'Wrong ✕ (-0.25)';
      badgeIcon = Icons.cancel_rounded;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF0F172A), size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Question ${_currentIndex + 1} of ${res.questions.length}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(badgeIcon, size: 14, color: badgeColor),
                    const SizedBox(width: 4),
                    Text(
                      badgeText,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: badgeColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Question Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x04000000),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Q${_currentIndex + 1}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF026BFC),
                                ),
                              ),
                            ),
                            const Spacer(),
                            if (selectedOption != null)
                              Text(
                                'Your Choice: $selectedOption',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isCorrect
                                      ? const Color(0xFF16A34A)
                                      : const Color(0xFFE11D48),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          q.questionBengali,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                            height: 1.45,
                          ),
                        ),
                        if (q.questionEnglish != null &&
                            q.questionEnglish != q.questionBengali) ...[
                          const SizedBox(height: 8),
                          Text(
                            q.questionEnglish!,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Option Review Cards (A, B, C, D)
                  _buildReviewOption('A', q.optionA, selectedOption, correctOption),
                  const SizedBox(height: 10),
                  _buildReviewOption('B', q.optionB, selectedOption, correctOption),
                  const SizedBox(height: 10),
                  _buildReviewOption('C', q.optionC, selectedOption, correctOption),
                  const SizedBox(height: 10),
                  _buildReviewOption('D', q.optionD, selectedOption, correctOption),

                  const SizedBox(height: 20),

                  // Explanation Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x06000000),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.lightbulb_rounded,
                                color: Color(0xFFD97706), size: 20),
                            SizedBox(width: 8),
                            Text(
                              '💡 সঠিক উত্তর ও ব্যাখ্যা (Explanation)',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF92400E),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          q.explanationBengali.isNotEmpty
                              ? q.explanationBengali
                              : 'সঠিক বিকল্প হলো ($correctOption)। এটি প্রামাণ্য তথ্যভিত্তিক এবং সংশ্লিষ্ট অধ্যায়ের গুরুত্বপূর্ণ অংশ।',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF78350F),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),

            // Bottom Navigation Bar: ← Prev | Next →
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 10,
                    offset: Offset(0, -3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Prev
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _currentIndex > 0
                          ? () {
                              setState(() {
                                _currentIndex--;
                              });
                            }
                          : null,
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(
                          color: _currentIndex > 0
                              ? const Color(0xFFCBD5E1)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.arrow_back_rounded, size: 16),
                          SizedBox(width: 6),
                          Text('Previous',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Next
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _currentIndex < res.questions.length - 1
                          ? () {
                              setState(() {
                                _currentIndex++;
                              });
                            }
                          : () {
                              context.pop();
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF026BFC),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _currentIndex < res.questions.length - 1
                                ? 'Next →'
                                : 'Back to Review',
                            style: const TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewOption(
      String label, String text, String? selected, String correct) {
    final isCorrect = label.trim().toUpperCase() == correct.trim().toUpperCase();
    final isUserChoice =
        selected != null && selected.trim().toUpperCase() == label.trim().toUpperCase();

    Color bg = Colors.white;
    Color border = const Color(0xFFE2E8F0);
    Color pillBg = const Color(0xFFF1F5F9);
    Color pillText = const Color(0xFF475569);
    Widget? trailingIcon;

    if (isCorrect) {
      bg = const Color(0xFFDCFCE7);
      border = const Color(0xFF86EFAC);
      pillBg = const Color(0xFF16A34A);
      pillText = Colors.white;
      trailingIcon = const Icon(Icons.check_circle_rounded,
          color: Color(0xFF16A34A), size: 20);
    } else if (isUserChoice) {
      bg = const Color(0xFFFFE4E6);
      border = const Color(0xFFFDA4AF);
      pillBg = const Color(0xFFE11D48);
      pillText = Colors.white;
      trailingIcon =
          const Icon(Icons.cancel_rounded, color: Color(0xFFE11D48), size: 20);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border, width: isCorrect || isUserChoice ? 1.5 : 1.0),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: pillBg,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: pillText,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isCorrect || isUserChoice
                    ? FontWeight.w700
                    : FontWeight.w500,
                color: isCorrect
                    ? const Color(0xFF14532D)
                    : isUserChoice
                        ? const Color(0xFF881337)
                        : const Color(0xFF334155),
                height: 1.35,
              ),
            ),
          ),
          if (trailingIcon != null) ...[
            const SizedBox(width: 8),
            trailingIcon,
          ],
        ],
      ),
    );
  }
}
