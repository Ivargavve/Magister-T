import { useLanguage } from '../contexts/LanguageContext'

function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'sv' ? 'en' : 'sv')}
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      title={language === 'sv' ? 'Switch to English' : 'Byt till svenska'}
    >
      {language === 'sv' ? (
        // Swedish flag
        <svg viewBox="0 0 32 20" className="w-6 h-4 rounded-sm overflow-hidden">
          <rect width="32" height="20" fill="#006AA7" />
          <rect x="10" width="4" height="20" fill="#FECC00" />
          <rect y="8" width="32" height="4" fill="#FECC00" />
        </svg>
      ) : (
        // UK flag
        <svg viewBox="0 0 32 20" className="w-6 h-4 rounded-sm overflow-hidden">
          <rect width="32" height="20" fill="#012169" />
          <path d="M0,0 L32,20 M32,0 L0,20" stroke="#fff" strokeWidth="4" />
          <path d="M0,0 L32,20 M32,0 L0,20" stroke="#C8102E" strokeWidth="2" />
          <path d="M16,0 V20 M0,10 H32" stroke="#fff" strokeWidth="6" />
          <path d="M16,0 V20 M0,10 H32" stroke="#C8102E" strokeWidth="4" />
        </svg>
      )}
    </button>
  )
}

export default LanguageToggle
