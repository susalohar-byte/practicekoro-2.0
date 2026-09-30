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
      backgroundColor: const Color(0xFFF6F9FF),
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
          color: Colors.white.withValues(alpha: 0.96),
          border: const Border(
            top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0B1F44).withValues(alpha: 0.06),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 68,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Row(
                children: [
                  _buildNavItem(
                    0,
                    Icons.home_rounded,
                    Icons.home_outlined,
                    'Home',
                  ),
                  _buildNavItem(
                    1,
                    Icons.assignment_rounded,
                    Icons.assignment_outlined,
                    'Test Series',
                  ),
                  _buildNavItem(
                    2,
                    Icons.menu_book_rounded,
                    Icons.menu_book_outlined,
                    'Practice',
                  ),
                  _buildNavItem(
                    3,
                    Icons.bar_chart_rounded,
                    Icons.bar_chart_outlined,
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
      child: InkWell(
        onTap: () => setState(() => _currentIndex = index),
        borderRadius: BorderRadius.circular(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [Color(0xFF0158FC), Color(0xFF0198FD)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isSelected ? null : Colors.transparent,
                borderRadius: BorderRadius.circular(14),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: const Color(0xFF0158FC).withValues(alpha: 0.28),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                isSelected ? activeIcon : inactiveIcon,
                size: 20,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? const Color(0xFF0158FC)
                    : const Color(0xFF64748B),
                letterSpacing: -0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
