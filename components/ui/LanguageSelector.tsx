'use client';

import { LANGUAGE_NAMES, Language, useLanguage } from '@/components/ui/LanguageProvider';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const langs: Language[] = ['en', 'zh-CN', 'zh-TW'];

  const handleChange = async (lang: Language) => {
    setLanguage(lang);
    // Persist to backend
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
    } catch { /* silent fail — UI already updated */ }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400">Language / 语言</h2>

      <div className="space-y-2">
        {langs.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => handleChange(lang)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
              language === lang
                ? 'bg-xm-gold/10 border border-xm-gold/30 text-xm-gold'
                : 'bg-xm-card border border-gray-800 text-gray-400 hover:border-gray-600'
            }`}
          >
            <span>{LANGUAGE_NAMES[lang]}</span>
            {language === lang && (
              <span className="text-xm-gold text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
