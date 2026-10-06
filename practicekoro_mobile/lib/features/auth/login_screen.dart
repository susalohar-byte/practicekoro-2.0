import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/wb_districts.dart';
import '../../core/components/pk_button.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/pk_text_field.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

enum _AuthMode { signIn, signUp }

class _LoginScreenState extends ConsumerState<LoginScreen>
    with WidgetsBindingObserver {
  _AuthMode _authMode = _AuthMode.signIn;

  // Sign In controllers
  final _signInEmailController = TextEditingController();
  final _signInPasswordController = TextEditingController();
  bool _obscureSignInPassword = true;

  // Sign Up controllers
  final _signUpNameController = TextEditingController();
  final _signUpEmailController = TextEditingController();
  final _signUpPasswordController = TextEditingController();
  bool _obscureSignUpPassword = true;
  String _selectedDistrict = 'Purulia';

  bool _isLoading = false;
  bool _isGoogleLoading = false;
  String? _errorMessage;
  String? _successMessage;
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Pre-fill previously saved email if any
    final savedEmail = LocalStorageService.getUserEmail();
    if (savedEmail != null && savedEmail.isNotEmpty) {
      _signInEmailController.text = savedEmail;
    }

    // Listen to Supabase auth state changes (e.g. from Google OAuth callback deep link)
    final authRepo = ref.read(authRepositoryProvider);
    _authSubscription = authRepo.authStateChanges?.listen((data) async {
      final session = data.session;
      if (session != null && mounted) {
        setState(() => _isGoogleLoading = false);
        await authRepo.syncUserProfile(session.user);
        if (mounted) {
          context.go('/home');
        }
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // If user returned to the app without completing Google OAuth, clear loading
    if (state == AppLifecycleState.resumed && _isGoogleLoading) {
      Future.delayed(const Duration(milliseconds: 1600), () {
        if (mounted && _isGoogleLoading) {
          final isAuthed = ref.read(authRepositoryProvider).isAuthenticated;
          if (!isAuthed) {
            setState(() => _isGoogleLoading = false);
          }
        }
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _authSubscription?.cancel();
    _signInEmailController.dispose();
    _signInPasswordController.dispose();
    _signUpNameController.dispose();
    _signUpEmailController.dispose();
    _signUpPasswordController.dispose();
    super.dispose();
  }

  String _formatErrorMessage(dynamic error) {
    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('invalid login credentials') ||
          msg.contains('invalid_credentials')) {
        return 'Incorrect email or password. Please verify your details or create a new account.';
      }
      if (msg.contains('email not confirmed')) {
        return 'Your email has not been verified yet. Please check your inbox for the confirmation link.';
      }
      if (msg.contains('already registered') ||
          msg.contains('user already exists')) {
        return 'An account with this email already exists. Please switch to "Sign In".';
      }
      if (msg.contains('password should be at least 6 characters')) {
        return 'Password must be at least 6 characters long.';
      }
      return error.message;
    }

    final s = error.toString().toLowerCase();
    if (s.contains('network') ||
        s.contains('socket') ||
        s.contains('failed host lookup') ||
        s.contains('clientexception')) {
      return 'Network connection error. Please check your internet connection.';
    }
    return error.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
  }

  Future<void> _handleGoogleLogin() async {
    if (_isGoogleLoading || _isLoading) return;
    setState(() {
      _isGoogleLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final authRepo = ref.read(authRepositoryProvider);
    try {
      final launched = await authRepo.signInWithGoogle();
      if (!launched && mounted) {
        setState(() {
          _isGoogleLoading = false;
          _errorMessage =
              'Could not open Google Sign-In. Please check your browser or network.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isGoogleLoading = false;
          _errorMessage = _formatErrorMessage(e);
        });
      }
    }
  }

  Future<void> _handleSignIn() async {
    if (_isLoading || _isGoogleLoading) return;

    final email = _signInEmailController.text.trim();
    final password = _signInPasswordController.text;

    if (email.isEmpty) {
      setState(() => _errorMessage = 'Please enter your email address.');
      return;
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      setState(() => _errorMessage = 'Please enter a valid email address.');
      return;
    }
    if (password.isEmpty) {
      setState(() => _errorMessage = 'Please enter your password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final authRepo = ref.read(authRepositoryProvider);
    try {
      final res = await authRepo.signInWithEmail(
        email: email,
        password: password,
      );

      if (res?.user != null && mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Welcome back, ${LocalStorageService.getUserName()}!',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFF16A34A),
            duration: const Duration(seconds: 2),
          ),
        );
        context.go('/home');
        return;
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = _formatErrorMessage(e);
        });
      }
      return;
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSignUp() async {
    if (_isLoading || _isGoogleLoading) return;

    final fullName = _signUpNameController.text.trim();
    final email = _signUpEmailController.text.trim();
    final password = _signUpPasswordController.text;

    if (fullName.isEmpty || fullName.length < 2) {
      setState(() => _errorMessage = 'Please enter your full name.');
      return;
    }
    if (email.isEmpty) {
      setState(() => _errorMessage = 'Please enter your email address.');
      return;
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      setState(() => _errorMessage = 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final authRepo = ref.read(authRepositoryProvider);
    try {
      final res = await authRepo.signUpWithEmail(
        email: email,
        password: password,
        fullName: fullName,
        district: _selectedDistrict,
      );

      if (mounted) {
        setState(() => _isLoading = false);

        if (res?.session != null) {
          // Immediately signed in (if auto-confirm enabled)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Account created! Welcome, $fullName!',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: const Color(0xFF16A34A),
            ),
          );
          context.go('/home');
        } else {
          // Supabase sent verification email
          _showVerificationSentDialog(email);
          setState(() {
            _authMode = _AuthMode.signIn;
            _signInEmailController.text = email;
            _signInPasswordController.clear();
            _successMessage =
                'Confirmation email sent to $email. Please check your inbox & spam folder, verify your email, and sign in.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = _formatErrorMessage(e);
        });
      }
    }
  }

  void _showVerificationSentDialog(String email) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.mark_email_read_rounded,
                  color: Color(0xFF16A34A), size: 24),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Verify Your Email',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'A verification link has been sent to:',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                email,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Please check your inbox (and spam/promotions folder) and click the link to activate your account. Then sign in below.',
              style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF026BFC),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Got It, Sign In',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showForgotPasswordBottomSheet() {
    final emailCtrl = TextEditingController(
      text: _signInEmailController.text.trim(),
    );
    bool isResetting = false;
    String? resetError;
    String? resetSuccess;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Reset Password',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Enter your registered email address to receive password reset instructions.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 18),
                if (resetError != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      resetError!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFFBE123C),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                if (resetSuccess != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      resetSuccess!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFF16A34A),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                PKTextField(
                  controller: emailCtrl,
                  label: 'Registered Email',
                  hint: 'student@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 20),
                PKPrimaryButton(
                  text: 'Send Reset Link',
                  isLoading: isResetting,
                  onPressed: isResetting
                      ? null
                      : () async {
                          final em = emailCtrl.text.trim();
                          if (em.isEmpty ||
                              !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                  .hasMatch(em)) {
                            setModalState(() {
                              resetError =
                                  'Please enter a valid email address.';
                            });
                            return;
                          }

                          setModalState(() {
                            isResetting = true;
                            resetError = null;
                            resetSuccess = null;
                          });

                          try {
                            await ref
                                .read(authRepositoryProvider)
                                .sendPasswordResetEmail(email: em);
                            setModalState(() {
                              isResetting = false;
                              resetSuccess =
                                  'Password reset email sent! Check your inbox.';
                            });
                          } catch (err) {
                            setModalState(() {
                              isResetting = false;
                              resetError = _formatErrorMessage(err);
                            });
                          }
                        },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final horizontalPadding = screenWidth < 360 ? 16.0 : 24.0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: horizontalPadding,
              vertical: 20,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Official Brand Logo
                ClipRRect(
                  borderRadius: AppRadius.rXl,
                  child: Image.asset(
                    'assets/images/logo-circle.png',
                    width: 60,
                    height: 60,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.school_rounded,
                      color: AppColors.primary,
                      size: 36,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                RichText(
                  text: TextSpan(
                    style: AppTypography.displayLarge(color: AppColors.navy)
                        .copyWith(fontSize: 25),
                    children: const [
                      TextSpan(text: 'Practice'),
                      TextSpan(
                        text: 'Koro',
                        style: TextStyle(color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'West Bengal Competitive Exam Preparation',
                  style: AppTypography.bodySmall(color: AppColors.secondaryText),
                ),

                const SizedBox(height: 20),

                // Tab Switcher: [ Sign In ]  |  [ Create Account ]
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            if (_authMode != _AuthMode.signIn) {
                              setState(() {
                                _authMode = _AuthMode.signIn;
                                _errorMessage = null;
                                _successMessage = null;
                              });
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _authMode == _AuthMode.signIn
                                  ? Colors.white
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: _authMode == _AuthMode.signIn
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.05),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Sign In',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _authMode == _AuthMode.signIn
                                    ? const Color(0xFF026BFC)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            if (_authMode != _AuthMode.signUp) {
                              setState(() {
                                _authMode = _AuthMode.signUp;
                                _errorMessage = null;
                                _successMessage = null;
                              });
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _authMode == _AuthMode.signUp
                                  ? Colors.white
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: _authMode == _AuthMode.signUp
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.05),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Create Account',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _authMode == _AuthMode.signUp
                                    ? const Color(0xFF026BFC)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // Error Banner
                if (_errorMessage != null) ...[
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFECDD3)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          size: 18,
                          color: Color(0xFFE11D48),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              fontSize: 12.5,
                              color: Color(0xFFBE123C),
                              fontWeight: FontWeight.w600,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Success Banner
                if (_successMessage != null) ...[
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.check_circle_outline_rounded,
                          size: 18,
                          color: Color(0xFF16A34A),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _successMessage!,
                            style: const TextStyle(
                              fontSize: 12.5,
                              color: Color(0xFF15803D),
                              fontWeight: FontWeight.w600,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Google 1-Click OAuth Button
                Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    onTap: (_isGoogleLoading || _isLoading)
                        ? null
                        : _handleGoogleLogin,
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      width: double.infinity,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: const Color(0xFFCBD5E1),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.035),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: _isGoogleLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                                color: Color(0xFF0877FF),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Image.asset(
                                  'assets/images/google_logo.png',
                                  width: 20,
                                  height: 20,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, _, _) => const Icon(
                                    Icons.g_mobiledata_rounded,
                                    color: Color(0xFF026BFC),
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  _authMode == _AuthMode.signIn
                                      ? 'Continue with Google'
                                      : 'Sign Up with Google',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF1E293B),
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ),

                // Divider
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Divider(color: Color(0xFFE2E8F0), thickness: 1),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          _authMode == _AuthMode.signIn
                              ? 'OR SIGN IN WITH EMAIL'
                              : 'OR REGISTER WITH EMAIL',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.6,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                      const Expanded(
                        child: Divider(color: Color(0xFFE2E8F0), thickness: 1),
                      ),
                    ],
                  ),
                ),

                // Form Content
                if (_authMode == _AuthMode.signIn)
                  _buildSignInForm()
                else
                  _buildSignUpForm(),

                const SizedBox(height: 14),

                // Continue as Guest Option
                PKSecondaryButton(
                  text: 'Continue as Guest',
                  icon: Icons.bolt_rounded,
                  onPressed: () => context.go('/home'),
                ),

                const SizedBox(height: 20),

                // Switch Mode Prompt
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _authMode == _AuthMode.signIn
                            ? "Don't have an account? "
                            : 'Already have an account? ',
                        style: AppTypography.bodySmall(
                            color: AppColors.secondaryText),
                      ),
                      InkWell(
                        onTap: () {
                          setState(() {
                            _authMode = _authMode == _AuthMode.signIn
                                ? _AuthMode.signUp
                                : _AuthMode.signIn;
                            _errorMessage = null;
                            _successMessage = null;
                          });
                        },
                        child: Text(
                          _authMode == _AuthMode.signIn
                              ? 'Create Account'
                              : 'Sign In',
                          style: AppTypography.bodySmall(
                                  color: AppColors.primary)
                              .copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------------- SIGN IN FORM ----------------
  Widget _buildSignInForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PKTextField(
          controller: _signInEmailController,
          label: 'Email Address',
          hint: 'you@example.com',
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 14),
        PKTextField(
          controller: _signInPasswordController,
          label: 'Password',
          hint: 'Enter your password',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: _obscureSignInPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureSignInPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              size: 20,
              color: const Color(0xFF64748B),
            ),
            onPressed: () {
              setState(() {
                _obscureSignInPassword = !_obscureSignInPassword;
              });
            },
          ),
        ),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: _showForgotPasswordBottomSheet,
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: const Size(0, 24),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text(
              'Forgot Password?',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF026BFC),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        PKPrimaryButton(
          text: 'Sign In to Account',
          icon: Icons.arrow_forward_rounded,
          isLoading: _isLoading,
          onPressed: _handleSignIn,
        ),
      ],
    );
  }

  // ---------------- SIGN UP FORM ----------------
  Widget _buildSignUpForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PKTextField(
          controller: _signUpNameController,
          label: 'Full Name',
          hint: 'e.g. Rahul Mondal',
          prefixIcon: Icons.person_outline_rounded,
          keyboardType: TextInputType.name,
        ),
        const SizedBox(height: 14),
        PKTextField(
          controller: _signUpEmailController,
          label: 'Email Address',
          hint: 'you@example.com',
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 14),
        PKTextField(
          controller: _signUpPasswordController,
          label: 'Create Password',
          hint: 'Minimum 6 characters',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: _obscureSignUpPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureSignUpPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              size: 20,
              color: const Color(0xFF64748B),
            ),
            onPressed: () {
              setState(() {
                _obscureSignUpPassword = !_obscureSignUpPassword;
              });
            },
          ),
        ),
        const SizedBox(height: 14),
        const Text(
          'Target District (West Bengal)',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFCBD5E1)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedDistrict,
              isExpanded: true,
              icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF026BFC)),
              items: kWestBengalDistricts.map((d) {
                return DropdownMenuItem<String>(
                  value: d,
                  child: Text(
                    d,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() => _selectedDistrict = val);
                }
              },
            ),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Used for district-level rankings and local leaderboards.',
          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 20),
        PKPrimaryButton(
          text: 'Create Free Account',
          icon: Icons.check_circle_outline_rounded,
          isLoading: _isLoading,
          onPressed: _handleSignUp,
        ),
      ],
    );
  }
}
