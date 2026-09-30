import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
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

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );

    _scaleAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.1, 0.7, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();

    Timer(const Duration(milliseconds: 2800), () {
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
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF091428), // Deep midnight navy
              Color(0xFF0C2556),
              Color(0xFF0158FC), // PracticeKoro brand blue
              Color(0xFF1D4ED8),
            ],
            stops: [0.0, 0.35, 0.80, 1.0],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Ambient Decorative Light Glows in Background
              Positioned(
                top: -60,
                right: -60,
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF38BDF8).withValues(alpha: 0.12),
                  ),
                ),
              ),
              Positioned(
                bottom: 80,
                left: -50,
                child: Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF60A5FA).withValues(alpha: 0.08),
                  ),
                ),
              ),

              // Main Centered Content
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const Spacer(flex: 3),

                    // Animated Logo & Glow Card
                    AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _scaleAnimation.value,
                          child: Opacity(
                            opacity: _fadeAnimation.value,
                            child: child,
                          ),
                        );
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.asset(
                          'assets/images/logo-circle.png',
                          width: 104,
                          height: 104,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),

                    const SizedBox(height: 22),

                    // Primary English Brand Title
                    const Text(
                      'PracticeKoro',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.6,
                      ),
                    ),

                    const SizedBox(height: 4),

                    // Bengali Brand Name
                    Text(
                      'প্র্যাকটিস করো',
                      style: GoogleFonts.hindSiliguri(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF93C5FD),
                        letterSpacing: 0.6,
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Bengali Tagline Pill Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6.5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.22),
                          width: 1.1,
                        ),
                      ),
                      child: Text(
                        '✨ আজকের প্রস্তুতি • আগামীর সাফল্য',
                        style: GoogleFonts.hindSiliguri(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Subtitle in Bengali
                    Text(
                      'পশ্চিমবঙ্গের সরকারি চাকরির সেরা প্রস্তুতি মঞ্চ',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.hindSiliguri(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.88),
                        height: 1.35,
                      ),
                    ),

                    const SizedBox(height: 18),

                    // 3 Feature Pills in Bengali
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildFeaturePill('🎯 মক টেস্ট'),
                          const SizedBox(width: 8),
                          _buildFeaturePill('📚 পি.ওয়াই.কিউ'),
                          const SizedBox(width: 8),
                          _buildFeaturePill('⚡ লাইভ টেস্ট'),
                        ],
                      ),
                    ),

                    const Spacer(flex: 3),

                    // Loading Section with Bengali label
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 56),
                      child: Column(
                        children: [
                          AnimatedBuilder(
                            animation: _animationController,
                            builder: (context, child) {
                              return ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: LinearProgressIndicator(
                                  value: _animationController.value,
                                  backgroundColor: Colors.white.withValues(alpha: 0.18),
                                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                                  minHeight: 4.5,
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'অ্যাপ প্রস্তুত হচ্ছে...',
                            style: GoogleFonts.hindSiliguri(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withValues(alpha: 0.85),
                              letterSpacing: 0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'স্বপ্নের চাকরির পথে এগিয়ে চলো 🚀',
                            style: GoogleFonts.hindSiliguri(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF93C5FD).withValues(alpha: 0.75),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturePill(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Text(
        label,
        style: GoogleFonts.hindSiliguri(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Colors.white.withValues(alpha: 0.92),
        ),
      ),
    );
  }
}
