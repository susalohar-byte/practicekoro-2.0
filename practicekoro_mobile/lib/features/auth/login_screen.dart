import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
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
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Enter your email and password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    final authRepo = ref.read(authRepositoryProvider);

    try {
      final response = await authRepo.signInWithEmail(
        email: email,
        password: password,
      );
      if (response?.session == null || response?.user == null) {
        throw StateError('Authentication service is unavailable.');
      }
      if (mounted) {
        final destination = GoRouterState.of(context).uri.queryParameters['redirect'];
        final isSafeInternalPath =
            destination?.startsWith('/') == true &&
            destination?.startsWith('//') == false;
        context.go(isSafeInternalPath ? destination! : '/home');
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _errorMessage =
              'Sign-in failed. Check your credentials and internet connection.';
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openWebAuth(String path) async {
    final uri = Uri.parse('${AppConstants.websiteUrl}$path');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      setState(() => _errorMessage = 'Could not open the secure account page.');
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

                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => _openWebAuth('/forgot-password'),
                    child: const Text('Forgot password?'),
                  ),
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Semantics(
                    liveRegion: true,
                    child: Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],

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
                      onTap: () => _openWebAuth('/register'),
                      child: Text(
                        'Create an account',
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
