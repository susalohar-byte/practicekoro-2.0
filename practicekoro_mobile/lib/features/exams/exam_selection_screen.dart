import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/catalog_repository.dart';

class ExamSelectionScreen extends StatefulWidget {
  final bool isProfileChange;

  const ExamSelectionScreen({super.key, this.isProfileChange = false});

  @override
  State<ExamSelectionScreen> createState() => _ExamSelectionScreenState();
}

class _ExamSelectionScreenState extends State<ExamSelectionScreen> {
  int _selectedCategoryIndex = 0;
  final TextEditingController _searchController = TextEditingController();
  List<String> _categories = ['West Bengal', 'Central', 'Teaching', 'Others'];
  String _selectedExamId = '';
  List<Map<String, dynamic>> _exams = const [];
  bool _loadingExams = true;

  IconData _examIcon(String title, String category) {
    final t = title.toLowerCase();
    if (t.contains('wbp') || t.contains('kp') || t.contains('police')) {
      return Icons.shield_rounded;
    }
    if (t.contains('ssc') || t.contains('gd')) {
      return Icons.military_tech_rounded;
    }
    if (t.contains('tet') || t.contains('teach')) {
      return Icons.school_rounded;
    }
    if (t.contains('rail') || t.contains('alp') || t.contains('ntpc')) {
      return Icons.train_rounded;
    }
    if (t.contains('psc') || t.contains('wbpsc')) {
      return Icons.account_balance_rounded;
    }
    if (t.contains('panchayat')) {
      return Icons.cottage_rounded;
    }
    return Icons.menu_book_rounded;
  }

  Color _examColor(String title, String category) {
    final t = title.toLowerCase();
    if (t.contains('wbp')) return const Color(0xFFDC2626); // WBP Red
    if (t.contains('kp')) return const Color(0xFF2563EB); // KP Blue
    if (t.contains('ssc')) return const Color(0xFFEA580C); // SSC Orange
    if (t.contains('tet')) return const Color(0xFF16A34A); // TET Green
    if (t.contains('rail')) return const Color(0xFF7C3AED); // Railway Purple
    if (t.contains('psc')) return const Color(0xFF0D9488); // PSC Teal
    if (t.contains('panchayat')) return const Color(0xFFD97706); // Panchayat Amber
    return const Color(0xFF026BFC);
  }

  String _bengaliSubtitle(String title, String defaultSub) {
    final t = title.toLowerCase();
    if (t.contains('wbp')) return 'পশ্চিমবঙ্গ পুলিশ';
    if (t.contains('kp')) return 'কলকাতা পুলিশ';
    if (t.contains('ssc')) return 'কেন্দ্রীয় বাহিনী';
    if (t.contains('tet')) return 'শিক্ষক নিয়োগ';
    if (t.contains('rail')) return 'রেলওয়ে';
    if (t.contains('psc')) return 'রাজ্য সরকারি';
    if (t.contains('panchayat')) return 'পঞ্চায়েত';
    return defaultSub.isNotEmpty ? defaultSub : 'সরকারি পরীক্ষা প্রস্তুতি';
  }

  Future<void> _loadExams() async {
    try {
      final rows = await CatalogRepository().getExams();
      final exams = rows.map((exam) {
        return <String, dynamic>{
          'id': exam.id,
          'title': exam.title,
          'subtitle': _bengaliSubtitle(exam.title, exam.description ?? ''),
          'category': exam.category,
          'imageUrl': exam.bannerUrl,
          'fallbackIcon': _examIcon(exam.title, exam.category),
          'color': _examColor(exam.title, exam.category),
        };
      }).toList();

      if (!mounted) return;

      // Extract unique categories, ensuring reference categories come first
      final dynamicCats = exams.map((e) => e['category'] as String).toSet();
      final defaultTabs = ['West Bengal', 'Central', 'Teaching', 'Others'];
      final combined = <String>[];
      for (final cat in defaultTabs) {
        if (dynamicCats.contains(cat) || combined.length < 4) {
          combined.add(cat);
        }
      }
      for (final cat in dynamicCats) {
        if (!combined.contains(cat)) combined.add(cat);
      }

      final saved = LocalStorageService.getTargetExam();
      Map<String, dynamic>? chosen;
      for (final exam in exams) {
        if (exam['id'] == saved || exam['title'] == saved) {
          chosen = exam;
          break;
        }
      }

      setState(() {
        _exams = exams;
        _categories = combined.isNotEmpty ? combined : ['All', 'West Bengal', 'Central', 'Teaching'];
        _selectedCategoryIndex = 0;
        _selectedExamId = chosen?['id'] as String? ?? (exams.isEmpty ? '' : exams.first['id'] as String);
        _loadingExams = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingExams = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadExams();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _selectExam(Map<String, dynamic> exam) async {
    setState(() => _selectedExamId = exam['id'] as String);
    await LocalStorageService.saveTargetExam(exam['title'] as String);
    await LocalStorageService.setOnboardingCompleted(true);
    if (!mounted) return;
    if (widget.isProfileChange && context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedCat = _categories.isEmpty
        ? 'West Bengal'
        : _categories[_selectedCategoryIndex.clamp(0, _categories.length - 1)];
    final query = _searchController.text.trim().toLowerCase();

    final filteredExams = _exams.where((exam) {
      final cat = (exam['category'] as String? ?? '').toLowerCase();
      final sel = selectedCat.toLowerCase();
      final matchesCategory = selectedCat == 'All' ||
          cat.contains(sel) ||
          (sel.contains('bengal') && (cat.contains('wb') || cat.contains('state') || cat.contains('police') || cat.contains('psc'))) ||
          (sel.contains('central') && (cat.contains('ssc') || cat.contains('central') || cat.contains('rail'))) ||
          (sel.contains('teach') && (cat.contains('tet') || cat.contains('teach') || cat.contains('school')));

      final matchesQuery = query.isEmpty ||
          (exam['title'] as String).toLowerCase().contains(query) ||
          ((exam['subtitle'] as String?) ?? '').toLowerCase().contains(query);
      return (query.isNotEmpty || matchesCategory) && matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Navigation Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/home');
                      }
                    },
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                    color: const Color(0xFF051A43),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'পরীক্ষা নির্বাচন',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF051A43),
                      letterSpacing: -0.3,
                    ),
                  ),
                ],
              ),
            ),

            // Subtitle
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 2),
              child: Text(
                'আপনার প্রস্তুতি পরীক্ষাটি নির্বাচন করুন',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() {}),
                  style: const TextStyle(fontSize: 13.5, color: Color(0xFF0F172A)),
                  decoration: InputDecoration(
                    hintText: 'পরীক্ষার নাম দিয়ে খুঁজুন...',
                    hintStyle: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF94A3B8),
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: Color(0xFF94A3B8),
                      size: 20,
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              setState(() {});
                            },
                            child: const Icon(
                              Icons.cancel_rounded,
                              color: Color(0xFF94A3B8),
                              size: 18,
                            ),
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Category Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: List.generate(_categories.length, (idx) {
                  final isSel = _selectedCategoryIndex == idx;
                  final title = _categories[idx];
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategoryIndex = idx),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w600,
                          color: isSel ? Colors.white : const Color(0xFF475569),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 14),

            // Exam List
            Expanded(
              child: _loadingExams
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF026BFC)))
                  : filteredExams.isEmpty
                      ? const Center(
                          child: Text(
                            'কোনো পরীক্ষা পাওয়া যায়নি',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                          itemCount: filteredExams.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final exam = filteredExams[index];
                            final color = exam['color'] as Color;
                            final icon = exam['fallbackIcon'] as IconData;
                            final isSelected = exam['id'] == _selectedExamId;

                            return InkWell(
                              onTap: () => _selectExam(exam),
                              borderRadius: BorderRadius.circular(14),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                                    width: isSelected ? 1.5 : 1,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    // Circular Exam Icon Badge
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: color.withValues(alpha: 0.1),
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: color.withValues(alpha: 0.25),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: Center(
                                        child: Icon(
                                          icon,
                                          color: color,
                                          size: 22,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 14),

                                    // Title & Bengali Subtitle
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            exam['title'] as String,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFF051A43),
                                              letterSpacing: -0.2,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            exam['subtitle'] as String,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                              color: Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Indicator
                                    Icon(
                                      isSelected ? Icons.check_circle_rounded : Icons.chevron_right_rounded,
                                      color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF94A3B8),
                                      size: 22,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
