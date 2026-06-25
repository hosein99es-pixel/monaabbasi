import {
  BlockContentIcon,
  BookIcon,
  ComposeIcon,
  EnvelopeIcon,
  ImageIcon,
  LinkIcon,
  ProjectsIcon,
  RocketIcon,
  StarIcon,
  UserIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {PortfolioImageInput} from '../../components/PortfolioImageInput'
import {validateRequiredLocales} from '../validation/localization'

export const portfolioImage = defineType({
  name: 'portfolioImage',
  title: 'Portfolio image',
  type: 'image',
  icon: ImageIcon,
  options: {hotspot: true},
  components: {input: PortfolioImageInput},
  description:
    'Choose Crop & hotspot after uploading. Move the hotspot onto the face or subject so website crops stay centered correctly.',
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'localizedString',
      description: 'Describe the image for visitors using screen readers.',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
  ],
})

export const profileRole = defineType({
  name: 'profileRole',
  title: 'Profile role',
  type: 'object',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {select: {title: 'label.0.value'}},
})

export const educationItem = defineType({
  name: 'educationItem',
  title: 'Education item',
  type: 'object',
  icon: BookIcon,
  fields: [
    defineField({name: 'qualification', title: 'Qualification', type: 'localizedString'}),
    defineField({
      name: 'institution',
      title: 'Institution',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', title: 'Description', type: 'localizedBlockContent'}),
  ],
  preview: {select: {title: 'institution.0.value', subtitle: 'qualification.0.value'}},
})

export const skillItem = defineType({
  name: 'skillItem',
  title: 'Skill',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({name: 'category', title: 'Category', type: 'localizedString'}),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', title: 'Description', type: 'localizedBlockContent'}),
  ],
  preview: {select: {title: 'title.0.value', subtitle: 'category.0.value'}},
})

export const sectionIntroduction = defineType({
  name: 'sectionIntroduction',
  title: 'Section introduction',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          {title: 'Theatre', value: 'theatre'},
          {title: 'Film & TV', value: 'film'},
          {title: 'Awards', value: 'awards'},
          {title: 'Teaching', value: 'teaching'},
          {title: 'Upcoming work', value: 'upcoming'},
          {title: 'Gallery', value: 'gallery'},
          {title: 'Downloads', value: 'downloads'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'label', title: 'Label', type: 'localizedString'}),
    defineField({name: 'heading', title: 'Heading', type: 'localizedString'}),
    defineField({name: 'body', title: 'Body', type: 'localizedBlockContent'}),
  ],
  preview: {select: {title: 'heading.0.value', subtitle: 'section'}},
})

export const customSection = defineType({
  name: 'customSection',
  title: 'Custom section',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'sectionId',
      title: 'Section ID',
      type: 'string',
      validation: (rule) =>
        rule.required().regex(/^[a-z0-9-]+$/, {name: 'lowercase letters, numbers, and hyphens'}),
    }),
    defineField({name: 'title', title: 'Navigation title', type: 'localizedString'}),
    defineField({name: 'heading', title: 'Heading', type: 'localizedString'}),
    defineField({name: 'body', title: 'Body', type: 'localizedBlockContent'}),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [defineArrayMember({type: 'portfolioImage'})],
    }),
  ],
  preview: {select: {title: 'heading.0.value', subtitle: 'sectionId'}},
})

export const awardItem = defineType({
  name: 'awardItem',
  title: 'Award',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', title: 'Description', type: 'localizedBlockContent'}),
  ],
  preview: {select: {title: 'title.0.value'}},
})

export const teachingExperience = defineType({
  name: 'teachingExperience',
  title: 'Teaching experience',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', title: 'Description', type: 'localizedBlockContent'}),
  ],
  preview: {select: {title: 'title.0.value'}},
})

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'portfolioImage',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'label', title: 'Label', type: 'localizedString'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'caption', title: 'Caption', type: 'localizedBlockContent'}),
  ],
  preview: {select: {title: 'title.0.value', media: 'image'}},
})

export const upcomingWork = defineType({
  name: 'upcomingWork',
  title: 'Upcoming work',
  type: 'object',
  icon: RocketIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedBlockContent'}),
    defineField({name: 'image', title: 'Image', type: 'portfolioImage'}),
  ],
  preview: {select: {title: 'title.0.value', media: 'image'}},
})

export const contactInformation = defineType({
  name: 'contactInformation',
  title: 'Contact information',
  type: 'object',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'localizedString',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
    defineField({name: 'description', title: 'Description', type: 'localizedBlockContent'}),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.email().required(),
    }),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({
      name: 'whatsappUrl',
      title: 'WhatsApp link',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
  ],
})

export const downloadLinks = defineType({
  name: 'downloadLinks',
  title: 'Download links',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'portfolioFile',
      title: 'Portfolio file',
      type: 'file',
      options: {storeOriginalFilename: true},
    }),
    defineField({
      name: 'resumeFile',
      title: 'CV file',
      type: 'file',
      options: {storeOriginalFilename: true},
    }),
    defineField({
      name: 'portfolioPath',
      title: 'Legacy portfolio path',
      type: 'string',
      hidden: true,
      readOnly: true,
      deprecated: {reason: 'Retained for migration history. Use Portfolio file.'},
    }),
    defineField({
      name: 'resumePath',
      title: 'Legacy CV path',
      type: 'string',
      hidden: true,
      readOnly: true,
      deprecated: {reason: 'Retained for migration history. Use CV file.'},
    }),
  ],
})

export const seoMetadata = defineType({
  name: 'seoMetadata',
  title: 'SEO metadata',
  type: 'object',
  icon: ProjectsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Search result title',
      type: 'localizedString',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
    defineField({
      name: 'description',
      title: 'Search result description',
      type: 'localizedString',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
  ],
})

export const migrationMetadata = defineType({
  name: 'migrationMetadata',
  title: 'Migration metadata',
  type: 'object',
  icon: ProjectsIcon,
  fields: [
    defineField({name: 'source', title: 'Source', type: 'string', readOnly: true}),
    defineField({name: 'sourcePath', title: 'Source path', type: 'string', readOnly: true}),
    defineField({name: 'migratedAt', title: 'Migrated at', type: 'datetime', readOnly: true}),
    defineField({
      name: 'qualityFlags',
      title: 'Quality flags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      readOnly: true,
    }),
  ],
})
