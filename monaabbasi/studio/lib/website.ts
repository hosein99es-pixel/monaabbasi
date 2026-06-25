import type {SanityDocument} from 'sanity'

export const defaultWebsiteOrigin =
  process.env.SANITY_STUDIO_WEBSITE_ORIGIN || 'https://monaabbasi.netlify.app'

type PreviewDocument = Partial<SanityDocument> & {
  medium?: string
  slug?: {current?: string}
}

export function getWebsitePath(type: string, document?: PreviewDocument | null) {
  if (type === 'portfolioPage') return '/en#profile'

  if (type === 'production') {
    const anchor = ['film', 'shortFilm', 'television'].includes(document?.medium ?? '')
      ? 'film'
      : 'theatre'
    return `/en#${anchor}`
  }

  if (type === 'post') {
    const slug = document?.slug?.current
    return slug ? `/en#journal-${slug}` : '/en'
  }

  return '/en'
}

export function getWebsiteUrl(
  type: string,
  document?: PreviewDocument | null,
  origin = defaultWebsiteOrigin,
) {
  return new URL(getWebsitePath(type, document), origin).toString()
}
