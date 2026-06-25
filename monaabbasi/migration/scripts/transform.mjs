import fs from "node:fs/promises";
import path from "node:path";

import {
  extractedPath,
  projectId,
  sourceRoot,
  targetDataset,
  transformedPath,
} from "../config.mjs";
import {
  collectMigrationImages,
  compact,
  localizedBlocks,
  localizedString,
  migrationImage,
  stableKey,
} from "../lib/content.mjs";
import { loadMarkdown } from "../lib/dependencies.mjs";

const { markdownToPortableText } = await loadMarkdown();
const extracted = JSON.parse(await fs.readFile(extractedPath, "utf8"));

function blocks(seed, en, fa) {
  return localizedBlocks(markdownToPortableText, seed, en, fa);
}

function image(sourcePath, en, fa, hotspot) {
  return migrationImage(sourcePath, localizedString(en, fa), hotspot);
}

function migratedFrom(sourcePath, qualityFlags = []) {
  return compact({
    _type: "migrationMetadata",
    source: "static-portfolio",
    sourcePath,
    qualityFlags,
  });
}

function transformProduction(sourceId, source) {
  const sourceKey = `production:${sourceId}`;
  const heroImage =
    source.images.find((item) => item[2] === source.hero) || source.images[0];
  const medium = ["khab", "astronaut"].includes(sourceId)
    ? "shortFilm"
    : "theatre";

  return compact({
    _type: "production",
    title: localizedString(source.title, source.titleFa),
    slug: { _type: "slug", current: sourceId },
    medium,
    yearDisplay: localizedString(source.year, source.yearFa),
    role: localizedString(source.role, source.roleFa),
    director: localizedString(source.director, source.directorFa),
    venue: localizedString(source.venue, source.venueFa),
    runDates: localizedString(source.festival, source.festivalFa),
    summary: blocks(`${sourceKey}:summary`, source.summary, source.summaryFa),
    body: blocks(
      `${sourceKey}:body`,
      source.paragraphs.join("\n\n"),
      source.paragraphsFa.join("\n\n"),
    ),
    heroImage: image(source.hero, heroImage?.[0], heroImage?.[1]),
    gallery: source.images.map(([altEn, altFa, sourcePath], index) =>
      compact({
        _key: stableKey(`${sourceKey}:gallery:${sourcePath}:${index}`),
        _type: "galleryImage",
        image: image(sourcePath, altEn, altFa),
      }),
    ),
    sourceKey,
    migration: migratedFrom("assets/js/productions.js"),
  });
}

function localizedCard(type, seed, item, index) {
  return compact({
    _key: stableKey(`${seed}:${index}:${item.title_en || item.title?.en}`),
    _type: type,
    title: localizedString(
      item.title_en || item.title?.en,
      item.title_fa || item.title?.fa,
    ),
    description: blocks(
      `${seed}:${index}:description`,
      item.text_en || item.description?.en,
      item.text_fa || item.description?.fa,
    ),
  });
}

const productions = Object.entries(extracted.productions).map(
  ([sourceId, source]) => transformProduction(sourceId, source),
);

const home = extracted.content.home;
const html = extracted.html;
const missingPersianAltFlags = [];

function trackAlt(pathValue, alt) {
  if (alt?.en && !alt?.fa)
    missingPersianAltFlags.push(`Missing Persian alt text: ${pathValue}`);
}

trackAlt(home.headshot, html.profile.headshotAlt);
trackAlt(html.resume.image, html.resume.imageAlt);
trackAlt(html.upcomingImage.src, html.upcomingImage.alt);
for (const item of extracted.content.gallery.items)
  trackAlt(item.src, { en: item.alt_en, fa: item.alt_fa });

const sectionNames = {
  work: "theatre",
  film: "film",
  awards: "awards",
  teaching: "teaching",
  upcoming: "upcoming",
  gallery: "gallery",
  downloads: "downloads",
};

const portfolioPage = compact({
  _id: "portfolioPage",
  _type: "portfolioPage",
  name: localizedString(home.name_en, home.name_fa),
  intro: blocks("portfolio:intro", home.intro_en, home.intro_fa),
  headshot: image(
    home.headshot,
    html.profile.headshotAlt.en,
    html.profile.headshotAlt.fa,
    {
      _type: "sanity.imageHotspot",
      x: Number(home.headshot_focus_x ?? 50) / 100,
      y: Number(home.headshot_focus_y ?? 50) / 100,
      width: 1,
      height: 1,
    },
  ),
  roles: html.profile.roles.map((role, index) => ({
    _key: stableKey(`portfolio:role:${index}:${role.en}`),
    _type: "profileRole",
    label: localizedString(role.en, role.fa),
  })),
  resumeHeading: localizedString(
    html.resume.heading.en,
    html.resume.heading.fa,
  ),
  resumeBody: blocks(
    "portfolio:resume-body",
    html.resume.paragraphs.map((item) => item.en).join("\n\n"),
    html.resume.paragraphs.map((item) => item.fa).join("\n\n"),
  ),
  resumeImage: image(
    html.resume.image,
    html.resume.imageAlt.en,
    html.resume.imageAlt.fa,
  ),
  education: html.resume.education.map((item, index) => ({
    _key: stableKey(`portfolio:education:${index}:${item.title.en}`),
    _type: "educationItem",
    qualification: localizedString(item.label.en, item.label.fa),
    institution: localizedString(item.title.en, item.title.fa),
    description: blocks(
      `portfolio:education:${index}:description`,
      item.description.en,
      item.description.fa,
    ),
  })),
  skills: html.resume.skills.map((item, index) => ({
    _key: stableKey(`portfolio:skill:${index}:${item.title.en}`),
    _type: "skillItem",
    category: localizedString(item.label.en, item.label.fa),
    title: localizedString(item.title.en, item.title.fa),
    description: blocks(
      `portfolio:skill:${index}:description`,
      item.description.en,
      item.description.fa,
    ),
  })),
  sectionIntroductions: html.sections.map((section) => ({
    _key: stableKey(`portfolio:section:${section.id}`),
    _type: "sectionIntroduction",
    section: sectionNames[section.id],
    label: localizedString(section.label.en, section.label.fa),
    heading: localizedString(section.heading.en, section.heading.fa),
    body: blocks(
      `portfolio:section:${section.id}:body`,
      section.body.en,
      section.body.fa,
    ),
  })),
  awards: extracted.content.awards.items.map((item, index) =>
    localizedCard("awardItem", "portfolio:award", item, index),
  ),
  teachingExperiences: extracted.content.teaching.items.map((item, index) =>
    localizedCard("teachingExperience", "portfolio:teaching", item, index),
  ),
  upcomingWork: {
    _type: "upcomingWork",
    title: localizedString(
      extracted.content.sections.upcoming_heading_en,
      extracted.content.sections.upcoming_heading_fa,
    ),
    description: blocks(
      "portfolio:upcoming:description",
      extracted.content.sections.upcoming_body_en,
      extracted.content.sections.upcoming_body_fa,
    ),
    image: image(
      html.upcomingImage.src,
      html.upcomingImage.alt.en,
      html.upcomingImage.alt.fa,
    ),
  },
  gallery: extracted.content.gallery.items.map((item, index) => ({
    _key: stableKey(`portfolio:gallery:${index}:${item.src}`),
    _type: "galleryImage",
    image: image(item.src, item.alt_en, item.alt_fa),
    label: localizedString(item.label_en, item.label_fa),
    title: localizedString(item.title_en, item.title_fa),
    caption: blocks(
      `portfolio:gallery:${index}:caption`,
      item.copy_en,
      item.copy_fa,
    ),
  })),
  customSections: extracted.content.extras.items.map((item, index) => ({
    _key: stableKey(`portfolio:custom-section:${index}:${item.id}`),
    _type: "customSection",
    sectionId: item.id,
    title: localizedString(item.title_en, item.title_fa),
    heading: localizedString(item.heading_en, item.heading_fa),
    body: blocks(
      `portfolio:custom-section:${item.id}:body`,
      item.body_en,
      item.body_fa,
    ),
    images: (item.images || []).map((sourcePath, imageIndex) => ({
      ...image(sourcePath, "", ""),
      _key: stableKey(
        `portfolio:custom-section:${item.id}:image:${imageIndex}`,
      ),
    })),
  })),
  contact: {
    _type: "contactInformation",
    heading: localizedString(html.contact.heading.en, html.contact.heading.fa),
    description: blocks(
      "portfolio:contact:description",
      html.contact.description.en,
      html.contact.description.fa,
    ),
    email: html.contact.email,
    phone: html.contact.phone,
    whatsappUrl: html.contact.whatsappUrl,
  },
  downloads: {
    _type: "downloadLinks",
    portfolioPath: "portfolio.html",
    resumePath: "cv.html",
  },
  seo: {
    _type: "seoMetadata",
    title: localizedString(html.seo.en.title, html.seo.fa.title),
    description: localizedString(
      html.seo.en.description,
      html.seo.fa.description,
    ),
  },
  footerText: localizedString(html.footer.en, html.footer.fa),
  migration: migratedFrom(
    "content/*.json + index.html",
    missingPersianAltFlags,
  ),
});

const productionOrder = productions.map((production) => production.sourceKey);
const allImages = collectMigrationImages({ productions, portfolioPage });
const assets = [...allImages.values()].sort((a, b) =>
  a.sourcePath.localeCompare(b.sourcePath),
);
const missingAssets = [];

for (const asset of assets) {
  try {
    await fs.access(path.join(sourceRoot, asset.sourcePath));
  } catch {
    missingAssets.push(asset.sourcePath);
  }
}

if (missingAssets.length) {
  throw new Error(
    `Missing ${missingAssets.length} assets:\n${missingAssets.join("\n")}`,
  );
}

const manifest = {
  version: 1,
  target: { projectId, dataset: targetDataset },
  source: {
    kind: extracted.source.kind,
    publishedOnly: true,
    locales: extracted.source.locales,
  },
  counts: {
    portfolioPages: 1,
    productions: productions.length,
    assets: assets.length,
  },
  assets,
  productionOrder,
  documents: { portfolioPage, productions },
};

await fs.mkdir(path.dirname(transformedPath), { recursive: true });
await fs.writeFile(transformedPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Transformed ${productions.length} productions`);
console.log(`Prepared ${assets.length} original assets`);
console.log(`Manifest: ${transformedPath}`);
