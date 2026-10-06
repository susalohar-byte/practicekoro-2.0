import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/repositories/practice_repository.dart';

class TopicReviewQuestionsScreen extends ConsumerStatefulWidget {
  final String topicId;
  final int testNumber;
  final String? attemptId;
  final String? topicTitle;
  final String? subjectTitle;

  const TopicReviewQuestionsScreen({
    super.key,
    required this.topicId,
    required this.testNumber,
    this.attemptId,
    this.topicTitle,
    this.subjectTitle,
  });

  @override
  ConsumerState<TopicReviewQuestionsScreen> createState() =>
      _TopicReviewQuestionsScreenState();
}

class _TopicReviewQuestionsScreenState
    extends ConsumerState<TopicReviewQuestionsScreen> {
  PracticeAttemptResult? _result;
  bool _isLoading = true;
  String _selectedFilter = 'all'; // 'all', 'correct', 'wrong', 'unattempted'

  @override
  void initState() {
    super.initState();
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
    if (res == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Review Questions')),
        body: const Center(child: Text('রিভিউ করার মতো কোনো তথ্য পাওয়া যায়নি')),
      );
    }

    // Filter questions based on filter chip
    final filteredQuestions = res.questions.asMap().entries.where((entry) {
      final index = entry.key;
      final q = entry.value;
      final selected = res.userAnswers[index];
      final isCorrect = selected != null &&
          selected.trim().toUpperCase() == q.correctOption.trim().toUpperCase();
      final isUnattempted = selected == null || selected.isEmpty;
      final isWrong = !isUnattempted && !isCorrect;

      if (_selectedFilter == 'correct') return isCorrect;
      if (_selectedFilter == 'wrong') return isWrong;
      if (_selectedFilter == 'unattempted') return isUnattempted;
      return true;
    }).toList();

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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Review: ${res.topicTitle} — Test ${widget.testNumber}',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              'Score: ${res.score.toStringAsFixed(1)}/${res.totalMarks.toInt()} • Accuracy: ${res.accuracy}%',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: PKBottomSpacing.edgeInsets(
          context,
          horizontal: 16,
          top: 14,
        ),
        children: [
          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('all', 'All (${res.totalQuestions})'),
                const SizedBox(width: 8),
                _buildFilterChip('correct', 'Correct (${res.correctCount})',
                    color: const Color(0xFF16A34A)),
                const SizedBox(width: 8),
                _buildFilterChip('wrong', 'Wrong (${res.wrongCount})',
                    color: const Color(0xFFE11D48)),
                const SizedBox(width: 8),
                _buildFilterChip('unattempted',
                    'Unattempted (${res.unattemptedCount})',
                    color: const Color(0xFF64748B)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Question Items
          if (filteredQuestions.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text(
                  'এই ফিল্টারে কোনো প্রশ্ন নেই',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                ),
              ),
            )
          else
            ...filteredQuestions.map((entry) {
              final originalIndex = entry.key;
              final q = entry.value;
              final selected = res.userAnswers[originalIndex];
              final isCorrect = selected != null &&
                  selected.trim().toUpperCase() ==
                      q.correctOption.trim().toUpperCase();
              final isUnattempted = selected == null || selected.isEmpty;

              Color badgeBg = const Color(0xFFF1F5F9);
              Color badgeColor = const Color(0xFF64748B);
              String badgeText = 'Skipped';
              IconData badgeIcon = Icons.remove_circle_outline_rounded;

              if (isCorrect) {
                badgeBg = const Color(0xFFDCFCE7);
                badgeColor = const Color(0xFF16A34A);
                badgeText = 'Correct ✓';
                badgeIcon = Icons.check_circle_rounded;
              } else if (!isUnattempted) {
                badgeBg = const Color(0xFFFFE4E6);
                badgeColor = const Color(0xFFE11D48);
                badgeText = 'Wrong ✕';
                badgeIcon = Icons.cancel_rounded;
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  onTap: () {
                    context.push(
                      '/practice/review/${widget.topicId}/${widget.testNumber}/question/$originalIndex?attemptId=${res.attemptId}&subjectTitle=${Uri.encodeComponent(res.subjectTitle)}&topicTitle=${Uri.encodeComponent(res.topicTitle)}',
                    );
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x04000000),
                          blurRadius: 6,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Question Number Pill
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              '${originalIndex + 1}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Question Snippet
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                q.questionBengali,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                  height: 1.35,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  // Status Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: badgeBg,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(badgeIcon,
                                            size: 12, color: badgeColor),
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
                                  const SizedBox(width: 8),
                                  if (selected != null) ...[
                                    Text(
                                      'Your: $selected • Ans: ${q.correctOption}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                  ] else ...[
                                    Text(
                                      'Ans: ${q.correctOption}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Arrow Icon
                        const Padding(
                          padding: EdgeInsets.only(top: 6),
                          child: Icon(
                            Icons.arrow_forward_ios_rounded,
                            color: Color(0xFF94A3B8),
                            size: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label, {Color? color}) {
    final isSelected = _selectedFilter == key;
    final primary = color ?? const Color(0xFF026BFC);

    return InkWell(
      onTap: () {
        setState(() {
          _selectedFilter = key;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? primary : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1.0,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: primary.withValues(alpha: 0.2),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }
}
