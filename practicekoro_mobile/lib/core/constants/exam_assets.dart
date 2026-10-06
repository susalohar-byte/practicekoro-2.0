class ExamAssets {
  const ExamAssets._();

  /// Returns the corresponding high-resolution official West Bengal / National exam emblem asset path
  static String? getEmblemAsset(String? titleOrSlug) {
    if (titleOrSlug == null || titleOrSlug.trim().isEmpty) return null;
    final t = titleOrSlug.toLowerCase();
    if (t.contains('kp') || t.contains('kolkata')) {
      return 'assets/images/exams/emblem_series_kp.png';
    }
    if (t.contains('wbp') ||
        t.contains('constable') ||
        t.contains('police') ||
        t.contains('warder') ||
        t.contains('sub-inspector')) {
      return 'assets/images/exams/emblem_series_wbp.png';
    }
    if (t.contains('wbssc')) {
      return 'assets/images/exams/emblem_wbssc.png';
    }
    if (t.contains('ssc') ||
        t.contains('mts') ||
        t.contains('cgl') ||
        t.contains('chsl') ||
        t.contains('gd')) {
      return 'assets/images/exams/emblem_series_ssc.png';
    }
    if (t.contains('group c') ||
        t.contains('group-c') ||
        t.contains('group d') ||
        t.contains('group-d') ||
        t.contains('clerk')) {
      return 'assets/images/exams/emblem_wbssc.png';
    }
    if (t.contains('rail') ||
        t.contains('ntpc') ||
        t.contains('rrb') ||
        t.contains('alp')) {
      return 'assets/images/exams/emblem_railway.png';
    }
    if (t.contains('food') ||
        t.contains('psc') ||
        t.contains('wbpsc') ||
        t.contains('wbcs') ||
        t.contains('misc') ||
        t.contains('si')) {
      return 'assets/images/exams/emblem_wbpsc.png';
    }
    if (t.contains('icds')) {
      return 'assets/images/exams/emblem_tet.png';
    }
    if (t.contains('tet') || t.contains('primary') || t.contains('ctet')) {
      return 'assets/images/exams/emblem_wbtet_seal.png';
    }
    return null;
  }
}
