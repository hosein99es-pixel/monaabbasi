import {author} from './documents/author'
import {category} from './documents/category'
import {portfolioPage} from './documents/portfolio-page'
import {post} from './documents/post'
import {production} from './documents/production'
import {
  localizedBlockContent,
  localizedBlockContentValue,
  localizedString,
  localizedStringValue,
  simpleBlockContent,
} from './objects/localization'
import {
  awardItem,
  contactInformation,
  customSection,
  downloadLinks,
  educationItem,
  galleryImage,
  migrationMetadata,
  portfolioImage,
  profileRole,
  sectionIntroduction,
  seoMetadata,
  skillItem,
  teachingExperience,
  upcomingWork,
} from './objects/portfolio-objects'

export const schemaTypes = [
  portfolioPage,
  production,
  post,
  author,
  category,
  simpleBlockContent,
  localizedStringValue,
  localizedBlockContentValue,
  localizedString,
  localizedBlockContent,
  portfolioImage,
  profileRole,
  educationItem,
  skillItem,
  sectionIntroduction,
  customSection,
  awardItem,
  teachingExperience,
  galleryImage,
  upcomingWork,
  contactInformation,
  downloadLinks,
  seoMetadata,
  migrationMetadata,
]
