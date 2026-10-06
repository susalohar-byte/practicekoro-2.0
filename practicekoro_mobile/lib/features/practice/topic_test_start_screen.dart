import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class TopicTestStartScreen extends ConsumerStatefulWidget {
  final String topicId;
  final int testNumber;
  final String? topicTitle;
  final String? subjectTitle;

  const TopicTestStartScreen({
    super.key,
    required this.topicId,
    required this.testNumber,
    this.topicTitle,
    this.subjectTitle,
  });

  @override
  ConsumerState<TopicTestStartScreen> createState() => _TopicTestStartScreenState();
}

class _TopicTestStartScreenState extends ConsumerState<TopicTestStartScreen> {
  @override
  Widget build(BuildContext context) {
    final title = widget.topicTitle ?? 'অধ্যায় টেস্ট';
    final subject = widget.subjectTitle ?? 'বিষয়ভিত্তিক প্র্যাকটিস';

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
              '$title — Test ${widget.testNumber}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              subject,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                children: [
                  // Nimo Encouraging Ready Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEFF6FF), Color(0xFFDBEAFE), Color(0xFFE0E7FF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFBFDBFE), width: 1.2),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A026BFC),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 100,
                          height: 100,
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
                              'assets/images/nimo_ready.png',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) => const Center(
                                child: Text('🦁', style: TextStyle(fontSize: 48)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Ready? You can do it! 🚀',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'শান্ত মাথায় প্রতিটি প্রশ্ন পড়ে উত্তর নির্বাচন করো। কোনোরূপ নেতিবাচক চাপ ছাড়া আত্মবিশ্বাসের সাথে শুরু করো!',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF475569),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Briefing Details Grid
                  const Text(
                    'টেস্ট বিবরণী (Test Briefing)',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 12),

                  Container(
                    padding: const EdgeInsets.all(16),
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
                      children: [
                        _buildBriefingRow(
                          icon: Icons.quiz_outlined,
                          iconColor: const Color(0xFF026BFC),
                          label: 'মোট প্রশ্ন',
                          sublabel: 'Total Questions',
                          value: '১০ টি (10 Qs)',
                        ),
                        const Divider(height: 20, color: Color(0xFFF1F5F9)),
                        _buildBriefingRow(
                          icon: Icons.timer_outlined,
                          iconColor: const Color(0xFFD97706),
                          label: 'সময়সীমা',
                          sublabel: 'Time Limit',
                          value: '১০ মিনিট (10 Mins)',
                        ),
                        const Divider(height: 20, color: Color(0xFFF1F5F9)),
                        _buildBriefingRow(
                          icon: Icons.military_tech_outlined,
                          iconColor: const Color(0xFF16A34A),
                          label: 'প্রতিটি প্রশ্নের মান',
                          sublabel: 'Marks per Question',
                          value: '+১.০ নম্বর (+1.0)',
                        ),
                        const Divider(height: 20, color: Color(0xFFF1F5F9)),
                        _buildBriefingRow(
                          icon: Icons.remove_circle_outline_rounded,
                          iconColor: const Color(0xFFE11D48),
                          label: 'নেগেটিভ মার্কিং',
                          sublabel: 'Negative Marking',
                          value: '-০.২৫ (-0.25)',
                        ),
                        const Divider(height: 20, color: Color(0xFFF1F5F9)),
                        _buildBriefingRow(
                          icon: Icons.language_rounded,
                          iconColor: const Color(0xFF8B5CF6),
                          label: 'ভাষা',
                          sublabel: 'Language',
                          value: 'বাংলা / English',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Quick Rules Box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.lightbulb_outline_rounded, size: 16, color: Color(0xFFD97706)),
                            SizedBox(width: 6),
                            Text(
                              'স্মরণীয় নিয়মাবলী:',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 6),
                        Text(
                          '• যেকোনো সময় প্রশ্ন পরিবর্তন বা আগের প্রশ্নে ফিরে যেতে পারবে।\n• টেস্ট সাবমিট করার সাথে সাথেই তাৎক্ষণিক ফলাফল ও ব্যাখ্যা দেখতে পাবে।',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF475569),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Bottom CTA Button
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
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    context.pushReplacement(
                      '/practice/test-runner/${widget.topicId}/${widget.testNumber}?subjectTitle=${Uri.encodeComponent(subject)}&topicTitle=${Uri.encodeComponent(title)}',
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
                        'Start Test →',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBriefingRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    String? sublabel,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B),
                ),
              ),
              if (sublabel != null)
                Text(
                  sublabel,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
        ),
      ],
    );
  }
}
