import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/question_model.dart';
import '../../data/repositories/catalog_repository.dart';

class AnalysisScreen extends ConsumerStatefulWidget {
  final String attemptId;
  final TestAttemptModel? attempt;

  const AnalysisScreen({super.key, required this.attemptId, this.attempt});

  @override
  ConsumerState<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends ConsumerState<AnalysisScreen> {
  int _selectedTab = 1; // Default to Questions (Screen 8 mockup)
  String _filter = 'all'; // 'all', 'correct', 'wrong', 'skipped'
  int _currentQuestionIndex = 0;
  List<QuestionModel> _questions = [];
  Map<String, AttemptAnswerState> _reviewAnswers = {};
  bool _isLoading = true;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final catalog = ref.read(catalogRepositoryProvider);
    try {
      final questions = await catalog.getAttemptSolutions(widget.attemptId);
      if (mounted) {
        setState(() {
          _questions = questions;
          _reviewAnswers = {
            for (final question in questions)
              question.id: AttemptAnswerState(
                questionId: question.id,
                selectedOption: question.selectedOption,
              ),
          };
          _isLoading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _loadError = error.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final attempt =
        widget.attempt ??
        TestAttemptModel(
          id: widget.attemptId,
          userId: '',
          testId: '',
          testTitle: 'Test Analysis',
          score: 0.0,
          totalMarks: 0.0,
          percentage: 0.0,
          accuracy: 0.0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
          timeSpentSeconds: 0,
          totalQuestions: 0,
          completedAt: DateTime.now(),
        );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
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
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Detailed Analysis',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.navy,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.share_outlined,
              size: 20,
              color: AppColors.navy,
            ),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Tab Switcher: Overview | Questions | Subjects
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.all(3),
                child: Row(
                  children: [
                    _buildTabButton(0, 'Overview'),
                    _buildTabButton(1, 'Questions'),
                    _buildTabButton(2, 'Subjects'),
                  ],
                ),
              ),
            ),

            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Content based on tab
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                      ),
                    )
                  : _loadError != null
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'Could not load question analysis. Check your connection and try again.',
                          textAlign: TextAlign.center,
                        ),
                      ),
                    )
                  : _selectedTab == 1
                  ? _buildQuestionsView(attempt)
                  : _selectedTab == 0
                  ? _buildOverviewView(attempt)
                  : _buildSubjectsView(attempt),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String label) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? AppColors.primary : const Color(0xFF64748B),
            ),
          ),
        ),
      ),
    );
  }

  // --- TAB 1: QUESTIONS VIEW (EXACT SCREEN 8 MOCKUP) ---
  Widget _buildQuestionsView(TestAttemptModel attempt) {
    final answers = {...attempt.answers, ..._reviewAnswers};

    // Filter questions
    final filteredQuestions = _questions.where((q) {
      final ans = answers[q.id];
      final isAnswered = ans?.selectedOption != null;
      final isCorrect =
          isAnswered &&
          (q.isCorrect ??
              ans!.selectedOption!.toUpperCase() ==
                  q.correctOption.toUpperCase());

      if (_filter == 'correct') return isCorrect;
      if (_filter == 'wrong') return isAnswered && !isCorrect;
      if (_filter == 'skipped') return !isAnswered;
      return true; // 'all'
    }).toList();

    if (filteredQuestions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.quiz_outlined, size: 48, color: Color(0xFF94A3B8)),
            const SizedBox(height: 12),
            Text(
              'No questions found in this category',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
            ),
          ],
        ),
      );
    }

    final currentIndex = _currentQuestionIndex.clamp(
      0,
      filteredQuestions.length - 1,
    );
    final currentQ = filteredQuestions[currentIndex];
    final ansState = answers[currentQ.id];
    final userSelected =
        (ansState?.selectedOption ?? currentQ.selectedOption)?.toUpperCase() ??
        '';
    final correctOption = currentQ.correctOption.toUpperCase();
    final isCorrect =
        userSelected.isNotEmpty &&
        (currentQ.isCorrect ?? userSelected == correctOption);
    final isSkipped = userSelected.isEmpty;

    return Column(
      children: [
        // Filter Chips Row
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(
                  'All (${_questions.length})',
                  'all',
                  const Color(0xFF2563EB),
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'Correct (${attempt.correctCount})',
                  'correct',
                  const Color(0xFF16A34A),
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'Incorrect (${attempt.wrongCount})',
                  'wrong',
                  const Color(0xFFEF4444),
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'Skipped (${attempt.skippedCount})',
                  'skipped',
                  const Color(0xFF64748B),
                ),
              ],
            ),
          ),
        ),

        const Divider(height: 1, color: Color(0xFFE2E8F0)),

        // Question Detail Card & Explanation
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Question Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Question Number & Badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Q. ${currentIndex + 1} of ${filteredQuestions.length}',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.navy,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: isCorrect
                                  ? const Color(0xFFDCFCE7)
                                  : isSkipped
                                  ? const Color(0xFFF1F5F9)
                                  : const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isCorrect
                                      ? Icons.check_circle_rounded
                                      : isSkipped
                                      ? Icons.remove_circle_outline_rounded
                                      : Icons.cancel_rounded,
                                  size: 13,
                                  color: isCorrect
                                      ? const Color(0xFF16A34A)
                                      : isSkipped
                                      ? const Color(0xFF64748B)
                                      : const Color(0xFFEF4444),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isCorrect
                                      ? 'Correct'
                                      : isSkipped
                                      ? 'Skipped'
                                      : 'Incorrect',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isCorrect
                                        ? const Color(0xFF16A34A)
                                        : isSkipped
                                        ? const Color(0xFF64748B)
                                        : const Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Question Text
                      Text(
                        currentQ.questionText,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.navy,
                          height: 1.45,
                        ),
                      ),

                      const SizedBox(height: 18),

                      // Options Comparison
                      _buildSolutionOptionItem(
                        'A',
                        currentQ.optionA,
                        correctOption == 'A',
                        userSelected == 'A',
                      ),
                      _buildSolutionOptionItem(
                        'B',
                        currentQ.optionB,
                        correctOption == 'B',
                        userSelected == 'B',
                      ),
                      _buildSolutionOptionItem(
                        'C',
                        currentQ.optionC,
                        correctOption == 'C',
                        userSelected == 'C',
                      ),
                      _buildSolutionOptionItem(
                        'D',
                        currentQ.optionD,
                        correctOption == 'D',
                        userSelected == 'D',
                      ),

                      const SizedBox(height: 12),

                      // Tags Row: Subject, Topic
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _buildTag(
                            currentQ.subjectName ?? 'Polity',
                            const Color(0xFFEFF6FF),
                            const Color(0xFF2563EB),
                          ),
                          _buildTag(
                            'Fundamental Rights',
                            const Color(0xFFF1F5F9),
                            const Color(0xFF475569),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Short Notes / Explanation Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFDBEAFE)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(
                            Icons.lightbulb_rounded,
                            color: Color(0xFFF59E0B),
                            size: 20,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Explanation & Short Notes',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E3A8A),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        (currentQ.explanation != null &&
                                currentQ.explanation!.isNotEmpty)
                            ? currentQ.explanation!
                            : 'Articles 14 to 18 of the Constitution of India deal with the Right to Equality. Article 14 guarantees equality before law and equal protection of laws within the territory of India.',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF1E293B),
                          height: 1.55,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),

        // Bottom Navigation Bar: Previous Q / Next Q
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: currentIndex > 0
                      ? () => setState(
                          () => _currentQuestionIndex = currentIndex - 1,
                        )
                      : null,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.navy,
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    '‹ Previous Q',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: currentIndex < filteredQuestions.length - 1
                      ? () => setState(
                          () => _currentQuestionIndex = currentIndex + 1,
                        )
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Next Q ›',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value, Color activeColor) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() {
        _filter = value;
        _currentQuestionIndex = 0;
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildSolutionOptionItem(
    String optionKey,
    String text,
    bool isCorrect,
    bool isUserSelected,
  ) {
    Color borderColor = const Color(0xFFE2E8F0);
    Color bgColor = Colors.white;
    String? badgeLabel;
    Color badgeColor = Colors.transparent;
    Color badgeTextColor = Colors.transparent;

    if (isCorrect) {
      borderColor = const Color(0xFF16A34A);
      bgColor = const Color(0xFFF0FDF4);
      badgeLabel = '✓ Correct Answer';
      badgeColor = const Color(0xFFDCFCE7);
      badgeTextColor = const Color(0xFF16A34A);
    } else if (isUserSelected) {
      borderColor = const Color(0xFFEF4444);
      bgColor = const Color(0xFFFEF2F2);
      badgeLabel = '✗ Your Answer';
      badgeColor = const Color(0xFFFEE2E2);
      badgeTextColor = const Color(0xFFEF4444);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: borderColor,
          width: (isCorrect || isUserSelected) ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCorrect
                      ? const Color(0xFF16A34A)
                      : isUserSelected
                      ? const Color(0xFFEF4444)
                      : const Color(0xFFF1F5F9),
                ),
                alignment: Alignment.center,
                child: Text(
                  optionKey,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: (isCorrect || isUserSelected)
                        ? Colors.white
                        : const Color(0xFF64748B),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: (isCorrect || isUserSelected)
                        ? FontWeight.bold
                        : FontWeight.w500,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          if (badgeLabel != null) ...[
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.only(left: 36),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badgeLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: badgeTextColor,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTag(String label, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  // --- TAB 0: OVERVIEW VIEW ---
  Widget _buildOverviewView(TestAttemptModel attempt) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Overall Performance Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Overall Accuracy',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 80,
                        height: 80,
                        child: CircularProgressIndicator(
                          value: attempt.accuracy / 100,
                          strokeWidth: 8,
                          backgroundColor: const Color(0xFFE2E8F0),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.primary,
                          ),
                        ),
                      ),
                      Text(
                        '${attempt.accuracy.toInt()}%',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.navy,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLegendItem(
                          const Color(0xFF16A34A),
                          'Correct Answers',
                          '${attempt.correctCount}',
                        ),
                        const SizedBox(height: 8),
                        _buildLegendItem(
                          const Color(0xFFEF4444),
                          'Incorrect Answers',
                          '${attempt.wrongCount}',
                        ),
                        const SizedBox(height: 8),
                        _buildLegendItem(
                          const Color(0xFF64748B),
                          'Skipped Questions',
                          '${attempt.skippedCount}',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Quick button to jump to Questions Tab
        ElevatedButton(
          onPressed: () => setState(() => _selectedTab = 1),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Review Questions & Solutions',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward_rounded, size: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // --- TAB 2: SUBJECTS VIEW ---
  Widget _buildSubjectsView(TestAttemptModel attempt) {
    final bySubject = <String, List<QuestionModel>>{};
    for (final question in _questions) {
      if (question.selectedOption == null || question.subjectName == null) {
        continue;
      }
      bySubject.putIfAbsent(question.subjectName!, () => []).add(question);
    }
    if (bySubject.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Subject breakdown is not available for this attempt.'),
        ),
      );
    }
    const colors = [
      Color(0xFF2563EB),
      Color(0xFF16A34A),
      Color(0xFFF59E0B),
      Color(0xFF8B5CF6),
    ];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: bySubject.entries.toList().asMap().entries.map((entry) {
        final color = colors[entry.key % colors.length];
        final questions = entry.value.value;
        final correct = questions
            .where(
              (question) =>
                  question.isCorrect ??
                  question.selectedOption == question.correctOption,
            )
            .length;
        final accuracy = (correct / questions.length * 100).toStringAsFixed(1);
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                width: 10,
                height: 40,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.value.key,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.navy,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$correct correct · ${questions.length} attempted',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$accuracy% accuracy',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLegendItem(Color color, String label, String value) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.navy,
          ),
        ),
      ],
    );
  }
}
