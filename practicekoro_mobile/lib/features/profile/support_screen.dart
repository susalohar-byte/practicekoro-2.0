import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_button.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../core/components/pk_card.dart';
import '../../core/components/pk_tab.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/pk_text_field.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  String _activeTab = 'ticket'; // 'ticket' or 'faq'
  String _selectedCategory = 'Exam & Question Issue';
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitted = false;

  final List<Map<String, String>> _faqs = [
    {
      'q': 'What if a question or answer key seems incorrect in a test?',
      'a': 'You can report it directly from the Test Solutions screen or submit a ticket here under "Exam & Question Issue". Our academic editorial team verifies the discrepancy and updates the question bank within 24-48 hours.',
    },
    {
      'q': 'My payment succeeded but Pro Pass was not unlocked?',
      'a': 'Occasionally payment gateway webhooks face a short delay. Submit a ticket under "Payment & Transaction" with your Payment ID or UTR number. Our admin support team verifies the transaction and activates your Pro subscription immediately.',
    },
    {
      'q': 'How does negative marking and percentile ranking work?',
      'a': 'PracticeKoro strictly follows the official examination pattern (e.g. 0.25 negative marks for WBP / KP / Food SI). Your percentile and live ranks are dynamically recalculated against all candidates who completed the test.',
    },
    {
      'q': 'Can I re-attempt a mock test after submission?',
      'a': 'Yes, you can re-attempt practice tests anytime. Your latest attempt as well as past analytics remain safely saved in your Results history and Mistakes Notebook.',
    },
  ];

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _handleSubmitTicket() {
    if (_subjectController.text.trim().isEmpty || _messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in both subject and description')),
      );
      return;
    }

    setState(() => _isSubmitted = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.navy),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Student Help & Support',
          style: AppTypography.titleLarge(color: AppColors.navy),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: PKBottomSpacing.safeAreaEdgeInsets(context, horizontal: 16, top: 16, additionalGap: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Contact Banner Cards
            Row(
              children: [
                Expanded(
                  child: _contactPill(
                    icon: Icons.chat_bubble_outline_rounded,
                    title: 'WhatsApp Chat',
                    subtitle: '+91 98765 43210',
                    color: const Color(0xFF25D366),
                    onTap: () => _launchUrl('https://wa.me/919876543210'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _contactPill(
                    icon: Icons.mail_outline_rounded,
                    title: 'Email Support',
                    subtitle: 'help@practicekoro.com',
                    color: AppColors.primary,
                    onTap: () => _launchUrl('mailto:help@practicekoro.com'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // Tabs
            PKTab<String>(
              values: const ['ticket', 'faq'],
              selectedValue: _activeTab,
              labelBuilder: (v) => v == 'ticket' ? 'Submit Ticket' : 'FAQs & Guide',
              onSelected: (v) => setState(() => _activeTab = v),
            ),

            const SizedBox(height: 18),

            if (_activeTab == 'ticket') ...[
              if (_isSubmitted)
                PKCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.successLight,
                          borderRadius: AppRadius.rXl,
                        ),
                        child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 32),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Ticket Submitted Successfully!',
                        style: AppTypography.titleLarge(color: AppColors.textPrimary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ticket #PK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)} has been opened. Our support team will respond within 24 hours.',
                        style: AppTypography.bodySmall(color: AppColors.secondaryText),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      PKSecondaryButton(
                        text: 'Submit Another Ticket',
                        onPressed: () {
                          _subjectController.clear();
                          _messageController.clear();
                          setState(() => _isSubmitted = false);
                        },
                      ),
                    ],
                  ),
                )
              else
                PKCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Create Support Request',
                        style: AppTypography.titleMedium(color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 14),
                      Text('Category', style: AppTypography.titleSmall(color: AppColors.textPrimary)),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: AppColors.veryLightBlue,
                          borderRadius: AppRadius.rMd,
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedCategory,
                            isExpanded: true,
                            items: [
                              'Exam & Question Issue',
                              'Payment & Transaction',
                              'Technical Bug / App Glitch',
                              'Account & Subscription',
                            ].map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedCategory = val);
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      PKTextField(
                        controller: _subjectController,
                        label: 'Subject',
                        hint: 'Brief summary of the issue',
                      ),
                      const SizedBox(height: 14),
                      PKTextField(
                        controller: _messageController,
                        label: 'Description',
                        hint: 'Describe the problem in detail...',
                        maxLines: 4,
                      ),
                      const SizedBox(height: 20),
                      PKPrimaryButton(
                        text: 'Submit Support Ticket',
                        icon: Icons.send_rounded,
                        onPressed: _handleSubmitTicket,
                      ),
                    ],
                  ),
                ),
            ] else ...[
              // FAQs Accordion
              ..._faqs.map((faq) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: PKCard(
                    padding: const EdgeInsets.all(16),
                    child: ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      childrenPadding: const EdgeInsets.only(top: 8),
                      title: Text(
                        faq['q']!,
                        style: AppTypography.titleSmall(color: AppColors.textPrimary),
                      ),
                      children: [
                        Text(
                          faq['a']!,
                          style: AppTypography.bodySmall(color: AppColors.secondaryText),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _contactPill({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.rLg,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: AppRadius.rLg,
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: AppRadius.rSm,
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppTypography.titleSmall(color: AppColors.textPrimary).copyWith(fontSize: 12),
            ),
            Text(
              subtitle,
              style: AppTypography.bodySmall(color: AppColors.secondaryText).copyWith(fontSize: 10.5),
            ),
          ],
        ),
      ),
    );
  }
}
