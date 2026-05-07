/**
 * Global test setup — initialises i18next with the English locale so that
 * `useTranslation()` / `i18next.t()` calls in components resolve to actual
 * English strings instead of bare translation keys.
 */
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './i18n/locales/en'

i18next.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
