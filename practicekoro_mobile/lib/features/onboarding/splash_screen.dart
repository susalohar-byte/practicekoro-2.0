import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  Timer? _navigationTimer;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _scaleAnimation = Tween<double>(begin: 0.94, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.65, curve: Curves.easeOutCubic),
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.50, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();

    _navigationTimer = Timer(const Duration(milliseconds: 2400), () {
      if (mounted) {
        if (LocalStorageService.isOnboardingCompleted()) {
          context.go('/home');
        } else {
          context.go('/onboarding');
        }
      }
    });
  }

  @override
  void dispose() {
    _navigationTimer?.cancel();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8F3FE),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final screenWidth = constraints.maxWidth;
            final isLandscapeOrShort = constraints.maxHeight < 450;

            // Proportions matching the 576x1024 reference design
            final logoSize = (screenWidth * 0.23).clamp(80.0, 132.0);
            final brandWidth = logoSize * 1.95;
            final headlineWidth = logoSize * 1.70;
            final subtitleWidth = logoSize * 1.45;
            final gapLogoToBrand = logoSize * 0.19;
            final gapBrandToHeadline = logoSize * 0.21;
            final gapHeadlineToSubtitle = logoSize * 0.085;
            final gapSubtitleToDots = logoSize * 0.42;
            final dotSize = (logoSize * 0.075).clamp(8.0, 10.5);
            final dotGap = (logoSize * 0.075).clamp(8.0, 10.5);

            final content = AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return Opacity(
                  opacity: _fadeAnimation.value,
                  child: Transform.scale(
                    scale: _scaleAnimation.value,
                    child: child,
                  ),
                );
              },
              child: Semantics(
                label: 'PracticeKoro - পরীক্ষার প্রস্তুতি, এখন আরও সহজ',
                readOnly: true,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // 1. PracticeKoro App Icon
                    SizedBox(
                      width: logoSize,
                      height: logoSize,
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    SizedBox(height: gapLogoToBrand),

                    // 2. PracticeKoro Branding with Blue Swoosh Underline
                    const Opacity(
                      opacity: 0.0,
                      child: SizedBox(
                        height: 0,
                        child: Text('PracticeKoro'),
                      ),
                    ),
                    SizedBox(
                      width: brandWidth,
                      child: Image.asset(
                        'assets/images/splash_brand.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    SizedBox(height: gapBrandToHeadline),

                    // 3. Bengali Headline: পরীক্ষার প্রস্তুতি
                    SizedBox(
                      width: headlineWidth,
                      child: Image.asset(
                        'assets/images/splash_headline.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    SizedBox(height: gapHeadlineToSubtitle),

                    // 4. Bengali Subtitle: এখন আরও সহজ
                    SizedBox(
                      width: subtitleWidth,
                      child: Image.asset(
                        'assets/images/splash_subtitle.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    SizedBox(height: gapSubtitleToDots),

                    // 5. Three Pagination Dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildDot(isActive: true, size: dotSize),
                        SizedBox(width: dotGap),
                        _buildDot(isActive: false, size: dotSize),
                        SizedBox(width: dotGap),
                        _buildDot(isActive: false, size: dotSize),
                      ],
                    ),
                  ],
                ),
              ),
            );

            if (isLandscapeOrShort) {
              return Center(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: content,
                ),
              );
            }

            return SizedBox.expand(
              child: Column(
                children: [
                  const Spacer(flex: 35),
                  content,
                  const Spacer(flex: 28),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildDot({required bool isActive, required double size}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isActive ? const Color(0xFF0066FF) : const Color(0xFFB4D1FD),
      ),
    );
  }
}
