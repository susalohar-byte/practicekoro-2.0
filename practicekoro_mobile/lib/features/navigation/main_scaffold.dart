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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: const Color(0xFFF1F5FC),
      body: PKBottomNavScope(
        hasFloatingNavBar: true,
        navBarHeight: 70.0,
        navBarBottomMargin: 10.0,
        child: IndexedStack(
          index: _currentIndex,
          children: [
            HomeScreen(
              onTabSelected: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
            ),
            ExamsCatalogScreen(
              onTabSelected: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
            ),
            PracticeScreen(
              initialTab: widget.practiceInitialTab ?? 'subjects',
              onTabSelected: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
            ),
            ResultsHubScreen(
              onTabSelected: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
            ),
            ProfileScreen(
              onTabSelected: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Align(
            alignment: Alignment.bottomCenter,
            heightFactor: 1.0,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final totalWidth = constraints.maxWidth;
                  final itemWidth = totalWidth / _navItems.length;
                  final isSmall = totalWidth < 340;

                  // Active circle dimensions: perfectly circular, fits cleanly inside pill
                  final circleDiameter = isSmall
                      ? (itemWidth - 6).clamp(46.0, 52.0)
                      : (itemWidth - 10).clamp(52.0, 58.0);
                  final pillHeight = (circleDiameter + 12.0).clamp(64.0, 70.0);
                  final activeTop = (pillHeight - circleDiameter) / 2;
                  final activeLeft =
                      (_currentIndex + 0.5) * itemWidth - (circleDiameter / 2);
                  final iconSize = isSmall ? 20.0 : 22.5;
                  final labelFontSize = isSmall ? 9.5 : 11.0;

                  return SizedBox(
                    height: pillHeight,
                    width: double.infinity,
                    child: Container(
                      decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(pillHeight / 2),
                      border: Border.all(
                        color: const Color(0xFFE2EAF8),
                        width: 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0A2E65).withValues(alpha: 0.08),
                          blurRadius: 24,
                          spreadRadius: 0,
                          offset: const Offset(0, 8),
                        ),
                        BoxShadow(
                          color: const Color(0xFF0866F5).withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(pillHeight / 2),
                      child: Stack(
                        children: [
                          // 1. Sliding Circular Highlight (Elevated, soft blue gradient)
                          AnimatedPositioned(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeInOutCubic,
                            left: activeLeft,
                            top: activeTop,
                            width: circleDiameter,
                            height: circleDiameter,
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: const LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Color(0xFFEFF5FF),
                                    Color(0xFFDBEAFE),
                                  ],
                                ),
                                border: Border.all(
                                  color: Colors.white,
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF0866F5).withValues(alpha: 0.14),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2.5),
                                  ),
                                  BoxShadow(
                                    color: const Color(0xFF0A2E65).withValues(alpha: 0.04),
                                    blurRadius: 3,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // 2. Navigation items
                          Positioned.fill(
                            child: Row(
                              children: List.generate(_navItems.length, (idx) {
                                final item = _navItems[idx];
                                final isSelected = _currentIndex == idx;
                                return _buildNavItem(
                                  item: item,
                                  index: idx,
                                  isSelected: isSelected,
                                  iconSize: iconSize,
                                  labelFontSize: labelFontSize,
                                );
                              }),
                            ),
                          ),
                        ],
                      ),
                    ),
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

  Widget _buildNavItem({
    required _NavItemData item,
    required int index,
    required bool isSelected,
    required double iconSize,
    required double labelFontSize,
  }) {
    final itemColor =
        isSelected ? const Color(0xFF0866F5) : const Color(0xFF172B55);

    Widget iconWidget;
    switch (item.type) {
      case _PKNavType.home:
        iconWidget = CustomPaint(
          size: Size(iconSize, iconSize),
          painter: _LucideHousePainter(
            color: itemColor,
            isFilled: isSelected,
          ),
        );
        break;
      case _PKNavType.testSeries:
        iconWidget = CustomPaint(
          size: Size(iconSize, iconSize),
          painter: _LucideFileTextPainter(
            color: itemColor,
          ),
        );
        break;
      case _PKNavType.practice:
        iconWidget = CustomPaint(
          size: Size(iconSize, iconSize),
          painter: _LucideZapPainter(
            color: itemColor,
            isFilled: isSelected,
          ),
        );
        break;
      case _PKNavType.results:
        iconWidget = CustomPaint(
          size: Size(iconSize, iconSize),
          painter: _LucideChartNoAxesColumnPainter(
            color: itemColor,
          ),
        );
        break;
      case _PKNavType.profile:
        iconWidget = CustomPaint(
          size: Size(iconSize, iconSize),
          painter: _LucideUserRoundPainter(
            color: itemColor,
            isFilled: isSelected,
          ),
        );
        break;
    }

    return Expanded(
      child: Semantics(
        label: item.label,
        button: true,
        selected: isSelected,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            if (_currentIndex != index) {
              setState(() {
                _currentIndex = index;
              });
            }
          },
          child: SizedBox(
            height: double.infinity,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                iconWidget,
                const SizedBox(height: 3),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: TextStyle(
                      fontSize: labelFontSize,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w600,
                      color: itemColor,
                      letterSpacing: -0.2,
                    ),
                    maxLines: 1,
                    child: Text(item.label),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXACT LUCIDE ICONS (Pixel-perfect matching reference image media_1790848962140.png)
// ─────────────────────────────────────────────────────────────────────────────

class _LucideHousePainter extends CustomPainter {
  final Color color;
  final bool isFilled;

  const _LucideHousePainter({
    required this.color,
    required this.isFilled,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    if (isFilled) {
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;

      // Solid house matching active state in reference image
      final path = Path()
        ..moveTo(12.0, 3.0)
        ..lineTo(3.2, 10.6)
        ..arcToPoint(const Offset(4.4, 12.0), radius: const Radius.circular(1.2))
        ..lineTo(5.8, 10.8)
        ..lineTo(5.8, 19.4)
        ..arcToPoint(const Offset(7.8, 21.4), radius: const Radius.circular(2.0))
        ..lineTo(16.2, 21.4)
        ..arcToPoint(const Offset(18.2, 19.4), radius: const Radius.circular(2.0))
        ..lineTo(18.2, 10.8)
        ..lineTo(19.6, 12.0)
        ..arcToPoint(const Offset(20.8, 10.6), radius: const Radius.circular(1.2))
        ..close();

      canvas.drawPath(path, paint);
    } else {
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;

      // Lucide House outline
      final path = Path()
        ..moveTo(3.0, 10.2)
        ..lineTo(11.2, 3.4)
        ..arcToPoint(const Offset(12.8, 3.4), radius: const Radius.circular(1.5))
        ..lineTo(21.0, 10.2)
        ..moveTo(5.5, 9.2)
        ..lineTo(5.5, 19.2)
        ..arcToPoint(const Offset(7.5, 21.2), radius: const Radius.circular(2.0))
        ..lineTo(16.5, 21.2)
        ..arcToPoint(const Offset(18.5, 19.2), radius: const Radius.circular(2.0))
        ..lineTo(18.5, 9.2);

      canvas.drawPath(path, paint);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LucideHousePainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.isFilled != isFilled;
}

class _LucideFileTextPainter extends CustomPainter {
  final Color color;

  const _LucideFileTextPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Document outline with folded top-right corner
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
    canvas.drawPath(docPath, paint);

    // Folded corner flap
    final flapPath = Path()
      ..moveTo(14.5, 2.5)
      ..lineTo(14.5, 6.5)
      ..arcToPoint(const Offset(15.5, 7.5), radius: const Radius.circular(1.0))
      ..lineTo(19.5, 7.5);
    canvas.drawPath(flapPath, paint);

    // Two text lines inside the document (as shown in reference image)
    canvas.drawLine(const Offset(8.0, 13.0), const Offset(16.0, 13.0), paint);
    canvas.drawLine(const Offset(8.0, 17.0), const Offset(13.5, 17.0), paint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LucideFileTextPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _LucideZapPainter extends CustomPainter {
  final Color color;
  final bool isFilled;

  const _LucideZapPainter({
    required this.color,
    this.isFilled = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    final paint = Paint()
      ..color = color
      ..style = isFilled ? PaintingStyle.fill : PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Lucide zap polygon: 13 2, 3 14, 12 14, 11 22, 21 10, 12 10, 13 2
    final path = Path()
      ..moveTo(13.0, 2.5)
      ..lineTo(4.5, 13.5)
      ..lineTo(11.5, 13.5)
      ..lineTo(10.5, 21.5)
      ..lineTo(19.5, 10.5)
      ..lineTo(12.5, 10.5)
      ..close();

    canvas.drawPath(path, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LucideZapPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.isFilled != isFilled;
}

class _LucideChartNoAxesColumnPainter extends CustomPainter {
  final Color color;

  const _LucideChartNoAxesColumnPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round;

    // 3 vertical rounded pill bars (short, tall, medium)
    canvas.drawLine(const Offset(6.5, 19.5), const Offset(6.5, 13.5), paint);
    canvas.drawLine(const Offset(12.0, 19.5), const Offset(12.0, 4.5), paint);
    canvas.drawLine(const Offset(17.5, 19.5), const Offset(17.5, 9.5), paint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LucideChartNoAxesColumnPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _LucideUserRoundPainter extends CustomPainter {
  final Color color;
  final bool isFilled;

  const _LucideUserRoundPainter({
    required this.color,
    this.isFilled = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    final strokePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Head circle (diameter 8.4)
    if (isFilled) {
      final fillPaint = Paint()..color = color..style = PaintingStyle.fill;
      canvas.drawCircle(const Offset(12.0, 7.8), 4.2, fillPaint);
    } else {
      canvas.drawCircle(const Offset(12.0, 7.8), 4.2, strokePaint);
    }

    // Shoulder curved arc
    final shoulderPath = Path()
      ..moveTo(4.8, 20.2)
      ..arcToPoint(
        const Offset(19.2, 20.2),
        radius: const Radius.circular(7.2),
        clockwise: true,
      );

    canvas.drawPath(shoulderPath, strokePaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LucideUserRoundPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.isFilled != isFilled;
}
