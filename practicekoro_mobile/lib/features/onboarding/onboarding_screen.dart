import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, String>> _slides = [
    {
      'title': 'সরকারি পরীক্ষার\nপ্রস্তুতি এখন\nআরও সহজ',
      'subtitle': 'Mock Test • Practice • Analysis\nReal Exam Experience',
    },
    {
      'title': 'সেরা মক টেস্ট ও\nরিয়েল এক্সাম ফিল',
      'subtitle': 'WB ও কেন্দ্রীয় পরীক্ষার অনুরূপ প্রশ্ন\nও বিস্তারিত সমাধান',
    },
    {
      'title': 'রাজ্যব্যাপী র‍্যাঙ্ক ও\nসঠিক অগ্রগতি ট্র্যাকিং',
      'subtitle': 'হাজারো পরীক্ষার্থীর মধ্যে\nআপনার অবস্থান জানুন',
    },
  ];

  void _onGetStarted() {
    LocalStorageService.setOnboardingCompleted(true);
    context.go('/exam-selection');
  }

  void _onLogin() {
    LocalStorageService.setOnboardingCompleted(true);
    context.go('/login');
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const Spacer(flex: 1),

              // Large Circular Icon Container from Reference
              Container(
                width: 108,
                height: 108,
                decoration: BoxDecoration(
                  color: const Color(0xFF026BFC),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF026BFC).withValues(alpha: 0.25),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.assignment_turned_in_rounded,
                      size: 44,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // PracticeKoro Brand Name
              const Text(
                'PracticeKoro',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF051A43),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 28),

              // Swipable Text Slides
              SizedBox(
                height: 180,
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (idx) => setState(() => _currentPage = idx),
                  itemCount: _slides.length,
                  itemBuilder: (context, index) {
                    final slide = _slides[index];
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          slide['title']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF051A43),
                            letterSpacing: -0.4,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          slide['subtitle']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                            height: 1.45,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

              const SizedBox(height: 16),

              // 3-Dot Carousel Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (idx) {
                  final isCurrent = idx == _currentPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: isCurrent ? 22 : 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? const Color(0xFF026BFC)
                          : const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  );
                }),
              ),

              const Spacer(flex: 2),

              // Pill CTA Button: "চালু করি ->"
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _onGetStarted,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF026BFC),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'চালু করি',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.2,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 20),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Already have an account? Login
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Already have an account? ',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  GestureDetector(
                    onTap: _onLogin,
                    child: const Text(
                      'Login',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}
