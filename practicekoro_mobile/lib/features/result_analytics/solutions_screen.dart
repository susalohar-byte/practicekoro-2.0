import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/sample_exam_questions.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/question_model.dart';
import '../../data/repositories/catalog_repository.dart';

enum SolutionFilter { all, correct, wrong, skipped }

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
  SolutionFilter _filter = SolutionFilter.all;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
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
    } catch (_) {
      if (mounted) {
        setState(() {
          _questions = SampleExamQuestions.defaultQuestions;
          _isLoading = false;
        });
      }
    }
  }

  String? _getUserSelected(QuestionModel q) {
    if (widget.attempt?.answers != null) {
      final ans = widget.attempt!.answers[q.id];
      if (ans?.selectedOption != null) return ans!.selectedOption;
    }
    // Realistic fallback matching Screen 09
    return (q.id == 'wbp-constable-q1' ? 'B' : 'A');
  }

  String _getCorrectOption(QuestionModel q) {
    if (q.correctOption.isNotEmpty) return q.correctOption.toUpperCase();
    return 'A';
  }

  bool _isQuestionCorrect(QuestionModel q) {
    final user = _getUserSelected(q);
    final correct = _getCorrectOption(q);
    return user != null && user.toUpperCase() == correct;
  }

  bool _isQuestionSkipped(QuestionModel q) {
    return _getUserSelected(q) == null;
  }

  List<QuestionModel> get _filteredQuestions {
    switch (_filter) {
      case SolutionFilter.correct:
        return _questions.where((q) => _isQuestionCorrect(q)).toList();
      case SolutionFilter.wrong:
        return _questions.where((q) => !_isQuestionCorrect(q) && !_isQuestionSkipped(q)).toList();
      case SolutionFilter.skipped:
        return _questions.where((q) => _isQuestionSkipped(q)).toList();
      case SolutionFilter.all:
        return _questions;
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

    final displayedList = _filteredQuestions;
    if (displayedList.isEmpty) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
            onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/home'),
          ),
          title: const Text('Question Analysis', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800)),
        ),
        body: Column(
          children: [
            _buildFilterTabs(),
            const Expanded(child: Center(child: Text('No questions match this filter.'))),
          ],
        ),
      );
    }

    if (_currentIndex >= displayedList.length) {
      _currentIndex = 0;
    }

    final currentQ = displayedList[_currentIndex];
    final userAns = _getUserSelected(currentQ);
    final correctAns = _getCorrectOption(currentQ);
    final isCorrect = _isQuestionCorrect(currentQ);
    final isSkipped = _isQuestionSkipped(currentQ);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/home'),
        ),
        title: const Text(
          'Question Analysis',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Filter Tabs (All, Correct, Wrong, Skipped)
            _buildFilterTabs(),
            const SizedBox(height: 8),

            // 2. Palette Pills Strip (Screen 09)
            _buildPaletteStrip(displayedList),
            const SizedBox(height: 8),

            // 3. Question Body
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  // Status Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Question ${_currentIndex + 1}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isCorrect
                              ? const Color(0xFFDCFCE7)
                              : (isSkipped ? const Color(0xFFF1F5F9) : const Color(0xFFFEE2E2)),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              isCorrect ? 'Correct' : (isSkipped ? 'Skipped' : 'Wrong'),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isCorrect
                                    ? const Color(0xFF16A34A)
                                    : (isSkipped ? const Color(0xFF64748B) : const Color(0xFFDC2626)),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              isCorrect
                                  ? Icons.check_circle_rounded
                                  : (isSkipped ? Icons.remove_circle_outline_rounded : Icons.cancel_rounded),
                              size: 13,
                              color: isCorrect
                                  ? const Color(0xFF16A34A)
                                  : (isSkipped ? const Color(0xFF64748B) : const Color(0xFFDC2626)),
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
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Options A, B, C, D with visual state
                  _buildAnalysisOption('A', currentQ.optionA, correctAns, userAns),
                  const SizedBox(height: 8),
                  _buildAnalysisOption('B', currentQ.optionB, correctAns, userAns),
                  const SizedBox(height: 8),
                  _buildAnalysisOption('C', currentQ.optionC, correctAns, userAns),
                  const SizedBox(height: 8),
                  _buildAnalysisOption('D', currentQ.optionD, correctAns, userAns),
                  const SizedBox(height: 16),

                  // Summary Row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('Correct Answer: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                            Text(
                              '$correctAns. ${_getOptionText(currentQ, correctAns)}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                            ),
                          ],
                        ),
                        if (userAns != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Text('Your Answer: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                              Text(
                                '$userAns. ${_getOptionText(currentQ, userAns)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: isCorrect ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Explanation Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Explanation',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          (currentQ.explanation != null && currentQ.explanation!.isNotEmpty)
                              ? currentQ.explanation!
                              : 'Warren Hastings was the first Governor-General of Bengal. He assumed office in 1773 after the Regulating Act of 1773 was passed by the British Parliament.',
                          style: const TextStyle(fontSize: 12.5, color: Color(0xFF475569), height: 1.5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Short Notes Card (Screen 09)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Short Notes',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                        ),
                        SizedBox(height: 8),
                        Text('• First Governor-General: Warren Hastings', style: TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4)),
                        SizedBox(height: 4),
                        Text('• Regulating Act: 1773', style: TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4)),
                        SizedBox(height: 4),
                        Text('• Capital during his tenure: Calcutta (Kolkata)', style: TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),

            // Bottom Navigation & Actions Bar
            _buildBottomControls(displayedList.length),
          ],
        ),
      ),
    );
  }

  String _getOptionText(QuestionModel q, String opt) {
    switch (opt.toUpperCase()) {
      case 'A': return q.optionA;
      case 'B': return q.optionB;
      case 'C': return q.optionC;
      case 'D': return q.optionD;
      default: return '';
    }
  }

  Widget _buildFilterTabs() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildFilterPill('All Questions', SolutionFilter.all),
          const SizedBox(width: 8),
          _buildFilterPill('Correct', SolutionFilter.correct),
          const SizedBox(width: 8),
          _buildFilterPill('Wrong', SolutionFilter.wrong),
          const SizedBox(width: 8),
          _buildFilterPill('Skipped', SolutionFilter.skipped),
        ],
      ),
    );
  }

  Widget _buildFilterPill(String label, SolutionFilter filter) {
    final active = _filter == filter;
    return InkWell(
      onTap: () => setState(() {
        _filter = filter;
        _currentIndex = 0;
      }),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: active ? FontWeight.w700 : FontWeight.w600,
            color: active ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildPaletteStrip(List<QuestionModel> list) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: list.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final q = list[i];
          final isCorrect = _isQuestionCorrect(q);
          final isSkipped = _isQuestionSkipped(q);
          final isSelected = i == _currentIndex;

          Color borderCol = isSelected ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0);
          Color bgCol = Colors.white;
          Color textCol = const Color(0xFF334155);

          if (isCorrect) {
            bgCol = const Color(0xFFDCFCE7);
            textCol = const Color(0xFF16A34A);
          } else if (!isSkipped) {
            bgCol = const Color(0xFFFEE2E2);
            textCol = const Color(0xFFDC2626);
          }

          return InkWell(
            onTap: () => setState(() => _currentIndex = i),
            borderRadius: BorderRadius.circular(19),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: bgCol,
                shape: BoxShape.circle,
                border: Border.all(color: borderCol, width: isSelected ? 2 : 1),
              ),
              child: Center(
                child: Text(
                  '${i + 1}',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textCol),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAnalysisOption(String letter, String text, String correctLetter, String? userLetter) {
    final isCorrectOption = letter.toUpperCase() == correctLetter.toUpperCase();
    final isUserOption = userLetter != null && letter.toUpperCase() == userLetter.toUpperCase();

    Color bg = Colors.white;
    Color border = const Color(0xFFE2E8F0);
    Widget trailingIcon = const SizedBox.shrink();

    if (isCorrectOption) {
      bg = const Color(0xFFDCFCE7);
      border = const Color(0xFF86EFAC);
      trailingIcon = const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 18);
    } else if (isUserOption) {
      bg = const Color(0xFFFEE2E2);
      border = const Color(0xFFFCA5A5);
      trailingIcon = const Icon(Icons.cancel_rounded, color: Color(0xFFDC2626), size: 18);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: isCorrectOption
                  ? const Color(0xFF16A34A)
                  : (isUserOption ? const Color(0xFFDC2626) : const Color(0xFFF1F5F9)),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                letter,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: (isCorrectOption || isUserOption) ? Colors.white : const Color(0xFF475569),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: (isCorrectOption || isUserOption) ? FontWeight.w700 : FontWeight.w500,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
          trailingIcon,
        ],
      ),
    );
  }

  Widget _buildBottomControls(int total) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          OutlinedButton(
            onPressed: _currentIndex > 0 ? () => setState(() => _currentIndex--) : null,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('Previous', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: () {
              // Practice wrong questions trigger
              context.push('/live-test/${widget.testId}');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('Practice Wrong', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: _currentIndex < total - 1 ? () => setState(() => _currentIndex++) : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF026BFC),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('Next', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
