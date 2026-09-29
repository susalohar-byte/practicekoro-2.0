import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/pk_pill_tabs.dart';

class SavedQuestionsScreen extends StatefulWidget {
  const SavedQuestionsScreen({super.key});

  @override
  State<SavedQuestionsScreen> createState() => _SavedQuestionsScreenState();
}

class _SavedQuestionsScreenState extends State<SavedQuestionsScreen> {
  int _selectedFilterIndex = 0;
  final List<String> _filters = ['All', 'Bookmarks', 'Incorrect'];

  final List<Map<String, dynamic>> _savedList = [];

  @override
  Widget build(BuildContext context) {
    final activeFilter = _filters[_selectedFilterIndex];
    final items = _savedList.where((item) {
      if (activeFilter == 'All') return true;
      return item['type'] == activeFilter;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Saved Questions',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.navy),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 12),

            // Tabs
            PKPillTabs(
              tabs: _filters,
              selectedIndex: _selectedFilterIndex,
              onTabSelected: (idx) => setState(() => _selectedFilterIndex = idx),
            ),

            const SizedBox(height: 12),

            // List of Saved Questions
            Expanded(
              child: items.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No saved questions yet.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                      ),
                    )
                  : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () {
                        context.push('/solutions/test-wbp-001');
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: (item['color'] as Color).withAlpha(25),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                item['icon'] as IconData,
                                color: item['color'] as Color,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['title'] as String,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.navy,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${item['subject']} • ${item['date']}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.textMuted,
                              size: 20,
                            ),
                          ],
                        ),
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
