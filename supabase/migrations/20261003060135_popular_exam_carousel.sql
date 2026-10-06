-- Admin-managed Popular Exam cards shared by the web and Flutter student apps.
-- Keep the seed idempotent so existing administrator configuration is preserved.
INSERT INTO public.app_settings (id, category, key, value, description)
VALUES (
    'popular_exams_config',
    'general',
    'popular_exams_config',
    $popular_exams$
    [
      {"id":"popular-primary-tet","examId":"primary-tet","title":"WB TET","slug":"primary-tet","testsCount":"120+ Tests","cardBadge":"120+ Tests","cardGradientStart":"#0084FF","cardGradientEnd":"#0048C6","cardBgImage":"/images/popular_exams/bg_wbtet.png","cardEmblemUrl":"/images/popular_exams/logo_wbtet.png","cardArrowColor":"#0877FF","orderIndex":1,"route":"/exams/primary-tet","isActive":true},
      {"id":"popular-wbp","examId":"wbp-constable","title":"WBP","slug":"wbp-constable","testsCount":"80+ Tests","cardBadge":"80+ Tests","cardGradientStart":"#E11D48","cardGradientEnd":"#9F1239","cardBgImage":"/images/popular_exams/bg_wbp.png","cardEmblemUrl":"/images/popular_exams/logo_wbp.png","cardArrowColor":"#0877FF","orderIndex":2,"route":"/exams/wbp-constable","isActive":true},
      {"id":"popular-wbpsc","examId":"wbpsc-clerkship","title":"WBPSC","slug":"wbpsc-clerkship","testsCount":"100+ Tests","cardBadge":"100+ Tests","cardGradientStart":"#10B981","cardGradientEnd":"#047857","cardBgImage":"/images/popular_exams/bg_wbpsc.png","cardEmblemUrl":"/images/popular_exams/logo_wbpsc.png","cardArrowColor":"#0877FF","orderIndex":3,"route":"/exams/wbpsc-clerkship","isActive":true},
      {"id":"popular-railway","examId":"railway-ntpc","title":"Railway","slug":"railway-ntpc","testsCount":"150+ Tests","cardBadge":"150+ Tests","cardGradientStart":"#8B5CF6","cardGradientEnd":"#5B21B6","cardBgImage":"/images/popular_exams/bg_railway.png","cardEmblemUrl":"/images/popular_exams/logo_railway.png","cardArrowColor":"#0877FF","orderIndex":4,"route":"/exams/railway-ntpc","isActive":true},
      {"id":"popular-ssc","examId":"ssc-gd","title":"SSC","slug":"ssc-gd","testsCount":"120+ Tests","cardBadge":"120+ Tests","cardGradientStart":"#F59E0B","cardGradientEnd":"#B45309","cardBgImage":"/images/popular_exams/bg_ssc.png","cardEmblemUrl":"/images/popular_exams/logo_ssc.png","cardArrowColor":"#0877FF","orderIndex":5,"route":"/exams/ssc-gd","isActive":true}
    ]
    $popular_exams$::jsonb,
    'Admin-managed Popular Exam cards shown on the student dashboard'
)
ON CONFLICT (id) DO NOTHING;
