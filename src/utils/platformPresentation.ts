import type { AppSettingItem } from '@/types';
export const PLATFORM_FONTS: Record<string, string> = {
  'Inter (Default)':
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Bengali", "PracticeKoro Bengali Fallback", sans-serif',
  'System UI': 'system-ui, -apple-system, "Segoe UI", "PracticeKoro Bengali Fallback", sans-serif',
  'Bengali Letterpress':
    '"Li Subha Letterpress Unicode", "PracticeKoro Bengali Fallback", system-ui, sans-serif',
};
export function presentationSettings(settings: AppSettingItem[]) {
  const text = (id: string) => {
    const v = settings.find((s) => s.id === id)?.value;
    return typeof v === 'string' ? v.trim() : '';
  };
  const theme = text('theme_mode');
  const font = text('font_family');
  return {
    title: text('seo_meta_title'),
    description: text('seo_meta_description'),
    verification: text('seo_google_tag'),
    theme: (theme === 'light' || theme === 'dark' ? theme : 'system') as
      'light' | 'dark' | 'system',
    font: Object.prototype.hasOwnProperty.call(PLATFORM_FONTS, font) ? font : 'Inter (Default)',
  };
}
export function validateSeoSettings(title: string, description: string, verification: string) {
  if (!title.trim() || title.trim().length > 100)
    throw new Error('SEO title must contain 1–100 characters.');
  if (!description.trim() || description.trim().length > 320)
    throw new Error('SEO description must contain 1–320 characters.');
  if (verification && !/^[A-Za-z0-9_-]{10,200}$/.test(verification.trim()))
    throw new Error(
      'Enter only the Google verification token (10–200 letters, digits, underscores or hyphens), not HTML.'
    );
}
export function validatePresentation(theme: string, font: string) {
  if (
    !['light', 'dark', 'system'].includes(theme) ||
    !Object.prototype.hasOwnProperty.call(PLATFORM_FONTS, font)
  )
    throw new Error('Choose a supported platform default theme and font.');
}
