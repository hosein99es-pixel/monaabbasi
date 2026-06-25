import {
  BookIcon,
  ComposeIcon,
  EnvelopeIcon,
  HomeIcon,
  ImageIcon,
  LinkIcon,
  PlayIcon,
  ProjectsIcon,
  RocketIcon,
  StarIcon,
  UserIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {validateRequiredLocales} from '../validation/localization'

export const portfolioPage = defineType({
  name: 'portfolioPage',
  title: 'Portfolio homepage',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'profile', title: '01 · Profile · نمایه', icon: UserIcon, default: true},
    {name: 'resume', title: '02 · Resume · رزومه', icon: BookIcon},
    {name: 'theatre', title: '03 · Theatre · تئاتر', icon: PlayIcon},
    {name: 'film', title: '04 · Film & TV · فیلم و تلویزیون', icon: ProjectsIcon},
    {name: 'awards', title: '05 · Awards · جوایز', icon: StarIcon},
    {name: 'teaching', title: '06 · Teaching · تدریس', icon: ComposeIcon},
    {name: 'upcoming', title: '07 · Upcoming · پیش‌رو', icon: RocketIcon},
    {name: 'gallery', title: '08 · Gallery · گالری', icon: ImageIcon},
    {name: 'downloads', title: '09 · Downloads · دانلودها', icon: LinkIcon},
    {name: 'contact', title: '10 · Contact · تماس', icon: EnvelopeIcon},
    {name: 'seo', title: 'SEO · جستجو و اشتراک', icon: ProjectsIcon},
  ],
  // Fieldsets gather related fields into titled, bordered panels so each tab
  // reads as grouped sections rather than a stack of loose boxes.
  fieldsets: [
    {name: 'identity', title: 'Name & roles · نام و نقش‌ها', options: {collapsible: false}},
    {
      name: 'opening',
      title: 'Opening text & portrait · متن و عکس آغازین',
      options: {collapsible: false},
    },
    {
      name: 'resumeIntro',
      title: 'Heading, body & image · عنوان، متن و تصویر',
      options: {collapsible: false},
    },
    {
      name: 'resumeDetails',
      title: 'Education & skills · تحصیلات و مهارت‌ها',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name · نام',
      description:
        'The name that greets every visitor at the top of your site. · نامی که در بالای سایت به هر بازدیدکننده خوش‌آمد می‌گوید.',
      type: 'localizedString',
      group: 'profile',
      fieldset: 'identity',
      validation: (rule) => rule.required().custom(validateRequiredLocales),
    }),
    defineField({
      name: 'intro',
      title: 'Introduction · معرفی',
      description:
        'Your opening words — a short, warm hello that introduces you. Write it in both English and Persian. · چند جملهٔ آغازین و گرم برای معرفی خودتان؛ به انگلیسی و فارسی بنویسید.',
      type: 'localizedBlockContent',
      group: 'profile',
      fieldset: 'opening',
      validation: (rule) => rule.required().warning('Add the opening profile text.'),
    }),
    defineField({
      name: 'headshot',
      title: 'Profile portrait · عکس پروفایل',
      description:
        'The portrait that opens your site. After uploading, open “Crop & hotspot” and gently place the dot on your face so it always stays centred. · عکسی که سایت با آن آغاز می‌شود؛ پس از بارگذاری در «Crop & hotspot» نقطه را روی صورت بگذارید تا همیشه درست قاب شود.',
      type: 'portfolioImage',
      group: 'profile',
      fieldset: 'opening',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'roles',
      title: 'Roles · نقش‌ها',
      description:
        'A few words for what you do — Actor, Director, and so on. They sit right under your name. · چند کلمه دربارهٔ کاری که می‌کنید (بازیگر، کارگردان…) که درست زیر نام شما می‌آید.',
      type: 'array',
      group: 'profile',
      fieldset: 'identity',
      of: [defineArrayMember({type: 'profileRole'})],
      validation: (rule) => rule.min(1).required(),
    }),
    defineField({
      name: 'resumeHeading',
      title: 'Resume heading · عنوان رزومه',
      type: 'localizedString',
      group: 'resume',
      fieldset: 'resumeIntro',
    }),
    defineField({
      name: 'resumeBody',
      title: 'Resume body · متن رزومه',
      type: 'localizedBlockContent',
      group: 'resume',
      fieldset: 'resumeIntro',
    }),
    defineField({
      name: 'resumeImage',
      title: 'Resume image · تصویر رزومه',
      type: 'portfolioImage',
      group: 'resume',
      fieldset: 'resumeIntro',
    }),
    defineField({
      name: 'education',
      title: 'Education · تحصیلات',
      type: 'array',
      group: 'resume',
      fieldset: 'resumeDetails',
      of: [defineArrayMember({type: 'educationItem'})],
    }),
    defineField({
      name: 'skills',
      title: 'Skills · مهارت‌ها',
      type: 'array',
      group: 'resume',
      fieldset: 'resumeDetails',
      of: [defineArrayMember({type: 'skillItem'})],
    }),
    defineField({
      name: 'sectionIntroductions',
      title: 'Section headings & intros · عنوان و مقدمهٔ بخش‌ها',
      description:
        'The title and short text shown above each section on the site. · عنوان و متن کوتاهی که بالای هر بخش سایت دیده می‌شود.',
      type: 'array',
      group: ['theatre', 'film', 'awards', 'teaching', 'upcoming', 'gallery', 'downloads'],
      of: [defineArrayMember({type: 'sectionIntroduction'})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'productions',
      title: 'Production order · ترتیب کارها',
      description:
        'Drag to arrange the order your works appear in. To change a work’s photos and story, open it from the Productions menu on the left. · با کشیدن، ترتیب نمایش کارها را بچینید؛ برای ویرایش عکس و شرحِ هر کار، آن را از منوی «کارها» باز کنید.',
      type: 'array',
      group: ['theatre', 'film'],
      of: [defineArrayMember({type: 'reference', to: [{type: 'production'}]})],
      validation: (rule) => rule.unique().min(1).required(),
    }),
    defineField({
      name: 'awards',
      title: 'Awards · جوایز',
      type: 'array',
      group: 'awards',
      of: [defineArrayMember({type: 'awardItem'})],
    }),
    defineField({
      name: 'teachingExperiences',
      title: 'Teaching experiences · سوابق تدریس',
      type: 'array',
      group: 'teaching',
      of: [defineArrayMember({type: 'teachingExperience'})],
    }),
    defineField({
      name: 'upcomingWork',
      title: 'Upcoming work · کار پیش‌رو',
      type: 'upcomingWork',
      group: 'upcoming',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery · گالری',
      description:
        'A place for your favourite photos. Drag to reorder, and set a focal point on each so it always crops beautifully. · جایی برای عکس‌های دلخواه؛ با کشیدن مرتب کنید و نقطهٔ کانونی هر عکس را تنظیم کنید تا همیشه زیبا برش بخورد.',
      type: 'array',
      group: 'gallery',
      of: [defineArrayMember({type: 'galleryImage'})],
    }),
    defineField({
      name: 'customSections',
      title: 'Custom sections · بخش‌های دلخواه',
      description:
        'Add your own extra sections beyond the built-in ones. · بخش‌های اضافیِ دلخواه به‌جز بخش‌های آماده.',
      type: 'array',
      group: ['theatre', 'film', 'awards', 'teaching', 'upcoming', 'gallery'],
      of: [defineArrayMember({type: 'customSection'})],
    }),
    defineField({
      name: 'contact',
      title: 'Contact · تماس',
      type: 'contactInformation',
      group: 'contact',
    }),
    defineField({
      name: 'downloads',
      title: 'Downloads · دانلودها',
      type: 'downloadLinks',
      group: 'downloads',
    }),
    defineField({
      name: 'seo',
      title: 'Search & social sharing · جستجو و اشتراک‌گذاری',
      description:
        'How the page looks in Google results and when shared on social media. · نحوهٔ نمایش صفحه در نتایج گوگل و هنگام اشتراک در شبکه‌های اجتماعی.',
      type: 'seoMetadata',
      group: 'seo',
    }),
    defineField({
      name: 'footerText',
      title: 'Footer text · متن پاورقی',
      type: 'localizedString',
      group: 'contact',
    }),
    defineField({
      name: 'migration',
      title: 'Migration metadata',
      type: 'migrationMetadata',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {media: 'headshot'},
    prepare({media}) {
      return {title: 'Portfolio homepage', subtitle: 'English + فارسی', media}
    },
  },
})
