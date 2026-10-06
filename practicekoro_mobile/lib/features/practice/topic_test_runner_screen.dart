import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/practice_repository.dart';

class TopicTestRunnerScreen extends ConsumerStatefulWidget {
  final String topicId;
  final int testNumber;
  final String? topicTitle;
  final String? subjectTitle;

  const TopicTestRunnerScreen({
    super.key,
    required this.topicId,
    required this.testNumber,
    this.topicTitle,
    this.subjectTitle,
  });

  @override
  ConsumerState<TopicTestRunnerScreen> createState() => _TopicTestRunnerScreenState();
}

class _TopicTestRunnerScreenState extends ConsumerState<TopicTestRunnerScreen> {
  List<PracticeQuestion> _questions = [];
  bool _isLoading = true;
  int _currentIndex = 0;
  final Map<int, String?> _answers = {}; // questionIndex -> 'A' | 'B' | 'C' | 'D' | null

  Timer? _timer;
  int _remainingSeconds = 600; // 10 minutes default
  final int _totalSeconds = 600;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final repo = ref.read(practiceRepositoryProvider);
    final qs = await repo.getQuestionsForTopicTest(widget.topicId, widget.testNumber, count: 10);
    if (mounted) {
      setState(() {
        _questions = qs;
        _isLoading = false;
        _remainingSeconds = qs.length * 60; // 1 min per question
      });
      _startTimer();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        _timer?.cancel();
        _submitTest(autoSubmit: true);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatTime(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    final mm = m < 10 ? '0$m' : '$m';
    final ss = s < 10 ? '0$s' : '$s';
    return '$mm:$ss';
  }

  void _selectOption(String opt) {
    setState(() {
      if (_answers[_currentIndex] == opt) {
        _answers[_currentIndex] = null; // Toggle unselect
      } else {
        _answers[_currentIndex] = opt;
      }
    });
  }

  Future<bool> _onWillPop() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Leave Practice?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: const Text(
          'আপনি কি অনুশীলন বন্ধ করতে চান? আপনার বর্তমান উত্তরগুলি সেভ হবে না।',
          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE11D48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Leave Test', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    return leave ?? false;
  }

  void _confirmSubmit() {
    int answeredCount = 0;
    for (int i = 0; i < _questions.length; i++) {
      if (_answers[i] != null) answeredCount++;
    }
    final unansweredCount = _questions.length - answeredCount;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Submit Test?',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'আপনি কি টেস্টটি সমাপ্ত করে সাবমিট করতে চান?',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildModalStat('মোট প্রশ্ন', '${_questions.length}', const Color(0xFF0F172A)),
                    Container(width: 1, height: 32, color: const Color(0xFFE2E8F0)),
                    _buildModalStat('উত্তর দেওয়া', '$answeredCount', const Color(0xFF16A34A)),
                    Container(width: 1, height: 32, color: const Color(0xFFE2E8F0)),
                    _buildModalStat('বাকি আছে', '$unansweredCount', const Color(0xFFE11D48)),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      child: const Text(
                        'Review Again',
                        style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _submitTest();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF026BFC),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text(
                        'Submit Test',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModalStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
      ],
    );
  }

  Future<void> _submitTest({bool autoSubmit = false}) async {
    _timer?.cancel();

    int correct = 0;
    int wrong = 0;
    int unattempted = 0;

    for (int i = 0; i < _questions.length; i++) {
      final selected = _answers[i];
      final correctOpt = _questions[i].correctOption.trim().toUpperCase();
      if (selected == null || selected.isEmpty) {
        unattempted++;
      } else if (selected.trim().toUpperCase() == correctOpt) {
        correct++;
      } else {
        wrong++;
      }
    }

    final double rawScore = (correct * 1.0) - (wrong * 0.25);
    final double finalScore = rawScore < 0 ? 0.0 : rawScore;
    final int attempted = correct + wrong;
    final int accuracy = attempted > 0 ? ((correct / attempted) * 100).round() : 0;
    final int timeSpent = (_totalSeconds - _remainingSeconds).clamp(1, _totalSeconds);

    final attemptId = 'att-prac-${DateTime.now().millisecondsSinceEpoch}';
    final result = PracticeAttemptResult(
      attemptId: attemptId,
      topicId: widget.topicId,
      testNumber: widget.testNumber,
      topicTitle: widget.topicTitle ?? 'অধ্যায় টেস্ট',
      subjectTitle: widget.subjectTitle ?? 'বিষয়ভিত্তিক প্র্যাকটিস',
      totalQuestions: _questions.length,
      correctCount: correct,
      wrongCount: wrong,
      unattemptedCount: unattempted,
      score: finalScore,
      totalMarks: _questions.length * 1.0,
      accuracy: accuracy,
      timeSpentSeconds: timeSpent,
      completedAt: DateTime.now(),
      userAnswers: _answers,
      questions: _questions,
    );

    final repo = ref.read(practiceRepositoryProvider);
    await repo.saveAttemptResult(result);

    if (mounted) {
      context.pushReplacement(
        '/practice/result/${widget.topicId}/${widget.testNumber}?attemptId=$attemptId&subjectTitle=${Uri.encodeComponent(widget.subjectTitle ?? '')}&topicTitle=${Uri.encodeComponent(widget.topicTitle ?? '')}',
      );
    }
  }

  void _openQuestionNavigator() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Question Navigator',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Legend
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLegendItem('Answered', const Color(0xFF16A34A), const Color(0xFFDCFCE7)),
                  const SizedBox(width: 14),
                  _buildLegendItem('Current', const Color(0xFF026BFC), const Color(0xFFDBEAFE)),
                  const SizedBox(width: 14),
                  _buildLegendItem('Not Answered', const Color(0xFF64748B), const Color(0xFFF1F5F9)),
                ],
              ),
              const SizedBox(height: 18),

              // Question Grid (1..10)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.2,
                ),
                itemCount: _questions.length,
                itemBuilder: (context, i) {
                  final isAnswered = _answers[i] != null;
                  final isCurrent = i == _currentIndex;

                  Color bg = const Color(0xFFF8FAFC);
                  Color text = const Color(0xFF475569);
                  Border border = Border.all(color: const Color(0xFFE2E8F0));

                  if (isCurrent) {
                    bg = const Color(0xFFDBEAFE);
                    text = const Color(0xFF026BFC);
                    border = Border.all(color: const Color(0xFF026BFC), width: 2);
                  } else if (isAnswered) {
                    bg = const Color(0xFFDCFCE7);
                    text = const Color(0xFF16A34A);
                    border = Border.all(color: const Color(0xFF86EFAC));
                  }

                  return InkWell(
                    onTap: () {
                      setState(() {
                        _currentIndex = i;
                      });
                      Navigator.pop(ctx);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(12),
                        border: border,
                      ),
                      child: Center(
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: text,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),

              // Submit Button in Navigator
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _confirmSubmit();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF026BFC),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Submit Test', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLegendItem(String label, Color dotColor, Color pillBg) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: dotColor,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF026BFC))),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice Test')),
        body: const Center(child: Text('কোনো প্রশ্ন পাওয়া যায়নি')),
      );
    }

    final currentQ = _questions[_currentIndex];
    final selectedOption = _answers[_currentIndex];
    final isTimerLow = _remainingSeconds < 120; // less than 2 mins

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldLeave = await _onWillPop();
        if (shouldLeave && context.mounted) {
          context.pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 1,
          leading: IconButton(
            icon: const Icon(Icons.close_rounded, color: Color(0xFF0F172A), size: 24),
            onPressed: () async {
              final shouldLeave = await _onWillPop();
              if (shouldLeave && context.mounted) context.pop();
            },
          ),
          title: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isTimerLow ? const Color(0xFFFFE4E6) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 16,
                  color: isTimerLow ? const Color(0xFFE11D48) : const Color(0xFF026BFC),
                ),
                const SizedBox(width: 5),
                Text(
                  _formatTime(_remainingSeconds),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: isTimerLow ? const Color(0xFFE11D48) : const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
          centerTitle: true,
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: TextButton(
                onPressed: _confirmSubmit,
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFF026BFC),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                ),
                child: const Text(
                  'Submit',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              // Progress Bar
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Question ${_currentIndex + 1} of ${_questions.length}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '${(((_currentIndex + 1) / _questions.length) * 100).toInt()}% Done',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF026BFC),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (_currentIndex + 1) / _questions.length,
                        minHeight: 5,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF026BFC)),
                      ),
                    ),
                  ],
                ),
              ),

              // Question & Options Area
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Question Box
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
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'Q${_currentIndex + 1}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF026BFC),
                                  ),
                                ),
                              ),
                              const Spacer(),
                              const Text(
                                '+1.0 / -0.25',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            currentQ.questionBengali,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                              height: 1.45,
                            ),
                          ),
                          if (currentQ.questionEnglish != null &&
                              currentQ.questionEnglish != currentQ.questionBengali) ...[
                            const SizedBox(height: 8),
                            Text(
                              currentQ.questionEnglish!,
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

                    // Options List (A, B, C, D)
                    _buildOptionCard('A', currentQ.optionA, selectedOption == 'A'),
                    const SizedBox(height: 10),
                    _buildOptionCard('B', currentQ.optionB, selectedOption == 'B'),
                    const SizedBox(height: 10),
                    _buildOptionCard('C', currentQ.optionC, selectedOption == 'C'),
                    const SizedBox(height: 10),
                    _buildOptionCard('D', currentQ.optionD, selectedOption == 'D'),

                    const SizedBox(height: 20),
                  ],
                ),
              ),

              // Bottom Bar: Previous | Navigator Grid | Next/Submit
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
                    // Previous Button
                    OutlinedButton(
                      onPressed: _currentIndex > 0
                          ? () {
                              setState(() {
                                _currentIndex--;
                              });
                            }
                          : null,
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                        side: BorderSide(
                          color: _currentIndex > 0 ? const Color(0xFFCBD5E1) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.arrow_back_rounded, size: 16),
                          SizedBox(width: 4),
                          Text('Prev', style: TextStyle(fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Question Navigator Icon Button
                    InkWell(
                      onTap: _openQuestionNavigator,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.grid_view_rounded, color: Color(0xFF334155), size: 20),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Next / Submit Button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          if (_currentIndex < _questions.length - 1) {
                            setState(() {
                              _currentIndex++;
                            });
                          } else {
                            _confirmSubmit();
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF026BFC),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _currentIndex < _questions.length - 1 ? 'Next →' : 'Submit Test ✓',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
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
      ),
    );
  }

  Widget _buildOptionCard(String label, String text, bool isSelected) {
    return InkWell(
      onTap: () => _selectOption(label),
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.8 : 1.0,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: const Color(0xFF026BFC).withValues(alpha: 0.12),
                blurRadius: 8,
                offset: const Offset(0, 2),
              )
            else
              const BoxShadow(
                color: Color(0x03000000),
                blurRadius: 4,
                offset: Offset(0, 1),
              ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Option Letter Pill
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: isSelected ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Option Text
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? const Color(0xFF0F172A) : const Color(0xFF334155),
                  height: 1.35,
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Check Icon
            if (isSelected)
              const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF026BFC),
                size: 20,
              )
            else
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
