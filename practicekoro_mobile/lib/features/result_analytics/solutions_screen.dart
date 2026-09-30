import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_badge.dart';
import '../../core/widgets/pk_card.dart';
import '../../data/datasources/local_storage.dart';
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
  String? _loadError;
  String _filter = 'all'; // 'all', 'correct', 'wrong', 'skipped'
  bool _preferBengali = false;

  @override
  void initState() {
    super.initState();
    _preferBengali = LocalStorageService.getLanguagePreference();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final catalog = ref.read(catalogRepositoryProvider);
    try {
      final attemptId = widget.attempt?.id;
      final questions = attemptId == null
          ? <QuestionModel>[]
          : await catalog.getAttemptSolutions(attemptId);
      if (mounted) {
        setState(() {
          _questions = questions;
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
    final answers = widget.attempt?.answers ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Question Solutions & Explanations',
          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.navy),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _loadError != null
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Could not load solutions. Check your connection and try again.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : Column(
              children: [
                // Filter Tabs
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  color: Colors.white,
                  child: Row(
                    children: [
                      _buildFilterChip('All (${_questions.length})', 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        'Correct (${widget.attempt?.correctCount ?? 0})',
                        'correct',
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        'Incorrect (${widget.attempt?.wrongCount ?? 0})',
                        'wrong',
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        'Skipped (${widget.attempt?.skippedCount ?? 0})',
                        'skipped',
                      ),
                    ],
                  ),
                ),

                const Divider(height: 1, color: AppColors.border),

                // Question Solutions List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _questions.length,
                    itemBuilder: (context, index) {
                      final q = _questions[index];
                      final ans = answers[q.id];
                      final selected = ans?.selectedOption ?? q.selectedOption;
                      final isCorrect =
                          selected != null &&
                          (q.isCorrect ??
                              selected.toUpperCase() ==
                                  q.correctOption.toUpperCase());
                      final isSkipped = selected == null;

                      // Filter logic
                      if (_filter == 'correct' && !isCorrect) {
                        return const SizedBox.shrink();
                      }
                      if (_filter == 'wrong' && (isCorrect || isSkipped)) {
                        return const SizedBox.shrink();
                      }
                      if (_filter == 'skipped' && !isSkipped) {
                        return const SizedBox.shrink();
                      }

                      final isBookmarked = LocalStorageService.isBookmarked(
                        q.id,
                      );

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: PKCard(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header
                              Row(
                                children: [
                                  Text(
                                    'Question ${index + 1}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: AppColors.navy,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (isSkipped)
                                    const PKBadge(
                                      label: 'Skipped',
                                      variant: PKBadgeVariant.neutral,
                                      isSmall: true,
                                    )
                                  else if (isCorrect)
                                    const PKBadge(
                                      label: 'Correct',
                                      variant: PKBadgeVariant.success,
                                      isSmall: true,
                                    )
                                  else
                                    const PKBadge(
                                      label: 'Incorrect',
                                      variant: PKBadgeVariant.error,
                                      isSmall: true,
                                    ),
                                  const Spacer(),
                                  IconButton(
                                    icon: Icon(
                                      isBookmarked
                                          ? Icons.bookmark
                                          : Icons.bookmark_border_rounded,
                                      color: isBookmarked
                                          ? AppColors.warning
                                          : AppColors.textMuted,
                                      size: 20,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        LocalStorageService.toggleBookmark(
                                          q.id,
                                        );
                                      });
                                    },
                                  ),
                                ],
                              ),

                              const SizedBox(height: 8),

                              // Question Text
                              Text(
                                q.getLocalizedQuestion(_preferBengali),
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),

                              const SizedBox(height: 12),

                              // Option items
                              _buildSolutionOption(
                                'A',
                                q.optionA,
                                q.correctOption == 'A',
                                selected == 'A',
                              ),
                              _buildSolutionOption(
                                'B',
                                q.optionB,
                                q.correctOption == 'B',
                                selected == 'B',
                              ),
                              _buildSolutionOption(
                                'C',
                                q.optionC,
                                q.correctOption == 'C',
                                selected == 'C',
                              ),
                              _buildSolutionOption(
                                'D',
                                q.optionD,
                                q.correctOption == 'D',
                                selected == 'D',
                              ),

                              const SizedBox(height: 12),

                              // Explanation Box
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.blueLight,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppColors.blueSoft),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.menu_book_rounded,
                                          size: 16,
                                          color: AppColors.primary,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          LocalStorageService.isBilingualEnabled()
                                              ? 'Explanation:'
                                              : 'শর্ট নোটস:',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.navy,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      q.getLocalizedExplanation(
                                            _preferBengali,
                                          ) ??
                                          (!LocalStorageService.isBilingualEnabled()
                                              ? 'এই প্রশ্নের জন্য কোনো শর্ট নোটস উপলব্ধ নেই।'
                                              : 'No additional explanation provided for this question.'),
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textPrimary,
                                        height: 1.45,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return InkWell(
      onTap: () => setState(() => _filter = value),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.blueLight,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildSolutionOption(
    String key,
    String text,
    bool isCorrect,
    bool isSelectedByUser,
  ) {
    Color bg = Colors.white;
    Color border = AppColors.border;
    Color textColor = AppColors.textPrimary;
    Widget? trailing;

    if (isCorrect) {
      bg = AppColors.successLight;
      border = AppColors.success;
      textColor = AppColors.success;
      trailing = const Icon(
        Icons.check_circle,
        color: AppColors.success,
        size: 18,
      );
    } else if (isSelectedByUser) {
      bg = AppColors.errorLight;
      border = AppColors.error;
      textColor = AppColors.error;
      trailing = const Icon(Icons.cancel, color: AppColors.error, size: 18);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isCorrect
                  ? AppColors.success
                  : (isSelectedByUser
                        ? AppColors.error
                        : AppColors.borderSubtle),
              shape: BoxShape.circle,
            ),
            child: Text(
              key,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: (isCorrect || isSelectedByUser)
                    ? Colors.white
                    : AppColors.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isCorrect ? FontWeight.bold : FontWeight.normal,
                color: textColor,
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}
