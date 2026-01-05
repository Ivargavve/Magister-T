import { createContext, useContext, useState, ReactNode } from 'react'
import { translations, Language, TranslationKey } from '../lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, ...args: any[]) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('magister-t-language')
    return (saved === 'en' || saved === 'sv') ? saved : 'sv'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('magister-t-language', lang)
  }

  const t = (key: TranslationKey, ...args: any[]): string => {
    const value = translations[language][key]
    if (typeof value === 'function') {
      return value(args[0])
    }
    return value as string
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
