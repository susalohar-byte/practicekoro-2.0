import 'package:flutter/material.dart';
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

class _MainScaffoldState extends State<MainScaffold> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomeScreen(
            onTabSelected: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
          ),
          const ExamsCatalogScreen(),
          PracticeScreen(initialTab: widget.practiceInitialTab ?? 'subjects'),
          ResultsHubScreen(
            onTabSelected: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
          ),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF4F6FB),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
            child: Container(
              height: 64,
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3142D6).withValues(alpha: 0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  _buildNavItem(
                    0,
                    Icons.grid_view_rounded,
                    Icons.grid_view_outlined,
                    'Home',
                  ),
                  _buildNavItem(
                    1,
                    Icons.layers_rounded,
                    Icons.layers_outlined,
                    'Tests',
                  ),
                  _buildNavItem(
                    2,
                    Icons.bolt_rounded,
                    Icons.bolt_outlined,
                    'Practice',
                  ),
                  _buildNavItem(
                    3,
                    Icons.donut_large_rounded,
                    Icons.donut_large_outlined,
                    'Results',
                  ),
                  _buildNavItem(
                    4,
                    Icons.person_rounded,
                    Icons.person_outline_rounded,
                    'Profile',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData activeIcon,
    IconData inactiveIcon,
    String label,
  ) {
    final bool isSelected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _currentIndex = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFEEF2FF) : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isSelected ? activeIcon : inactiveIcon,
                size: 22,
                color: isSelected
                    ? const Color(0xFF3142D6)
                    : const Color(0xFF64748B),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? const Color(0xFF3142D6)
                      : const Color(0xFF64748B),
                  letterSpacing: -0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
