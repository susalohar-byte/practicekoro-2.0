import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 13: Payment Screen
/// Exact 1:1 match to Screen 13 with authentic Razorpay SDK integration.
class PaymentScreen extends ConsumerStatefulWidget {
  final String planId;
  final String planTitle;
  final int originalPrice;

  const PaymentScreen({
    super.key,
    this.planId = '1_year',
    this.planTitle = '1 Year Plan',
    this.originalPrice = 499,
  });

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  final TextEditingController _couponController = TextEditingController();
  late Razorpay _razorpay;
  int _selectedMethod = 0; // 0: Razorpay, 1: UPI, 2: Card, 3: Net Banking, 4: Wallets
  String? _appliedCoupon;
  int _discount = 0;
  bool _isProcessing = false;
  String? _currentOrderId;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    _couponController.dispose();
    super.dispose();
  }

  void _applyCoupon(int basePrice) async {
    final code = _couponController.text.trim().toUpperCase();
    if (code.isEmpty) return;

    try {
      final coupon = await ref.read(catalogRepositoryProvider).validateCoupon(code);
      if (!mounted) return;
      if (coupon != null) {
        final pct = (coupon['discount_percent'] as num?)?.toDouble() ?? 0;
        final amt = (coupon['discount_amount'] as num?)?.toDouble() ?? 0;
        int disc = 0;
        if (pct > 0) {
          disc = (basePrice * (pct / 100)).round();
        } else if (amt > 0) {
          disc = amt.round();
        }
        setState(() {
          _appliedCoupon = code;
          _discount = disc.clamp(0, basePrice);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Coupon $code applied! ₹$_discount Discount added.')),
        );
        return;
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Coupon "$code" is not valid or expired.')),
      );
    }
  }

  void _processPayment(int finalPrice) async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final orderData = await ref.read(catalogRepositoryProvider).createPaymentOrder(widget.planId);
      final orderId = orderData['order_id']?.toString();
      final keyId = (orderData['key_id'] != null && orderData['key_id'].toString().trim().isNotEmpty)
          ? orderData['key_id'].toString().trim()
          : 'rzp_live_TdoDuJhIn8jWT5';

      _currentOrderId = orderId;

      final userEmail = LocalStorageService.getUserEmail() ?? '';
      final userPhone = LocalStorageService.getUserPhone() ?? '';

      final options = <String, dynamic>{
        'key': keyId,
        'amount': (finalPrice * 100).toInt(),
        'name': 'PracticeKoro',
        'description': widget.planTitle,
        if (orderId != null && !orderId.startsWith('pk_local_')) 'order_id': orderId,
        'prefill': {
          if (userPhone.isNotEmpty) 'contact': userPhone,
          if (userEmail.isNotEmpty) 'email': userEmail,
        },
        'external': {
          'wallets': ['paytm']
        }
      };

      _razorpay.open(options);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to initiate payment: ${e.toString().replaceAll("Exception:", "").trim()}'),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (!mounted) return;
    setState(() => _isProcessing = true);

    try {
      final verified = await ref.read(catalogRepositoryProvider).verifyPayment(
        orderId: _currentOrderId ?? response.orderId ?? '',
        paymentId: response.paymentId ?? '',
        signature: response.signature ?? '',
        planId: widget.planId,
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      if (verified) {
        await LocalStorageService.setProUser(true);
        _showSuccessDialog();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment recorded (${response.paymentId}). Verification in progress...'),
            backgroundColor: Colors.orange.shade800,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment successful (${response.paymentId}). Pro access is being updated.'),
          backgroundColor: Colors.orange.shade800,
        ),
      );
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _isProcessing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment cancelled or failed (${response.code}): ${response.message ?? ""}'),
        backgroundColor: Colors.red.shade700,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    setState(() => _isProcessing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External wallet chosen: ${response.walletName}')),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 36),
            ),
            const SizedBox(height: 14),
            const Text(
              'Payment Successful!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 6),
            Text(
              'You now have active PRO access for ${widget.planTitle}.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  context.go('/profile');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF026BFC),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Back to Profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Determine authoritative base price from subscriptionPlansProvider if available
    final plansAsync = ref.watch(subscriptionPlansProvider);
    final plans = plansAsync.asData?.value;
    final matchedPlan = plans?.firstWhere(
      (p) => p['id']?.toString() == widget.planId,
      orElse: () => <String, dynamic>{},
    );
    final basePrice = (matchedPlan != null && matchedPlan['price'] != null)
        ? (matchedPlan['price'] as num).toInt()
        : widget.originalPrice;

    final finalPrice = (basePrice - _discount).clamp(0, 9999);

    final paymentMethods = [
      {'title': 'Razorpay', 'desc': '(UPI, Cards, Wallets)', 'icon': Icons.flash_on_rounded},
      {'title': 'UPI', 'desc': '(GPay, PhonePe, Paytm, BHIM)', 'icon': Icons.account_balance_rounded},
      {'title': 'Credit / Debit Card', 'desc': '(Visa, MasterCard, RuPay)', 'icon': Icons.credit_card_rounded},
      {'title': 'Net Banking', 'desc': '(All Indian Banks)', 'icon': Icons.account_balance_wallet_rounded},
      {'title': 'Wallets', 'desc': '(PhonePe, GPay, Paytm)', 'icon': Icons.wallet_rounded},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/subscription'),
        ),
        title: const Text(
          'Payment',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                children: [
                  // 1. Selected Plan Card (Screen 13)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x06000000),
                          blurRadius: 10,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.workspace_premium_rounded,
                            color: Color(0xFFD97706),
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.planTitle,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                '50% OFF • Validity: 12 Months',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹$finalPrice',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 2. Apply Coupon Code Section (Screen 13)
                  const Text(
                    'Apply Coupon Code',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _couponController,
                            textCapitalization: TextCapitalization.characters,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            decoration: const InputDecoration(
                              hintText: 'Enter coupon code',
                              hintStyle: TextStyle(fontSize: 13, color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => _applyCoupon(basePrice),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF026BFC),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            minimumSize: const Size(0, 36),
                          ),
                          child: const Text('Apply', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                  ),
                  if (_appliedCoupon != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF10B981)),
                        const SizedBox(width: 4),
                        Text(
                          'Coupon "$_appliedCoupon" applied (-₹$_discount)',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF10B981),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),

                  // 3. Payment Method Section (Screen 13)
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: List.generate(paymentMethods.length, (i) {
                        final method = paymentMethods[i];
                        final isSel = _selectedMethod == i;
                        return Column(
                          children: [
                            InkWell(
                              onTap: () => setState(() => _selectedMethod = i),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                child: Row(
                                  children: [
                                    Icon(
                                      method['icon'] as IconData,
                                      color: isSel ? const Color(0xFF026BFC) : const Color(0xFF64748B),
                                      size: 20,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Text(
                                            method['title'] as String,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                                              color: const Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Flexible(
                                            child: Text(
                                              method['desc'] as String,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Color(0xFF64748B),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      width: 18,
                                      height: 18,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSel ? const Color(0xFF026BFC) : const Color(0xFFCBD5E1),
                                          width: isSel ? 5 : 1.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (i < paymentMethods.length - 1)
                              const Divider(height: 1, indent: 46, color: Color(0xFFF1F5F9)),
                          ],
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),

            // 4. Pay Button (Bottom)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : () => _processPayment(finalPrice),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF026BFC),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(
                          'Pay ₹$finalPrice →',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
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
