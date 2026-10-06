import 'package:flutter/material.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../home/home_screen.dart';
import '../exams/exams_catalog_screen.dart';
import '../practice/practice_screen.dart';
import '../result_analytics/results_hub_screen.dart';
import '../profile/profile_screen.dart';

class MainScaffold extends StatefulWidget {
  final int initialIndex;
  final String? practiceInitialTab;

  const MainScaffold({
    super.key,
    this.initialIndex = 0,
    this.practiceInitialTab,
  });

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

enum _PKNavType {
  home,
  testSeries,
  practice,
  results,
  profile,
}

class _NavItemData {
  final _PKNavType type;
  final String label;

  const _NavItemData({
    required this.type,
    required this.label,
  });
}

class _MainScaffoldState extends State<MainScaffold> {
  late int _currentIndex;

  static const List<_NavItemData> _navItems = [
    _NavItemData(
      type: _PKNavType.home,
      label: 'Home',
    ),
    _NavItemData(
      type: _PKNavType.testSeries,
      label: 'Test Series',
    ),
    _NavItemData(
      type: _PKNavType.practice,
      label: 'Practice',
    ),
    _NavItemData(
      type: _PKNavType.results,
      label: 'Results',
    ),
    _NavItemData(
      type: _PKNavType.profile,
      label: 'Profile',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void _onTabSelected(int index) {
    if (_currentIndex != index) {
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isUltraNarrow = screenWidth < 340;
    final isNarrow = screenWidth < 375;
    final horizontalPadding = isUltraNarrow ? 6.0 : (isNarrow ? 10.0 : 14.0);

    return Scaffold(
      extendBody: true,
      backgroundColor: const Color(0xFFF8FAFC),
      body: PKBottomNavScope(
        hasFloatingNavBar: true,
        navBarHeight: 74.0,
        navBarBottomMargin: 12.0,
        child: IndexedStack(
          index: _currentIndex,
          children: [
            HomeScreen(onTabSelected: _onTabSelected),
            ExamsCatalogScreen(onTabSelected: _onTabSelected),
            PracticeScreen(
              initialTab: widget.practiceInitialTab ?? 'subjects',
              onTabSelected: _onTabSelected,
            ),
            ResultsHubScreen(onTabSelected: _onTabSelected),
            ProfileScreen(onTabSelected: _onTabSelected),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: EdgeInsets.fromLTRB(horizontalPadding, 0, horizontalPadding, 8),
          child: Align(
            alignment: Alignment.bottomCenter,
            heightFactor: 1.0,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final totalWidth = constraints.maxWidth;
                  final isSmall = totalWidth < 350;

                  final pillHeight = isSmall ? 66.0 : 70.0;
                  final mascotSize = isSmall ? 54.0 : 60.0;
                  final iconSize = isSmall ? 20.0 : 22.0;
                  final labelFontSize = isSmall ? 9.5 : 10.5;

                  return SizedBox(
                    height: pillHeight + 24.0, // Extra headroom so floating mascot never clips
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.bottomCenter,
                      children: [
                        // ── Left Playful Sunburst Doodle (Orange rays \ | /) ──
                        Positioned(
                          left: -6,
                          bottom: (pillHeight - 28) / 2,
                          child: const CustomPaint(
                            size: Size(16, 28),
                            painter: _SunburstDoodlePainter(isLeft: true),
                          ),
                        ),

                        // ── Right Playful Sunburst Doodle (Orange rays / | \) ──
                        Positioned(
                          right: -6,
                          bottom: (pillHeight - 28) / 2,
                          child: const CustomPaint(
                            size: Size(16, 28),
                            painter: _SunburstDoodlePainter(isLeft: false),
                          ),
                        ),

                        // ── White Navigation Pill Container with Warm Ambient Glow ──
                        Container(
                          height: pillHeight,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(pillHeight / 2),
                            border: Border.all(
                              color: const Color(0xFFF2ECE1),
                              width: 1.2,
                            ),
                            boxShadow: [
                              // Warm ambient yellow glow
                              BoxShadow(
                                color: const Color(0xFFFFD84D).withValues(alpha: 0.38),
                                blurRadius: 32,
                                spreadRadius: 2,
                                offset: const Offset(0, 8),
                              ),
                              // Soft card shadow
                              BoxShadow(
                                color: const Color(0xFF0F172A).withValues(alpha: 0.06),
                                blurRadius: 14,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: List.generate(_navItems.length, (idx) {
                              final item = _navItems[idx];
                              final isSelected = _currentIndex == idx;

                              // Center item: Practice is floating
                              if (item.type == _PKNavType.practice) {
                                return Expanded(
                                  child: _buildPracticeCenterItem(
                                    isSelected: isSelected,
                                    mascotSize: mascotSize,
                                    isSmall: isSmall,
                                    onTap: () => _onTabSelected(idx),
                                  ),
                                );
                              }

                              return Expanded(
                                child: _buildRegularNavItem(
                                  item: item,
                                  index: idx,
                                  isSelected: isSelected,
                                  iconSize: iconSize,
                                  labelFontSize: labelFontSize,
                                  onTap: () => _onTabSelected(idx),
                                ),
                              );
                            }),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Regular Navigation Item (Home, Test Series, Results, Profile) ──
  Widget _buildRegularNavItem({
    required _NavItemData item,
    required int index,
    required bool isSelected,
    required double iconSize,
    required double labelFontSize,
    required VoidCallback onTap,
  }) {
    return Semantics(
      label: item.label,
      button: true,
      selected: isSelected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox(
          height: double.infinity,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon Area with Soft Yellow Circular Blob for Active Item
              SizedBox(
                width: 36,
                height: 36,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (isSelected)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFFFF082),
                        ),
                      ),
                    _buildIconWidget(item.type, isSelected, iconSize),
                  ],
                ),
              ),

              const SizedBox(height: 1),

              // Item Label
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  item.label,
                  maxLines: 1,
                  style: TextStyle(
                    fontSize: labelFontSize,
                    fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                    color: const Color(0xFF0B132B),
                    letterSpacing: -0.2,
                  ),
                ),
              ),

              // Small Active Dot Indicator
              if (isSelected) ...[
                const SizedBox(height: 2),
                Container(
                  width: 4.5,
                  height: 4.5,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFFFFD84D),
                  ),
                ),
              ] else
                const SizedBox(height: 6.5), // Balance height so items align perfectly
            ],
          ),
        ),
      ),
    );
  }

  // ── Center Floating Practice Item ──
  Widget _buildPracticeCenterItem({
    required bool isSelected,
    required double mascotSize,
    required bool isSmall,
    required VoidCallback onTap,
  }) {
    return Semantics(
      label: 'Practice',
      button: true,
      selected: isSelected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: OverflowBox(
          maxHeight: 110,
          alignment: Alignment.bottomCenter,
          child: Transform.translate(
            offset: Offset(0, isSmall ? -18.0 : -22.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Circular Mascot Button
                Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    // Elevated Circular Container with Mascot
                    Container(
                      width: mascotSize,
                      height: mascotSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFFD84D).withValues(alpha: 0.50),
                            blurRadius: 18,
                            spreadRadius: 1,
                            offset: const Offset(0, 6),
                          ),
                          BoxShadow(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.12),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/mascot_with_crown_tight.png',
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            // Fallback to existing student avatar inside yellow circle
                            return Container(
                              color: const Color(0xFFFFDE31),
                              padding: const EdgeInsets.all(4),
                              child: Image.asset(
                                'assets/images/student_avatar.png',
                                fit: BoxFit.contain,
                              ),
                            );
                          },
                        ),
                      ),
                    ),

                    // Tiny Sparkle Star on bottom-left of mascot circle
                    Positioned(
                      left: -6,
                      bottom: 4,
                      child: const CustomPaint(
                        size: Size(12, 12),
                        painter: _SparkleStarPainter(),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 3),

                // Yellow Pill for "Practice" Label
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFDE31),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF0B132B)
                          : const Color(0x66EAB308),
                      width: isSelected ? 1.4 : 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0x18000000),
                        blurRadius: 3,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    'Practice',
                    style: TextStyle(
                      fontSize: isSmall ? 9.5 : 10.5,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0B132B),
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Icon Switcher ──
  Widget _buildIconWidget(_PKNavType type, bool isSelected, double size) {
    switch (type) {
      case _PKNavType.home:
        return CustomPaint(
          size: Size(size, size),
          painter: _HouseIconPainter(isActive: isSelected),
        );
      case _PKNavType.testSeries:
        return CustomPaint(
          size: Size(size, size),
          painter: _TestPaperIconPainter(isActive: isSelected),
        );
      case _PKNavType.results:
        return CustomPaint(
          size: Size(size, size),
          painter: _TrophyIconPainter(isActive: isSelected),
        );
      case _PKNavType.profile:
        return CustomPaint(
          size: Size(size, size),
          painter: _UserIconPainter(isActive: isSelected),
        );
      case _PKNavType.practice:
        return const SizedBox.shrink();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXACT PLAYFUL GEN-Z ICON PAINTERS (Matching media_1791279861087.png)
// ─────────────────────────────────────────────────────────────────────────────

/// 1. Home Icon: Colorful house (Red Roof, Yellow Body, Navy Outline) when active;
/// Clean navy outline house when inactive.
class _HouseIconPainter extends CustomPainter {
  final bool isActive;

  const _HouseIconPainter({required this.isActive});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    const navy = Color(0xFF0B132B);
    const redRoof = Color(0xFFEF4444);
    const yellowWall = Color(0xFFFFE866);

    if (isActive) {
      // 1. House Wall Fill
      final wallFill = Paint()
        ..color = yellowWall
        ..style = PaintingStyle.fill;
      final wallPath = Path()
        ..moveTo(5.0, 10.5)
        ..lineTo(5.0, 20.0)
        ..arcToPoint(const Offset(6.0, 21.0), radius: const Radius.circular(1.0))
        ..lineTo(18.0, 21.0)
        ..arcToPoint(const Offset(19.0, 20.0), radius: const Radius.circular(1.0))
        ..lineTo(19.0, 10.5)
        ..close();
      canvas.drawPath(wallPath, wallFill);

      // 2. House Wall Stroke
      final wallStroke = Paint()
        ..color = navy
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(wallPath, wallStroke);

      // 3. Red Roof Fill & Stroke
      final roofPath = Path()
        ..moveTo(3.2, 11.2)
        ..lineTo(11.2, 3.4)
        ..arcToPoint(const Offset(12.8, 3.4), radius: const Radius.circular(1.2))
        ..lineTo(20.8, 11.2)
        ..close();

      final roofFill = Paint()
        ..color = redRoof
        ..style = PaintingStyle.fill;
      canvas.drawPath(roofPath, roofFill);

      final roofStroke = Paint()
        ..color = navy
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(roofPath, roofStroke);

      // 4. Navy Door Arch
      final doorPath = Path()
        ..moveTo(10.2, 21.0)
        ..lineTo(10.2, 15.5)
        ..arcToPoint(const Offset(13.8, 15.5), radius: const Radius.circular(1.8))
        ..lineTo(13.8, 21.0);

      final doorPaint = Paint()
        ..color = navy
        ..style = PaintingStyle.fill;
      canvas.drawPath(doorPath, doorPaint);
    } else {
      // Inactive: Clean Navy Outline House
      final strokePaint = Paint()
        ..color = navy
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;

      // Roof
      final roofPath = Path()
        ..moveTo(3.2, 11.0)
        ..lineTo(11.2, 3.4)
        ..arcToPoint(const Offset(12.8, 3.4), radius: const Radius.circular(1.2))
        ..lineTo(20.8, 11.0);
      canvas.drawPath(roofPath, strokePaint);

      // Walls
      final wallsPath = Path()
        ..moveTo(5.5, 9.8)
        ..lineTo(5.5, 19.5)
        ..arcToPoint(const Offset(7.0, 21.0), radius: const Radius.circular(1.5))
        ..lineTo(17.0, 21.0)
        ..arcToPoint(const Offset(18.5, 19.5), radius: const Radius.circular(1.5))
        ..lineTo(18.5, 9.8);
      canvas.drawPath(wallsPath, strokePaint);

      // Door
      final doorPath = Path()
        ..moveTo(10.0, 21.0)
        ..lineTo(10.0, 15.0)
        ..arcToPoint(const Offset(14.0, 15.0), radius: const Radius.circular(2.0))
        ..lineTo(14.0, 21.0);
      canvas.drawPath(doorPath, strokePaint);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _HouseIconPainter oldDelegate) =>
      oldDelegate.isActive != isActive;
}

/// 2. Test Paper / Document Icon with Folded Corner & 3 Content Lines
class _TestPaperIconPainter extends CustomPainter {
  final bool isActive;

  const _TestPaperIconPainter({required this.isActive});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    const navy = Color(0xFF0B132B);

    final strokePaint = Paint()
      ..color = navy
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Document Body Path
    final docPath = Path()
      ..moveTo(14.5, 2.5)
      ..lineTo(6.5, 2.5)
      ..arcToPoint(const Offset(4.5, 4.5), radius: const Radius.circular(2.0))
      ..lineTo(4.5, 19.5)
      ..arcToPoint(const Offset(6.5, 21.5), radius: const Radius.circular(2.0))
      ..lineTo(17.5, 21.5)
      ..arcToPoint(const Offset(19.5, 19.5), radius: const Radius.circular(2.0))
      ..lineTo(19.5, 7.5)
      ..close();

    if (isActive) {
      final fillPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawPath(docPath, fillPaint);
    }
    canvas.drawPath(docPath, strokePaint);

    // Folded Corner Flap
    final flapPath = Path()
      ..moveTo(14.5, 2.5)
      ..lineTo(14.5, 7.5)
      ..lineTo(19.5, 7.5);
    canvas.drawPath(flapPath, strokePaint);

    // 3 Content Lines
    canvas.drawLine(const Offset(8.0, 12.0), const Offset(16.0, 12.0), strokePaint);
    canvas.drawLine(const Offset(8.0, 15.5), const Offset(16.0, 15.5), strokePaint);
    canvas.drawLine(const Offset(8.0, 18.5), const Offset(12.5, 18.5), strokePaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _TestPaperIconPainter oldDelegate) =>
      oldDelegate.isActive != isActive;
}

/// 3. Trophy Icon: Friendly Trophy Cup with Light Blue Fill & Navy Outline
class _TrophyIconPainter extends CustomPainter {
  final bool isActive;

  const _TrophyIconPainter({required this.isActive});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    const navy = Color(0xFF0B132B);
    const blueFill = Color(0xFFBFDBFE);

    final strokePaint = Paint()
      ..color = navy
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Cup Bowl Path
    final bowlPath = Path()
      ..moveTo(6.0, 3.5)
      ..lineTo(18.0, 3.5)
      ..lineTo(18.0, 11.0)
      ..arcToPoint(const Offset(12.0, 16.5), radius: const Radius.circular(6.0))
      ..arcToPoint(const Offset(6.0, 11.0), radius: const Radius.circular(6.0))
      ..close();

    // Fill cup with soft blue
    final fillPaint = Paint()
      ..color = blueFill
      ..style = PaintingStyle.fill;
    canvas.drawPath(bowlPath, fillPaint);
    canvas.drawPath(bowlPath, strokePaint);

    // Left Handle
    final leftHandle = Path()
      ..moveTo(6.0, 5.5)
      ..lineTo(3.8, 5.5)
      ..arcToPoint(const Offset(3.8, 11.5), radius: const Radius.circular(3.0))
      ..lineTo(6.5, 11.5);
    canvas.drawPath(leftHandle, strokePaint);

    // Right Handle
    final rightHandle = Path()
      ..moveTo(18.0, 5.5)
      ..lineTo(20.2, 5.5)
      ..arcToPoint(const Offset(20.2, 11.5), radius: const Radius.circular(3.0))
      ..lineTo(17.5, 11.5);
    canvas.drawPath(rightHandle, strokePaint);

    // Stem & Base
    canvas.drawLine(const Offset(12.0, 16.5), const Offset(12.0, 20.0), strokePaint);
    canvas.drawLine(const Offset(8.0, 20.5), const Offset(16.0, 20.5), strokePaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _TrophyIconPainter oldDelegate) =>
      oldDelegate.isActive != isActive;
}

/// 4. Profile User Icon: Clean rounded outline with navy stroke
class _UserIconPainter extends CustomPainter {
  final bool isActive;

  const _UserIconPainter({required this.isActive});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    const navy = Color(0xFF0B132B);

    final strokePaint = Paint()
      ..color = navy
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Head circle
    if (isActive) {
      final fillPaint = Paint()
        ..color = const Color(0xFFFFE866)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(const Offset(12.0, 7.5), 4.2, fillPaint);
    }
    canvas.drawCircle(const Offset(12.0, 7.5), 4.2, strokePaint);

    // Shoulder curve
    final shouldersPath = Path()
      ..moveTo(4.5, 20.5)
      ..arcToPoint(
        const Offset(19.5, 20.5),
        radius: const Radius.circular(7.5),
        clockwise: true,
      );
    canvas.drawPath(shouldersPath, strokePaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _UserIconPainter oldDelegate) =>
      oldDelegate.isActive != isActive;
}

/// 5. Outer Orange Sunburst Doodle Rays (\ | / or / | \)
class _SunburstDoodlePainter extends CustomPainter {
  final bool isLeft;

  const _SunburstDoodlePainter({required this.isLeft});

  @override
  void paint(Canvas canvas, Size size) {
    const orange = Color(0xFFF97316);
    final paint = Paint()
      ..color = orange
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round;

    if (isLeft) {
      // Top ray
      canvas.drawLine(const Offset(14.0, 6.0), const Offset(4.0, 2.0), paint);
      // Middle ray
      canvas.drawLine(const Offset(16.0, 14.0), const Offset(2.0, 14.0), paint);
      // Bottom ray
      canvas.drawLine(const Offset(14.0, 22.0), const Offset(4.0, 26.0), paint);
    } else {
      // Top ray
      canvas.drawLine(const Offset(2.0, 6.0), const Offset(12.0, 2.0), paint);
      // Middle ray
      canvas.drawLine(const Offset(0.0, 14.0), const Offset(14.0, 14.0), paint);
      // Bottom ray
      canvas.drawLine(const Offset(2.0, 22.0), const Offset(12.0, 26.0), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SunburstDoodlePainter oldDelegate) =>
      oldDelegate.isLeft != isLeft;
}

/// 6. Playful 4-Point Sparkle Star Doodle
class _SparkleStarPainter extends CustomPainter {
  const _SparkleStarPainter();

  @override
  void paint(Canvas canvas, Size size) {
    const amber = Color(0xFFF59E0B);
    final paint = Paint()
      ..color = amber
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(6.0, 0.0)
      ..lineTo(7.2, 4.2)
      ..lineTo(12.0, 6.0)
      ..lineTo(7.2, 7.8)
      ..lineTo(6.0, 12.0)
      ..lineTo(4.8, 7.8)
      ..lineTo(0.0, 6.0)
      ..lineTo(4.8, 4.2)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _SparkleStarPainter oldDelegate) => false;
}
