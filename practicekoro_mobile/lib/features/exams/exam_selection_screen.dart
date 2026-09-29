import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';

class ExamSelectionScreen extends StatefulWidget {
  final bool isProfileChange;

  const ExamSelectionScreen({super.key, this.isProfileChange = false});

  @override
  State<ExamSelectionScreen> createState() => _ExamSelectionScreenState();
}

class _ExamSelectionScreenState extends State<ExamSelectionScreen> {
  int _selectedCategoryIndex = 0;
  final TextEditingController _searchController = TextEditingController();
  final List<String> _categories = [
    'All',
    'WB Police (WBP / KP)',
    'WBPSC (Clerkship / WBCS)',
    'Teaching (TET / SLST)',
    'SSC & Central Govt.',
    'Railways (RRB)',
  ];

  String _selectedExamId = 'wbp-constable';

  final List<Map<String, dynamic>> _exams = [
    {
      'id': 'wbp-constable',
      'title': 'WBP Constable',
      'subtitle': 'West Bengal Police Constable Prelims & Mains',
      'category': 'WB Police (WBP / KP)',
      'emblem': 'assets/images/exams/emblem_wbp.png',
      'fallbackIcon': Icons.shield_rounded,
      'color': const Color(0xFFEF4444),
    },
    {
      'id': 'kp-police-si',
      'title': 'Kolkata Police SI',
      'subtitle': 'Kolkata Police Sub-Inspector & Sergeant',
      'category': 'WB Police (WBP / KP)',
      'emblem': 'assets/images/exams/emblem_wbp.png',
      'fallbackIcon': Icons.local_police_rounded,
      'color': const Color(0xFF1E3A8A),
    },
    {
      'id': 'wbpsc-clerkship',
      'title': 'WBPSC Clerkship',
      'subtitle': 'Public Service Commission Clerkship',
      'category': 'WBPSC (Clerkship / WBCS)',
      'emblem': 'assets/images/exams/emblem_wbpsc.png',
      'fallbackIcon': Icons.stars_rounded,
      'color': const Color(0xFFF59E0B),
    },
    {
      'id': 'wbcs-prelims',
      'title': 'WBCS Executive Prelims',
      'subtitle': 'West Bengal Civil Service Examination',
      'category': 'WBPSC (Clerkship / WBCS)',
      'emblem': 'assets/images/exams/emblem_wbpsc.png',
      'fallbackIcon': Icons.account_balance_rounded,
      'color': const Color(0xFFD97706),
    },
    {
      'id': 'wbssc-group-d',
      'title': 'WBSSC Group D',
      'subtitle': 'School Service Commission Group D',
      'category': 'Teaching (TET / SLST)',
      'emblem': 'assets/images/exams/emblem_wbssc.png',
      'fallbackIcon': Icons.school_rounded,
      'color': const Color(0xFFF97316),
    },
    {
      'id': 'primary-tet',
      'title': 'Primary TET',
      'subtitle': 'West Bengal Primary Teacher Eligibility Test',
      'category': 'Teaching (TET / SLST)',
      'emblem': 'assets/images/exams/emblem_tet.png',
      'fallbackIcon': Icons.menu_book_rounded,
      'color': const Color(0xFF8B5CF6),
    },
    {
      'id': 'ssc-gd',
      'title': 'SSC GD Constable',
      'subtitle': 'Staff Selection Commission GD',
      'category': 'SSC & Central Govt.',
      'emblem': 'assets/images/exams/emblem_ssc.png',
      'fallbackIcon': Icons.military_tech_rounded,
      'color': AppColors.primary,
    },
    {
      'id': 'ssc-cgl',
      'title': 'SSC CGL',
      'subtitle': 'Staff Selection Combined Graduate Level',
      'category': 'SSC & Central Govt.',
      'emblem': 'assets/images/exams/emblem_ssc.png',
      'fallbackIcon': Icons.work_rounded,
      'color': const Color(0xFF2563EB),
    },
    {
      'id': 'railway-group-d',
      'title': 'Railway Group D',
      'subtitle': 'Railway Recruitment Board Group D',
      'category': 'Railways (RRB)',
      'emblem': 'assets/images/exams/emblem_railway.png',
      'fallbackIcon': Icons.train_rounded,
      'color': const Color(0xFF0F172A),
    },
    {
      'id': 'railway-ntpc',
      'title': 'Railway NTPC',
      'subtitle': 'RRB Non-Technical Popular Categories',
      'category': 'Railways (RRB)',
      'emblem': 'assets/images/exams/emblem_railway.png',
      'fallbackIcon': Icons.directions_railway_rounded,
      'color': const Color(0xFF334155),
    },
  ];

  @override
  void initState() {
    super.initState();
    final saved = LocalStorageService.getTargetExam();
    if (saved != null && saved.isNotEmpty) {
      final match = _exams.firstWhere(
        (e) => e['title'] == saved || e['id'] == saved,
        orElse: () => _exams[0],
      );
      _selectedExamId = match['id'] as String;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _onContinue() async {
    final selected = _exams.firstWhere((e) => e['id'] == _selectedExamId);
    await LocalStorageService.saveTargetExam(selected['title'] as String);
    await LocalStorageService.setOnboardingCompleted(true);
    if (!mounted) return;
    if (widget.isProfileChange) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedCat = _categories[_selectedCategoryIndex];
    final query = _searchController.text.trim().toLowerCase();

    final filteredExams = _exams.where((exam) {
      final matchesCategory = selectedCat == 'All' || exam['category'] == selectedCat;
      final matchesQuery = query.isEmpty ||
          (exam['title'] as String).toLowerCase().contains(query) ||
          (exam['subtitle'] as String).toLowerCase().contains(query);
      return matchesCategory && matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(9),
                    child: Image.asset(
                      'assets/images/logo.png',
                      width: 32,
                      height: 32,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'PracticeKoro',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'Target Exam',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  const SizedBox(height: 8),

                  // Heading
                  const Text(
                    'Select Your\nTarget Exam',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                      letterSpacing: -0.5,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Choose your exam to get personalized\ncontent and test series.',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Search Bar
                  Container(
                    height: 46,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() {}),
                      decoration: const InputDecoration(
                        hintText: 'Search exams...',
                        hintStyle: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF94A3B8),
                        ),
                        prefixIcon: Icon(
                          Icons.search_rounded,
                          color: Color(0xFF94A3B8),
                          size: 20,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Category Pills
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(_categories.length, (idx) {
                        final isSel = _selectedCategoryIndex == idx;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedCategoryIndex = idx),
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primary : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _categories[idx],
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSel ? FontWeight.w700 : FontWeight.w600,
                                color: isSel ? Colors.white : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Exam List Cards
                  ...filteredExams.map((exam) {
                    final isSelected = exam['id'] == _selectedExamId;

                    return GestureDetector(
                      onTap: () => setState(() => _selectedExamId = exam['id'] as String),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFF0F6FF) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
                            width: isSelected ? 1.8 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Emblem
                            Container(
                              width: 44,
                              height: 44,
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                              ),
                              child: Image.asset(
                                exam['emblem'] as String,
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) => Icon(
                                  exam['fallbackIcon'] as IconData,
                                  color: exam['color'] as Color,
                                  size: 24,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),

                            // Title & Subtitle
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    exam['title'] as String,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                                      color: isSelected ? AppColors.primary : AppColors.navy,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    exam['subtitle'] as String,
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Selection Radio Indicator
                            Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected ? AppColors.primary : Colors.transparent,
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : const Color(0xFFCBD5E1),
                                  width: 1.5,
                                ),
                              ),
                              child: isSelected
                                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                                  : null,
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 12),
                ],
              ),
            ),

            // Fixed Bottom Continue Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _onContinue,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Continue',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
