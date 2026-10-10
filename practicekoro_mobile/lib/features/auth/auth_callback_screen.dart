import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/repositories/auth_repository.dart';

/// Screen displayed when redirected back from Google OAuth via deep link.
/// Extracts session, synchronizes user profile, and navigates to the home dashboard.
class AuthCallbackScreen extends ConsumerStatefulWidget {
  const AuthCallbackScreen({super.key});

  @override
  ConsumerState<AuthCallbackScreen> createState() => _AuthCallbackScreenState();
}

class _AuthCallbackScreenState extends ConsumerState<AuthCallbackScreen> {
  StreamSubscription<AuthState>? _authSubscription;
  Timer? _timeoutTimer;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _processAuthCallback();
  }

  User? _getCurrentUser() {
    try {
      return Supabase.instance.client.auth.currentUser;
    } catch (_) {
      return null;
    }
  }

  void _processAuthCallback() {
    final authRepo = ref.read(authRepositoryProvider);

    // 1. If user is already authenticated, complete immediately
    final currentUser = _getCurrentUser();
    if (currentUser != null) {
      _navigateHome(currentUser);
      return;
    }

    // 2. Listen for auth state change triggered by the deep link tokens
    _authSubscription = authRepo.authStateChanges?.listen((data) {
      final session = data.session;
      if (session != null && mounted) {
        _navigateHome(session.user);
      }
    });

    // 3. Fallback timeout: if OAuth exchange doesn't complete within 12 seconds
    _timeoutTimer = Timer(const Duration(seconds: 12), () {
      if (!mounted) return;
      final fallbackUser = _getCurrentUser();
      if (fallbackUser != null) {
        _navigateHome(fallbackUser);
      } else {
        setState(() {
          _hasError = true;
          _errorMessage =
              'Google sign-in took too long or was interrupted. Please try again.';
        });
      }
    });
  }

  Future<void> _navigateHome(User user) async {
    _timeoutTimer?.cancel();
    _authSubscription?.cancel();

    try {
      await ref.read(authRepositoryProvider).syncUserProfile(user);
    } catch (_) {
      // Profile sync failure should not block login
    }

    if (mounted) {
      context.go('/home');
    }
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App Logo Icon
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF026BFC).withValues(alpha: 0.12),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                    border: Border.all(
                      color: const Color(0xFFE2E8F0),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Image.asset(
                      'assets/images/google_logo.png',
                      width: 36,
                      height: 36,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.g_mobiledata_rounded,
                        color: Color(0xFF026BFC),
                        size: 44,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                if (!_hasError) ...[
                  const SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.8,
                      color: Color(0xFF026BFC),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Signing in with Google...',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Securing your PracticeKoro session',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ] else ...[
                  const Icon(
                    Icons.error_outline_rounded,
                    color: Color(0xFFEF4444),
                    size: 32,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _errorMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.go('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF026BFC),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                    ),
                    child: const Text(
                      'Back to Login',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
