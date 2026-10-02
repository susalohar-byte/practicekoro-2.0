import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/catalog_repository.dart';

class TopicScreen extends ConsumerStatefulWidget {
  final String subjectId;

  const TopicScreen({super.key, required this.subjectId});

  @override
  ConsumerState<TopicScreen> createState() => _TopicScreenState();
}

class _TopicScreenState extends ConsumerState<TopicScreen> {
  String _subjectTitle = 'Subject Practice';
  List<ChapterModel> _topics = [];
  final Set<String> _expandedTopics = {};
  final Map<String, List<MockTestModel>> _testsByTopic = {};
  final Set<String> _loadingTopics = {};
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTopics();
  }

  Future<void> _loadTopics() async {
    try {
      final repository = ref.read(catalogRepositoryProvider);
      final subjects = await repository.getSubjects(
        examId: LocalStorageService.getTargetExam(),
      );
      final matchingSubjects = subjects.where(
        (item) => item.id == widget.subjectId,
      );
      final subject = matchingSubjects.isEmpty ? null : matchingSubjects.first;
      final topics = await repository.getChaptersForSubject(widget.subjectId);
      if (!mounted) return;
      setState(() {
        _subjectTitle = subject?.name ?? widget.subjectId.replaceAll('-', ' ');
        _topics = topics;
        _isLoading = false;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleTopic(ChapterModel topic) async {
    if (_expandedTopics.remove(topic.id)) {
      setState(() {});
      return;
    }
    setState(() => _expandedTopics.add(topic.id));
    if (_testsByTopic.containsKey(topic.id)) return;
    setState(() => _loadingTopics.add(topic.id));
    try {
      final tests = await ref
          .read(catalogRepositoryProvider)
          .getPracticeTests(subjectId: widget.subjectId, chapterId: topic.id);
      if (mounted) setState(() => _testsByTopic[topic.id] = tests);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loadingTopics.remove(topic.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _subjectTitle,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.navy,
              ),
            ),
            const Text(
              'Choose a topic to practice',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _error != null
          ? _emptyState(
              'Could not load topics. Check your connection and try again.',
              onRetry: _loadTopics,
            )
          : _topics.isEmpty
          ? _emptyState('No active topics are set up for this subject yet.')
          : ListView(
              padding: PKBottomSpacing.safeAreaEdgeInsets(context, horizontal: 16, top: 18),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFEAF2FF), Colors.white],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFD9E7FD)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.menu_book_rounded,
                        color: AppColors.primary,
                        size: 26,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${_topics.length} active topics from your exam syllabus',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.navy,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ..._topics.map(_buildTopicCard),
              ],
            ),
    );
  }

  Widget _buildTopicCard(ChapterModel topic) {
    final expanded = _expandedTopics.contains(topic.id);
    final tests = _testsByTopic[topic.id] ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _toggleTopic(topic),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.topic_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          topic.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          topic.description?.trim().isNotEmpty == true
                              ? topic.description!
                              : 'Topic-wise practice tests',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_loadingTopics.contains(topic.id))
                    const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  else
                    Icon(
                      expanded
                          ? Icons.expand_less_rounded
                          : Icons.chevron_right_rounded,
                      color: AppColors.textMuted,
                    ),
                ],
              ),
            ),
          ),
          if (expanded) ...[
            const Divider(height: 1),
            if (_loadingTopics.contains(topic.id))
              const Padding(
                padding: EdgeInsets.all(16),
                child: LinearProgressIndicator(),
              )
            else if (tests.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'No published practice tests for this topic yet.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              )
            else
              ...tests.map(_buildTestRow),
          ],
        ],
      ),
    );
  }

  Widget _buildTestRow(MockTestModel test) {
    return ListTile(
      dense: true,
      leading: const Icon(
        Icons.quiz_outlined,
        color: AppColors.primary,
        size: 20,
      ),
      title: Text(
        test.title,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.navy,
        ),
      ),
      subtitle: Text(
        '${test.totalQuestions} questions · ${test.durationMinutes} min',
        style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
      ),
      trailing: const Icon(
        Icons.arrow_forward_ios_rounded,
        size: 14,
        color: AppColors.primary,
      ),
      onTap: () {
        final title = Uri.encodeComponent(test.title);
        context.push(
          '/test-details/${test.id}?title=$title&isPro=${test.isPremium}',
        );
      },
    );
  }

  Widget _emptyState(String message, {VoidCallback? onRetry}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.library_books_outlined,
              color: AppColors.textMuted,
              size: 44,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 14),
              OutlinedButton(
                onPressed: onRetry,
                child: const Text('Try again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
