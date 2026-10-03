class AppConstants {
  static const String appName = 'PracticeKoro';
  static const String appTagline = 'Practice Today, Progress Tomorrow';
  static const String appVersion = '2.0.0';

  // Supabase Production Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://prycanbnxuihxhskallw.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw',
  );

  // Support & Website
  static const String websiteUrl = 'https://practicekoro.online';
  static const String supportPhone = '+919547771118';
  static const String supportEmail = 'support@practicekoro.online';

  // Storage Keys
  static const String prefsTargetExamKey = 'pk_target_exam_id';
  static const String prefsThemeKey = 'pk_theme_mode';
  static const String prefsOfflineAttemptsKey = 'pk_offline_attempts';
  static const String prefsBookmarksKey = 'pk_bookmarks';
  static const String prefsMistakesKey = 'pk_mistakes';
  static const String prefsIsProUserKey = 'pk_is_pro_user';
  static const String prefsProExpiresAtKey = 'pk_pro_expires_at';
}
