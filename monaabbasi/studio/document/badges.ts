import {CheckmarkCircleIcon, TranslateIcon} from '@sanity/icons'
import type {DocumentBadgeComponent, SanityDocument} from 'sanity'

function hasEnglishAndPersian(value: unknown) {
  if (!Array.isArray(value)) return false
  const languages = new Set(
    value
      .map((entry) => (entry && typeof entry === 'object' ? entry.language : undefined))
      .filter(Boolean),
  )
  return languages.has('en') && languages.has('fa')
}

function getLocalizedTitle(document: SanityDocument) {
  if (document._type === 'portfolioPage') return document.name
  if (document._type === 'production') return document.title
  return null
}

export const EditorialStatusBadge: DocumentBadgeComponent = (props) => {
  const document = props.draft ?? props.published
  if (!document) return null

  const localizedTitle = getLocalizedTitle(document)
  if (localizedTitle && !hasEnglishAndPersian(localizedTitle)) {
    return {
      label: 'Translation needed',
      title: 'Add both English and Persian before publishing.',
      color: 'warning',
      icon: TranslateIcon,
    }
  }

  return {
    label: props.draft ? (props.published ? 'Unpublished changes' : 'Draft') : 'Published',
    color: props.draft ? 'warning' : 'success',
    icon: CheckmarkCircleIcon,
  }
}
