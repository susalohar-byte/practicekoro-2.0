import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/test_model.dart';
import '../../data/models/question_model.dart';
import '../../data/models/attempt_model.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/catalog_repository.dart';

class TestRunnerScreen extends ConsumerStatefulWidget {
  final String testId;
  final String? liveTestId;

  const TestRunnerScreen({super.key, required this.testId, this.liveTestId});

  @override
  ConsumerState<TestRunnerScreen> createState() => _TestRunnerScreenState();
}

class _TestRunnerScreenState extends ConsumerState<TestRunnerScreen> {
  MockTestModel? _test;
  List<QuestionModel> _questions = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _loadError;
  String? _attemptId;

  int _currentIndex = 0;
  final Map<String, AttemptAnswerState> _answers = {};

  Timer? _timer;
  Timer? _saveTimer;
  int _secondsRemaining = 3572;
  int _elapsedSeconds = 0;
  final ScrollController _paletteScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadTestData();
  }

  Future<void> _loadTestData() async {
    final catalogRepo = ref.read(catalogRepositoryProvider);
    try {
      final test = await catalogRepo.getTestById(widget.testId);
      if (test == null) {
        throw StateError('This test is no longer available.');
      }
      final attempt = await catalogRepo.startTestAttempt(widget.testId);
      final attemptId = attempt['attempt_id']?.toString();
      if (attemptId == null || attemptId.isEmpty) {
        throw StateError('Could not initialize this test attempt.');
      }
      final results = await Future.wait([
        catalogRepo.getQuestionsForTest(widget.testId),
        catalogRepo.getSavedTestAnswers(attemptId),
      ]);
      final questions = results[0] as List<QuestionModel>;
      final savedAnswers = results[1] as List<Map<String, dynamic>>;
      if (questions.isEmpty) {
        throw StateError('This test has no available questions.');
      }
      final durationSeconds = test.durationMinutes * 60;
      final startTime = DateTime.tryParse(
        attempt['start_time']?.toString() ?? '',
      );
      final elapsed = startTime == null
          ? 0
          : DateTime.now()
                .difference(startTime)
                .inSeconds
                .clamp(0, durationSeconds);

      if (widget.liveTestId != null) {
        await catalogRepo.updateLiveTestParticipant(
          liveTestId: widget.liveTestId!,
          attemptId: attemptId,
          status: 'started',
        );
      }
      if (mounted) {
        setState(() {
          _test = test;
          _attemptId = attemptId;
          _questions = questions;
          _elapsedSeconds = elapsed;
          _secondsRemaining = (durationSeconds - elapsed).clamp(
            0,
            durationSeconds,
          );
          _isLoading = false;
          for (final q in questions) {
            _answers[q.id] = AttemptAnswerState(questionId: q.id);
          }
          for (final saved in savedAnswers) {
            final id = saved['question_id']?.toString();
            if (id != null && _answers.containsKey(id)) {
              _answers[id] = AttemptAnswerState.fromJson({
                'question_id': id,
                'selected_option': saved['selected_option'],
                'is_marked_for_review': saved['is_marked_for_review'],
                'time_spent_seconds': saved['time_spent_seconds'],
              });
            }
          }
        });
        _startTimer();
        _saveTimer = Timer.periodic(
          const Duration(seconds: 15),
          (_) => _saveAttempt(),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _loadError = error.toString().replaceFirst('Bad state: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining <= 1) {
        timer.cancel();
        _submitTest();
      } else {
        setState(() {
          _secondsRemaining--;
          _elapsedSeconds++;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _saveTimer?.cancel();
    _paletteScrollController.dispose();
    super.dispose();
  }

  void _selectOption(String option) {
    if (_questions.isEmpty) return;
    final currentQ = _questions[_currentIndex];
    setState(() {
      final state = _answers[currentQ.id]!;
      if (state.selectedOption == option) {
        state.selectedOption = null;
      } else {
        state.selectedOption = option;
      }
    });
    _saveAttempt();
  }

  void _clearResponse() {
    if (_questions.isEmpty) return;
    final currentQ = _questions[_currentIndex];
    setState(() {
      _answers[currentQ.id]?.selectedOption = null;
    });
    _saveAttempt();
  }

  void _toggleMark() {
    if (_questions.isEmpty) return;
    final currentQ = _questions[_currentIndex];
    setState(() {
      final state = _answers[currentQ.id]!;
      state.isMarkedForReview = !state.isMarkedForReview;
    });
    _saveAttempt();
  }

  void _goToQuestion(int index) {
    if (index >= 0 && index < _questions.length) {
      setState(() => _currentIndex = index);
      if (_paletteScrollController.hasClients) {
        final targetOffset = (index * 46.0) - 100;
        _paletteScrollController.animateTo(
          targetOffset.clamp(
            0.0,
            _paletteScrollController.position.maxScrollExtent,
          ),
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
        );
      }
    }
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      _goToQuestion(_currentIndex + 1);
    } else {
      _showSubmitConfirmation();
    }
  }

  void _prevQuestion() {
    if (_currentIndex > 0) {
      _goToQuestion(_currentIndex - 1);
    }
  }

  Future<void> _saveAttempt() async {
    final attemptId = _attemptId;
    if (attemptId == null || _isSubmitting || _answers.isEmpty) return;
    final catalogRepo = ref.read(catalogRepositoryProvider);
    try {
      await catalogRepo.saveTestAnswers(
        attemptId: attemptId,
        answers: _answers.values.map((answer) => answer.toJson()).toList(),
        timeSpentSeconds: _elapsedSeconds,
      );
    } catch (_) {
      // Keep the latest selections in memory; final submit retries the save.
    }
  }

  Future<void> _submitTest() async {
    if (_isSubmitting || _questions.isEmpty) return;
    setState(() => _isSubmitting = true);
    _timer?.cancel();
    _saveTimer?.cancel();

    final catalogRepo = ref.read(catalogRepositoryProvider);
    Map<String, dynamic>? serverResult;
    if (_attemptId != null) {
      try {
        serverResult = await catalogRepo.submitTestAttempt(
          attemptId: _attemptId!,
          answers: _answers.values.map((answer) => answer.toJson()).toList(),
          timeSpentSeconds: _elapsedSeconds,
        );
      } catch (error) {
        if (!mounted) return;
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Submission failed: ${error.toString().replaceFirst('Exception: ', '')}',
            ),
          ),
        );
        _saveTimer = Timer.periodic(
          const Duration(seconds: 15),
          (_) => _saveAttempt(),
        );
        if (_secondsRemaining > 1) _startTimer();
        return;
      }
    }

    int correct = 0;
    int incorrect = 0;
    int skipped = 0;
    double score = 0;

    for (final q in _questions) {
      final ans = _answers[q.id];
      if (ans?.selectedOption == null) {
        skipped++;
      } else if (ans?.selectedOption?.toUpperCase() ==
          q.correctOption.toUpperCase()) {
        correct++;
        score += q.marks;
      } else {
        incorrect++;
        score -= _test?.negativeMarking ?? 0;
      }
    }

    final finalScore = score > 0 ? score : 0.0;
    final totalMarks = _test?.totalMarks ?? (_questions.length * 1.0);
    final percentage = totalMarks > 0 ? ((finalScore / totalMarks) * 100) : 0.0;
    final accuracy = (_questions.length - skipped) > 0
        ? ((correct / (_questions.length - skipped)) * 100)
        : 0.0;

    final negMarks = (_test?.negativeMarking ?? 0) * incorrect;
    final attempt = TestAttemptModel(
      id: _attemptId ?? 'att-${DateTime.now().millisecondsSinceEpoch}',
      testId: widget.testId,
      testTitle: _test?.title ?? 'Mock Test',
      userId: catalogRepo.currentUserId ?? '',
      score: (serverResult?['score'] as num?)?.toDouble() ?? finalScore,
      totalMarks:
          (serverResult?['total_marks'] as num?)?.toDouble() ?? totalMarks,
      percentage:
          (serverResult?['percentage'] as num?)?.toDouble() ?? percentage,
      accuracy: (serverResult?['accuracy'] as num?)?.toDouble() ?? accuracy,
      correctCount:
          (serverResult?['correct_count'] as num?)?.toInt() ?? correct,
      wrongCount: (serverResult?['wrong_count'] as num?)?.toInt() ?? incorrect,
      skippedCount:
          (serverResult?['skipped_count'] as num?)?.toInt() ?? skipped,
      totalQuestions: _questions.length,
      timeSpentSeconds:
          (serverResult?['time_spent_seconds'] as num?)?.toInt() ??
          _elapsedSeconds,
      negativeMarksDeducted: negMarks,
      completedAt: DateTime.now(),
      answers: _answers,
    );

    if (widget.liveTestId != null &&
        _attemptId != null &&
        serverResult != null) {
      try {
        await catalogRepo.updateLiveTestParticipant(
          liveTestId: widget.liveTestId!,
          attemptId: _attemptId!,
          status: 'completed',
          result: serverResult,
        );
      } catch (_) {}
    }
    await LocalStorageService.saveAttempt(attempt);

    if (mounted) {
      context.go('/result/${attempt.id}');
    }
  }

  void _showSubmitConfirmation() {
    final answeredCount = _answers.values
        .where((a) => a.selectedOption != null)
        .length;
    final markedCount = _answers.values
        .where((a) => a.isMarkedForReview)
        .length;
    final unansweredCount = _questions.length - answeredCount;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.rXl),
        title: Text(
          'Submit Test?',
          style: AppTypography.titleLarge(color: AppColors.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to finish and submit your test now?',
              style: AppTypography.bodySmall(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: AppRadius.rMd,
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _buildSummaryRow(
                    'Total Questions:',
                    '${_questions.length}',
                    AppColors.textPrimary,
                  ),
                  const SizedBox(height: 6),
                  _buildSummaryRow(
                    'Answered:',
                    '$answeredCount',
                    AppColors.success,
                  ),
                  const SizedBox(height: 6),
                  _buildSummaryRow(
                    'Unanswered:',
                    '$unansweredCount',
                    AppColors.error,
                  ),
                  const SizedBox(height: 6),
                  _buildSummaryRow(
                    'Marked for Review:',
                    '$markedCount',
                    AppColors.warning,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Continue Test',
              style: AppTypography.buttonText(color: AppColors.secondaryText),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _submitTest();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: AppRadius.rMd),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            ),
            child: const Text(
              'Submit Now',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  void _showPaletteModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Question Palette',
                        style: AppTypography.titleLarge(color: AppColors.navy),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Legend
                  Row(
                    children: [
                      _buildLegendDot(AppColors.primary, 'Answered'),
                      const SizedBox(width: 12),
                      _buildLegendDot(AppColors.warning, 'Review'),
                      const SizedBox(width: 12),
                      _buildLegendDot(AppColors.border, 'Unvisited'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Flexible(
                    child: SingleChildScrollView(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: List.generate(_questions.length, (idx) {
                          final q = _questions[idx];
                          final ans = _answers[q.id];
                          final isSelected = ans?.selectedOption != null;
                          final isReview = ans?.isMarkedForReview ?? false;
                          final isCurrent = idx == _currentIndex;

                          Color bgColor = Colors.white;
                          Color textColor = AppColors.textPrimary;
                          Color borderColor = AppColors.border;

                          if (isSelected) {
                            bgColor = AppColors.primary;
                            textColor = Colors.white;
                            borderColor = AppColors.primary;
                          } else if (isReview) {
                            bgColor = AppColors.warningLight;
                            textColor = AppColors.warning;
                            borderColor = AppColors.warning;
                          }

                          if (isCurrent) {
                            borderColor = AppColors.darkNavy;
                          }

                          return InkWell(
                            onTap: () {
                              Navigator.pop(ctx);
                              _goToQuestion(idx);
                            },
                            borderRadius: AppRadius.rMd,
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: bgColor,
                                borderRadius: AppRadius.rMd,
                                border: Border.all(
                                  color: borderColor,
                                  width: isCurrent ? 2.5 : 1.2,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '${idx + 1}',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: textColor,
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.bodySmall(color: AppColors.secondaryText),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  String _formatTimer(int totalSeconds) {
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (_loadError != null || _questions.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          leading: IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.cloud_off_rounded,
                  size: 44,
                  color: AppColors.error,
                ),
                const SizedBox(height: 12),
                Text(
                  _loadError ?? 'Unable to load this test.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.pop(),
                  child: const Text('Go Back'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentQ = _questions[_currentIndex];
    final answerState = _answers[currentQ.id];
    final isMarked = answerState?.isMarkedForReview ?? false;
    final isCriticalTime = _secondsRemaining <= 300;

    return Scaffold(
      backgroundColor: AppColors.background,
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
          onPressed: _showSubmitConfirmation,
        ),
        titleSpacing: 0,
        title: Text(
          _test?.title ?? 'WBP Constable Mock 01',
          style: AppTypography.titleMedium(color: AppColors.navy),
        ),
        actions: [
          // Palette Button
          IconButton(
            icon: const Icon(
              Icons.grid_view_rounded,
              size: 20,
              color: AppColors.navy,
            ),
            onPressed: _showPaletteModal,
            tooltip: 'Question Palette',
          ),

          // Submit Action Pill
          Container(
            margin: const EdgeInsets.only(right: 12, top: 10, bottom: 10),
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _showSubmitConfirmation,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                shape: RoundedRectangleBorder(borderRadius: AppRadius.rPill),
                elevation: 0,
              ),
              child: Text(
                _isSubmitting ? 'Submitting…' : 'Submit',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Sub-header: Timer Pill + Question Pill + Subject Badge
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Timer Pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: isCriticalTime
                          ? AppColors.errorLight
                          : AppColors.veryLightBlue,
                      borderRadius: AppRadius.rPill,
                      border: Border.all(
                        color: isCriticalTime
                            ? AppColors.error
                            : AppColors.softBlue,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.timer_outlined,
                          color: isCriticalTime
                              ? AppColors.error
                              : AppColors.primary,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatTimer(_secondsRemaining),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isCriticalTime
                                ? AppColors.error
                                : AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Question Index Pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMuted,
                      borderRadius: AppRadius.rPill,
                    ),
                    child: Text(
                      '${_currentIndex + 1} / ${_questions.length}',
                      style: AppTypography.labelSmall(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),

                  // Subject Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.veryLightBlue,
                      borderRadius: AppRadius.rSm,
                    ),
                    child: Text(
                      currentQ.subjectName ?? 'General Knowledge',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Linear Progress Bar
            LinearProgressIndicator(
              value: (_currentIndex + 1) / _questions.length,
              backgroundColor: AppColors.borderSubtle,
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.primary,
              ),
              minHeight: 2.5,
            ),

            // Scrollable Question & Options Card Area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: AppRadius.rXl,
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'QUESTION ${_currentIndex + 1}',
                                style: AppTypography.labelSmall(
                                  color: AppColors.primary,
                                ),
                              ),
                              if (isMarked)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.warningLight,
                                    borderRadius: AppRadius.rPill,
                                  ),
                                  child: const Text(
                                    'MARKED',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.warning,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            currentQ.getLocalizedQuestion(
                              LocalStorageService.getLanguagePreference(),
                            ),
                            style: AppTypography.titleLarge(
                              color: AppColors.navy,
                            ).copyWith(fontSize: 16, height: 1.45),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Options Title
                    Text(
                      'Select One Option:',
                      style: AppTypography.titleSmall(
                        color: AppColors.secondaryText,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Options A, B, C, D
                    _buildOptionItem(
                      'A',
                      currentQ.optionA,
                      answerState?.selectedOption == 'A',
                    ),
                    _buildOptionItem(
                      'B',
                      currentQ.optionB,
                      answerState?.selectedOption == 'B',
                    ),
                    _buildOptionItem(
                      'C',
                      currentQ.optionC,
                      answerState?.selectedOption == 'C',
                    ),
                    _buildOptionItem(
                      'D',
                      currentQ.optionD,
                      answerState?.selectedOption == 'D',
                    ),

                    // Clear Answer button if selected
                    if (answerState?.selectedOption != null)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: _clearResponse,
                          icon: const Icon(
                            Icons.clear_rounded,
                            size: 14,
                            color: AppColors.secondaryText,
                          ),
                          label: Text(
                            'Clear Selection',
                            style: AppTypography.bodySmall(
                              color: AppColors.secondaryText,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Horizontal Question Palette Strip
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: SizedBox(
                height: 38,
                child: ListView.builder(
                  controller: _paletteScrollController,
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _questions.length,
                  itemBuilder: (context, index) {
                    final q = _questions[index];
                    final ans = _answers[q.id];
                    final isSelected = ans?.selectedOption != null;
                    final isReview = ans?.isMarkedForReview ?? false;
                    final isCurrent = index == _currentIndex;

                    Color bgColor = Colors.white;
                    Color textColor = AppColors.textPrimary;
                    Color borderColor = AppColors.border;

                    if (isSelected) {
                      bgColor = AppColors.primary;
                      textColor = Colors.white;
                      borderColor = AppColors.primary;
                    } else if (isReview) {
                      bgColor = AppColors.warningLight;
                      textColor = AppColors.warning;
                      borderColor = AppColors.warning;
                    }

                    if (isCurrent) {
                      borderColor = AppColors.darkNavy;
                    }

                    return GestureDetector(
                      onTap: () => _goToQuestion(index),
                      child: Container(
                        width: 36,
                        height: 36,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: bgColor,
                          borderRadius: AppRadius.rMd,
                          border: Border.all(
                            color: borderColor,
                            width: isCurrent ? 2.2 : 1.0,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: textColor,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

            // Bottom Navigation Controls
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  // Previous button
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _currentIndex > 0 ? _prevQuestion : null,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.navy,
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: AppRadius.rMd,
                        ),
                      ),
                      child: const Text(
                        '‹ Previous',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Mark for Review Icon Button
                  IconButton(
                    onPressed: _toggleMark,
                    icon: Icon(
                      isMarked
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_border_rounded,
                      color: isMarked
                          ? AppColors.warning
                          : AppColors.secondaryText,
                    ),
                    tooltip: 'Mark for Review',
                  ),
                  const SizedBox(width: 8),

                  // Next / Finish button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _nextQuestion,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: AppRadius.rMd,
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        _currentIndex == _questions.length - 1
                            ? 'Finish Test'
                            : 'Next ›',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
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

  Widget _buildLegendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTypography.bodySmall(color: AppColors.secondaryText),
        ),
      ],
    );
  }

  Widget _buildOptionItem(String optionKey, String text, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => _selectOption(optionKey),
        borderRadius: AppRadius.rLg,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.veryLightBlue : Colors.white,
            borderRadius: AppRadius.rLg,
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: isSelected ? 1.8 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.surfaceMuted,
                ),
                alignment: Alignment.center,
                child: Text(
                  optionKey,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? AppColors.navy : AppColors.textPrimary,
                    height: 1.35,
                  ),
                ),
              ),
              if (isSelected)
                const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.primary,
                  size: 18,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
