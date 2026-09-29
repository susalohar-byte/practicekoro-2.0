import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

/**
 * Global বাংলা / ENG switch. Drives the shared LanguageContext.
 * When bilingual mode is disabled (Bengali Only), this toggle is hidden from students.
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className }) => {
  const { lang, setLang } = useLanguage();
  const { isBilingualEnabled } = useContentLanguage();

  if (!isBilingualEnabled) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold',
        className
      )}
      role="group"
      aria-label="Language / ভাষা"
    >
      <span className="pl-1.5 text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </span>
      {(['bn', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            'px-2 py-1 rounded-full transition-all cursor-pointer',
            lang === code
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          {code === 'bn' ? 'বাংলা' : 'ENG'}
        </button>
      ))}
    </div>
  );
};
