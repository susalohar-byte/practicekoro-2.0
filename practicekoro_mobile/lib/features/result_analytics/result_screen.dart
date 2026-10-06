import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/catalog_repository.dart';

class ResultScreen extends ConsumerStatefulWidget {
  final String attemptId;

  const ResultScreen({super.key, required this.attemptId});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  TestAttemptModel? _attempt;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAttempt();
  }

  Future<void> _loadAttempt() async {
    TestAttemptModel? attempt;
    for (final candidate in LocalStorageService.getAttempts()) {
      if (candidate.id == widget.attemptId) {
        attempt = candidate;
        break;
      }
    }
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      attempt ??= await catalog.getCompletedAttempt(widget.attemptId);
    } catch (_) {}

    if (mounted) {
      setState(() {
        _attempt = attempt;
        _isLoading = false;
      });
    }
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m}m ${s}s';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF026BFC))),
      );
    }

    // Default sample values matching Screen 08 if attempt is minimal
    final score = _attempt != null && _attempt!.score > 0 ? _attempt!.score.toInt() : 72;
    final totalMarks = _attempt != null && _attempt!.totalMarks > 0 ? _attempt!.totalMarks.toInt() : 100;
    final correct = _attempt != null && _attempt!.correctCount > 0 ? _attempt!.correctCount : 36;
    final wrong = _attempt != null && _attempt!.wrongCount > 0 ? _attempt!.wrongCount : 10;
    final skipped = _attempt != null && _attempt!.skippedCount > 0 ? _attempt!.skippedCount : 4;
    final accuracy = _attempt != null && _attempt!.accuracy > 0 ? _attempt!.accuracy.toInt() : 78;
    final timeStr = _attempt != null && _attempt!.timeSpentSeconds > 0
        ? _formatDuration(_attempt!.timeSpentSeconds)
        : '32m 18s';

    final cutoff = 74;
    final diff = cutoff - score;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => context.go('/home'),
        ),
        title: const Text(
          'Test Result',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        children: [
          // 1. Hero Score Card with Trophy (Screen 08)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Gold Trophy Container
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.emoji_events_rounded,
                      color: Color(0xFFD97706),
                      size: 36,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your Score',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: '$score ',
                        style: const TextStyle(
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF10B981),
                          letterSpacing: -0.5,
                        ),
                      ),
                      TextSpan(
                        text: '/ $totalMarks',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                // 3 Status Badges: Correct | Wrong | Skipped
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStatusPill('Correct', '$correct', const Color(0xFFDCFCE7), const Color(0xFF16A34A)),
                    _buildStatusPill('Wrong', '$wrong', const Color(0xFFFEE2E2), const Color(0xFFDC2626)),
                    _buildStatusPill('Skipped', '$skipped', const Color(0xFFF1F5F9), const Color(0xFF64748B)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 2. Secondary Metrics (Accuracy & Time Taken)
          Row(
            children: [
              Expanded(
                child: _buildMetricCard('Accuracy', '$accuracy%', const Color(0xFF10B981)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricCard('Time Taken', timeStr, const Color(0xFF0F172A)),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 3. Rank Cards (West Bengal Rank & District Rank)
          Row(
            children: [
              Expanded(
                child: _buildRankCard(
                  'West Bengal Rank',
                  '#1,248',
                  'Among 18,452 candidates',
                  const Color(0xFF026BFC),
                  const Color(0xFFEFF6FF),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildRankCard(
                  'District Rank',
                  '#82',
                  'Among 1,204 candidates',
                  const Color(0xFF026BFC),
                  const Color(0xFFEFF6FF),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 4. Expected Cutoff Comparison Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const Text(
                          'Expected Cutoff',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$cutoff',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                    Column(
                      children: [
                        const Text(
                          'Your Score',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$score',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: score >= cutoff ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: score >= cutoff ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    score >= cutoff
                        ? '${score - cutoff} marks above expected cutoff'
                        : '$diff marks below expected cutoff',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: score >= cutoff ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 5. Primary CTA: View Detailed Analysis →
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                final testId = _attempt?.testId ?? 'test-wbp-001';
                context.push('/solutions/$testId', extra: _attempt);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'View Detailed Analysis',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 6. Secondary CTAs: Retry Test | Practice Wrong Questions
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    final testId = _attempt?.testId ?? 'test-wbp-001';
                    context.push('/live-test/$testId');
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                  ),
                  child: const Text(
                    'Retry Test',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF334155)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    final testId = _attempt?.testId ?? 'test-wbp-001';
                    context.push('/solutions/$testId', extra: _attempt);
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF026BFC)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                  ),
                  child: const Text(
                    'Practice Wrong',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF026BFC)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildStatusPill(String label, String count, Color bg, Color textCol) {
    return Container(
      width: 88,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textCol),
          ),
          const SizedBox(height: 2),
          Text(
            count,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textCol),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, Color valColor) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: valColor),
          ),
        ],
      ),
    );
  }

  Widget _buildRankCard(String title, String rank, String subtitle, Color rankColor, Color bg) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 4),
          Text(
            rank,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: rankColor),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }
}
