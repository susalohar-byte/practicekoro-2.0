import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/test_model.dart';
import '../../data/models/question_model.dart';
import '../../data/models/attempt_model.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/datasources/sample_exam_questions.dart';
import '../../data/repositories/catalog_repository.dart';

enum RunnerScreenMode {
  question, // Screen 5
  palette,  // Screen 6
  review,   // Screen 7
  submitting, // Screen 9
}

class TestRunnerScreen extends ConsumerStatefulWidget {
  final String testId;
  final String? liveTestId;

  const TestRunnerScreen({super.key, required this.testId, this.liveTestId});

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
      final test = await catalogRepo.getTestById(widget.testId) ??
          MockTestModel(
            id: widget.testId,
            title: 'WBP Constable Mock Test 1',
            slug: widget.testId,
            durationMinutes: 60,
            totalQuestions: 100,
            totalMarks: 100.0,
            negativeMarking: 0.25,
            testSeriesId: 'wbp-constable',
            testSeriesTitle: 'WBP Constable Test Series 2026',
          );

      final attempt = await catalogRepo.startTestAttempt(widget.testId);
      final attemptId = attempt['attempt_id']?.toString() ?? 'att-${DateTime.now().millisecondsSinceEpoch}';

      final questions = await catalogRepo.getQuestionsForTest(widget.testId);
      final finalQuestions = questions.isNotEmpty ? questions : SampleExamQuestions.defaultQuestions;

      final durationSeconds = test.durationMinutes * 60;

      if (mounted) {
        setState(() {
          _test = test;
          _attemptId = attemptId;
          _questions = finalQuestions;
          _secondsRemaining = durationSeconds;
          _isLoading = false;
          for (final q in finalQuestions) {
            _answers[q.id] = AttemptAnswerState(questionId: q.id);
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
                    child: Icon(Icons.assignment_outlined, size: 30, color: AppColors.primary),
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
                    child: Text('!', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Confirm Submission',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppColors.navy,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Are you sure you want to submit your test? You will not be able to make any changes after submission.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                height: 1.45,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _startSubmittingProcess();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text(
                      'Submit Test',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
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

    int correct = 0;
    int incorrect = 0;
    int skipped = 0;
    double score = 0;

    for (final q in _questions) {
      final ans = _answers[q.id];
      if (ans?.selectedOption == null) {
        skipped++;
      } else if (ans?.selectedOption?.toUpperCase() == q.correctOption.toUpperCase()) {
        correct++;
        score += q.marks;
      } else {
        incorrect++;
        score -= (_test?.negativeMarking ?? 0.25);
      }
    }

    final finalScore = score > 0 ? score : 0.0;
    final totalMarks = _test?.totalMarks ?? (_questions.length * 1.0);
    final percentage = totalMarks > 0 ? ((finalScore / totalMarks) * 100) : 0.0;
    final accuracy = (_questions.length - skipped) > 0
        ? ((correct / (_questions.length - skipped)) * 100)
        : 0.0;

    final negMarks = (_test?.negativeMarking ?? 0.25) * incorrect;
    final attempt = TestAttemptModel(
      id: _attemptId ?? 'att-${DateTime.now().millisecondsSinceEpoch}',
      testId: widget.testId,
      testTitle: _test?.title ?? 'WBP Constable Mock Test 1',
      userId: catalogRepo.currentUserId ?? '',
      score: finalScore,
      totalMarks: totalMarks,
      percentage: percentage,
      accuracy: accuracy,
      correctCount: correct,
      wrongCount: incorrect,
      skippedCount: skipped,
      totalQuestions: _questions.length,
      timeSpentSeconds: _elapsedSeconds,
      negativeMarksDeducted: negMarks,
      completedAt: DateTime.now(),
      answers: _answers,
      testSeriesId: _test?.testSeriesId ?? 'wbp-constable',
      testSeriesTitle: _test?.testSeriesTitle ?? 'WBP Constable Test Series 2026',
    );

    await LocalStorageService.saveAttempt(attempt);

    try {
      if (_attemptId != null) {
        await catalogRepo.submitTestAttempt(
          attemptId: _attemptId!,
          answers: _answers.values.map((answer) => answer.toJson()).toList(),
          timeSpentSeconds: _elapsedSeconds,
        );
      }
    } catch (_) {}

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
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.navy),
          onPressed: () {
            // Prompt exit
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Exit Test?'),
                content: const Text('Your answers will be saved. You can submit when you are ready.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Resume')),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.pop();
                    },
                    child: const Text('Exit', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            );
          },
        ),
        title: Text(
          _test?.title ?? 'WBP Constable Mock Test 1',
          style: const TextStyle(
            fontSize: 15,
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
              color: _secondsRemaining < 300 ? const Color(0xFFFEE2E2) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: _secondsRemaining < 300 ? const Color(0xFFDC2626) : AppColors.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatTimer(_secondsRemaining),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: _secondsRemaining < 300 ? const Color(0xFFDC2626) : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // 9-dot Grid Icon: Opens Screen 6 Question Palette
          IconButton(
            icon: const Icon(Icons.grid_view_rounded, color: AppColors.navy, size: 21),
            onPressed: () => setState(() => _currentMode = RunnerScreenMode.palette),
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
                            : (marked ? const Color(0xFFD8B4FE) : Colors.transparent),
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

          const Divider(color: Color(0xFFF1F5F9), height: 1),

          // ── MAIN QUESTION BODY ──
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section pill + Position Counter
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFDBEAFE)),
                        ),
                        child: Text(
                          currentQ.subjectName ?? 'General Knowledge',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      Text(
                        '${_currentIndex + 1}/${_questions.length}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF64748B),
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

                  if (currentQ.imageUrl != null && currentQ.imageUrl!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        currentQ.imageUrl!,
                        height: 160,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Options A, B, C, D
                  _buildOptionCard('A', currentQ.optionA, selectedOption == 'A'),
                  const SizedBox(height: 10),
                  _buildOptionCard('B', currentQ.optionB, selectedOption == 'B'),
                  const SizedBox(height: 10),
                  _buildOptionCard('C', currentQ.optionC, selectedOption == 'C'),
                  const SizedBox(height: 10),
                  _buildOptionCard('D', currentQ.optionD, selectedOption == 'D'),

                  const SizedBox(height: 20),

                  // Mark for review toggle
                  GestureDetector(
                    onTap: _toggleMarkForReview,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isMarked ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                          size: 20,
                          color: isMarked ? const Color(0xFFA855F7) : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Mark for Review',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isMarked ? const Color(0xFF7E22CE) : const Color(0xFF475569),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── BOTTOM ACTION BAR ──
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
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
                        color: _currentIndex > 0 ? const Color(0xFFCBD5E1) : const Color(0xFFE2E8F0),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      '← Previous',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: _currentIndex > 0 ? const Color(0xFF475569) : const Color(0xFF94A3B8),
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
                      backgroundColor: AppColors.primary,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      _currentIndex < _questions.length - 1 ? 'Next →' : 'Submit Test →',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
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
          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
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
          color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF22C55E) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF22C55E) : const Color(0xFFF1F5F9),
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
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? const Color(0xFF15803D) : AppColors.navy,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle_rounded, color: Color(0xFF22C55E), size: 18),
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
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.navy),
          onPressed: () => setState(() => _currentMode = RunnerScreenMode.question),
        ),
        title: Text(
          _test?.title ?? 'WBP Constable Mock Test 1',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.navy),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.close_rounded, color: AppColors.navy),
            onPressed: () => setState(() => _currentMode = RunnerScreenMode.question),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Legend
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
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
          const Divider(color: Color(0xFFF1F5F9), height: 1),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildPaletteSection('General Knowledge (1 - 25)', 0, 25),
                const SizedBox(height: 18),
                _buildPaletteSection('General Science (26 - 50)', 25, 50),
                const SizedBox(height: 18),
                _buildPaletteSection('Mathematics (51 - 75)', 50, 75),
                const SizedBox(height: 18),
                _buildPaletteSection('Reasoning & English (76 - 100)', 75, 100),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaletteSection(String sectionTitle, int startIdx, int endIdx) {
    final subQuestions = _questions.sublist(
      startIdx.clamp(0, _questions.length),
      endIdx.clamp(0, _questions.length),
    );

    if (subQuestions.isEmpty) return const SizedBox.shrink();

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
          itemCount: subQuestions.length,
          itemBuilder: (context, i) {
            final globalIdx = startIdx + i;
            final q = subQuestions[i];
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
                        : (marked ? const Color(0xFFD8B4FE) : Colors.transparent),
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
    final answeredCount = _answers.values.where((a) => a.selectedOption != null).length;
    final markedCount = _answers.values.where((a) => a.isMarkedForReview).length;
    final unansweredCount = _questions.length - answeredCount;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.navy),
          onPressed: () => setState(() => _currentMode = RunnerScreenMode.question),
        ),
        title: const Text(
          'Review & Submit',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.navy),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildSpecPill(
                        icon: Icons.description_outlined,
                        label: '${_test?.totalQuestions ?? _questions.length} Questions',
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
                          color: const Color(0xFF0F172A).withValues(alpha: 0.04),
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
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
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
                    onPressed: () => setState(() => _currentMode = RunnerScreenMode.question),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
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
