type LocalizedEntry = {language?: string; value?: unknown}

export const requiredLocales = ['en', 'fa'] as const

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return value != null
}

export function validateRequiredLocales(value?: LocalizedEntry[]) {
  const populated = new Set(
    (value ?? []).filter((entry) => hasValue(entry?.value)).map((entry) => entry.language),
  )
  const missing = requiredLocales.filter((locale) => !populated.has(locale))
  return missing.length ? `Required before publishing: ${missing.join(', ')} translation` : true
}
