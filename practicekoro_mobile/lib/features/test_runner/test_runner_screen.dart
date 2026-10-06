import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/test_model.dart';
import '../../data/models/question_model.dart';
import '../../data/models/attempt_model.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/catalog_repository.dart';

enum RunnerScreenMode {
  question, // Screen 5
  palette, // Screen 6
  review, // Screen 7
  submitting, // Screen 9
}

class TestRunnerScreen extends ConsumerStatefulWidget {
  final String testId;
  final String? liveTestId;
  final String? attemptId;

  const TestRunnerScreen({
    super.key,
    required this.testId,
    this.liveTestId,
    this.attemptId,
  });

  @override
  ConsumerState<TestRunnerScreen> createState() => _TestRunnerScreenState();
}

class _TestRunnerScreenState extends ConsumerState<TestRunnerScreen>
    with SingleTickerProviderStateMixin {
  MockTestModel? _test;
  List<QuestionModel> _questions = [];
  bool _isLoading = true;
  String? _loadError;
  String? _attemptId;

  RunnerScreenMode _currentMode = RunnerScreenMode.question;
  int _currentIndex = 0;
  final Map<String, AttemptAnswerState> _answers = {};

  Timer? _timer;
  int _secondsRemaining = 3600;
  int _elapsedSeconds = 0;
  final ScrollController _numbersScrollController = ScrollController();

  late AnimationController _progressAnimController;

  @override
  void initState() {
    super.initState();
    _progressAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _loadTestData();
  }

  Future<void> _loadTestData() async {
    final catalogRepo = ref.read(catalogRepositoryProvider);
    try {
      final test = await catalogRepo.getTestById(widget.testId);
      if (test == null || !test.isActive) {
        throw StateError('This test is no longer available.');
      }
      final questions = await catalogRepo.getQuestionsForTest(widget.testId);
      if (questions.isEmpty) {
        throw StateError('This test has no published questions yet.');
      }
      final attemptId =
          widget.attemptId ??
          (await catalogRepo.startTestAttempt(
            widget.testId,
          ))['attempt_id']?.toString();
      if (attemptId == null || attemptId.isEmpty) {
        throw StateError('The test attempt could not be started.');
      }
      final savedAnswers = widget.attemptId == null
          ? const <Map<String, dynamic>>[]
          : await catalogRepo.getSavedTestAnswers(attemptId);
      final elapsedSeconds = widget.attemptId == null
          ? 0
          : await catalogRepo.getAttemptElapsedSeconds(attemptId);

      final durationSeconds = (test.durationMinutes * 60 - elapsedSeconds)
          .clamp(0, test.durationMinutes * 60);

      if (mounted) {
        setState(() {
          _test = test;
          _attemptId = attemptId;
          _questions = questions;
          _secondsRemaining = durationSeconds;
          _elapsedSeconds = elapsedSeconds;
          _isLoading = false;
          final savedByQuestion = {
            for (final answer in savedAnswers)
              answer['question_id'].toString(): answer,
          };
          for (final q in questions) {
            final saved = savedByQuestion[q.id];
            _answers[q.id] = AttemptAnswerState(
              questionId: q.id,
              selectedOption: saved?['selected_option'] as String?,
              isMarkedForReview:
                  saved?['is_marked_for_review'] as bool? ?? false,
              timeSpentSeconds:
                  (saved?['time_spent_seconds'] as num?)?.toInt() ?? 0,
            );
          }
        });
        _startTimer();
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
        _onAutoSubmitTimerExpired();
      } else {
        setState(() {
          _secondsRemaining--;
          _elapsedSeconds++;
        });
      }
    });
  }

  void _onAutoSubmitTimerExpired() {
    _showConfirmSubmissionModal(autoSubmit: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _numbersScrollController.dispose();
    _progressAnimController.dispose();
    super.dispose();
  }

  String _formatTimer(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
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
  }

  void _toggleMarkForReview() {
    if (_questions.isEmpty) return;
    final currentQ = _questions[_currentIndex];
    setState(() {
      final state = _answers[currentQ.id]!;
      state.isMarkedForReview = !state.isMarkedForReview;
    });
  }

  void _goToQuestion(int index) {
    if (index >= 0 && index < _questions.length) {
      setState(() {
        _currentIndex = index;
        _currentMode = RunnerScreenMode.question;
      });
      if (_numbersScrollController.hasClients) {
        final targetOffset = (index * 42.0) - 100;
        _numbersScrollController.animateTo(
          targetOffset.clamp(
            0.0,
            _numbersScrollController.position.maxScrollExtent,
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
      // Reached the end -> Go to Screen 7: Review & Submit
      setState(() => _currentMode = RunnerScreenMode.review);
    }
  }

  void _prevQuestion() {
    if (_currentIndex > 0) {
      _goToQuestion(_currentIndex - 1);
    }
  }

  // ── SUBMISSION FLOW (Screens 7, 8, 9, 10) ──
  void _showConfirmSubmissionModal({bool autoSubmit = false}) {
    if (autoSubmit) {
      _startSubmittingProcess();
      return;
    }

    // Screen 8: Confirm Submission Dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Soft blue circular icon with clipboard and red alert badge
            Stack(
              alignment: Alignment.topRight,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFDBEAFE)),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.assignment_outlined,
                      size: 30,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: Color(0xFFEF4444),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      '!',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Ready to Submit?',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: Color(0xFF051A43),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'You have answered ${_answers.values.where((a) => a.selectedOption != null).length} out of ${_questions.length} questions.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                height: 1.4,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 18),
            Builder(builder: (context) {
              final answered = _answers.values.where((a) => a.selectedOption != null).length;
              final marked = _answers.values.where((a) => a.isMarkedForReview).length;
              final notAnswered = _questions.length - answered;
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(20)),
                    child: Text('🟢 $answered Answered', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF16A34A))),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(20)),
                    child: Text('🟡 $notAnswered Not Answered', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(color: const Color(0xFFEDE9FE), borderRadius: BorderRadius.circular(20)),
                    child: Text('🟣 $marked Marked', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF7C3AED))),
                  ),
                ],
              );
            }),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFDBEAFE)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, size: 18, color: Color(0xFF026BFC)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Once submitted, you will not be able to modify your answers.',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Color(0xFF1E40AF)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _startSubmittingProcess();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF026BFC),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    child: const Text(
                      'Submit Test',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() => _currentMode = RunnerScreenMode.palette);
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF026BFC), width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    child: const Text(
                      'Review Answers',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _startSubmittingProcess() async {
    setState(() => _currentMode = RunnerScreenMode.submitting);
    _timer?.cancel();
    _progressAnimController.forward(from: 0.0);

    final catalogRepo = ref.read(catalogRepositoryProvider);

    // Client-side preliminary scoring (used as fallback only)
    int correct = 0;
    int incorrect = 0;
    int skipped = 0;
    double score = 0;

    for (final q in _questions) {
      final ans = _answers[q.id];
      if (ans?.selectedOption == null) {
        skipped++;
      } else if (q.correctOption.isNotEmpty &&
          ans?.selectedOption?.toUpperCase() == q.correctOption.toUpperCase()) {
        correct++;
        score += q.marks;
      } else if (q.correctOption.isNotEmpty) {
        incorrect++;
        score -= (_test?.negativeMarking ?? 0.25);
      } else {
        // correctOption was sanitized — can't score client-side, mark as attempted
        // Server will grade these properly
      }
    }

    final clientScore = score > 0 ? score : 0.0;
    final totalMarks = _test?.totalMarks ?? (_questions.length * 1.0);
    final clientPercentage = totalMarks > 0
        ? ((clientScore / totalMarks) * 100)
        : 0.0;
    final clientAccuracy = (_questions.length - skipped) > 0
        ? ((correct / (_questions.length - skipped)) * 100)
        : 0.0;
    final clientNegMarks = (_test?.negativeMarking ?? 0.25) * incorrect;

    // Submit to server and get the authoritative graded result
    Map<String, dynamic> serverResult = {};
    try {
      if (_attemptId != null) {
        serverResult = await catalogRepo.submitTestAttempt(
          attemptId: _attemptId!,
          answers: _answers.values.map((answer) => answer.toJson()).toList(),
          timeSpentSeconds: _elapsedSeconds,
        );
      }
    } catch (_) {}

    // Use server result if available, otherwise fall back to client calculation
    final finalScore = serverResult.isNotEmpty
        ? (serverResult['score'] as num?)?.toDouble() ?? clientScore
        : clientScore;
    final finalPercentage = serverResult.isNotEmpty
        ? (serverResult['percentage'] as num?)?.toDouble() ?? clientPercentage
        : clientPercentage;
    final finalAccuracy = serverResult.isNotEmpty
        ? (serverResult['accuracy'] as num?)?.toDouble() ?? clientAccuracy
        : clientAccuracy;
    final finalCorrect = serverResult.isNotEmpty
        ? (serverResult['correct_count'] as num?)?.toInt() ?? correct
        : correct;
    final finalIncorrect = serverResult.isNotEmpty
        ? (serverResult['wrong_count'] as num?)?.toInt() ?? incorrect
        : incorrect;
    final finalSkipped = serverResult.isNotEmpty
        ? (serverResult['skipped_count'] as num?)?.toInt() ?? skipped
        : skipped;
    final finalNegMarks = serverResult.isNotEmpty
        ? (serverResult['negative_marks'] as num?)?.toDouble() ?? clientNegMarks
        : clientNegMarks;

    final attempt = TestAttemptModel(
      id: _attemptId ?? 'att-${DateTime.now().millisecondsSinceEpoch}',
      testId: widget.testId,
      testTitle: _test?.title ?? 'Mock Test',
      userId: catalogRepo.currentUserId ?? '',
      score: finalScore,
      totalMarks: totalMarks,
      percentage: finalPercentage,
      accuracy: finalAccuracy,
      correctCount: finalCorrect,
      wrongCount: finalIncorrect,
      skippedCount: finalSkipped,
      totalQuestions: _questions.length,
      timeSpentSeconds: _elapsedSeconds,
      negativeMarksDeducted: finalNegMarks,
      completedAt: DateTime.now(),
      answers: _answers,
      testSeriesId: _test?.testSeriesId ?? '',
      testSeriesTitle: _test?.testSeriesTitle ?? '',
    );

    await LocalStorageService.saveAttempt(attempt);

    // Simulate short pleasant submission delay matching Screen 9
    await Future.delayed(const Duration(milliseconds: 1200));

    if (mounted) {
      context.go('/result/${attempt.id}');
    }
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
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Text(_loadError ?? 'No questions available for this test.'),
        ),
      );
    }

    // Switch between Screen 5, Screen 6, Screen 7, Screen 9
    switch (_currentMode) {
      case RunnerScreenMode.palette:
        return _buildScreen6Palette();
      case RunnerScreenMode.review:
        return _buildScreen7ReviewAndSubmit();
      case RunnerScreenMode.submitting:
        return _buildScreen9Submitting();
      case RunnerScreenMode.question:
        return _buildScreen5Question();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 5: TEST TAKING / QUESTION SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildScreen5Question() {
    final currentQ = _questions[_currentIndex];
    final answerState = _answers[currentQ.id];
    final selectedOption = answerState?.selectedOption;
    final isMarked = answerState?.isMarkedForReview ?? false;

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
          onPressed: () {
            // Prompt exit
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Exit Test?'),
                content: const Text(
                  'Your answers will be saved. You can submit when you are ready.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Resume'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.pop();
                    },
                    child: const Text(
                      'Exit',
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        title: Text(
          _test?.title ?? 'WBP Constable Mock Test 1',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: MediaQuery.sizeOf(context).width < 360 ? 13 : 15,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        centerTitle: false,
        actions: [
          // Timer badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _secondsRemaining < 300
                  ? const Color(0xFFFEE2E2)
                  : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: _secondsRemaining < 300
                      ? const Color(0xFFDC2626)
                      : AppColors.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatTimer(_secondsRemaining),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: _secondsRemaining < 300
                        ? const Color(0xFFDC2626)
                        : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // 9-dot Grid Icon: Opens Screen 6 Question Palette
          IconButton(
            icon: const Icon(
              Icons.grid_view_rounded,
              color: AppColors.navy,
              size: 21,
            ),
            onPressed: () =>
                setState(() => _currentMode = RunnerScreenMode.palette),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // ── HORIZONTAL QUESTION NUMBER BAR ──
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: ListView.builder(
              controller: _numbersScrollController,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _questions.length,
              itemBuilder: (context, index) {
                final isCurrent = index == _currentIndex;
                final q = _questions[index];
                final ans = _answers[q.id];
                final hasAnswered = ans?.selectedOption != null;
                final marked = ans?.isMarkedForReview ?? false;

                Color bgColor;
                Color textColor;
                if (isCurrent) {
                  bgColor = AppColors.primary;
                  textColor = Colors.white;
                } else if (marked) {
                  bgColor = const Color(0xFFF3E8FF);
                  textColor = const Color(0xFF7E22CE);
                } else if (hasAnswered) {
                  bgColor = const Color(0xFFDCFCE7);
                  textColor = const Color(0xFF15803D);
                } else {
                  bgColor = const Color(0xFFF1F5F9);
                  textColor = const Color(0xFF64748B);
                }

                return GestureDetector(
                  onTap: () => _goToQuestion(index),
                  child: Container(
                    width: 34,
                    height: 34,
                    margin: const EdgeInsets.only(right: 6),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isCurrent
                            ? AppColors.primary
                            : (marked
                                  ? const Color(0xFFD8B4FE)
                                  : Colors.transparent),
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: textColor,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // ── LEGEND ROW ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  _buildLegendItem(const Color(0xFF22C55E), 'Answered'),
                  const SizedBox(width: 14),
                  _buildLegendItem(const Color(0xFFA855F7), 'Marked'),
                  const SizedBox(width: 14),
                  _buildLegendItem(const Color(0xFF94A3B8), 'Not Visited'),
                ],
              ),
            ),
          ),

          const Divider(color: Color(0xFFF1F5F9), height: 1),

          // ── MAIN QUESTION BODY ──
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sub-header row matching Screen 07 in mockup
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFDBEAFE)),
                        ),
                        child: Text(
                          'Question ${_currentIndex + 1} / ${_questions.length}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF026BFC),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: _toggleMarkForReview,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isMarked
                                  ? Icons.check_box_rounded
                                  : Icons.check_box_outline_blank_rounded,
                              size: 18,
                              color: isMarked
                                  ? const Color(0xFFA855F7)
                                  : const Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Mark for Review',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isMarked
                                    ? const Color(0xFF7E22CE)
                                    : const Color(0xFF475569),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Question Text (Bengali preferred / English)
                  Text(
                    '${_currentIndex + 1}. ${currentQ.questionBengaliText ?? currentQ.questionText}',
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.navy,
                      height: 1.45,
                    ),
                  ),

                  if (currentQ.imageUrl != null &&
                      currentQ.imageUrl!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        currentQ.imageUrl!,
                        height: 160,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            const SizedBox.shrink(),
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Options A, B, C, D
                  _buildOptionCard(
                    'A',
                    currentQ.optionA,
                    selectedOption == 'A',
                  ),
                  const SizedBox(height: 10),
                  _buildOptionCard(
                    'B',
                    currentQ.optionB,
                    selectedOption == 'B',
                  ),
                  const SizedBox(height: 10),
                  _buildOptionCard(
                    'C',
                    currentQ.optionC,
                    selectedOption == 'C',
                  ),
                  const SizedBox(height: 10),
                  _buildOptionCard(
                    'D',
                    currentQ.optionD,
                    selectedOption == 'D',
                  ),

                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),

          // ── BOTTOM ACTION BAR ──
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Previous button
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _currentIndex > 0 ? _prevQuestion : null,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        side: BorderSide(
                          color: _currentIndex > 0
                              ? const Color(0xFF026BFC)
                              : const Color(0xFFE2E8F0),
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          '< Previous',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: _currentIndex > 0
                                ? const Color(0xFF026BFC)
                                : const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Next or Submit Test button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _nextQuestion,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF026BFC),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          _currentIndex < _questions.length - 1
                              ? 'Next >'
                              : 'Submit Test',
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildOptionCard(String letter, String text, bool isSelected) {
    return GestureDetector(
      onTap: () => _selectOption(letter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF026BFC)
                : const Color(0xFFE2E8F0),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0xFF026BFC)
                    : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                letter,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? Colors.white : const Color(0xFF475569),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF051A43),
                ),
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF026BFC),
                size: 18,
              ),
          ],
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 6: QUESTION PALETTE
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildScreen6Palette() {
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
          onPressed: () =>
              setState(() => _currentMode = RunnerScreenMode.question),
        ),
        title: Text(
          _test?.title ?? 'WBP Constable Mock Test 1',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: MediaQuery.sizeOf(context).width < 360 ? 13 : 15,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.close_rounded, color: AppColors.navy),
            onPressed: () =>
                setState(() => _currentMode = RunnerScreenMode.question),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Legend
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  _buildLegendItem(const Color(0xFF22C55E), 'Answered'),
                  const SizedBox(width: 16),
                  _buildLegendItem(const Color(0xFFA855F7), 'Marked'),
                  const SizedBox(width: 16),
                  _buildLegendItem(const Color(0xFF94A3B8), 'Not Visited'),
                ],
              ),
            ),
          ),
          const Divider(color: Color(0xFFF1F5F9), height: 1),

          Expanded(
            child: Builder(
              builder: (context) {
                final Map<String, List<int>> subjectMap = {};
                for (int i = 0; i < _questions.length; i++) {
                  final sName = _questions[i].subjectName?.trim();
                  final key = (sName != null && sName.isNotEmpty) ? sName : 'All Questions';
                  subjectMap.putIfAbsent(key, () => []).add(i);
                }

                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: subjectMap.entries.map((entry) {
                    final indices = entry.value;
                    final title = subjectMap.length == 1
                        ? 'Questions (1 - ${_questions.length})'
                        : '${entry.key} (${indices.first + 1} - ${indices.last + 1})';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: _buildPaletteSectionByIndices(title, indices),
                    );
                  }).toList(),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaletteSectionByIndices(String sectionTitle, List<int> indices) {
    if (indices.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          sectionTitle,
          style: const TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 6,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1.0,
          ),
          itemCount: indices.length,
          itemBuilder: (context, i) {
            final globalIdx = indices[i];
            final q = _questions[globalIdx];
            final ans = _answers[q.id];
            final isCurrent = globalIdx == _currentIndex;
            final hasAnswered = ans?.selectedOption != null;
            final marked = ans?.isMarkedForReview ?? false;

            Color bgColor;
            Color textColor;
            if (isCurrent) {
              bgColor = AppColors.primary;
              textColor = Colors.white;
            } else if (marked) {
              bgColor = const Color(0xFFF3E8FF);
              textColor = const Color(0xFF7E22CE);
            } else if (hasAnswered) {
              bgColor = const Color(0xFFDCFCE7);
              textColor = const Color(0xFF15803D);
            } else {
              bgColor = const Color(0xFFF1F5F9);
              textColor = const Color(0xFF64748B);
            }

            return GestureDetector(
              onTap: () => _goToQuestion(globalIdx),
              child: Container(
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isCurrent
                        ? AppColors.primary
                        : (marked
                              ? const Color(0xFFD8B4FE)
                              : Colors.transparent),
                    width: 1.5,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${globalIdx + 1}',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 7: REVIEW & SUBMIT
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildScreen7ReviewAndSubmit() {
    final answeredCount = _answers.values
        .where((a) => a.selectedOption != null)
        .length;
    final markedCount = _answers.values
        .where((a) => a.isMarkedForReview)
        .length;
    final unansweredCount = _questions.length - answeredCount;

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
          onPressed: () =>
              setState(() => _currentMode = RunnerScreenMode.question),
        ),
        title: const Text(
          'Review & Submit',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  // Top Spec Bar
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildSpecPill(
                          icon: Icons.description_outlined,
                          label:
                              '${_test?.totalQuestions ?? _questions.length} Questions',
                          color: const Color(0xFF6D28D9),
                          bgColor: const Color(0xFFF5F3FF),
                          borderColor: const Color(0xFFDDD6FE),
                        ),
                        const SizedBox(width: 8),
                        _buildSpecPill(
                          icon: Icons.access_time_rounded,
                          label: '${_test?.durationMinutes ?? 60} Minutes',
                          color: const Color(0xFF1D4ED8),
                          bgColor: const Color(0xFFEFF6FF),
                          borderColor: const Color(0xFFDBEAFE),
                        ),
                        const SizedBox(width: 8),
                        _buildSpecPill(
                          icon: Icons.military_tech_outlined,
                          label: '${_test?.totalMarks.toInt() ?? 100} Marks',
                          color: const Color(0xFFB45309),
                          bgColor: const Color(0xFFFFFBEB),
                          borderColor: const Color(0xFFFDE68A),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Summary Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF0F172A,
                          ).withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        _buildReviewRow(
                          color: const Color(0xFF22C55E),
                          label: 'Answered',
                          count: '$answeredCount',
                        ),
                        const Divider(color: Color(0xFFF1F5F9), height: 24),
                        _buildReviewRow(
                          color: const Color(0xFF94A3B8),
                          label: 'Not Answered',
                          count: '$unansweredCount',
                        ),
                        const Divider(color: Color(0xFFF1F5F9), height: 24),
                        _buildReviewRow(
                          color: const Color(0xFFA855F7),
                          label: 'Marked for Review',
                          count: '$markedCount',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Bottom Action Buttons
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Column(
                children: [
                  // "← Back to Test" outlined button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      onPressed: () => setState(
                        () => _currentMode = RunnerScreenMode.question,
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        '← Back to Test',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // "🚀 Submit Test" solid blue button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () => _showConfirmSubmissionModal(),
                      icon: const Text('🚀', style: TextStyle(fontSize: 16)),
                      label: const Text(
                        'Submit Test',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewRow({
    required Color color,
    required String label,
    required String count,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 10),
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Color(0xFF334155),
              ),
            ),
          ],
        ),
        Text(
          count,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: AppColors.navy,
          ),
        ),
      ],
    );
  }

  Widget _buildSpecPill({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required Color borderColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 9: SUBMITTING SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildScreen9Submitting() {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const SizedBox.shrink(),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Soft blue circle with Paper Airplane
              Container(
                width: 110,
                height: 110,
                decoration: const BoxDecoration(
                  color: Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.send_rounded,
                    size: 48,
                    color: AppColors.primary,
                  ),
                ),
              ),

              const SizedBox(height: 28),

              const Text(
                'Submitting your test...',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: AppColors.navy,
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                'Please wait while we are evaluating\nyour answers.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: Color(0xFF64748B),
                ),
              ),

              const SizedBox(height: 32),

              // Animated Progress Bar
              Container(
                width: 220,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(3),
                ),
                alignment: Alignment.centerLeft,
                child: AnimatedBuilder(
                  animation: _progressAnimController,
                  builder: (context, child) {
                    return FractionallySizedBox(
                      widthFactor: _progressAnimController.value,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
