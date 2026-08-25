import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import km from '../locales/km.json'

const savedLanguage = localStorage.getItem('app_language') || 'km'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

// Persist language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app_language', lng)
  document.documentElement.lang = lng
})

export default i18n
