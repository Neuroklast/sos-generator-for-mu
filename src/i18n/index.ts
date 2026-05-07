/**
 * i18n initialization for SOS Generator.
 * Sets up i18next with localStorage persistence and English/German translations.
 */
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import de from './locales/de'

const STORAGE_KEY = 'sos-language'
const DEFAULT_LANGUAGE = 'en'

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

i18next.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18next
