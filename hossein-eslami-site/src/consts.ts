// Site-wide settings. Change SITE_URL once the Netlify domain is known.
export const SITE_URL = 'https://hossein-eslami.netlify.app';

// Lighter image set for the in-chat preview build (PUBLIC_PREVIEW=1). Never set on Netlify.
export const PREVIEW = import.meta.env.PUBLIC_PREVIEW === '1';

export const NAME = 'Mohammad Hossein Eslami';
export const SHORT_NAME = 'Hossein Eslami';
export const TAGLINE = 'Theatre director · Dramaturg · Video mapping';
export const DESCRIPTION =
  'Mohammad Hossein Eslami is a theatre director, dramaturg and video-mapping artist based in Tehran, working in postdramatic and intermedial performance.';
export const EMAIL = 'mohammadhosein.eslami95@gmail.com';
export const LINKEDIN = 'https://linkedin.com/in/hosein-eslami-5b8290111/';
export const LOCATION = 'Tehran, Iran';

// While true, missing information is shown on the site as visible [PLACEHOLDERS]
// so it can be reviewed. Set to false before launch: placeholders are then hidden.
export const SHOW_PLACEHOLDERS = true;

export const CATEGORIES = {
  theatre: 'Theatre',
  'video-mapping': 'Video Mapping & Media',
  dramaturgy: 'Dramaturgy',
  scenography: 'Scenography',
} as const;
export type Category = keyof typeof CATEGORIES;

export const DOWNLOADS = [
  { href: '/downloads/Mohammad-Hossein-Eslami-CV.pdf', label: 'Curriculum Vitae', meta: 'PDF · 3 pages · A4' },
  { href: '/downloads/Mohammad-Hossein-Eslami-Portfolio.pdf', label: 'Portfolio', meta: 'PDF · 32 pages' },
];
