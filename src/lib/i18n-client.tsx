'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { t as serverT, type Lang, frDict } from '@/lib/i18n'

interface I18nCtxValue {
  lang: Lang
  t: (key: string, fallback?: string) => string
}

const I18nCtx = createContext<I18nCtxValue>({
  lang: 'fr',
  t: (key: string, fallback?: string) => serverT(key, 'fr', fallback),
})

export function I18nProvider({ children, lang = 'fr' }: { children: ReactNode; lang?: Lang }) {
  const dicts: Record<Lang, Record<string, string>> = { fr: frDict }

  const t = useCallback(
    (key: string, fallback?: string) => dicts[lang]?.[key] ?? fallback ?? key,
    [lang],
  )

  return (
    <I18nCtx.Provider value={{ lang, t }}>
      {children}
    </I18nCtx.Provider>
  )
}

export function useI18n() {
  return useContext(I18nCtx)
}
