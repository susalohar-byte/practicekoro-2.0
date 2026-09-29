import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DICTIONARIES, en as enDict, type AppLang } from '@/i18n/dictionaries';

export const LANGUAGE_STORAGE_KEY = 'practicekoro_language';

type TranslateFn = (path: string) => string;

interface LanguageContextType {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  /** Nested lookup (`hero.eyebrow`) with English fallback, then the key itself. */
  t: TranslateFn;
}

function lookup(lang: AppLang, path: string): string | undefined {
  const parts = path.split('.');
  let node: Record<string, unknown> | unknown = DICTIONARIES[lang];
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function readStoredLang(): AppLang {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {
    // storage unavailable — fall through to default
  }
  // Bengali-first platform default; any stored choice wins.
  return 'bn';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLang>(readStoredLang);

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const t = useCallback<TranslateFn>(
    (path: string) => {
      return lookup(lang, path) ?? lookup('en', path) ?? path;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  // Provider-less fallback (incremental adoption): read-only stored language
  // with English fallback lookups, persistence off. This keeps isolated unit
  // tests and not-yet-wrapped trees working instead of throwing —
  // LanguageProvider in main.tsx is still the real source.
  const stored = readStoredLang();
  const fallbackT: TranslateFn = (path: string) =>
    lookup(stored, path) ?? lookup('en', path) ?? path;
  return { lang: stored, setLang: () => undefined, t: fallbackT };
}

// Re-export for tests/consumers that need the raw English schema.
export { enDict };
