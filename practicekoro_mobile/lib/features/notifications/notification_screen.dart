import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 14: Notification Screen
/// Exact reproduction of Screen 14 from the design mockup.
class NotificationScreen extends ConsumerStatefulWidget {
  const NotificationScreen({super.key});

  @override
  ConsumerState<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends ConsumerState<NotificationScreen> {
  int _selectedFilterIndex = 0; // 0: All, 1: Updates, 2: Offers, 3: Important

  static const List<String> _filters = ['All', 'Updates', 'Offers', 'Important'];

  final List<Map<String, dynamic>> _notifications = [
    {
      'type': 'updates',
      'title': 'New Mock Test Added',
      'desc': 'WBP Constable Full Mock Test 05 is now available.',
      'time': '2 hours ago',
      'icon': Icons.shield_rounded,
      'color': Color(0xFFEF4444),
      'bg': Color(0xFFFEE2E2),
      'route': '/test-details/test-wbp-005',
    },
    {
      'type': 'offers',
      'title': 'Special Offer',
      'desc': 'Get 50% OFF on 1 Year Plan. Use code PK50',
      'time': '1 day ago',
      'icon': Icons.card_giftcard_rounded,
      'color': Color(0xFF10B981),
      'bg': Color(0xFFDCFCE7),
      'route': '/subscription',
    },
    {
      'type': 'updates',
      'title': 'Test Result Available',
      'desc': 'Your WBSSC Group C Mock Test result is ready.',
      'time': '2 days ago',
      'icon': Icons.bar_chart_rounded,
      'color': Color(0xFF026BFC),
      'bg': Color(0xFFDBEAFE),
      'route': '/results',
    },
    {
      'type': 'important',
      'title': 'Daily Challenge',
      'desc': "Today's practice challenge is live!",
      'time': '2 days ago',
      'icon': Icons.track_changes_rounded,
      'color': Color(0xFFF59E0B),
      'bg': Color(0xFFFEF3C7),
      'route': '/live-test/test-wbp-001',
    },
    {
      'type': 'important',
      'title': 'Subscription Expiring',
      'desc': 'Your PRO plan will expire in 5 days.',
      'time': '3 days ago',
      'icon': Icons.warning_amber_rounded,
      'color': Color(0xFFF59E0B),
      'bg': Color(0xFFFEF3C7),
      'route': '/subscription',
    },
  ];

  String _formatRelativeTime(dynamic dateVal) {
    if (dateVal == null) return 'Recently';
    final dt = dateVal is DateTime ? dateVal : DateTime.tryParse(dateVal.toString());
    if (dt == null) return 'Recently';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes.clamp(1, 60)} min ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} hours ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${(diff.inDays / 7).floor()} weeks ago';
    }
  }

  IconData _iconForNotif(String type, String title) {
    final t = '$type $title'.toLowerCase();
    if (t.contains('offer') || t.contains('discount') || t.contains('coupon')) return Icons.card_giftcard_rounded;
    if (t.contains('exam') || t.contains('test') || t.contains('mock')) return Icons.shield_rounded;
    if (t.contains('result') || t.contains('rank')) return Icons.bar_chart_rounded;
    if (t.contains('alert') || t.contains('warning') || t.contains('expir')) return Icons.warning_amber_rounded;
    return Icons.notifications_active_rounded;
  }

  Color _colorForNotif(String type, String title) {
    final t = '$type $title'.toLowerCase();
    if (t.contains('offer') || t.contains('discount')) return const Color(0xFF10B981);
    if (t.contains('exam') || t.contains('test')) return const Color(0xFFEF4444);
    if (t.contains('result') || t.contains('rank')) return const Color(0xFF026BFC);
    if (t.contains('alert') || t.contains('warning')) return const Color(0xFFF59E0B);
    return const Color(0xFF026BFC);
  }

  Color _bgForNotif(String type, String title) {
    final t = '$type $title'.toLowerCase();
    if (t.contains('offer') || t.contains('discount')) return const Color(0xFFDCFCE7);
    if (t.contains('exam') || t.contains('test')) return const Color(0xFFFEE2E2);
    if (t.contains('result') || t.contains('rank')) return const Color(0xFFDBEAFE);
    if (t.contains('alert') || t.contains('warning')) return const Color(0xFFFEF3C7);
    return const Color(0xFFDBEAFE);
  }

  @override
  Widget build(BuildContext context) {
    final notifsAsync = ref.watch(notificationsProvider);

    final List<Map<String, dynamic>> sourceList;
    if (notifsAsync.value != null && notifsAsync.value!.isNotEmpty) {
      sourceList = notifsAsync.value!.map((n) {
        final rawType = (n['type'] as String? ?? 'updates').toLowerCase();
        final title = (n['title'] as String? ?? 'Notification');
        final desc = (n['message'] ?? n['body'] ?? '') as String;
        String mappedType = 'updates';
        if (rawType.contains('offer') || rawType.contains('promo')) {
          mappedType = 'offers';
        } else if (rawType.contains('important') || rawType.contains('alert') || rawType.contains('urgent')) {
          mappedType = 'important';
        }
        return {
          'type': mappedType,
          'title': title,
          'desc': desc,
          'time': _formatRelativeTime(n['created_at']),
          'icon': _iconForNotif(rawType, title),
          'color': _colorForNotif(rawType, title),
          'bg': _bgForNotif(rawType, title),
          'route': n['action_url'] ?? n['link'] ?? '/home',
        };
      }).toList();
    } else {
      sourceList = _notifications;
    }

    final filtered = sourceList.where((n) {
      if (_selectedFilterIndex == 1 && n['type'] != 'updates') return false;
      if (_selectedFilterIndex == 2 && n['type'] != 'offers') return false;
      if (_selectedFilterIndex == 3 && n['type'] != 'important') return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/home'),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: Color(0xFF026BFC), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All notifications marked as read.')),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF026BFC),
          onRefresh: () async {
            ref.invalidate(notificationsProvider);
            await ref.read(notificationsProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            children: [
              // Filter Pills (Screen 14)
              _buildFilterPills(),
              const SizedBox(height: 16),

              // Notifications List (Screen 14)
              ...filtered.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildNotificationCard(item),
                  )),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterPills() {
    return SizedBox(
      height: 32,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _filters.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final active = i == _selectedFilterIndex;
          return InkWell(
            onTap: () => setState(() => _selectedFilterIndex = i),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: active ? const Color(0xFF026BFC) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: active ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Center(
                child: Text(
                  _filters[i],
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                    color: active ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> item) {
    return InkWell(
      onTap: () {
        if (item['route'] != null) {
          context.push(item['route'] as String);
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: item['bg'] as Color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                item['icon'] as IconData,
                color: item['color'] as Color,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'] as String,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    item['desc'] as String,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF475569),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item['time'] as String,
                    style: const TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF94A3B8),
                    ),
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
