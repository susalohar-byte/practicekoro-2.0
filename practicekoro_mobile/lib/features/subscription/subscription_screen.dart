import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 12: Subscription Screen ("Go Premium")
/// Exact reproduction of Screen 12 from the design mockup.
class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  int _selectedPlan = 1; // 0: 6 Months, 1: 1 Year (Most Popular)

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(subscriptionPlansProvider);
    final List<Map<String, dynamic>> plans;
    if (plansAsync.value != null && plansAsync.value!.length >= 2) {
      plans = plansAsync.value!.map((p) {
        final price = (p['price'] as num?)?.toInt() ?? 299;
        final origPrice = (p['original_price'] as num?)?.toInt() ?? (price * 1.5).round();
        final discountPct = origPrice > price ? (((origPrice - price) / origPrice) * 100).round() : 40;
        final isPop = (p['is_popular'] as bool?) ?? (p['is_featured'] as bool?) ?? false;
        return {
          'id': p['id']?.toString() ?? 'plan',
          'title': p['name'] ?? p['title'] ?? 'Plan',
          'price': '₹$price',
          'originalPrice': '₹$origPrice',
          'discount': '$discountPct% OFF',
          'isPopular': isPop,
          'numericPrice': price,
        };
      }).toList();
    } else {
      plans = [
        {
          'id': '6_months',
          'title': '6 Months',
          'price': '₹299',
          'originalPrice': '₹499',
          'discount': '40% OFF',
          'isPopular': false,
          'numericPrice': 299,
        },
        {
          'id': '1_year',
          'title': '1 Year',
          'price': '₹499',
          'originalPrice': '₹999',
          'discount': '50% OFF',
          'isPopular': true,
          'numericPrice': 499,
        },
      ];
    }

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
          'Go Premium',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF026BFC),
          onRefresh: () async {
            ref.invalidate(subscriptionPlansProvider);
            await ref.read(subscriptionPlansProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            children: [
              // 1. Hero Pitch Section (Screen 12)
              _buildHeroPitchCard(),
              const SizedBox(height: 20),

              // 2. Side-by-Side Pricing Cards (Screen 12)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _buildPlanCard(
                      title: plans[0]['title'] as String,
                      price: plans[0]['price'] as String,
                      originalPrice: plans[0]['originalPrice'] as String,
                      discount: plans[0]['discount'] as String,
                      isPopular: plans[0]['isPopular'] as bool,
                      isSelected: _selectedPlan == 0,
                      onSelect: () {
                        setState(() => _selectedPlan = 0);
                        final p = plans[0];
                        context.push(
                          '/payment?planId=${p['id']}&price=${p['numericPrice']}&title=${Uri.encodeComponent(p['title'] as String)}',
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPlanCard(
                      title: plans[1]['title'] as String,
                      price: plans[1]['price'] as String,
                      originalPrice: plans[1]['originalPrice'] as String,
                      discount: plans[1]['discount'] as String,
                      isPopular: plans[1]['isPopular'] as bool,
                      isSelected: _selectedPlan == 1,
                      onSelect: () {
                        setState(() => _selectedPlan = 1);
                        final p = plans[1];
                        context.push(
                          '/payment?planId=${p['id']}&price=${p['numericPrice']}&title=${Uri.encodeComponent(p['title'] as String)}',
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // 1. Hero Pitch Card
  Widget _buildHeroPitchCard() {
    final features = [
      'Access to all Mock Tests',
      'Topic-wise & Subject-wise Tests',
      'Official Previous Year Questions',
      'Detailed Analysis & Rank',
      'Ad-free Experience',
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Unlock the full potential of your preparation',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 14),
          ...features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDCFCE7),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.check_rounded, color: Color(0xFF16A34A), size: 14),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        f,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  // 2. Pricing Card (Side by Side matching Screen 12)
  Widget _buildPlanCard({
    required String title,
    required String price,
    required String originalPrice,
    required String discount,
    required bool isPopular,
    required bool isSelected,
    required VoidCallback onSelect,
  }) {
    final features = [
      'All Mock Tests',
      'Subject Tests',
      'Topic Tests',
      'PYQs',
      'Detailed Analysis',
    ];

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isPopular ? const Color(0xFFF43F5E) : const Color(0xFFE2E8F0),
              width: isPopular ? 1.5 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: isPopular
                    ? const Color(0xFFF43F5E).withValues(alpha: 0.08)
                    : const Color(0x06000000),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isPopular) const SizedBox(height: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                price,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(
                    originalPrice,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF94A3B8),
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      discount,
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              const SizedBox(height: 10),
              // Feature list
              ...features.map((feat) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_rounded, color: Color(0xFF10B981), size: 14),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            feat,
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF475569),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
              const SizedBox(height: 14),
              // Select Plan Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onSelect,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isPopular ? const Color(0xFF026BFC) : const Color(0xFF0D9488),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Select Plan',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
        // Most Popular Pill
        if (isPopular)
          Positioned(
            top: -10,
            right: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFF43F5E),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Most Popular',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
