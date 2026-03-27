import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language, type TranslationKeys } from '../locales/translations';

interface LanguageState {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'pt',
      t: translations.pt,
      setLanguage: (lang: Language) => set({ language: lang, t: translations[lang] }),
    }),
    {
      name: 'iptv-language-settings',
    }
  )
);
