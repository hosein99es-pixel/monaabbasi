import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const DEFAULT_PROJECT_ID = 'esf8v11h';
const DEFAULT_DATASET = 'production';
const DEFAULT_API_VERSION = '2026-06-22';

const productionFields = /* groq */ `
  _id,
  sourceKey,
  slug,
  medium,
  title,
  yearDisplay,
  role,
  director,
  venue,
  runDates,
  summary,
  body,
  heroImage {
    crop,
    hotspot,
    alt,
    asset->{url, metadata{dimensions{width, height}}}
  },
  gallery[] {
    image {
      crop,
      hotspot,
      alt,
      asset->{url, metadata{dimensions{width, height}}}
    },
    label,
    title,
    caption
  }
`;

const SITE_QUERY = /* groq */ `{
  "page": *[_id == "portfolioPage"][0]{
    name,
    intro,
    headshot {
      crop,
      hotspot,
      alt,
      asset->{url, metadata{dimensions{width, height}}}
    },
    roles,
    resumeHeading,
    resumeBody,
    resumeImage {
      crop,
      hotspot,
      alt,
      asset->{url, metadata{dimensions{width, height}}}
    },
    education,
    skills,
    sectionIntroductions,
    productions[]->{${productionFields}},
    awards,
    teachingExperiences,
    upcomingWork {
      title,
      description,
      image {
        crop,
        hotspot,
        alt,
        asset->{url, metadata{dimensions{width, height}}}
      }
    },
    gallery[] {
      image {
        crop,
        hotspot,
        alt,
        asset->{url, metadata{dimensions{width, height}}}
      },
      label,
      title,
      caption
    },
    customSections,
    contact,
    downloads,
    seo,
    footerText
  },
  "allProductions": *[_type == "production"]{${productionFields}}
}`;

function readJsonFile(root, relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function readFallbackProductions(root) {
  const source = fs.readFileSync(path.join(root, 'assets/js/productions.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.productions = productions;`, context, {
    filename: 'assets/js/productions.js',
    timeout: 1000,
  });
  return context.productions || {};
}

function loadFallbackContent(root) {
  return {
    home: readJsonFile(root, 'content/home.json'),
    sections: readJsonFile(root, 'content/sections.json'),
    awards: readJsonFile(root, 'content/awards.json'),
    teaching: readJsonFile(root, 'content/teaching.json'),
    gallery: readJsonFile(root, 'content/gallery.json'),
    extras: readJsonFile(root, 'content/extra-sections.json'),
    productions: readFallbackProductions(root),
  };
}

function localized(value, language, fallback = '') {
  if (!Array.isArray(value)) return fallback;
  const exact = value.find((item) => item?.language === language)?.value;
  const english = value.find((item) => item?.language === 'en')?.value;
  return exact ?? english ?? fallback;
}

function spanToMarkdown(span, markDefs = []) {
  let text = String(span?.text ?? '');
  for (const mark of span?.marks ?? []) {
    if (mark === 'strong') text = `**${text}**`;
    else if (mark === 'em') text = `*${text}*`;
    else {
      const def = markDefs.find((item) => item._key === mark);
      if (def?._type === 'link' && def.href) text = `[${text}](${def.href})`;
    }
  }
  return text;
}

function blocksToMarkdown(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((block) => {
      if (block?._type !== 'block') return '';
      const text = (block.children ?? [])
        .map((span) => spanToMarkdown(span, block.markDefs ?? []))
        .join('');
      if (!text.trim()) return '';
      if (block.style === 'blockquote') return `> ${text}`;
      return text;
    })
    .filter(Boolean)
    .join('\n\n');
}

function localizedBlocks(value, language, fallback = '') {
  return blocksToMarkdown(localized(value, language, [])) || fallback;
}

function imageUrl(image, fallback = '') {
  return image?.asset?.url || fallback;
}

function imageDimensions(image) {
  return image?.asset?.metadata?.dimensions || {};
}

function imageAlt(image, language, fallback = '') {
  return localized(image?.alt, language, fallback);
}

function sourceKeyToSlug(doc) {
  const sourceKey = typeof doc?.sourceKey === 'string' ? doc.sourceKey.replace(/^production:/, '') : '';
  return sourceKey || doc?.slug?.current || '';
}

function toProductionRecord(doc, fallback = {}) {
  const key = sourceKeyToSlug(doc);
  const title = localized(doc.title, 'en', fallback.title || key);
  const titleFa = localized(doc.title, 'fa', fallback.titleFa || title);
  const hero = imageUrl(doc.heroImage, fallback.hero);
  const heroDimensions = imageDimensions(doc.heroImage);
  const heroHotspot = doc.heroImage?.hotspot;
  const summary = localizedBlocks(doc.summary, 'en', fallback.summary || '');
  const summaryFa = localizedBlocks(doc.summary, 'fa', fallback.summaryFa || summary);
  const bodyEn = localizedBlocks(doc.body, 'en');
  const bodyFa = localizedBlocks(doc.body, 'fa');
  const paragraphs = bodyEn ? bodyEn.split(/\n{2,}/) : fallback.paragraphs || (summary ? [summary] : []);
  const paragraphsFa = bodyFa
    ? bodyFa.split(/\n{2,}/)
    : fallback.paragraphsFa || (summaryFa ? [summaryFa] : []);
  const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  const images = gallery
    .map((item, index) => {
      const src = imageUrl(item?.image);
      if (!src) return null;
      const caption = localized(item?.title, 'en') || localized(item?.label, 'en') || `${title} portfolio image ${index + 1}`;
      const captionFa =
        localized(item?.title, 'fa') || localized(item?.label, 'fa') || `${titleFa}، تصویر ${index + 1}`;
      return [caption, captionFa, src];
    })
    .filter(Boolean);

  return {
    ...fallback,
    title,
    titleFa,
    year: localized(doc.yearDisplay, 'en', fallback.year || ''),
    yearFa: localized(doc.yearDisplay, 'fa', fallback.yearFa || fallback.year || ''),
    venue: localized(doc.venue, 'en', fallback.venue || ''),
    venueFa: localized(doc.venue, 'fa', fallback.venueFa || fallback.venue || ''),
    role: localized(doc.role, 'en', fallback.role || ''),
    roleFa: localized(doc.role, 'fa', fallback.roleFa || fallback.role || ''),
    director: localized(doc.director, 'en', fallback.director || ''),
    directorFa: localized(doc.director, 'fa', fallback.directorFa || fallback.director || ''),
    festival: localized(doc.runDates, 'en', fallback.festival || ''),
    festivalFa: localized(doc.runDates, 'fa', fallback.festivalFa || fallback.festival || ''),
    hero,
    heroWidth: heroDimensions.width ?? fallback.heroWidth,
    heroHeight: heroDimensions.height ?? fallback.heroHeight,
    heroFocusX: heroHotspot?.x ? Math.round(heroHotspot.x * 100) : fallback.heroFocusX,
    heroFocusY: heroHotspot?.y ? Math.round(heroHotspot.y * 100) : fallback.heroFocusY,
    heroAlt: imageAlt(doc.heroImage, 'en', fallback.heroAlt || `${title} portfolio image`),
    heroAltFa: imageAlt(doc.heroImage, 'fa', fallback.heroAltFa || `${titleFa}، تصویر پرتفولیو`),
    summary,
    summaryFa,
    paragraphs,
    paragraphsFa,
    images: images.length ? images : fallback.images || (hero ? [[`${title} portfolio image 1`, `${titleFa}، تصویر ۱`, hero]] : []),
    medium: doc.medium || fallback.medium || 'theatre',
  };
}

function mergeProductions(pageProductions = [], allProductions = [], fallbackProductions = {}) {
  const merged = {...fallbackProductions};
  const ordered = [...pageProductions, ...allProductions];
  const seen = new Set();

  for (const doc of ordered) {
    const key = sourceKeyToSlug(doc);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged[key] = toProductionRecord(doc, merged[key] || {});
  }

  return merged;
}

function sectionEntry(page, section) {
  return (page.sectionIntroductions || []).find((item) => item?.section === section);
}

function applySection(sections, page, section, prefix) {
  const entry = sectionEntry(page, section);
  if (!entry) return;
  sections[`${prefix}_label_en`] = localized(entry.label, 'en', sections[`${prefix}_label_en`]);
  sections[`${prefix}_label_fa`] = localized(entry.label, 'fa', sections[`${prefix}_label_fa`]);
  sections[`${prefix}_heading_en`] = localized(entry.heading, 'en', sections[`${prefix}_heading_en`]);
  sections[`${prefix}_heading_fa`] = localized(entry.heading, 'fa', sections[`${prefix}_heading_fa`]);
}

function sanityToContent(result, fallback) {
  const page = result?.page;
  if (!page) return fallback;

  const sections = {...fallback.sections};
  applySection(sections, page, 'theatre', 'theatre');
  applySection(sections, page, 'film', 'film');
  applySection(sections, page, 'awards', 'awards');
  applySection(sections, page, 'teaching', 'teaching');
  applySection(sections, page, 'gallery', 'gallery');
  applySection(sections, page, 'downloads', 'downloads');

  if (page.upcomingWork) {
    sections.upcoming_heading_en = localized(page.upcomingWork.title, 'en', sections.upcoming_heading_en);
    sections.upcoming_heading_fa = localized(page.upcomingWork.title, 'fa', sections.upcoming_heading_fa);
    sections.upcoming_body_en = localizedBlocks(page.upcomingWork.description, 'en', sections.upcoming_body_en);
    sections.upcoming_body_fa = localizedBlocks(page.upcomingWork.description, 'fa', sections.upcoming_body_fa);
  } else {
    applySection(sections, page, 'upcoming', 'upcoming');
  }

  const headshot = imageUrl(page.headshot, fallback.home.headshot);
  const hotspot = page.headshot?.hotspot;

  return {
    home: {
      ...fallback.home,
      name_en: localized(page.name, 'en', fallback.home.name_en),
      name_fa: localized(page.name, 'fa', fallback.home.name_fa),
      intro_en: localizedBlocks(page.intro, 'en', fallback.home.intro_en),
      intro_fa: localizedBlocks(page.intro, 'fa', fallback.home.intro_fa),
      headshot,
      headshot_focus_x: hotspot?.x ? Math.round(hotspot.x * 100) : fallback.home.headshot_focus_x,
      headshot_focus_y: hotspot?.y ? Math.round(hotspot.y * 100) : fallback.home.headshot_focus_y,
    },
    sections,
    awards: {
      items: (page.awards || fallback.awards.items || []).map((item) => ({
        title_en: localized(item.title, 'en', item.title_en || ''),
        title_fa: localized(item.title, 'fa', item.title_fa || ''),
        text_en: localizedBlocks(item.description, 'en', item.text_en || ''),
        text_fa: localizedBlocks(item.description, 'fa', item.text_fa || ''),
      })),
    },
    teaching: {
      items: (page.teachingExperiences || fallback.teaching.items || []).map((item) => ({
        title_en: localized(item.title, 'en', item.title_en || ''),
        title_fa: localized(item.title, 'fa', item.title_fa || ''),
        text_en: localizedBlocks(item.description, 'en', item.text_en || ''),
        text_fa: localizedBlocks(item.description, 'fa', item.text_fa || ''),
      })),
    },
    gallery: {
      items: (page.gallery || fallback.gallery.items || []).map((item, index) => {
        const image = item.image;
        const dimensions = imageDimensions(image);
        const fallbackItem = fallback.gallery.items?.[index] || {};
        return {
          src: imageUrl(image, fallbackItem.src),
          alt_en: imageAlt(image, 'en', fallbackItem.alt_en || ''),
          alt_fa: imageAlt(image, 'fa', fallbackItem.alt_fa || ''),
          label_en: localized(item.label, 'en', fallbackItem.label_en || ''),
          label_fa: localized(item.label, 'fa', fallbackItem.label_fa || ''),
          title_en: localized(item.title, 'en', fallbackItem.title_en || ''),
          title_fa: localized(item.title, 'fa', fallbackItem.title_fa || ''),
          copy_en: localizedBlocks(item.caption, 'en', fallbackItem.copy_en || ''),
          copy_fa: localizedBlocks(item.caption, 'fa', fallbackItem.copy_fa || ''),
          width: dimensions.width ?? fallbackItem.width,
          height: dimensions.height ?? fallbackItem.height,
        };
      }),
    },
    extras: {
      items: (page.customSections || fallback.extras.items || []).map((item) => ({
        id: item.sectionId,
        title_en: localized(item.title, 'en'),
        title_fa: localized(item.title, 'fa'),
        heading_en: localized(item.heading, 'en'),
        heading_fa: localized(item.heading, 'fa'),
        body_en: localizedBlocks(item.body, 'en'),
        body_fa: localizedBlocks(item.body, 'fa'),
        images: (item.images || []).map((image) => imageUrl(image)).filter(Boolean),
      })).filter((item) => item.id),
    },
    productions: mergeProductions(page.productions, result.allProductions, fallback.productions),
  };
}

async function fetchSanityContent() {
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || DEFAULT_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || DEFAULT_DATASET;
  const apiVersion = process.env.SANITY_API_VERSION || DEFAULT_API_VERSION;
  const token = process.env.SANITY_API_READ_TOKEN;
  const host = token ? 'api' : 'apicdn';
  const url = new URL(`https://${projectId}.${host}.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', SITE_QUERY);

  const response = await fetch(url, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.result;
}

export async function loadSiteContent({root, log = console.log}) {
  const fallback = loadFallbackContent(root);
  if (process.env.SANITY_CONTENT_SOURCE === 'json') {
    log('content source: local JSON fallback');
    return fallback;
  }

  try {
    const sanity = await fetchSanityContent();
    log('content source: Sanity production dataset');
    return sanityToContent(sanity, fallback);
  } catch (error) {
    log(`Sanity content unavailable; using local JSON fallback (${error.message})`);
    return fallback;
  }
}

export function writeProductionsBundle(file, productions) {
  const body = `const productions = ${JSON.stringify(productions, null, 2)};\n`;
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, body);
}
