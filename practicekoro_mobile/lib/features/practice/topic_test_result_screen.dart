import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/practice_repository.dart';

class TopicTestResultScreen extends ConsumerStatefulWidget {
  final String topicId;
  final int testNumber;
  final String? attemptId;
  final String? topicTitle;
  final String? subjectTitle;

  const TopicTestResultScreen({
    super.key,
    required this.topicId,
    required this.testNumber,
    this.attemptId,
    this.topicTitle,
    this.subjectTitle,
  });

  @override
  ConsumerState<TopicTestResultScreen> createState() => _TopicTestResultScreenState();
}

class _TopicTestResultScreenState extends ConsumerState<TopicTestResultScreen> {
  PracticeAttemptResult? _result;
  bool _isLoading = true;

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

  String _formatTime(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    final mm = m < 10 ? '0$m' : '$m';
    final ss = s < 10 ? '0$s' : '$s';
    return '$mm:$ss';
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
        appBar: AppBar(title: const Text('Test Result')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('ফলাফল পাওয়া যায়নি', style: TextStyle(fontSize: 16)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.pop(),
                child: const Text('Back to Topic'),
              ),
            ],
          ),
        ),
      );
    }

    final isHigh = res.accuracy >= 70;
    final headline = isHigh ? 'Well Done! 🌟' : 'Great Effort! 🎉';
    final motivationalSub = isHigh
        ? 'চমৎকার পারফরম্যান্স! আপনি বিষয়টিতে দারুণ দখল তৈরি করছেন।'
        : 'নিয়মিত অনুশীলনের মাধ্যমে আপনার স্কোর আরও উন্নত হবে!';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 20),
          onPressed: () {
            context.pushReplacement('/practice/topic/${widget.topicId}');
          },
        ),
        title: Text(
          '${res.topicTitle} — Test ${widget.testNumber}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                children: [
                  // Nimo Celebrating Hero Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A), Color(0xFFFEF9C3)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFFCD34D), width: 1.2),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0C000000),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            shape: BoxShape.circle,
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x10000000),
                                blurRadius: 10,
                                offset: Offset(0, 3),
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/images/nimo_celebrating.png',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) => const Center(
                                child: Text('🦁', style: TextStyle(fontSize: 44)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          headline,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF92400E),
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Test Completed! ✓',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          motivationalSub,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF78350F),
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Score & Accuracy Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x06000000),
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            // Circular Accuracy
                            Column(
                              children: [
                                Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    SizedBox(
                                      width: 76,
                                      height: 76,
                                      child: CircularProgressIndicator(
                                        value: (res.accuracy / 100.0).clamp(0.0, 1.0),
                                        strokeWidth: 8,
                                        backgroundColor: const Color(0xFFF1F5F9),
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          isHigh ? const Color(0xFF16A34A) : const Color(0xFF026BFC),
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '${res.accuracy}%',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Accuracy',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),

                            // Score & Time
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${res.score.toStringAsFixed(1)} / ${res.totalMarks.toInt()}',
                                  style: const TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF026BFC),
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const Text(
                                  'Total Marks Scored',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.timer_outlined, size: 14, color: Color(0xFF94A3B8)),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Time: ${_formatTime(res.timeSpentSeconds)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF334155),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Quick Stats Breakdown (Correct, Incorrect, Unattempted)
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatBox(
                          label: 'সঠিক (Correct)',
                          value: '${res.correctCount}',
                          color: const Color(0xFF16A34A),
                          bg: const Color(0xFFDCFCE7),
                          icon: Icons.check_circle_rounded,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatBox(
                          label: 'ভুল (Wrong)',
                          value: '${res.wrongCount}',
                          color: const Color(0xFFE11D48),
                          bg: const Color(0xFFFFE4E6),
                          icon: Icons.cancel_rounded,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatBox(
                          label: 'ছেড়ে দেওয়া',
                          value: '${res.unattemptedCount}',
                          color: const Color(0xFF64748B),
                          bg: const Color(0xFFF1F5F9),
                          icon: Icons.remove_circle_outline_rounded,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),

            // Bottom Actions: Review Questions | Retake | Back to Topic
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Color(0x08000000),
                    blurRadius: 10,
                    offset: Offset(0, -3),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Primary Button: Review Questions
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        context.push(
                          '/practice/review/${widget.topicId}/${widget.testNumber}?attemptId=${res.attemptId}&subjectTitle=${Uri.encodeComponent(res.subjectTitle)}&topicTitle=${Uri.encodeComponent(res.topicTitle)}',
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF026BFC),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Review Questions →',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Secondary Button Row: Retake Test & Back to Topic
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            context.pushReplacement(
                              '/practice/test-runner/${widget.topicId}/${widget.testNumber}?subjectTitle=${Uri.encodeComponent(res.subjectTitle)}&topicTitle=${Uri.encodeComponent(res.topicTitle)}',
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                          ),
                          child: const Text(
                            'Retake Test 🔄',
                            style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF334155)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextButton(
                          onPressed: () {
                            context.pushReplacement('/practice/topic/${widget.topicId}');
                          },
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFFF1F5F9),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                          ),
                          child: const Text(
                            'Back to Topic',
                            style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox({
    required String label,
    required String value,
    required Color color,
    required Color bg,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color.withValues(alpha: 0.85),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
