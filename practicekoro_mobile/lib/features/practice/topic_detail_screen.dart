import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/repositories/practice_repository.dart';

class TopicDetailScreen extends ConsumerStatefulWidget {
  final String topicId;
  final String? subjectTitle;
  final String? topicTitle;
  final int totalQuestions;

  const TopicDetailScreen({
    super.key,
    required this.topicId,
    this.subjectTitle,
    this.topicTitle,
    this.totalQuestions = 50,
  });

  @override
  ConsumerState<TopicDetailScreen> createState() => _TopicDetailScreenState();
}

class _TopicDetailScreenState extends ConsumerState<TopicDetailScreen> {
  PracticeTopic? _topic;
  List<PracticeTopicTest> _tests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTopicAndTests();
  }

  Future<void> _loadTopicAndTests() async {
    final repo = ref.read(practiceRepositoryProvider);
    final t = await repo.getTopicById(widget.topicId);
    final count = widget.totalQuestions > 0 ? widget.totalQuestions : (t?.questionCount ?? 50);
    final testsList = await repo.getTestsForTopic(widget.topicId, totalQuestions: count);

    if (mounted) {
      setState(() {
        _topic = t;
        _tests = testsList;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayTopicTitle = widget.topicTitle ?? _topic?.nameBengali ?? 'অধ্যায় টেস্ট';
    final displaySubjectTitle = widget.subjectTitle ?? 'বিষয়ভিত্তিক প্র্যাকটিস';
    final totalQ = widget.totalQuestions > 0 ? widget.totalQuestions : (_topic?.questionCount ?? 50);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 20),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              displayTopicTitle,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              '$totalQ Questions • $displaySubjectTitle',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF026BFC)),
            )
          : RefreshIndicator(
              color: const Color(0xFF026BFC),
              onRefresh: _loadTopicAndTests,
              child: ListView(
                padding: PKBottomSpacing.edgeInsets(
                  context,
                  horizontal: 16,
                  top: 14,
                ),
                children: [
                  // Nimo Thumbs Up Banner
                  _buildNimoBanner(),
                  const SizedBox(height: 18),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Tests (মক টেস্টসমূহ)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${_tests.length} টি টেস্ট উপলব্ধ',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF026BFC),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Dynamic Tests List
                  ..._tests.map((test) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _buildTestCard(test, displayTopicTitle, displaySubjectTitle),
                      )),

                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildNimoBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A), Color(0xFFFEF9C3)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFCD34D), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.85),
              shape: BoxShape.circle,
              boxShadow: const [
                BoxShadow(
                  color: Color(0x10000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/nimo_thumbs_up.png',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Center(
                  child: Text('🦁', style: TextStyle(fontSize: 32)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'চলো প্র্যাকটিস করি! 💪',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF92400E),
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'One step at a time! প্রতি টেস্টে ১০টি করে প্রশ্ন সমাধান করে নিজের স্কোর যাচাই করো।',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF78350F),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTestCard(PracticeTopicTest test, String topicTitle, String subjectTitle) {
    final isCompleted = test.status == 'completed';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCompleted ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
          width: isCompleted ? 1.4 : 1.0,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Test Title & Access Tier (Free vs Paid)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      test.title,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (isCompleted && test.score != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${test.score!.toStringAsFixed(1)}/${test.totalMarks.toInt()} • ${test.accuracy ?? 0}%',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF16A34A),
                        ),
                      ),
                    ),
                  ],
                ],
              ),

              // Access Badge: Free vs Paid (Strictly Free / Paid, no Pro/Premium)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: test.isPaid ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (test.isPaid) ...[
                      const Icon(Icons.lock_rounded, size: 11, color: Color(0xFFD97706)),
                      const SizedBox(width: 3),
                    ],
                    Text(
                      test.isPaid ? 'Paid' : 'Free',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: test.isPaid ? const Color(0xFFB45309) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Meta Info: 10 Questions • 10 Marks • 10 Minutes
          Wrap(
            spacing: 8,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.help_outline_rounded, size: 14, color: Color(0xFF64748B)),
                  const SizedBox(width: 4),
                  Text(
                    '${test.questionCount} Questions',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                  ),
                ],
              ),
              const Text('•', style: TextStyle(color: Color(0xFFCBD5E1))),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.military_tech_outlined, size: 14, color: Color(0xFF64748B)),
                  const SizedBox(width: 4),
                  Text(
                    '${test.totalMarks.toInt()} Marks',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                  ),
                ],
              ),
              const Text('•', style: TextStyle(color: Color(0xFFCBD5E1))),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.timer_outlined, size: 14, color: Color(0xFF64748B)),
                  const SizedBox(width: 4),
                  Text(
                    '${test.durationMinutes} Mins',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Bottom Action Row
          if (isCompleted) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _startTest(test, topicTitle, subjectTitle);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0F172A),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: const Text('Retake 🔄', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      context.push(
                        '/practice/review/${test.topicId}/${test.testNumber}?subjectTitle=${Uri.encodeComponent(subjectTitle)}&topicTitle=${Uri.encodeComponent(topicTitle)}',
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: const Text('Review →', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
                ),
              ],
            ),
          ] else ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (test.isPaid) {
                    _showSubscriptionPrompt();
                  } else {
                    _startTest(test, topicTitle, subjectTitle);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: test.isPaid ? const Color(0xFFF59E0B) : const Color(0xFF026BFC),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 11),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      test.isPaid ? 'Unlock & Start Test 🔒' : 'Start Test →',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _startTest(PracticeTopicTest test, String topicTitle, String subjectTitle) {
    context.push(
      '/practice/test-start/${test.topicId}/${test.testNumber}?subjectTitle=${Uri.encodeComponent(subjectTitle)}&topicTitle=${Uri.encodeComponent(topicTitle)}',
    );
  }

  void _showSubscriptionPrompt() {
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
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_rounded, color: Color(0xFFD97706), size: 32),
              ),
              const SizedBox(height: 14),
              const Text(
                'Paid Practice Test',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'এই টেস্টটি আনলক করতে অল-এক্সেস পাস সাবস্ক্রিপশন নিন। সকল বিষয়ে আনলিমিটেড মক টেস্ট ও বিস্তারিত সমাধান পান।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.push('/subscription');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF026BFC),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                  ),
                  child: const Text(
                    'View Plans & Subscribe',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text(
                  'Maybe Later',
                  style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
