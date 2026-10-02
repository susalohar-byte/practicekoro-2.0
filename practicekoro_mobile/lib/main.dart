import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants/app_constants.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'data/datasources/local_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local storage for offline support
  try {
    await LocalStorageService.init();
  } catch (e) {
    debugPrint('LocalStorageService init fallback: $e');
  }

  // Initialize Supabase if configured, otherwise fallback to local/demo gracefully
  try {
    if (AppConstants.supabaseUrl.startsWith('https://') &&
        !AppConstants.supabaseUrl.contains('demo.practicekoro.online')) {
      await Supabase.initialize(
        url: AppConstants.supabaseUrl,
        publishableKey: AppConstants.supabaseAnonKey,
      );
    }
  } catch (_) {
    // Graceful offline fallback
  }

  runApp(
    const ProviderScope(
      child: PracticeKoroApp(),
    ),
  );
}

class PracticeKoroApp extends StatelessWidget {
  const PracticeKoroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: appRouter,
      builder: (context, child) {
        if (!kIsWeb || child == null) {
          return child ?? const SizedBox.shrink();
        }
        final mq = MediaQuery.of(context);
        if (mq.size.width <= 500) {
          return child;
        }
        const double mobileWidth = 430.0;
        return ColoredBox(
          color: const Color(0xFFE2E8F0),
          child: Center(
            child: Container(
              width: mobileWidth,
              height: mq.size.height,
              decoration: BoxDecoration(
                color: const Color(0xFFF6F9FF),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.14),
                    blurRadius: 32,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: MediaQuery(
                data: mq.copyWith(
                  size: Size(mobileWidth, mq.size.height),
                ),
                child: child,
              ),
            ),
          ),
        );
      },
    );
  }
}

