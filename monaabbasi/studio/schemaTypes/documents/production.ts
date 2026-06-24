import {BlockContentIcon, ImageIcon, PlayIcon, ProjectsIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {validateRequiredLocales} from '../validation/localization'

type LocalizedValue = {language?: string; value?: string}

export const production = defineType({
  name: 'production',
  title: 'Production',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'overview', title: '01 · Overview', icon: ProjectsIcon, default: true},
    {name: 'story', title: '02 · Story', icon: BlockContentIcon},
    {name: 'media', title: '03 · Photos', icon: ImageIcon},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'overview',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'overview',
      options: {
        source: (document) => {
          const titles = document.title as LocalizedValue[] | undefined
          return titles?.find((item) => item.language === 'en')?.value ?? ''
        },
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
      group: 'overview',
      options: {
        list: [
          {title: 'Theatre', value: 'theatre'},
          {title: 'Performance', value: 'performance'},
          {title: 'Short film', value: 'shortFilm'},
          {title: 'Film', value: 'film'},
          {title: 'Television', value: 'television'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'yearDisplay', title: 'Year', type: 'localizedString', group: 'overview'}),
    defineField({name: 'role', title: 'Role', type: 'localizedString', group: 'overview'}),
    defineField({name: 'director', title: 'Director', type: 'localizedString', group: 'overview'}),
    defineField({name: 'venue', title: 'Venue', type: 'localizedString', group: 'overview'}),
    defineField({
      name: 'runDates',
      title: 'Run dates / festival',
      type: 'localizedString',
      group: 'overview',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'localizedBlockContent',
      group: 'story',
      validation: (rule) => rule.required().warning('Add a concise production summary.'),
    }),
    defineField({name: 'body', title: 'Full story', type: 'localizedBlockContent', group: 'story'}),
    defineField({
      name: 'heroImage',
      title: 'Card and hero image',
      description: 'Set the hotspot on the performer’s face or the main subject.',
      type: 'portfolioImage',
      group: 'media',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
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
      const mediumLabel = medium ? String(medium).replace(/([A-Z])/g, ' $1') : 'Production'
      return {
        title: englishTitle ?? 'Untitled production',
        subtitle: [year, mediumLabel, role].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
