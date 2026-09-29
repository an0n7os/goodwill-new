import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageStore {
  language: "EN" | "ML";
  setLanguage: (lang: "EN" | "ML") => void;
  t: (en: string, ml: string | null | undefined) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "EN",
      setLanguage: (language) => {},
      t: (en, ml) => {
        return en;
      },
    }),
    {
      name: "goodwill-language-storage",
    }
  )
);
