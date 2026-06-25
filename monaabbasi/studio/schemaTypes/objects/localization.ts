import {TranslateIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {MarkdownPortableTextInputComponent} from '../../components/MarkdownPortableTextInput'

const supportedLanguages = ['en', 'fa']

function validateUniqueLocales(items?: Array<{language?: string}>) {
  if (!items) return true

  const languages = items.map((item) => item.language).filter(Boolean)
  const duplicates = languages.filter((language, index) => languages.indexOf(language) !== index)
  return duplicates.length ? `Duplicate locale: ${duplicates[0]}` : true
}

function validateLocaleCoverage(items?: Array<{language?: string}>) {
  if (!items) return true

  const languages = items.map((item) => item.language).filter(Boolean)
  const missing = supportedLanguages.filter((language) => !languages.includes(language))
  return missing.length ? `Add translations for: ${missing.join(', ')}` : true
}

const languageField = defineField({
  name: 'language',
  title: 'Language',
  type: 'string',
  options: {
    list: [
      {title: 'English', value: 'en'},
      {title: 'فارسی', value: 'fa'},
    ],
    layout: 'radio',
  },
  validation: (rule) => rule.required(),
})

export const simpleBlockContent = defineType({
  name: 'simpleBlockContent',
  title: 'Rich text',
  type: 'array',
  icon: TranslateIcon,
  description: 'Type normally and use the toolbar for formatting. Markdown source is optional.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) =>
                  rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}).required(),
              }),
            ],
          }),
        ],
      },
    }),
  ],
  components: {input: MarkdownPortableTextInputComponent},
})

export const localizedStringValue = defineType({
  name: 'localizedStringValue',
  title: 'Localized string',
  type: 'object',
  icon: TranslateIcon,
  fields: [
    languageField,
    defineField({
      name: 'value',
      title: 'Text',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'value', subtitle: 'language'},
    prepare({title, subtitle}) {
      return {
        title: title || 'Text not filled in yet',
        subtitle: subtitle?.toUpperCase(),
      }
    },
  },
})

export const localizedBlockContentValue = defineType({
  name: 'localizedBlockContentValue',
  title: 'Localized rich text',
  type: 'object',
  icon: TranslateIcon,
  fields: [
    languageField,
    defineField({
      name: 'value',
      title: 'Text content',
      type: 'simpleBlockContent',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {subtitle: 'language', value: 'value'},
    prepare({subtitle, value}) {
      const hasText = Array.isArray(value) && value.length > 0
      return {
        title: hasText ? 'Rich text' : 'Rich text not filled in yet',
        subtitle: subtitle?.toUpperCase(),
      }
    },
  },
})

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized string',
  type: 'array',
  icon: TranslateIcon,
  of: [defineArrayMember({type: 'localizedStringValue'})],
  validation: (rule) => [
    rule.custom(validateUniqueLocales),
    rule.custom(validateLocaleCoverage).warning(),
  ],
})

export const localizedBlockContent = defineType({
  name: 'localizedBlockContent',
  title: 'Localized rich text',
  type: 'array',
  icon: TranslateIcon,
  of: [defineArrayMember({type: 'localizedBlockContentValue'})],
  validation: (rule) => [
    rule.custom(validateUniqueLocales),
    rule.custom(validateLocaleCoverage).warning(),
  ],
})
