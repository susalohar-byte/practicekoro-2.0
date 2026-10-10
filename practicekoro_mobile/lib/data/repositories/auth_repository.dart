import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../datasources/local_storage.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

class AuthRepository {
  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  User? get currentUser => _supabase?.auth.currentUser;

  bool get isAuthenticated => currentUser != null;

  Stream<AuthState>? get authStateChanges => _supabase?.auth.onAuthStateChange;

  Future<AuthResponse?> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final client = _supabase;
    if (client == null) throw Exception('Authentication service is unavailable.');
    final response = await client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
    if (response.user != null) {
      await syncUserProfile(response.user!);
    }
    return response;
  }

  Future<AuthResponse?> signUpWithEmail({
    required String email,
    required String password,
    required String fullName,
    String? district,
  }) async {
    final client = _supabase;
    if (client == null) throw Exception('Authentication service is unavailable.');
    final response = await client.auth.signUp(
      email: email.trim(),
      password: password,
      data: {
        'full_name': fullName.trim(),
        if (district != null && district.trim().isNotEmpty) 'district': district.trim(),
      },
    );

    // If email already exists, Supabase returns empty identities list
    if (response.user != null &&
        (response.user!.identities == null || response.user!.identities!.isEmpty)) {
      throw const AuthException('An account with this email already exists. Please sign in instead.');
    }

    if (response.user != null && response.session != null) {
      await syncUserProfile(
        response.user!,
        fallbackName: fullName,
        fallbackDistrict: district,
      );
    }
    return response;
  }

  Future<void> sendPasswordResetEmail({required String email}) async {
    final client = _supabase;
    if (client == null) throw Exception('Authentication service is unavailable.');
    await client.auth.resetPasswordForEmail(email.trim());
  }

  /// Sign in with Google using Supabase OAuth.
  /// Reuses the existing backend Google OAuth configuration in Supabase.
  /// On mobile devices, uses `io.supabase.practicekoro://login-callback`.
  /// On web, redirects back to the current web domain.
  Future<bool> signInWithGoogle({String? redirectTo}) async {
    final client = _supabase;
    if (client == null) throw Exception('Authentication service is unavailable.');

    final defaultRedirect = kIsWeb
        ? null
        : 'io.supabase.practicekoro://login-callback';

    return await client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: redirectTo ?? defaultRedirect,
      authScreenLaunchMode: kIsWeb
          ? LaunchMode.platformDefault
          : LaunchMode.externalApplication,
    );
  }

  /// Update user profile both in Supabase and local storage
  Future<void> updateProfile({
    String? fullName,
    String? phone,
    String? district,
    String? category,
    String? gender,
  }) async {
    final client = _supabase;
    final user = client?.auth.currentUser;
    if (client == null || user == null) return;

    final updates = <String, dynamic>{
      'id': user.id,
      'updated_at': DateTime.now().toIso8601String(),
      if (fullName != null && fullName.trim().isNotEmpty) 'full_name': fullName.trim(),
      if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      if (district != null && district.trim().isNotEmpty) 'district': district.trim(),
      if (category != null && category.trim().isNotEmpty) 'category': category.trim(),
      if (gender != null && gender.trim().isNotEmpty) 'gender': gender.trim(),
    };

    try {
      await client.from('profiles').upsert(updates, onConflict: 'id');
    } catch (_) {}

    if (fullName != null && fullName.trim().isNotEmpty) {
      await LocalStorageService.saveUserName(fullName.trim());
    }
    if (phone != null && phone.trim().isNotEmpty) {
      await LocalStorageService.saveUserPhone(phone.trim());
    }
    if (district != null && district.trim().isNotEmpty) {
      await LocalStorageService.saveUserDistrict(district.trim());
    }
    if (category != null && category.trim().isNotEmpty) {
      await LocalStorageService.saveUserCategory(category.trim());
    }
    if (gender != null && gender.trim().isNotEmpty) {
      await LocalStorageService.saveUserGender(gender.trim());
    }
  }

  /// Fetch and persist the student profile from Supabase profiles table
  Future<Map<String, dynamic>?> syncUserProfile(
    User user, {
    String? fallbackName,
    String? fallbackDistrict,
  }) async {
    final client = _supabase;
    if (client == null) return null;

    Map<String, dynamic>? profileData;
    try {
      final res = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
      if (res != null) {
        profileData = Map<String, dynamic>.from(res);
      }
    } catch (_) {}

    final meta = user.userMetadata ?? {};
    final rawName = (profileData?['full_name'] ??
            meta['full_name'] ??
            meta['name'] ??
            fallbackName ??
            user.email?.split('@').first ??
            'Candidate')
        .toString()
        .trim();
    final name = rawName.isNotEmpty ? rawName : 'Candidate';
    final email = (user.email ?? profileData?['email'] ?? '').toString().trim();
    final phone = (profileData?['phone'] ?? user.phone ?? '').toString().trim();
    final district = (profileData?['district'] ??
            meta['district'] ??
            fallbackDistrict ??
            '')
        .toString()
        .trim();
    final category = (profileData?['category'] ?? meta['category'] ?? 'GEN').toString().trim();
    final gender = (profileData?['gender'] ?? meta['gender'] ?? 'NOT_SPECIFIED').toString().trim();

    // If profile didn't exist in Supabase yet, upsert it
    if (profileData == null) {
      try {
        await client.from('profiles').upsert({
          'id': user.id,
          'email': email,
          'full_name': name,
          if (district.isNotEmpty) 'district': district,
          if (phone.isNotEmpty) 'phone': phone,
          if (category.isNotEmpty) 'category': category,
          if (gender.isNotEmpty) 'gender': gender,
          'role': 'student',
        }, onConflict: 'id');
      } catch (_) {}
    }

    // Save to local storage for instant offline access
    await LocalStorageService.saveUserId(user.id);
    await LocalStorageService.saveUserName(name);
    if (email.isNotEmpty) await LocalStorageService.saveUserEmail(email);
    if (phone.isNotEmpty) await LocalStorageService.saveUserPhone(phone);
    if (district.isNotEmpty) await LocalStorageService.saveUserDistrict(district);
    if (category.isNotEmpty) await LocalStorageService.saveUserCategory(category);
    if (gender.isNotEmpty) await LocalStorageService.saveUserGender(gender);

    // Check active PRO subscription
    try {
      final hasSub = await client.rpc('has_active_subscription');
      if (hasSub is bool) {
        await LocalStorageService.setProUser(hasSub);
      }
    } catch (_) {}

    return profileData;
  }

  Future<void> signOut() async {
    try {
      await _supabase?.auth.signOut();
    } catch (_) {}
    await LocalStorageService.clearUserSession();
  }
}
