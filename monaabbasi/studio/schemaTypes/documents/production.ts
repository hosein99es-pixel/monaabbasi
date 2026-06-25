import {BlockContentIcon, ImageIcon, PlayIcon, ProjectsIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {validateRequiredLocales} from '../validation/localization'

type LocalizedValue = {language?: string; value?: string}

const mediumLabels: Record<string, string> = {
  theatre: 'Theatre',
  performance: 'Performance',
  shortFilm: 'Short Film',
  film: 'Film',
  television: 'Television',
}

function normalizePreviewPart(value?: string) {
  return value?.toLowerCase().replace(/\s+/g, '')
}

export const production = defineType({
  name: 'production',
  title: 'Production',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'overview', title: '01 · Overview · معرفی', icon: ProjectsIcon, default: true},
    {name: 'story', title: '02 · Story · شرح', icon: BlockContentIcon},
    {name: 'media', title: '03 · Photos · عکس‌ها', icon: ImageIcon},
    {name: 'advanced', title: 'Advanced · پیشرفته', icon: ProjectsIcon},
  ],
  // Group the credit details into one titled panel so the Overview tab is not a
  // long stack of loose fields.
  fieldsets: [
    {
      name: 'credits',
      title: 'Credits & details · عوامل و جزئیات',
      options: {collapsible: true, collapsed: false, columns: 2},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title · عنوان',
      description: 'What this work is called. Add it in both languages. · نام این کار؛ به هر دو زبان بنویسید.',
      type: 'localizedString',
      group: 'overview',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
    defineField({
      name: 'slug',
      title: 'Web address · نشانی صفحه',
      type: 'slug',
      group: 'advanced',
      description:
        'Optional advanced field. The portfolio mostly links to website sections. · فیلد اختیاریِ پیشرفته؛ معمولاً نیازی به تغییر آن نیست.',
      options: {
        source: (document) => {
          const titles = document.title as LocalizedValue[] | undefined
          return titles?.find((item) => item.language === 'en')?.value ?? ''
        },
        maxLength: 96,
      },
    }),
    defineField({
      name: 'medium',
      title: 'Medium · نوع کار',
      description:
        'Choose where this work belongs — it decides whether it shows under Theatre or Film & TV. · انتخاب کنید این کار کجا جای بگیرد؛ تعیین می‌کند زیر «تئاتر» بیاید یا «فیلم و تلویزیون».',
      type: 'string',
      group: 'overview',
      options: {
        list: [
          {title: 'Theatre · تئاتر', value: 'theatre'},
          {title: 'Performance · اجرا', value: 'performance'},
          {title: 'Short film · فیلم کوتاه', value: 'shortFilm'},
          {title: 'Film · فیلم', value: 'film'},
          {title: 'Television · تلویزیون', value: 'television'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'yearDisplay',
      title: 'Year · سال',
      type: 'localizedString',
      group: 'overview',
      fieldset: 'credits',
    }),
    defineField({
      name: 'role',
      title: 'Role · نقش',
      type: 'localizedString',
      group: 'overview',
      fieldset: 'credits',
    }),
    defineField({
      name: 'director',
      title: 'Director · کارگردان',
      type: 'localizedString',
      group: 'overview',
      fieldset: 'credits',
    }),
    defineField({
      name: 'venue',
      title: 'Venue · مکان',
      type: 'localizedString',
      group: 'overview',
      fieldset: 'credits',
    }),
    defineField({
      name: 'runDates',
      title: 'Run dates / festival · تاریخ اجرا یا جشنواره',
      type: 'localizedString',
      group: 'overview',
      fieldset: 'credits',
    }),
    defineField({
      name: 'summary',
      title: 'Summary · خلاصه',
      description:
        'A short, inviting description — this is what people read on the work’s card. · توضیحی کوتاه و گیرا؛ همان چیزی که روی کارت اثر خوانده می‌شود.',
      type: 'localizedBlockContent',
      group: 'story',
      validation: (rule) => rule.required().warning('Add a concise production summary.'),
    }),
    defineField({
      name: 'body',
      title: 'Full story · شرح کامل',
      type: 'localizedBlockContent',
      group: 'story',
    }),
    defineField({
      name: 'heroImage',
      title: 'Card & hero image · تصویر اصلی',
      description:
        'The first image people see — on the card and the page. Open “Crop & hotspot” and place the dot on the face or main subject. · نخستین تصویری که دیده می‌شود (روی کارت و صفحه)؛ در «Crop & hotspot» نقطه را روی صورت یا سوژهٔ اصلی بگذارید.',
      type: 'portfolioImage',
      // Shown on both the first "Overview" tab (so it is visible immediately when
      // a work opens) and the "Photos" tab.
      group: ['overview', 'media'],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery · گالری',
      description: 'Extra photos shown on the work’s page. · عکس‌های بیشتر در صفحهٔ اثر.',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({type: 'galleryImage'})],
    }),
    defineField({
      name: 'sourceKey',
      title: 'Source key',
      type: 'string',
      readOnly: true,
      hidden: true,
      description: 'Optional identity retained on migrated records. New editor-created records leave this empty.',
    }),
    defineField({
      name: 'migration',
      title: 'Migration metadata',
      type: 'migrationMetadata',
      readOnly: true,
      hidden: true,
    }),
  ],
  orderings: [
    {
      title: 'Recently updated',
      name: 'updatedDesc',
      by: [{field: '_updatedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      year: 'yearDisplay',
      role: 'role',
      medium: 'medium',
      media: 'heroImage',
    },
    prepare({title, year: yearValues, role: roleValues, medium, media}) {
      const englishTitle = (title as LocalizedValue[] | undefined)?.find(
        (item) => item.language === 'en',
      )?.value
      const year = (yearValues as LocalizedValue[] | undefined)?.find(
        (item) => item.language === 'en',
      )?.value
      const role = (roleValues as LocalizedValue[] | undefined)?.find(
        (item) => item.language === 'en',
      )?.value
      const mediumLabel = medium ? mediumLabels[String(medium)] ?? String(medium) : 'Production'
      const subtitleParts = [year, mediumLabel, role].filter(
        (part, index, parts): part is string =>
          Boolean(part) &&
          parts.findIndex(
            (candidate) => normalizePreviewPart(candidate) === normalizePreviewPart(part),
          ) === index,
      )
      return {
        title: englishTitle ?? 'Untitled production',
        subtitle: subtitleParts.join(' · '),
        media,
      }
    },
  },
})
