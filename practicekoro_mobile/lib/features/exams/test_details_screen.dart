import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/exam_assets.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 06: Mock Test Start Screen
/// Exact 1:1 reproduction of the PracticeKoro Mock Test Start Screen from the design mockup.
class TestDetailsScreen extends ConsumerStatefulWidget {
  final String testId;
  final String testTitle;
  final int totalQuestions;
  final int durationMinutes;
  final double totalMarks;
  final double negativeMarks;
  final bool isPremium;

  const TestDetailsScreen({
    super.key,
    required this.testId,
    this.testTitle = 'Full Mock Test 01',
    this.totalQuestions = 85,
    this.durationMinutes = 60,
    this.totalMarks = 85.0,
    this.negativeMarks = 0.25,
    this.isPremium = true,
  });

  @override
  ConsumerState<TestDetailsScreen> createState() => _TestDetailsScreenState();
}

class _TestDetailsScreenState extends ConsumerState<TestDetailsScreen> {
  late String _title;
  late int _questions;
  late int _duration;
  late double _marks;
  late double _negMarks;
  late bool _isPro;
  String? _examTitle;

  @override
  void initState() {
    super.initState();
    _title = widget.testTitle;
    _questions = widget.totalQuestions;
    _duration = widget.durationMinutes;
    _marks = widget.totalMarks;
    _negMarks = widget.negativeMarks;
    _isPro = widget.isPremium;
    _loadTestData();
  }

  Future<void> _loadTestData() async {
    try {
      final t = await ref.read(catalogRepositoryProvider).getTestById(widget.testId);
      if (t != null && mounted) {
        setState(() {
          _title = t.title;
          _questions = t.totalQuestions;
          _duration = t.durationMinutes;
          _marks = t.totalMarks;
          _negMarks = t.negativeMarking;
          _isPro = t.isPremium;
          _examTitle = t.examTitle;
        });
      }
    } catch (_) {}
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/test-series'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF0F172A), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Test link copied to clipboard!')),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // 1. Header with Emblem, Title & PRO Badge (Screen 06)
                  _buildHeaderSection(),
                  const SizedBox(height: 20),

                  // 2. 4-Box Key Metrics Grid
                  _buildKeyMetricsGrid(),
                  const SizedBox(height: 20),

                  // 3. Test Instructions Card
                  _buildInstructionsCard(),
                  const SizedBox(height: 24),
                ],
              ),
            ),

            // 4. Fixed Bottom Button: Start Test →
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  // 1. Header Section
  Widget _buildHeaderSection() {
    return Column(
      children: [
        // Emblem Container
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFDC2626).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Builder(
            builder: (context) {
              final emblem = ExamAssets.getEmblemAsset(_examTitle ?? _title);
              if (emblem != null) {
                return Padding(
                  padding: const EdgeInsets.all(12),
                  child: Image.asset(
                    emblem,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Center(
                      child: Icon(
                        Icons.shield_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),
                );
              }
              return const Center(
                child: Icon(
                  Icons.shield_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Text(
          _examTitle ?? 'PracticeKoro Test',
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _isPro ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _isPro ? const Color(0xFFFDE68A) : const Color(0xFFBBF7D0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _isPro ? Icons.workspace_premium_rounded : Icons.check_circle_outline_rounded,
                size: 13,
                color: _isPro ? const Color(0xFFB45309) : const Color(0xFF16A34A),
              ),
              const SizedBox(width: 4),
              Text(
                _isPro ? 'PRO' : 'FREE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: _isPro ? const Color(0xFFB45309) : const Color(0xFF16A34A),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 2. 4-Box Key Metrics Grid (Screen 06)
  Widget _buildKeyMetricsGrid() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildMetricCol('$_questions', 'Questions'),
          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
          _buildMetricCol('$_duration', 'Minutes'),
          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
          _buildMetricCol('${_marks.toInt()}', 'Total Marks'),
          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
          _buildMetricCol('$_negMarks', 'Negative'),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  // 3. Test Instructions Card (Screen 06)
  Widget _buildInstructionsCard() {
    final bullets = [
      'The test contains $_questions multiple-choice questions.',
      'Total duration is $_duration minutes.',
      'Each question carries 1 mark.',
      'There is $_negMarks negative marking for each wrong answer.',
      'You can mark questions for review.',
      'The test will be auto-submitted when time ends.',
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Test Instructions',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          ...bullets.map((bullet) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '• ',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        bullet,
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: Color(0xFF334155),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  // 4. Fixed Bottom Bar
  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: () {
            context.push('/live-test/${widget.testId}');
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
                'Start Test',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(width: 8),
              Icon(Icons.arrow_forward_rounded, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
