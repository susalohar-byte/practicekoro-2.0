import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';

class PrimaryExamSelectionScreen extends StatefulWidget {
  final String? initialExamId;

  const PrimaryExamSelectionScreen({super.key, this.initialExamId});

  @override
  State<PrimaryExamSelectionScreen> createState() => _PrimaryExamSelectionScreenState();
}

class _PrimaryExamSelectionScreenState extends State<PrimaryExamSelectionScreen> {
  late String _selectedExam;

  final List<String> _exams = [
    'WBP Constable',
    'WBPSC Clerkship',
    'WBSSC Group D',
    'Primary TET',
    'Kolkata Police SI',
    'SSC GD Constable',
    'Railway Group D',
    'WBCS Executive Prelims',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialExamId != null) {
      if (widget.initialExamId == 'wbssc-group-d') {
        _selectedExam = 'WBSSC Group D';
      } else if (widget.initialExamId == 'wbpsc-clerkship') {
        _selectedExam = 'WBPSC Clerkship';
      } else if (widget.initialExamId == 'primary-tet') {
        _selectedExam = 'Primary TET';
      } else if (widget.initialExamId == 'kp-police-si' || widget.initialExamId == 'kp-si') {
        _selectedExam = 'Kolkata Police SI';
      } else if (widget.initialExamId == 'ssc-gd') {
        _selectedExam = 'SSC GD Constable';
      } else if (widget.initialExamId == 'railway-group-d') {
        _selectedExam = 'Railway Group D';
      } else {
        _selectedExam = 'WBP Constable';
      }
    } else {
      _selectedExam = 'WBP Constable';
    }
  }

  void _onContinue() {
    LocalStorageService.saveTargetExam(_selectedExam);
    LocalStorageService.setOnboardingCompleted(true);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Set Your Primary Exam',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'This helps us personalize your experience.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Radio Options List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _exams.length,
                itemBuilder: (context, index) {
                  final exam = _exams[index];
                  final isSelected = exam == _selectedExam;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () => setState(() => _selectedExam = exam),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryLight.withAlpha(120) : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.border,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            // Custom Radio with check
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected ? AppColors.primary : Colors.transparent,
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : AppColors.textMuted,
                                  width: 2,
                                ),
                              ),
                              child: isSelected
                                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    exam,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                      color: isSelected ? AppColors.navy : AppColors.textPrimary,
                                    ),
                                  ),
                                  if (isSelected) ...[
                                    const SizedBox(height: 2),
                                    const Text(
                                      'Selected',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ],
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

            // Bottom Continue Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'Continue',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
