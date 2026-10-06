import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/exam_assets.dart';

/// Data representation of an individual Test Series for the catalog card.
class TestSeriesItemData {
  final String id;
  final String category;
  final String title;
  final String subtitle;
  final int fullMockCount;
  final int topicTestCount;
  final int pyqTestCount;
  final String syllabus;
  final String emblemType;
  final List<Color> iconGradient;
  final String? assetPath;

  const TestSeriesItemData({
    required this.id,
    required this.category,
    required this.title,
    required this.subtitle,
    required this.fullMockCount,
    required this.topicTestCount,
    required this.pyqTestCount,
    this.syllabus = 'Full Syllabus',
    required this.emblemType,
    required this.iconGradient,
    this.assetPath,
  });

  int get totalTestsCount => fullMockCount + topicTestCount + pyqTestCount;
  String get testsCount => '$totalTestsCount Tests';
}

/// Reusable Test Series Card matching the PracticeKoro Test Series reference design.
///
/// Hierarchy:
/// TestSeriesCard
///  ├── ExamIcon (Square container with soft gradient and centered emblem)
///  ├── Content Column:
///  │    ├── Title + SyllabusBadge (Full Syllabus pill on the far right)
///  │    ├── Subtitle
///  │    └── Bottom Row:
///  │         ├── Stat Chips: Full Mock Tests, Topic Tests, PYQ Tests
///  │         └── ViewButton (Clean light-blue pill button on the far right)
class TestSeriesCard extends StatelessWidget {
  final TestSeriesItemData item;
  final VoidCallback? onViewTap;

  const TestSeriesCard({
    super.key,
    required this.item,
    this.onViewTap,
  });

  void _handleView(BuildContext context) {
    if (onViewTap != null) {
      onViewTap!();
    } else {
      context.push('/test-series/${item.id}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isCompact = screenWidth < 360;
    final iconSize = isCompact ? 54.0 : 66.0;

    return GestureDetector(
      onTap: () => _handleView(context),
      behavior: HitTestBehavior.opaque,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFE8EEF7),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF07194A).withValues(alpha: 0.035),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        padding: EdgeInsets.symmetric(horizontal: isCompact ? 9 : 11, vertical: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Left: Square Exam Emblem Icon (prominent, square, ~66px)
            _ExamIcon(item: item, size: iconSize),
            SizedBox(width: isCompact ? 9 : 12),

            // Right: Content Column
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top Row: Title + Full Syllabus Badge on far right
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF07194A),
                            letterSpacing: -0.3,
                            height: 1.2,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      _SyllabusBadge(syllabusText: item.syllabus),
                    ],
                  ),
                  const SizedBox(height: 2),

                  // Subtitle
                  Text(
                    item.subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                      height: 1.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 7),

                  // Bottom Row: 3 Stat Chips + View Button
                  LayoutBuilder(
                    builder: (context, constraints) {
                      return FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: ConstrainedBox(
                          constraints: BoxConstraints(minWidth: constraints.maxWidth),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _StatBoxItem(
                                    icon: Icons.description_outlined,
                                    iconColor: const Color(0xFF0066FF),
                                    bgColor: const Color(0xFFEEF5FF),
                                    count: item.fullMockCount,
                                    label: 'Full Mock',
                                  ),
                                  const SizedBox(width: 5),
                                  _StatBoxItem(
                                    icon: Icons.menu_book_rounded,
                                    iconColor: const Color(0xFF10B981),
                                    bgColor: const Color(0xFFEDF8F2),
                                    count: item.topicTestCount,
                                    label: 'Topic',
                                  ),
                                  const SizedBox(width: 5),
                                  _StatBoxItem(
                                    icon: Icons.assignment_outlined,
                                    iconColor: const Color(0xFFF59E0B),
                                    bgColor: const Color(0xFFFFF7ED),
                                    count: item.pyqTestCount,
                                    label: 'PYQ',
                                  ),
                                ],
                              ),
                              const SizedBox(width: 8),
                              _ViewButton(
                                onTap: () => _handleView(context),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────
// 1. EXAM ICON COMPONENT (SQUARE WITH SOFT GRADIENT)
// ──────────────────────────────────────────
class _ExamIcon extends StatelessWidget {
  final TestSeriesItemData item;
  final double size;

  const _ExamIcon({
    required this.item,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: item.iconGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: item.iconGradient.first.withValues(alpha: 0.22),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Soft inner decorative curve
            Positioned(
              right: -size * 0.25,
              bottom: -size * 0.25,
              child: Container(
                width: size * 0.85,
                height: size * 0.85,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.18),
                ),
              ),
            ),
            // Centered Logo / Emblem
            Padding(
              padding: EdgeInsets.all(size * 0.1),
              child: Builder(
                builder: (_) {
                  final asset = item.assetPath ?? ExamAssets.getEmblemAsset(item.title);
                  if (asset != null) {
                    return Image.asset(
                      asset,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => _buildFallbackVector(),
                    );
                  }
                  return _buildFallbackVector();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackVector() {
    IconData icon;
    Color iconColor;
    if (item.category == 'Police') {
      icon = Icons.local_police_rounded;
      iconColor = const Color(0xFFC2410C);
    } else if (item.category == 'Railway') {
      icon = Icons.train_rounded;
      iconColor = const Color(0xFF0066FF);
    } else if (item.category == 'Teaching') {
      icon = Icons.school_rounded;
      iconColor = const Color(0xFFD97706);
    } else {
      icon = Icons.shield_rounded;
      iconColor = const Color(0xFFDC2626);
    }

    return Icon(
      icon,
      size: size * 0.5,
      color: iconColor,
    );
  }
}

// ──────────────────────────────────────────
// 2. SYLLABUS BADGE COMPONENT
// ──────────────────────────────────────────
class _SyllabusBadge extends StatelessWidget {
  final String syllabusText;

  const _SyllabusBadge({
    required this.syllabusText,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 7.5,
        vertical: 3.5,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFEDF5FF),
        borderRadius: BorderRadius.circular(7),
        border: Border.all(
          color: const Color(0xFFD6E6FE),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.account_balance_rounded,
            size: 11,
            color: Color(0xFF0066FF),
          ),
          const SizedBox(width: 3.5),
          Text(
            syllabusText,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0066FF),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────
// 3. STAT BOX ITEM COMPONENT (COMPACT CHIP)
// ──────────────────────────────────────────
class _StatBoxItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final int count;
  final String label;

  const _StatBoxItem({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.count,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 7,
        vertical: 3.5,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(7),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 13.5,
            color: iconColor,
          ),
          const SizedBox(width: 4.5),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                count.toString(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF07194A),
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                  height: 1.1,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────
// 4. VIEW BUTTON COMPONENT (COMPACT PILL)
// ──────────────────────────────────────────
class _ViewButton extends StatelessWidget {
  final VoidCallback onTap;

  const _ViewButton({
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: const Color(0xFFEDF5FF),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 11,
            vertical: 5,
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'View',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0066FF),
                  letterSpacing: -0.2,
                ),
              ),
              SizedBox(width: 3),
              Icon(
                Icons.arrow_forward_rounded,
                size: 13,
                color: Color(0xFF0066FF),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
