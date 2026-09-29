/**
 * Central dictionaries (Bengali-first platform).
 *
 * Rules for growing this file:
 * - English (`en`) is the schema: `bn` must satisfy `typeof en`, so a
 *   missing Bengali string is a COMPILE error, never a runtime gap.
 * - Keys are namespaced (`hero.*`, `common.*`, ...). Add a namespace per
 *   surface as it migrates; never scatter raw Bengali/English literals in
 *   components for user-visible copy once a key exists here.
 * - Exam names, brand names and plan IDs stay in English in both languages.
 */

export const en = {
  common: {
    languageBengali: 'বাংলা',
    languageEnglish: 'ENG',
    dashboard: 'Dashboard',
    login: 'Login',
    getStarted: 'Get Started',
  },
  hero: {
    eyebrow: "West Bengal's #1 Govt Exam Practice Platform",
    headlineLead: 'Crack Your Dream Govt Exam',
    headlineHighlight: 'with Confidence',
    // Leading space intentional: BN tail ('।') takes none.
    headlineTail: '.',
    subLead: 'Real exam-pattern mock tests, 10+ years solved PYQs & topic-wise practice for',
    subExams: 'WBP, WBPSC, WBSSC, Primary TET & Railways',
    subMid: '—',
    subPlatform: 'The Complete Preparation Platform',
    subEnd: '.',
    ctaPrimary: 'Start Free Practice',
    ctaDashboard: 'Go to Dashboard',
    ctaSecondary: 'Explore Exams & Tests',
  },
};

export type Dictionary = typeof en;

export const bn: Dictionary = {
  common: {
    languageBengali: 'বাংলা',
    languageEnglish: 'ENG',
    dashboard: 'ড্যাশবোর্ড',
    login: 'লগইন',
    getStarted: 'শুরু করো',
  },
  hero: {
    eyebrow: 'পশ্চিমবঙ্গের #১ সরকারি চাকরি প্র্যাকটিস প্ল্যাটফর্ম',
    headlineLead: 'আত্মবিশ্বাসের সাথে জয়',
    headlineHighlight: 'করো স্বপ্নের সরকারি',
    headlineTail: ' চাকরি।',
    subLead: 'আসল পরীক্ষার ধাঁচে মক টেস্ট, ১০+ বছরের সমাধানসহ PYQ ও টপিক-ভিত্তিক প্র্যাকটিস।',
    subExams: 'WBP, WBPSC, WBSSC, Primary TET ও Railways',
    subMid: '-এর জন্য',
    subPlatform: '',
    subEnd: '।',
    ctaPrimary: 'Go to Dashboard',
    ctaDashboard: 'Go to Dashboard',
    ctaSecondary: 'Explore Exams & Tests',
  },
};

export type AppLang = 'bn' | 'en';

export const DICTIONARIES: Record<AppLang, Dictionary> = { en, bn };
