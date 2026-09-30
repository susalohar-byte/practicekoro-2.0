import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/components/pk_button.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/pk_text_field.dart';
import '../../data/repositories/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'student@practicekoro.com');
  final _passwordController = TextEditingController(text: 'student123');
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    final authRepo = ref.read(authRepositoryProvider);

    try {
      await authRepo.signInWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
    } catch (_) {
      // Gracefully continue in demo/offline mode
    }

    if (mounted) {
      setState(() => _isLoading = false);
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Official Brand Logo
                ClipRRect(
                  borderRadius: AppRadius.rXl,
                  child: Image.asset(
                    'assets/images/logo-circle.png',
                    width: 64,
                    height: 64,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.school_rounded,
                      color: AppColors.primary,
                      size: 36,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                RichText(
                  text: TextSpan(
                    style: AppTypography.displayLarge(color: AppColors.navy).copyWith(fontSize: 26),
                    children: const [
                      TextSpan(text: 'Practice'),
                      TextSpan(
                        text: 'Koro',
                        style: TextStyle(color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'India\'s Premier Mock Test Platform',
                  style: AppTypography.bodySmall(color: AppColors.secondaryText),
                ),

                const SizedBox(height: 32),

                // Inputs
                PKTextField(
                  controller: _emailController,
                  label: 'Email or Mobile Number',
                  hint: 'student@practicekoro.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),

                const SizedBox(height: 16),

                PKTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: '••••••••',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: true,
                ),

                const SizedBox(height: 24),

                // Primary Sign in button
                PKPrimaryButton(
                  text: 'Sign In to Account',
                  icon: Icons.arrow_forward_rounded,
                  isLoading: _isLoading,
                  onPressed: _handleLogin,
                ),

                const SizedBox(height: 12),

                // Continue as Guest button
                PKSecondaryButton(
                  text: 'Continue as Guest',
                  icon: Icons.bolt_rounded,
                  onPressed: () => context.go('/home'),
                ),

                const SizedBox(height: 28),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Don\'t have an account? ',
                      style: AppTypography.bodySmall(color: AppColors.secondaryText),
                    ),
                    InkWell(
                      onTap: () => context.go('/home'),
                      child: Text(
                        'Explore Free Tests',
                        style: AppTypography.bodySmall(color: AppColors.primary).copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
