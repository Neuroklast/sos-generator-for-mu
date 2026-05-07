/**
 * LanguageSwitcher component.
 * Toggles between English and German languages.
 */
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const isDE = i18n.language === 'de'

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5">
      <Button
        variant={isDE ? 'ghost' : 'default'}
        size="sm"
        className="h-7 px-2.5 text-xs font-semibold"
        onClick={() => i18n.changeLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant={isDE ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2.5 text-xs font-semibold"
        onClick={() => i18n.changeLanguage('de')}
      >
        DE
      </Button>
    </div>
  )
}
