import {
  ArrowRightIcon,
  BlockContentIcon,
  BookIcon,
  CheckmarkCircleIcon,
  CloseIcon,
  ComposeIcon,
  EnvelopeIcon,
  EyeOpenIcon,
  HomeIcon,
  ImageIcon,
  LinkIcon,
  PlayIcon,
  ProjectsIcon,
  RefreshIcon,
  RocketIcon,
  StarIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState, type ComponentType} from 'react'
import {useClient, type Tool} from 'sanity'
import {IntentLink} from 'sanity/router'
import styled from 'styled-components'
import {defaultWebsiteOrigin} from '../lib/website'

type LocalizedValue = {
  language?: string
  value?: unknown
}

type PortfolioDocument = {
  awards?: unknown[]
  contact?: Record<string, unknown>
  downloads?: Record<string, unknown>
  education?: unknown[]
  gallery?: unknown[]
  headshot?: Record<string, unknown>
  intro?: LocalizedValue[]
  name?: LocalizedValue[]
  resumeBody?: LocalizedValue[]
  resumeHeading?: LocalizedValue[]
  roles?: unknown[]
  seo?: Record<string, unknown>
  skills?: unknown[]
  teachingExperiences?: unknown[]
  upcomingWork?: Record<string, unknown>
}

type DashboardData = {
  filmCount: number
  portfolio: PortfolioDocument | null
  productionCount: number
  theatreCount: number
}

type SectionKey =
  | 'profile'
  | 'resume'
  | 'theatre'
  | 'film'
  | 'awards'
  | 'teaching'
  | 'upcoming'
  | 'gallery'
  | 'downloads'
  | 'contact'
  | 'seo'

type SiteSection = {
  description: string
  descriptionFa: string
  editorTab: string
  fieldLabels: string[]
  fieldLabelsFa: string[]
  icon: ComponentType
  key: SectionKey
  fieldPath: string
  guidance: string
  guidanceFa: string
  siteAnchor?: string
  siteLocation: string
  siteLocationFa: string
  title: string
  titleFa: string
}

type SectionState = {
  detail: string
  ready: boolean
}

type CmsLocale = 'en' | 'fa'

const dashboardQuery = `{
  "portfolio": *[_id == "portfolioPage"][0]{
    name,
    intro,
    headshot,
    roles,
    resumeHeading,
    resumeBody,
    education,
    skills,
    awards,
    teachingExperiences,
    upcomingWork,
    gallery,
    downloads,
    contact,
    seo
  },
  "productionCount": count(*[_type == "production"]),
  "theatreCount": count(*[_type == "production" && medium in ["theatre", "performance"]]),
  "filmCount": count(*[_type == "production" && medium in ["shortFilm", "film", "television"]])
}`

const sections: SiteSection[] = [
  {
    key: 'profile',
    fieldPath: 'name',
    title: 'Profile',
    titleFa: 'معرفی',
    editorTab: '01 · Profile',
    icon: HomeIcon,
    description: 'Name, introduction, roles and portrait',
    descriptionFa: 'نام، معرفی، نقش‌ها و پرتره',
    fieldLabels: ['Name', 'Introduction', 'Portrait hotspot', 'Roles'],
    fieldLabelsFa: ['نام', 'معرفی', 'هات‌اسپات پرتره', 'نقش‌ها'],
    guidance: 'Best for quick homepage identity changes and portrait framing.',
    guidanceFa: 'برای تغییر سریع هویت صفحه اصلی و تنظیم قاب پرتره استفاده کنید.',
    siteAnchor: 'profile',
    siteLocation: 'Homepage hero',
    siteLocationFa: 'هیروی صفحه اصلی',
  },
  {
    key: 'resume',
    fieldPath: 'resumeHeading',
    title: 'Resume',
    titleFa: 'رزومه',
    editorTab: '02 · Resume',
    icon: BookIcon,
    description: 'Biography, education and skills',
    descriptionFa: 'زندگی‌نامه، تحصیلات و مهارت‌ها',
    fieldLabels: ['Resume heading', 'Biography', 'Education', 'Skills'],
    fieldLabelsFa: ['عنوان رزومه', 'زندگی‌نامه', 'تحصیلات', 'مهارت‌ها'],
    guidance: 'Use this section for the long-form bio and professional training story.',
    guidanceFa: 'برای زندگی‌نامه کامل و مسیر آموزش حرفه‌ای از این بخش استفاده کنید.',
    siteAnchor: 'resume',
    siteLocation: 'Resume section',
    siteLocationFa: 'بخش رزومه',
  },
  {
    key: 'theatre',
    fieldPath: 'productions',
    title: 'Theatre',
    titleFa: 'تئاتر',
    editorTab: '03 · Theatre',
    icon: PlayIcon,
    description: 'Stage and performance credits',
    descriptionFa: 'سوابق صحنه و اجرا',
    fieldLabels: ['Theatre intro', 'Production order', 'Featured credits'],
    fieldLabelsFa: ['معرفی تئاتر', 'ترتیب آثار', 'سوابق شاخص'],
    guidance: 'Arrange stage credits here; edit individual productions from the Productions area.',
    guidanceFa: 'ترتیب آثار صحنه‌ای را اینجا تنظیم کنید؛ جزئیات هر اثر از بخش آثار ویرایش می‌شود.',
    siteAnchor: 'theatre',
    siteLocation: 'Theatre section',
    siteLocationFa: 'بخش تئاتر',
  },
  {
    key: 'film',
    fieldPath: 'productions',
    title: 'Film & TV',
    titleFa: 'فیلم و تلویزیون',
    editorTab: '04 · Film & TV',
    icon: ProjectsIcon,
    description: 'Screen work and film credits',
    descriptionFa: 'سوابق تصویر، فیلم و تلویزیون',
    fieldLabels: ['Film intro', 'Production order', 'Screen credits'],
    fieldLabelsFa: ['معرفی فیلم', 'ترتیب آثار', 'سوابق تصویری'],
    guidance: 'Arrange screen credits here; edit individual productions from the Productions area.',
    guidanceFa: 'ترتیب آثار تصویری را اینجا تنظیم کنید؛ جزئیات هر اثر از بخش آثار ویرایش می‌شود.',
    siteAnchor: 'film',
    siteLocation: 'Film & TV section',
    siteLocationFa: 'بخش فیلم و تلویزیون',
  },
  {
    key: 'awards',
    fieldPath: 'awards',
    title: 'Awards',
    titleFa: 'جوایز',
    editorTab: '05 · Awards',
    icon: StarIcon,
    description: 'Honors and recognitions',
    descriptionFa: 'جوایز و افتخارات',
    fieldLabels: ['Award titles', 'Descriptions', 'Section intro'],
    fieldLabelsFa: ['عنوان جوایز', 'توضیحات', 'معرفی بخش'],
    guidance: 'Keep awards concise so they scan well on the public site.',
    guidanceFa: 'جوایز را کوتاه و خوانا نگه دارید تا در سایت سریع دیده شوند.',
    siteAnchor: 'awards',
    siteLocation: 'Awards section',
    siteLocationFa: 'بخش جوایز',
  },
  {
    key: 'teaching',
    fieldPath: 'teachingExperiences',
    title: 'Teaching',
    titleFa: 'آموزش',
    editorTab: '06 · Teaching',
    icon: ComposeIcon,
    description: 'Classes, workshops and coaching',
    descriptionFa: 'کلاس‌ها، کارگاه‌ها و مربی‌گری',
    fieldLabels: ['Teaching entries', 'Descriptions', 'Section intro'],
    fieldLabelsFa: ['موارد آموزشی', 'توضیحات', 'معرفی بخش'],
    guidance: 'Use this for workshops, classes, coaching and education work.',
    guidanceFa: 'برای کارگاه‌ها، کلاس‌ها، مربی‌گری و فعالیت‌های آموزشی استفاده کنید.',
    siteAnchor: 'teaching',
    siteLocation: 'Teaching section',
    siteLocationFa: 'بخش آموزش',
  },
  {
    key: 'upcoming',
    fieldPath: 'upcomingWork',
    title: 'Upcoming',
    titleFa: 'به‌زودی',
    editorTab: '07 · Upcoming',
    icon: RocketIcon,
    description: 'Current and forthcoming work',
    descriptionFa: 'کارهای فعلی و آینده',
    fieldLabels: ['Title', 'Description', 'Image hotspot'],
    fieldLabelsFa: ['عنوان', 'توضیح', 'هات‌اسپات تصویر'],
    guidance: 'Use this as the current highlight or next major project.',
    guidanceFa: 'برای اثر شاخص فعلی یا پروژه مهم بعدی از این بخش استفاده کنید.',
    siteAnchor: 'upcoming',
    siteLocation: 'Upcoming section',
    siteLocationFa: 'بخش به‌زودی',
  },
  {
    key: 'gallery',
    fieldPath: 'gallery',
    title: 'Gallery',
    titleFa: 'گالری',
    editorTab: '08 · Gallery',
    icon: ImageIcon,
    description: 'Editorial photo gallery',
    descriptionFa: 'گالری عکس‌های منتخب',
    fieldLabels: ['Gallery images', 'Captions', 'Alt text', 'Photo hotspots'],
    fieldLabelsFa: ['تصاویر گالری', 'کپشن‌ها', 'متن جایگزین', 'هات‌اسپات عکس‌ها'],
    guidance: 'Use image hotspots to control the visible center on the website.',
    guidanceFa: 'با هات‌اسپات تصویر، مرکز نمایش عکس در سایت را کنترل کنید.',
    siteAnchor: 'gallery',
    siteLocation: 'Gallery section',
    siteLocationFa: 'بخش گالری',
  },
  {
    key: 'downloads',
    fieldPath: 'downloads',
    title: 'Downloads',
    titleFa: 'دانلودها',
    editorTab: '09 · Downloads',
    icon: LinkIcon,
    description: 'CV and portfolio links',
    descriptionFa: 'لینک‌های رزومه و پورتفولیو',
    fieldLabels: ['Resume file', 'Portfolio file', 'Download labels'],
    fieldLabelsFa: ['فایل رزومه', 'فایل پورتفولیو', 'برچسب‌های دانلود'],
    guidance: 'Upload replacement files here when CV or portfolio PDFs change.',
    guidanceFa: 'وقتی فایل رزومه یا پورتفولیو تغییر کرد، نسخه جدید را اینجا بارگذاری کنید.',
    siteAnchor: 'downloads',
    siteLocation: 'Downloads section',
    siteLocationFa: 'بخش دانلودها',
  },
  {
    key: 'contact',
    fieldPath: 'contact',
    title: 'Contact',
    titleFa: 'تماس',
    editorTab: '10 · Contact',
    icon: EnvelopeIcon,
    description: 'Contact details and call to action',
    descriptionFa: 'اطلاعات تماس و دعوت به ارتباط',
    fieldLabels: ['Email', 'Phone', 'WhatsApp', 'Contact copy'],
    fieldLabelsFa: ['ایمیل', 'تلفن', 'واتس‌اپ', 'متن تماس'],
    guidance: 'Keep the preferred contact method obvious and current.',
    guidanceFa: 'روش تماس اصلی را واضح و همیشه به‌روز نگه دارید.',
    siteAnchor: 'contact',
    siteLocation: 'Contact footer',
    siteLocationFa: 'فوتر تماس',
  },
  {
    key: 'seo',
    fieldPath: 'seo',
    title: 'Search & sharing',
    titleFa: 'جستجو و اشتراک‌گذاری',
    editorTab: 'SEO',
    icon: BlockContentIcon,
    description: 'Google results and social metadata',
    descriptionFa: 'نتایج گوگل و اطلاعات اشتراک‌گذاری',
    fieldLabels: ['SEO title', 'Meta description', 'Social preview'],
    fieldLabelsFa: ['عنوان سئو', 'توضیح متا', 'پیش‌نمایش اشتراک‌گذاری'],
    guidance: 'This affects search and shared links more than the visible page.',
    guidanceFa: 'این بخش بیشتر روی جستجو و لینک‌های اشتراک‌گذاری اثر دارد، نه ظاهر مستقیم صفحه.',
    siteLocation: 'Browser/search preview',
    siteLocationFa: 'پیش‌نمایش مرورگر و جستجو',
  },
]

const expressive = {
  background: '#fffbff',
  outline: 'rgba(73, 69, 79, .14)',
  primary: '#6750a4',
  primaryContainer: '#eaddff',
  onPrimaryContainer: '#21005d',
  secondaryContainer: '#ffd8e4',
  tertiary: '#006a6a',
  tertiaryContainer: '#b8f3f0',
  warningContainer: '#ffdcc2',
  warningText: '#311300',
}

const cmsCopy = {
  en: {
    awards: (count: number) => `${count} award${count === 1 ? '' : 's'}`,
    checking: 'Checking content',
    checkingContent: 'Checking content…',
    chooseSection: 'Choose what you want to change',
    closeSheet: 'Close section sheet',
    contactDetail: 'Email & social contact',
    contentStatusError: 'The content status could not be loaded.',
    currentFeature: 'Current feature',
    languageCoverage: 'Languages',
    sectionStatusHelp: 'Based on public fields that visitors can see.',
    editHomepage: 'Edit homepage',
    editingProduction: 'Editing a production?',
    editingProductionBody:
      'Open the Productions editor to change an individual theatre, film, or television credit. Use the homepage editor only to arrange their order on the website.',
    editorLanguage: 'CMS language',
    editorLanguageHelp: 'English first · فارسی available',
    entries: (count: number) => `${count} entr${count === 1 ? 'y' : 'ies'}`,
    expressiveControlRoom: 'Expressive control room',
    fieldsEditorsChange: 'Fields editors usually change here',
    filmTelevision: 'Film / television',
    galleryPhotos: 'Gallery photos',
    homepageMissing: 'Homepage not found',
    heroBody:
      'Choose a section below, then use the matching numbered tab in the editor. No technical fields, no guessing where content appears—just expressive, guided editing.',
    heroTitle: 'Edit the portfolio the way the audience experiences it.',
    langEnglish: 'EN',
    langPersian: 'FA',
    needsAttention: 'Needs attention',
    openFullEditor: 'Open full editor',
    openWebsite: 'Open website',
    productionDetail: (count: number) => `${count} production${count === 1 ? '' : 's'}`,
    productions: 'Productions',
    publicWebsiteTarget: 'Opens the matching section on the live website.',
    ready: 'Ready',
    readiness: 'Website readiness',
    resumeDetail: (education: number, skills: number) => `${education} education · ${skills} skills`,
    reviewSection: 'Review section',
    reviewSectionAria: (title: string) => `Review ${title} editing options`,
    rolesDetail: (roles: number) => `${roles} roles · EN + FA`,
    searchSharing: 'Search & sharing',
    sectionHealth: 'Section health',
    smoothEditingBody: (editorTab: string) =>
      `Review this sheet first. When you need to change content, open the focused editor and use the matching ${editorTab} tab.`,
    smoothEditingFlow: 'Smooth editing flow',
    stayOnDashboard: 'Stay on dashboard',
    statusVisibleContent: 'All section statuses come from visible website content',
    theatrePerformance: 'Theatre / performance',
    tryAgain: 'Try again',
    viewOnWebsite: 'View on website',
    websiteReadiness: (ready: number, total: number) => `${ready} of ${total} sections`,
    websiteSections: 'Website sections',
    whereThisAppears: 'Where this appears',
  },
  fa: {
    awards: (count: number) => `${formatNumber(count, 'fa')} جایزه`,
    checking: 'در حال بررسی محتوا',
    checkingContent: 'در حال بررسی محتوا…',
    chooseSection: 'بخشی را که می‌خواهید تغییر دهید انتخاب کنید',
    closeSheet: 'بستن پنل بخش',
    contactDetail: 'ایمیل و راه‌های تماس',
    contentStatusError: 'وضعیت محتوا بارگذاری نشد.',
    currentFeature: 'اثر فعلی',
    languageCoverage: 'زبان‌ها',
    sectionStatusHelp: 'بر اساس فیلدهایی که بازدیدکننده در سایت می‌بیند.',
    editHomepage: 'ویرایش صفحه اصلی',
    editingProduction: 'ویرایش یک اثر؟',
    editingProductionBody:
      'برای ویرایش جزئیات یک اثر تئاتری، سینمایی یا تلویزیونی، ویرایشگر آثار را باز کنید. در ویرایشگر صفحه اصلی فقط ترتیب نمایش آثار را تنظیم کنید.',
    editorLanguage: 'زبان CMS',
    editorLanguageHelp: 'پیش‌فرض انگلیسی · فارسی فعال است',
    entries: (count: number) => `${formatNumber(count, 'fa')} مورد`,
    expressiveControlRoom: 'اتاق کنترل اکسپرسیو',
    fieldsEditorsChange: 'فیلدهایی که معمولاً اینجا ویرایش می‌شوند',
    filmTelevision: 'فیلم و تلویزیون',
    galleryPhotos: 'عکس‌های گالری',
    homepageMissing: 'صفحه اصلی پیدا نشد',
    heroBody:
      'یک بخش را انتخاب کنید، سپس در ویرایشگر از تب شماره‌دار همان بخش استفاده کنید. بدون فیلدهای فنی، بدون حدس زدن محل نمایش محتوا؛ فقط ویرایش راهنمایی‌شده و روشن.',
    heroTitle: 'پورتفولیو را همان‌طور ویرایش کنید که مخاطب آن را تجربه می‌کند.',
    langEnglish: 'EN',
    langPersian: 'FA',
    needsAttention: 'نیازمند بررسی',
    openFullEditor: 'باز کردن ویرایشگر کامل',
    openWebsite: 'باز کردن سایت',
    productionDetail: (count: number) => `${formatNumber(count, 'fa')} اثر`,
    productions: 'آثار',
    publicWebsiteTarget: 'بخش مرتبط را در سایت زنده باز می‌کند.',
    ready: 'آماده',
    readiness: 'آمادگی سایت',
    resumeDetail: (education: number, skills: number) =>
      `${formatNumber(education, 'fa')} تحصیلات · ${formatNumber(skills, 'fa')} مهارت`,
    reviewSection: 'بررسی بخش',
    reviewSectionAria: (title: string) => `بررسی گزینه‌های ویرایش ${title}`,
    rolesDetail: (roles: number) => `${formatNumber(roles, 'fa')} نقش · EN + FA`,
    searchSharing: 'جستجو و اشتراک‌گذاری',
    sectionHealth: 'سلامت بخش',
    smoothEditingBody: (editorTab: string) =>
      `اول این پنل را بررسی کنید. وقتی نیاز به تغییر محتوا داشتید، ویرایشگر متمرکز را باز کنید و از تب ${editorTab} استفاده کنید.`,
    smoothEditingFlow: 'جریان ویرایش روان',
    stayOnDashboard: 'ماندن در داشبورد',
    statusVisibleContent: 'وضعیت هر بخش از محتوای قابل‌نمایش سایت خوانده می‌شود',
    theatrePerformance: 'تئاتر و اجرا',
    tryAgain: 'تلاش دوباره',
    viewOnWebsite: 'دیدن در سایت',
    websiteReadiness: (ready: number, total: number) =>
      `${formatNumber(ready, 'fa')} از ${formatNumber(total, 'fa')} بخش`,
    websiteSections: 'بخش‌های سایت',
    whereThisAppears: 'کجا نمایش داده می‌شود',
  },
} satisfies Record<CmsLocale, Record<string, unknown>>

function formatNumber(value: number, locale: CmsLocale) {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(value)
}

function getInitialCmsLocale(): CmsLocale {
  if (typeof window === 'undefined') return 'en'
  return window.localStorage.getItem('mona-cms-locale') === 'fa' ? 'fa' : 'en'
}

function getSectionTitle(section: SiteSection, locale: CmsLocale) {
  return locale === 'fa' ? section.titleFa : section.title
}

function getSectionSecondaryTitle(section: SiteSection, locale: CmsLocale) {
  return locale === 'fa' ? section.title : section.titleFa
}

function getEditorTabLabel(section: SiteSection, locale: CmsLocale) {
  if (locale === 'en') return section.editorTab
  if (section.editorTab === 'SEO') return 'سئو'
  return section.editorTab.replace(section.title, section.titleFa)
}

const DashboardShell = styled(Box)`
  min-height: 100%;
  color: #1d1b20;
  background:
    radial-gradient(circle at 8% 0%, rgba(234, 221, 255, 0.95), transparent 26rem),
    radial-gradient(circle at 100% 12%, rgba(184, 243, 240, 0.72), transparent 24rem),
    linear-gradient(180deg, #fffbff 0%, #fef7ff 48%, #f7f2fa 100%);
  -webkit-font-smoothing: antialiased;
`

const HeroCard = styled(Card)`
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(103, 80, 164, 0.16);
  border-radius: 34px;
  color: #1d1b20;
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 216, 228, 0.95), transparent 19rem),
    radial-gradient(circle at 12% 20%, rgba(234, 221, 255, 0.92), transparent 18rem),
    linear-gradient(135deg, #fffbff 0%, #f7f2fa 62%, #eaddff 100%);

  &::after {
    content: '';
    position: absolute;
    width: 11rem;
    height: 11rem;
    right: -3.5rem;
    bottom: -3rem;
    border-radius: 42% 58% 48% 52%;
    background: linear-gradient(135deg, #6750a4, #006a6a);
    opacity: 0.14;
    transform: rotate(-12deg);
    pointer-events: none;
  }
`

const HeroIntentLink = styled(IntentLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3rem;
  padding: 0 1.15rem;
  border-radius: 999px;
  color: #fffbff;
  background: ${expressive.primary};
  box-shadow: 0 12px 28px rgba(103, 80, 164, 0.22);
  font-size: 0.875rem;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  transition:
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus-visible {
    background: #7f67be;
    box-shadow: 0 16px 34px rgba(103, 80, 164, 0.28);
    transform: translateY(-2px) scale(1.015);
  }
`

const GhostAction = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3rem;
  padding: 0 1.05rem;
  border-radius: 999px;
  color: #49454f;
  background: rgba(255, 251, 255, 0.76);
  font-size: 0.875rem;
  font-weight: 750;
  text-decoration: none;
  box-shadow: inset 0 0 0 1px rgba(73, 69, 79, 0.1);

  &:hover,
  &:focus-visible {
    background: #fffbff;
  }
`

const SectionButton = styled.button`
  display: block;
  height: 100%;
  width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: inherit;
  text-decoration: none;
  outline: none;

  &:focus-visible {
    border-radius: 30px;
    outline: 3px solid rgba(103, 80, 164, 0.32);
    outline-offset: 4px;
  }
`

const LanguageToggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 3rem;
  padding: 0.22rem;
  border-radius: 999px;
  background: rgba(255, 251, 255, 0.78);
  box-shadow: inset 0 0 0 1px rgba(73, 69, 79, 0.1);
`

const LanguageButton = styled.button<{$active?: boolean}>`
  min-width: 3.2rem;
  min-height: 2.5rem;
  padding: 0 0.9rem;
  border: 0;
  border-radius: 999px;
  color: ${({$active}) => ($active ? '#fffbff' : '#49454f')};
  background: ${({$active}) => ($active ? expressive.primary : 'transparent')};
  box-shadow: ${({$active}) => ($active ? '0 10px 22px rgba(103, 80, 164, 0.24)' : 'none')};
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 820;

  &:hover,
  &:focus-visible {
    background: ${({$active}) => ($active ? '#7f67be' : '#f7f2fa')};
  }
`

const SectionCard = styled(Card)`
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px solid ${expressive.outline};
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 251, 255, 0.98), rgba(255, 251, 255, 0.9)),
    #fffbff;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 6px;
    background: linear-gradient(90deg, #6750a4, #7d5260, #006a6a);
    opacity: 0;
    transition: opacity 160ms ease;
  }

  ${SectionButton}:hover &,
  ${SectionButton}:focus-visible & {
    transform: translateY(-4px) scale(1.008);
    border-color: rgba(103, 80, 164, 0.36);
    box-shadow: 0 22px 48px rgba(58, 48, 83, 0.14);
  }

  ${SectionButton}:hover &::before,
  ${SectionButton}:focus-visible &::before {
    opacity: 1;
  }
`

const NumberMark = styled(Box)`
  width: 3.1rem;
  height: 3.1rem;
  flex: 0 0 3.1rem;
  display: grid;
  place-items: center;
  border-radius: 19px;
  background: ${expressive.primaryContainer};
  color: ${expressive.onPrimaryContainer};
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: -0.02em;
`

const SectionIcon = styled(Box)`
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  border-radius: 18px;
  color: #21005d;
  background: #eaddff;
`

const StatCard = styled(Card)`
  border: 1px solid rgba(103, 80, 164, 0.12);
  border-radius: 24px;
  background: rgba(255, 251, 255, 0.72);
  color: #1d1b20;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(18px);
`

const ExpressiveBadge = styled(Badge)<{$ready?: boolean}>`
  --card-badge-bg: ${({$ready}) => ($ready ? '#b8f3f0' : '#ffdcc2')};
  color: ${({$ready}) => ($ready ? '#00201f' : expressive.warningText)};
  border-radius: 999px;
  background: var(--card-badge-bg);
  font-weight: 750;
`

const ProgressTrack = styled(Box)`
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(103, 80, 164, 0.12);
`

const ProgressFill = styled(Box)<{$percent: number}>`
  width: ${({$percent}) => `${$percent}%`};
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6750a4, #7d5260, #006a6a);
  transition: width 280ms ease;
`

const Kicker = styled(Text)`
  width: fit-content;
  padding: 0.42rem 0.75rem;
  border-radius: 999px;
  color: #21005d;
  background: #eaddff;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const GuidanceCard = styled(Card)`
  border: 1px solid rgba(125, 82, 96, 0.18);
  border-radius: 28px;
  background: linear-gradient(135deg, #ffd8e4 0%, #fff8f8 52%, #fffbff 100%);
`

const ModalHero = styled(Box)`
  position: relative;
  overflow: hidden;
  color: #1d1b20;
  background:
    radial-gradient(circle at 88% 10%, rgba(184, 243, 240, 0.86), transparent 14rem),
    radial-gradient(circle at 8% 16%, rgba(234, 221, 255, 0.95), transparent 15rem),
    linear-gradient(135deg, #fffbff 0%, #f7f2fa 100%);
`

const ModalBody = styled(Box)`
  background: #fffbff;
`

const FieldChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0 0.72rem;
  border: 1px solid rgba(103, 80, 164, 0.14);
  border-radius: 999px;
  color: #49454f;
  background: #f7f2fa;
  font-size: 0.78rem;
  font-weight: 720;
`

const ModalIntentLink = styled(IntentLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 999px;
  color: #fffbff;
  background: ${expressive.primary};
  font-size: 0.875rem;
  font-weight: 780;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: #7f67be;
  }
`

const ModalExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 999px;
  color: #49454f;
  background: #f7f2fa;
  font-size: 0.875rem;
  font-weight: 760;
  text-decoration: none;
  box-shadow: inset 0 0 0 1px rgba(73, 69, 79, 0.1);

  &:hover,
  &:focus-visible {
    background: #eaddff;
  }
`

const ModalSecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  color: #49454f;
  background: #fffbff;
  box-shadow: inset 0 0 0 1px rgba(73, 69, 79, 0.14);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 760;

  &:hover,
  &:focus-visible {
    background: #f7f2fa;
  }
`

const ModalStat = styled(Card)`
  border: 1px solid rgba(73, 69, 79, 0.1);
  border-radius: 22px;
  background: #fef7ff;
`

function hasContent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.values(value).some(hasContent)
  return true
}

function hasBothLanguages(value?: LocalizedValue[]) {
  if (!value) return false
  const populatedLanguages = new Set(
    value.filter((item) => hasContent(item.value)).map((item) => item.language),
  )
  return populatedLanguages.has('en') && populatedLanguages.has('fa')
}

function getSectionState(key: SectionKey, data: DashboardData, locale: CmsLocale): SectionState {
  const copy = cmsCopy[locale]
  const portfolio = data.portfolio
  if (!portfolio) return {ready: false, detail: copy.homepageMissing}

  switch (key) {
    case 'profile':
      return {
        ready:
          hasBothLanguages(portfolio.name) &&
          hasBothLanguages(portfolio.intro) &&
          hasContent(portfolio.headshot),
        detail: copy.rolesDetail(portfolio.roles?.length ?? 0),
      }
    case 'resume':
      return {
        ready:
          hasBothLanguages(portfolio.resumeHeading) &&
          hasContent(portfolio.resumeBody) &&
          hasContent(portfolio.education),
        detail: copy.resumeDetail(portfolio.education?.length ?? 0, portfolio.skills?.length ?? 0),
      }
    case 'theatre':
      return {
        ready: data.theatreCount > 0,
        detail: copy.productionDetail(data.theatreCount),
      }
    case 'film':
      return {
        ready: data.filmCount > 0,
        detail: copy.productionDetail(data.filmCount),
      }
    case 'awards':
      return {
        ready: hasContent(portfolio.awards),
        detail: copy.awards(portfolio.awards?.length ?? 0),
      }
    case 'teaching':
      return {
        ready: hasContent(portfolio.teachingExperiences),
        detail: copy.entries(portfolio.teachingExperiences?.length ?? 0),
      }
    case 'upcoming':
      return {ready: hasContent(portfolio.upcomingWork), detail: copy.currentFeature}
    case 'gallery':
      return {
        ready: hasContent(portfolio.gallery),
        detail:
          locale === 'fa'
            ? `${formatNumber(portfolio.gallery?.length ?? 0, locale)} عکس`
            : `${portfolio.gallery?.length ?? 0} photo${portfolio.gallery?.length === 1 ? '' : 's'}`,
      }
    case 'downloads':
      return {
        ready: hasContent(portfolio.downloads),
        detail: locale === 'fa' ? 'فایل‌های رزومه و پورتفولیو' : 'CV & portfolio files',
      }
    case 'contact':
      return {ready: hasContent(portfolio.contact?.email), detail: copy.contactDetail}
    case 'seo':
      return {
        ready: hasContent(portfolio.seo),
        detail: locale === 'fa' ? 'گوگل و کارت‌های اجتماعی' : 'Google & social cards',
      }
    default:
      return {ready: false, detail: copy.needsAttention}
  }
}

function LoadingState({locale}: {locale: CmsLocale}) {
  const copy = cmsCopy[locale]

  return (
    <StatCard padding={5}>
      <Flex align="center" gap={3}>
        <Spinner muted />
        <Text muted>{copy.checkingContent}</Text>
      </Flex>
    </StatCard>
  )
}

function getSectionWebsiteUrl(section: SiteSection) {
  return new URL(section.siteAnchor ? `/en#${section.siteAnchor}` : '/en', defaultWebsiteOrigin)
    .toString()
}

function SectionEditDialog({
  locale,
  onClose,
  section,
  state,
}: {
  locale: CmsLocale
  onClose: () => void
  section: SiteSection
  state?: SectionState | null
}) {
  const copy = cmsCopy[locale]
  const Icon = section.icon
  const websiteUrl = getSectionWebsiteUrl(section)
  const title = getSectionTitle(section, locale)
  const fieldLabels = locale === 'fa' ? section.fieldLabelsFa : section.fieldLabels
  const guidance = locale === 'fa' ? section.guidanceFa : section.guidance
  const siteLocation = locale === 'fa' ? section.siteLocationFa : section.siteLocation
  const editorTab = getEditorTabLabel(section, locale)

  return (
    <Dialog
      __unstable_hideCloseButton
      animate
      cardRadius={4}
      cardShadow={3}
      header={
        <ModalHero padding={[4, 5]}>
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Stack space={4}>
              <Flex align="center" gap={3}>
                <SectionIcon style={{fontSize: 22}}>
                  <Icon />
                </SectionIcon>
                <Kicker size={0}>{editorTab}</Kicker>
              </Flex>
              <Stack space={3}>
                <Heading size={4} style={{letterSpacing: '-.045em', lineHeight: 1.04}}>
                  {title}
                </Heading>
                <Text size={2} style={{maxWidth: 620, color: '#625b71', lineHeight: 1.58}}>
                  {guidance}
                </Text>
              </Stack>
            </Stack>
            <Button
              aria-label={copy.closeSheet}
              icon={CloseIcon}
              mode="bleed"
              onClick={onClose}
              radius="full"
            />
          </Flex>
        </ModalHero>
      }
      id={`website-section-sheet-${section.key}`}
      onClickOutside={onClose}
      onClose={onClose}
      padding={0}
      width={[1, 1, 2]}
    >
      <ModalBody padding={[4, 5]}>
        <Stack space={5}>
          <Grid columns={[1, 1, 2]} gap={4}>
            <ModalStat padding={4}>
              <Stack space={4}>
                <Flex align="center" justify="space-between" gap={3}>
                  <Text size={1} weight="semibold">
                    {copy.sectionHealth}
                  </Text>
                  {state ? (
                    <ExpressiveBadge $ready={state.ready}>
                      {state.ready ? copy.ready : copy.needsAttention}
                    </ExpressiveBadge>
                  ) : null}
                </Flex>
                <Stack space={2}>
                  <Heading size={3} style={{letterSpacing: '-.035em'}}>
                    {state?.detail ?? copy.checkingContent}
                  </Heading>
                  <Text muted size={1}>
                    {copy.sectionStatusHelp}
                  </Text>
                </Stack>
              </Stack>
            </ModalStat>

            <ModalStat padding={4}>
              <Stack space={4}>
                <Text size={1} weight="semibold">
                  {copy.whereThisAppears}
                </Text>
                <Stack space={2}>
                  <Heading size={3} style={{letterSpacing: '-.035em'}}>
                    {siteLocation}
                  </Heading>
                  <Text muted size={1}>
                    {copy.publicWebsiteTarget}
                  </Text>
                </Stack>
              </Stack>
            </ModalStat>
          </Grid>

          <Stack space={3}>
            <Text size={1} weight="semibold">
              {copy.fieldsEditorsChange}
            </Text>
            <Flex gap={2} wrap="wrap">
              {fieldLabels.map((label) => (
                <FieldChip key={label}>{label}</FieldChip>
              ))}
            </Flex>
          </Stack>

          <GuidanceCard padding={4}>
            <Flex align="flex-start" gap={3}>
              <SectionIcon style={{background: expressive.primaryContainer, fontSize: 22}}>
                <CheckmarkCircleIcon />
              </SectionIcon>
              <Stack space={2}>
                <Text weight="semibold">{copy.smoothEditingFlow}</Text>
                <Text muted size={1}>
                  {copy.smoothEditingBody(editorTab)}
                </Text>
              </Stack>
            </Flex>
          </GuidanceCard>

          <Flex align="center" justify="space-between" gap={3} wrap="wrap">
            <ModalSecondaryButton onClick={onClose} type="button">
              {copy.stayOnDashboard}
            </ModalSecondaryButton>
            <Flex align="center" gap={2} wrap="wrap">
              <ModalExternalLink href={websiteUrl} rel="noreferrer" target="_blank">
                <EyeOpenIcon />
                <span>{copy.viewOnWebsite}</span>
              </ModalExternalLink>
              <ModalIntentLink
                intent="edit"
                params={{id: 'portfolioPage', path: section.fieldPath, type: 'portfolioPage'}}
              >
                <ArrowRightIcon />
                <span>{copy.openFullEditor}</span>
              </ModalIntentLink>
            </Flex>
          </Flex>
        </Stack>
      </ModalBody>
    </Dialog>
  )
}

export function WebsiteMapTool() {
  const client = useClient({apiVersion: '2026-06-22'})
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSectionKey, setActiveSectionKey] = useState<SectionKey | null>(null)
  const [locale, setLocale] = useState<CmsLocale>(getInitialCmsLocale)
  const [refreshKey, setRefreshKey] = useState(0)

  const copy = cmsCopy[locale]
  const isFa = locale === 'fa'
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])
  const closeSectionSheet = useCallback(() => setActiveSectionKey(null), [])

  useEffect(() => {
    window.localStorage.setItem('mona-cms-locale', locale)
  }, [locale])

  useEffect(() => {
    let active = true
    setError(null)

    client
      .fetch<DashboardData>(dashboardQuery)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to read website content')
        }
      })

    return () => {
      active = false
    }
  }, [client, refreshKey])

  const sectionStates = useMemo(
    () => (data ? sections.map((section) => getSectionState(section.key, data, locale)) : []),
    [data, locale],
  )
  const readyCount = sectionStates.filter((state) => state.ready).length
  const completionPercent = Math.round((readyCount / sections.length) * 100)
  const activeSection = sections.find((section) => section.key === activeSectionKey)
  const activeSectionState =
    activeSection && data ? getSectionState(activeSection.key, data, locale) : null

  return (
    <DashboardShell dir={isFa ? 'rtl' : 'ltr'} lang={locale} padding={[3, 4, 5]}>
      <Box style={{maxWidth: 1240, margin: '0 auto'}}>
        <Stack space={6}>
          <HeroCard padding={[4, 5, 6]} shadow={1}>
            <Grid columns={[1, 1, 2]} gap={6}>
              <Stack space={5}>
                <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                  <Stack space={2}>
                    <Kicker size={0}>{copy.expressiveControlRoom}</Kicker>
                    <Text size={1} style={{color: '#625b71'}}>
                      {copy.editorLanguageHelp}
                    </Text>
                  </Stack>
                  <LanguageToggle aria-label={copy.editorLanguage} role="group">
                    <LanguageButton
                      $active={locale === 'en'}
                      aria-label="Switch CMS language to English"
                      aria-pressed={locale === 'en'}
                      data-testid="cms-language-en"
                      onClick={() => setLocale('en')}
                      type="button"
                    >
                      {copy.langEnglish}
                    </LanguageButton>
                    <LanguageButton
                      $active={locale === 'fa'}
                      aria-label="Switch CMS language to Persian"
                      aria-pressed={locale === 'fa'}
                      data-testid="cms-language-fa"
                      onClick={() => setLocale('fa')}
                      type="button"
                    >
                      {copy.langPersian}
                    </LanguageButton>
                  </LanguageToggle>
                </Flex>
                <Stack space={3}>
                  <Heading size={5} style={{maxWidth: 760, letterSpacing: '-.055em', lineHeight: 0.96}}>
                    {copy.heroTitle}
                  </Heading>
                  <Text size={2} style={{maxWidth: 660, color: '#625b71', lineHeight: 1.6}}>
                    {copy.heroBody}
                  </Text>
                </Stack>
                <Flex align="center" gap={3} wrap="wrap">
                  <HeroIntentLink
                    intent="edit"
                    params={{id: 'portfolioPage', type: 'portfolioPage'}}
                  >
                    <HomeIcon />
                    <span>{copy.editHomepage}</span>
                  </HeroIntentLink>
                  <GhostAction
                    href={defaultWebsiteOrigin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <EyeOpenIcon />
                    <span>{copy.openWebsite}</span>
                  </GhostAction>
                </Flex>
              </Stack>

              <StatCard padding={4}>
                <Stack space={4}>
                  <Flex align="baseline" justify="space-between">
                    <Stack space={2}>
                      <Text size={1} style={{color: '#625b71'}}>
                        {copy.readiness}
                      </Text>
                      <Heading size={5} style={{letterSpacing: '-.06em'}}>
                        {data ? `${formatNumber(completionPercent, locale)}%` : '—'}
                      </Heading>
                    </Stack>
                    <Text size={1} style={{color: '#625b71'}}>
                      {data ? copy.websiteReadiness(readyCount, sections.length) : copy.checking}
                    </Text>
                  </Flex>
                  <ProgressTrack>
                    <ProgressFill $percent={data ? completionPercent : 0} />
                  </ProgressTrack>
                  <Grid columns={2} gap={3}>
                    <Card padding={3} style={{borderRadius: 20, background: expressive.primaryContainer}}>
                      <Stack space={2}>
                        <Text size={1} style={{color: '#625b71'}}>
                          {copy.productions}
                        </Text>
                        <Heading size={3}>
                          {data ? formatNumber(data.productionCount, locale) : '—'}
                        </Heading>
                      </Stack>
                    </Card>
                    <Card padding={3} style={{borderRadius: 20, background: expressive.tertiaryContainer}}>
                      <Stack space={2}>
                        <Text size={1} style={{color: '#625b71'}}>
                          {copy.galleryPhotos}
                        </Text>
                        <Heading size={3}>
                          {data ? formatNumber(data.portfolio?.gallery?.length ?? 0, locale) : '—'}
                        </Heading>
                      </Stack>
                    </Card>
                  </Grid>
                </Stack>
              </StatCard>
            </Grid>
          </HeroCard>

          <Grid columns={[1, 1, 3]} gap={3}>
            <StatCard padding={4}>
              <Stack space={2}>
                <Text muted size={1}>
                  {copy.theatrePerformance}
                </Text>
                <Heading size={3}>{data ? formatNumber(data.theatreCount, locale) : '—'}</Heading>
              </Stack>
            </StatCard>
            <StatCard padding={4}>
              <Stack space={2}>
                <Text muted size={1}>
                  {copy.filmTelevision}
                </Text>
                <Heading size={3}>{data ? formatNumber(data.filmCount, locale) : '—'}</Heading>
              </Stack>
            </StatCard>
            <StatCard padding={4}>
              <Stack space={2}>
                <Text muted size={1}>
                  {copy.languageCoverage}
                </Text>
                <Heading size={3}>EN + FA</Heading>
              </Stack>
            </StatCard>
          </Grid>

          {error ? (
            <GuidanceCard padding={4}>
              <Flex align="center" justify="space-between" gap={4} wrap="wrap">
                <Stack space={2}>
                  <Text weight="semibold">{copy.contentStatusError}</Text>
                  <Text muted size={1}>
                    {error}
                  </Text>
                </Stack>
                <Button icon={RefreshIcon} text={copy.tryAgain} mode="ghost" onClick={refresh} />
              </Flex>
            </GuidanceCard>
          ) : !data ? (
            <LoadingState locale={locale} />
          ) : null}

          <Flex align="flex-end" justify="space-between" gap={4} wrap="wrap">
            <Stack space={2}>
              <Kicker size={0}>{copy.websiteSections}</Kicker>
              <Heading size={4} style={{letterSpacing: '-.04em'}}>
                {copy.chooseSection}
              </Heading>
            </Stack>
            <Flex align="center" gap={2}>
              <Box style={{color: expressive.tertiary}}>
                <CheckmarkCircleIcon />
              </Box>
              <Text muted size={1}>
                {copy.statusVisibleContent}
              </Text>
            </Flex>
          </Flex>

          <Grid columns={[1, 1, 2]} gap={4}>
            {sections.map((section, index) => {
              const state = data ? getSectionState(section.key, data, locale) : null
              const Icon = section.icon
              const sectionTitle = getSectionTitle(section, locale)
              const secondaryTitle = getSectionSecondaryTitle(section, locale)
              const sectionDescription = isFa ? section.descriptionFa : section.description

              return (
                <SectionButton
                  aria-label={copy.reviewSectionAria(sectionTitle)}
                  data-testid={`website-map-card-${section.key}`}
                  key={section.key}
                  onClick={() => setActiveSectionKey(section.key)}
                  type="button"
                >
                  <SectionCard padding={4} shadow={1}>
                    <Stack space={4}>
                      <Flex align="flex-start" gap={3}>
                        <NumberMark>{String(index + 1).padStart(2, '0')}</NumberMark>
                        <Box flex={1}>
                          <Flex align="flex-start" justify="space-between" gap={3}>
                            <Stack space={2}>
                              <Flex align="center" gap={2}>
                                <SectionIcon style={{fontSize: 22}}>
                                  <Icon />
                                </SectionIcon>
                                <Heading size={3} style={{letterSpacing: '-.035em'}}>
                                  {sectionTitle}
                                </Heading>
                              </Flex>
                              <Text
                                muted
                                size={1}
                                dir={isFa ? 'ltr' : 'rtl'}
                                style={{
                                  paddingInlineStart: 54,
                                  textAlign: isFa ? 'right' : 'left',
                                }}
                              >
                                {secondaryTitle}
                              </Text>
                            </Stack>
                            {state ? (
                              <ExpressiveBadge $ready={state.ready}>
                                {state.ready ? copy.ready : copy.needsAttention}
                              </ExpressiveBadge>
                            ) : null}
                          </Flex>
                        </Box>
                      </Flex>

                      <Stack space={3}>
                        <Text muted size={1}>
                          {sectionDescription}
                        </Text>
                        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                          <Flex align="center" gap={2}>
                            <Badge mode="outline" tone="primary" style={{borderRadius: 999}}>
                              {getEditorTabLabel(section, locale)}
                            </Badge>
                            <Text muted size={1}>
                              {state?.detail ?? copy.checkingContent}
                            </Text>
                          </Flex>
                          <Flex align="center" gap={2} style={{color: expressive.primary}}>
                            <Text size={1} weight="semibold">
                              {copy.reviewSection}
                            </Text>
                            <ArrowRightIcon />
                          </Flex>
                        </Flex>
                      </Stack>
                    </Stack>
                  </SectionCard>
                </SectionButton>
              )
            })}
          </Grid>

          <GuidanceCard padding={[4, 5]}>
            <Flex align="flex-start" gap={3}>
              <SectionIcon
                style={{
                  background: expressive.warningContainer,
                  color: expressive.warningText,
                  fontSize: 22,
                }}
              >
                <WarningOutlineIcon />
              </SectionIcon>
              <Stack space={2}>
                <Text weight="semibold">{copy.editingProduction}</Text>
                <Text muted size={1}>
                  {copy.editingProductionBody}
                </Text>
              </Stack>
            </Flex>
          </GuidanceCard>
        </Stack>
      </Box>

      {activeSection ? (
        <SectionEditDialog
          locale={locale}
          onClose={closeSectionSheet}
          section={activeSection}
          state={activeSectionState}
        />
      ) : null}
    </DashboardShell>
  )
}

export const websiteMapTool: Tool = {
  name: 'website-map',
  title: 'Edit website',
  icon: HomeIcon,
  component: WebsiteMapTool,
}
