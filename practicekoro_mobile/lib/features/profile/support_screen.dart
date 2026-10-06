import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

/// Screen 15: Support Screen ("Help & Support")
/// Exact reproduction of Screen 15 from the design mockup.
class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  int _selectedTab = 0; // 0: FAQs, 1: Contact
  final TextEditingController _searchController = TextEditingController();
  final Set<int> _expandedFaqs = {0};

  final List<Map<String, dynamic>> _categories = [
    {'title': 'Account & Login', 'icon': Icons.person_outline_rounded},
    {'title': 'Subscription & Payment', 'icon': Icons.payment_rounded},
    {'title': 'Tests & Results', 'icon': Icons.assignment_outlined},
    {'title': 'Rank & Performance', 'icon': Icons.emoji_events_outlined},
    {'title': 'Technical Issues', 'icon': Icons.settings_outlined},
  ];

  final List<Map<String, String>> _popularFaqs = [
    {
      'q': 'How to attempt a mock test?',
      'a': 'Go to the Test Series or Practice tab, select your target exam, and tap "Start" on any available test. Read the instructions and tap "Start Test" to begin the countdown timer.',
    },
    {
      'q': 'How is rank calculated?',
      'a': 'Your statewide and district ranks are dynamically calculated across all enrolled candidates based on total marks, accuracy percentage, and test completion duration.',
    },
    {
      'q': 'How to use coupon code?',
      'a': 'When upgrading to the PRO plan, on the Payment screen, enter your coupon code in the "Apply Coupon Code" field and click Apply to receive an instant discount.',
    },
    {
      'q': 'Why is my result not showing?',
      'a': 'After submitting a test, the server grades your attempt within 1-2 seconds. If a network disruption occurs, results are stored locally and will synchronize once your internet connection is restored.',
    },
    {
      'q': 'How to download notes?',
      'a': 'From your Profile screen or any Subject section, tap "Download Notes" to access high-yield PDF revision capsules and previous year question summaries for offline study.',
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _launchWhatsApp() async {
    final uri = Uri.parse('https://wa.me/919876543210?text=Hi%20PracticeKoro%20Support');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
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
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/profile'),
        ),
        title: const Text(
          'Help & Support',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. Tab Toggle: [FAQs] | [Contact]
            _buildTabToggle(),
            const SizedBox(height: 16),

            if (_selectedTab == 0) ...[
              // 2. Search Bar
              _buildSearchBar(),
              const SizedBox(height: 16),

              // 3. Category Tiles List
              _buildCategoryList(),
              const SizedBox(height: 20),

              // 4. Popular Questions Header & Accordions
              const Text(
                'Popular Questions',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),
              ...List.generate(_popularFaqs.length, (i) => _buildFaqTile(i)),
            ] else ...[
              // Contact Us View
              _buildContactView(),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // 1. Tab Toggle
  Widget _buildTabToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _selectedTab = 0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _selectedTab == 0 ? const Color(0xFF026BFC) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  'FAQs',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _selectedTab == 0 ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _selectedTab = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _selectedTab == 1 ? const Color(0xFF026BFC) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  'Contact',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _selectedTab == 1 ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 2. Search Bar
  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: _searchController,
        style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
        decoration: const InputDecoration(
          hintText: 'Search for help...',
          hintStyle: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
          prefixIcon: Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }

  // 3. Category List (Screen 15)
  Widget _buildCategoryList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: List.generate(_categories.length, (i) {
          final cat = _categories[i];
          return Column(
            children: [
              InkWell(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Viewing articles for ${cat['title']}')),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  child: Row(
                    children: [
                      Icon(cat['icon'] as IconData, color: const Color(0xFF026BFC), size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          cat['title'] as String,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 20),
                    ],
                  ),
                ),
              ),
              if (i < _categories.length - 1)
                const Divider(height: 1, indent: 46, color: Color(0xFFF1F5F9)),
            ],
          );
        }),
      ),
    );
  }

  // 4. FAQ Accordion Tile (Screen 15)
  Widget _buildFaqTile(int index) {
    final faq = _popularFaqs[index];
    final isExpanded = _expandedFaqs.contains(index);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: () {
          setState(() {
            if (isExpanded) {
              _expandedFaqs.remove(index);
            } else {
              _expandedFaqs.add(index);
            }
          });
        },
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
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
                      faq['q']!,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                    color: const Color(0xFF64748B),
                    size: 20,
                  ),
                ],
              ),
              if (isExpanded) ...[
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Text(
                    faq['a']!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF475569),
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Contact Tab Content
  Widget _buildContactView() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Need help right now?',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 6),
          const Text(
            'Our student support team is available Monday to Saturday, 10:00 AM - 7:00 PM.',
            style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B), height: 1.4),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _launchWhatsApp,
            icon: const Icon(Icons.chat_bubble_rounded, size: 18),
            label: const Text('Chat on WhatsApp (+91 98765 43210)'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Emailing support@practicekoro.com')),
              );
            },
            icon: const Icon(Icons.email_outlined, size: 18),
            label: const Text('Email: support@practicekoro.com'),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}
