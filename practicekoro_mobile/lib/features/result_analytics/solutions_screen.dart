import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/sample_exam_questions.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/question_model.dart';
import '../../data/repositories/catalog_repository.dart';

class SolutionsScreen extends ConsumerStatefulWidget {
  final String testId;
  final TestAttemptModel? attempt;

  const SolutionsScreen({super.key, required this.testId, this.attempt});

  @override
  ConsumerState<SolutionsScreen> createState() => _SolutionsScreenState();
}

class _SolutionsScreenState extends ConsumerState<SolutionsScreen> {
  List<QuestionModel> _questions = [];
  bool _isLoading = true;
  int _currentIndex = 0;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadQuestions() async {
    final catalog = ref.read(catalogRepositoryProvider);
    try {
      final attemptId = widget.attempt?.id ?? widget.testId;
      var questions = await catalog.getAttemptSolutions(attemptId);
      if (questions.isEmpty) {
        questions = await catalog.getQuestionsForTest(widget.testId);
      }
      if (questions.isEmpty) {
        questions = SampleExamQuestions.defaultQuestions;
      }
      if (mounted) {
        setState(() {
          _questions = questions;
          _isLoading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _questions = SampleExamQuestions.defaultQuestions;
          _isLoading = false;
        });
      }
    }
  }

  void _jumpToQuestion(int index) {
    if (index < 0 || index >= _questions.length) return;
    setState(() => _currentIndex = index);

    // Scroll horizontal palette so the selected question is visible
    final targetOffset = index * 48.0 - 120.0;
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  String _getOptionText(QuestionModel q, String optionKey) {
    switch (optionKey.toUpperCase()) {
      case 'A':
        return q.optionA;
      case 'B':
        return q.optionB;
      case 'C':
        return q.optionC;
      case 'D':
        return q.optionD;
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 18,
            color: AppColors.navy,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Solutions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.navy,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _questions.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'No solutions available for this test.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ),
                )
              : SafeArea(
                  child: Column(
                    children: [
                      // ── HORIZONTAL QUESTION SELECTOR (Screen 12) ──
                      _buildQuestionPicker(),

                      const Divider(height: 1, color: Color(0xFFE2E8F0)),

                      // ── MAIN QUESTION & SOLUTION CONTENT (Screen 12) ──
                      Expanded(
                        child: ListView(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 16,
                          ),
                          children: [
                            _buildCurrentQuestionView(),
                          ],
                        ),
                      ),

                      // ── BOTTOM ACTION BUTTON (Screen 12) ──
                      _buildBottomBar(),
                    ],
                  ),
                ),
    );
  }

  // ===========================================================================
  // HORIZONTAL QUESTION PICKER BAR (Screen 12)
  // ===========================================================================
  Widget _buildQuestionPicker() {
    final answers = widget.attempt?.answers ?? {};

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 12),
      height: 60,
      child: ListView.separated(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _questions.length,
        separatorBuilder: (_, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final q = _questions[index];
          final isSelected = index == _currentIndex;

          final ans = answers[q.id];
          final userSelected = ans?.selectedOption ?? q.selectedOption;
          final isCorrect = userSelected != null &&
              (q.isCorrect ??
                  userSelected.toUpperCase() == q.correctOption.toUpperCase());
          final isAnswered = userSelected != null;

          return GestureDetector(
            onTap: () => _jumpToQuestion(index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected
                    ? AppColors.primary
                    : isAnswered
                        ? (isCorrect
                            ? const Color(0xFFF0FDF4)
                            : const Color(0xFFFEF2F2))
                        : const Color(0xFFF1F5F9),
                border: Border.all(
                  color: isSelected
                      ? AppColors.primary
                      : isAnswered
                          ? (isCorrect
                              ? const Color(0xFF86EFAC)
                              : const Color(0xFFFECACA))
                          : const Color(0xFFE2E8F0),
                  width: isSelected ? 2 : 1,
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isSelected
                      ? Colors.white
                      : isAnswered
                          ? (isCorrect
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626))
                          : const Color(0xFF64748B),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ===========================================================================
  // CURRENT QUESTION VIEW (Screen 12)
  // ===========================================================================
  Widget _buildCurrentQuestionView() {
    final q = _questions[_currentIndex];
    final answers = widget.attempt?.answers ?? {};
    final ans = answers[q.id];
    final userSelected = ans?.selectedOption ?? q.selectedOption;

    final questionText = q.questionBengaliText != null &&
            q.questionBengaliText!.isNotEmpty
        ? q.questionBengaliText!
        : q.questionText;

    final correctOptionKey = q.correctOption.toUpperCase();
    final correctOptionText = _getOptionText(q, correctOptionKey);

    final explanationText = q.explanationBengali != null &&
            q.explanationBengali!.isNotEmpty
        ? q.explanationBengali!
        : (q.explanation ?? 'এই প্রশ্নের জন্য কোনো শর্ট নোটস বা ব্যাখ্যা নেই।');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Question Title (e.g. "1. ভারতের জাতীয় ফুল কোনটি?")
        Text(
          '${_currentIndex + 1}. $questionText',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.navy,
            height: 1.45,
          ),
        ),

        const SizedBox(height: 18),

        // 4 Options (A, B, C, D)
        _buildOptionItem(
          key: 'A',
          text: q.optionA,
          isCorrectAnswer: correctOptionKey == 'A',
          isSelectedByUser: userSelected?.toUpperCase() == 'A',
        ),
        const SizedBox(height: 10),
        _buildOptionItem(
          key: 'B',
          text: q.optionB,
          isCorrectAnswer: correctOptionKey == 'B',
          isSelectedByUser: userSelected?.toUpperCase() == 'B',
        ),
        const SizedBox(height: 10),
        _buildOptionItem(
          key: 'C',
          text: q.optionC,
          isCorrectAnswer: correctOptionKey == 'C',
          isSelectedByUser: userSelected?.toUpperCase() == 'C',
        ),
        const SizedBox(height: 10),
        _buildOptionItem(
          key: 'D',
          text: q.optionD,
          isCorrectAnswer: correctOptionKey == 'D',
          isSelectedByUser: userSelected?.toUpperCase() == 'D',
        ),

        const SizedBox(height: 16),

        // Correct Answer Banner (Screen 12)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFA7F3D0)),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF10B981),
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Correct Answer: $correctOptionKey. $correctOptionText',
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF047857),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Explanation Card (Screen 12)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(
                    Icons.menu_book_rounded,
                    size: 16,
                    color: AppColors.primary,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Explanation',
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.navy,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                explanationText,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF334155),
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // INDIVIDUAL OPTION ITEM (Screen 12)
  // ===========================================================================
  Widget _buildOptionItem({
    required String key,
    required String text,
    required bool isCorrectAnswer,
    required bool isSelectedByUser,
  }) {
    Color bg = Colors.white;
    Color border = const Color(0xFFE2E8F0);
    Color textColor = AppColors.navy;
    Color circleBg = const Color(0xFFF1F5F9);
    Color circleTextColor = const Color(0xFF64748B);
    Widget? trailingIcon;

    if (isCorrectAnswer) {
      bg = const Color(0xFFECFDF5);
      border = const Color(0xFF10B981);
      textColor = const Color(0xFF047857);
      circleBg = const Color(0xFF10B981);
      circleTextColor = Colors.white;
      trailingIcon = const Icon(
        Icons.check_circle_rounded,
        color: Color(0xFF10B981),
        size: 20,
      );
    } else if (isSelectedByUser) {
      bg = const Color(0xFFFEF2F2);
      border = const Color(0xFFEF4444);
      textColor = const Color(0xFFB91C1C);
      circleBg = const Color(0xFFEF4444);
      circleTextColor = Colors.white;
      trailingIcon = const Icon(
        Icons.cancel_rounded,
        color: Color(0xFFEF4444),
        size: 20,
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border, width: isCorrectAnswer ? 1.5 : 1),
      ),
      child: Row(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: circleBg,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              key,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: circleTextColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                fontWeight:
                    isCorrectAnswer ? FontWeight.w700 : FontWeight.w500,
                color: textColor,
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

  // ===========================================================================
  // BOTTOM BAR (Screen 12)
  // ===========================================================================
  Widget _buildBottomBar() {
    final isLast = _currentIndex >= _questions.length - 1;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentIndex > 0) ...[
            OutlinedButton(
              onPressed: () => _jumpToQuestion(_currentIndex - 1),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFBFDBFE)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Icon(
                Icons.arrow_back_rounded,
                size: 20,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                if (isLast) {
                  Navigator.of(context).pop();
                } else {
                  _jumpToQuestion(_currentIndex + 1);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    isLast ? 'Finish Review' : 'Next Question',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    isLast
                        ? Icons.check_circle_outline_rounded
                        : Icons.arrow_forward_rounded,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
