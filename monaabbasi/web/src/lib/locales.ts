export const locales = ['en', 'fa'] as const
export type Locale = (typeof locales)[number]

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export const localeCopy = {
  en: {
    act: 'Act', awards: 'Awards', contact: 'Contact', cv: 'Download CV', downloads: 'Downloads',
    film: 'Film & TV', gallery: 'Gallery', intro: 'Profile', nav: 'Primary navigation',
    portfolio: 'Download portfolio', resume: 'Resume', skip: 'Skip to main content',
    teaching: 'Teaching', theatre: 'Theatre', upcoming: 'Upcoming',
  },
  fa: {
    act: 'پرده', awards: 'جوایز', contact: 'تماس', cv: 'دانلود رزومه', downloads: 'دانلودها',
    film: 'فیلم و تلویزیون', gallery: 'گالری', intro: 'معرفی', nav: 'ناوبری اصلی',
    portfolio: 'دانلود پرتفولیو', resume: 'رزومه', skip: 'رفتن به محتوای اصلی',
    teaching: 'آموزش', theatre: 'تئاتر', upcoming: 'به‌زودی',
  },
} as const
