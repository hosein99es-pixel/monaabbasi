import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

import { extractedPath, inventoryReportPath, sourceRoot } from "../config.mjs";
import { loadJsdom } from "../lib/dependencies.mjs";

const { JSDOM } = loadJsdom();

async function readJson(relativePath) {
  return JSON.parse(
    await fs.readFile(path.join(sourceRoot, relativePath), "utf8"),
  );
}

function normalizedText(node) {
  return node?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function localizedFrom(node) {
  if (!node) return { en: "", fa: "" };
  const en = normalizedText(node.querySelector(".en"));
  const fa = normalizedText(node.querySelector(".fa"));
  return {
    en: en || (!fa ? normalizedText(node) : ""),
    fa,
  };
}

function extractCard(card) {
  return {
    label: localizedFrom(card.querySelector(".chip")),
    title: localizedFrom(card.querySelector("h4")),
    description: localizedFrom(card.querySelector("p")),
  };
}

function extractSection(document, id) {
  const section = document.querySelector(`#${id}`);
  if (!section) return undefined;

  const body =
    section.querySelector(".work__header > p.bilingual") ||
    section.querySelector(".section-heading + p.bilingual") ||
    section.querySelector(".reel-panel p.bilingual") ||
    section.querySelector("p.bilingual");

  return {
    id,
    label: localizedFrom(section.querySelector(".section-label")),
    heading: localizedFrom(section.querySelector("h2")),
    body: localizedFrom(body),
  };
}

async function extractProductions() {
  const sourcePath = path.join(sourceRoot, "assets/js/productions.js");
  const source = await fs.readFile(sourcePath, "utf8");
  const executable = source.replace(
    /^const productions\s*=/,
    "globalThis.productions =",
  );
  const context = Object.create(null);

  vm.createContext(context);
  vm.runInContext(executable, context, { filename: sourcePath, timeout: 1000 });

  if (!context.productions || typeof context.productions !== "object") {
    throw new Error("Could not extract the productions object");
  }

  return JSON.parse(JSON.stringify(context.productions));
}

async function extractHtmlContent() {
  const sourceHtml = await fs.readFile(
    path.join(sourceRoot, "index.html"),
    "utf8",
  );
  const document = new JSDOM(sourceHtml).window.document;
  const resume = document.querySelector("#resume");
  const contact = document.querySelector("#contact");

  const seo = {};
  for (const locale of ["en", "fa"]) {
    const localizedPath = path.join(sourceRoot, "dist", locale, "index.html");
    try {
      const localizedHtml = await fs.readFile(localizedPath, "utf8");
      const localizedDocument = new JSDOM(localizedHtml).window.document;
      seo[locale] = {
        title: normalizedText(localizedDocument.querySelector("title")),
        description:
          localizedDocument
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") || "",
      };
    } catch {
      seo[locale] = { title: "", description: "" };
    }
  }

  const contactDescription = contact?.querySelector("p.bilingual");
  const emailHref =
    contact?.querySelector('a[href^="mailto:"]')?.getAttribute("href") || "";
  const phoneHref =
    contact?.querySelector('a[href^="tel:"]')?.getAttribute("href") || "";
  const whatsappHref =
    contact?.querySelector('a[href*="wa.me"]')?.getAttribute("href") || "";

  return {
    profile: {
      roles: [...document.querySelectorAll(".hero .chip-set .chip")].map(
        localizedFrom,
      ),
      headshotAlt: {
        en:
          document.querySelector(".hero__media img")?.getAttribute("alt") || "",
        fa: "",
      },
    },
    resume: {
      heading: localizedFrom(resume?.querySelector("#resume-title")),
      paragraphs: [
        ...(resume?.querySelectorAll(".bio-copy > p.bilingual") || []),
      ].map(localizedFrom),
      image: resume?.querySelector(".bio-mark img")?.getAttribute("src") || "",
      imageAlt: {
        en: resume?.querySelector(".bio-mark img")?.getAttribute("alt") || "",
        fa: "",
      },
      education: [
        ...(resume?.querySelectorAll(
          '[aria-labelledby="education-title"] .education-card',
        ) || []),
      ].map(extractCard),
      skills: [
        ...(resume?.querySelectorAll(
          '[aria-labelledby="skills-title"] .education-card',
        ) || []),
      ].map(extractCard),
    },
    sections: [
      "work",
      "film",
      "awards",
      "teaching",
      "upcoming",
      "gallery",
      "downloads",
    ]
      .map((id) => extractSection(document, id))
      .filter(Boolean),
    upcomingImage: {
      src: document.querySelector("#upcoming img")?.getAttribute("src") || "",
      alt: {
        en: document.querySelector("#upcoming img")?.getAttribute("alt") || "",
        fa: "",
      },
    },
    contact: {
      heading: localizedFrom(contact?.querySelector("h2")),
      description: localizedFrom(contactDescription),
      email: emailHref.replace(/^mailto:/, ""),
      phone: phoneHref.replace(/^tel:/, ""),
      whatsappUrl: whatsappHref,
    },
    footer: localizedFrom(document.querySelector(".footer .bilingual")),
    seo,
  };
}

async function listImageFiles(directory, prefix = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listImageFiles(
          path.join(directory, entry.name),
          relativePath,
        )),
      );
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

const [home, sections, awards, teaching, gallery, extras, productions, html] =
  await Promise.all([
    readJson("content/home.json"),
    readJson("content/sections.json"),
    readJson("content/awards.json"),
    readJson("content/teaching.json"),
    readJson("content/gallery.json"),
    readJson("content/extra-sections.json"),
    extractProductions(),
    extractHtmlContent(),
  ]);

const imageFiles = await listImageFiles(
  path.join(sourceRoot, "images"),
  "images",
);
const productionImagePaths = Object.values(productions).flatMap((production) =>
  production.images.map((image) => image[2]),
);
const uniqueProductionImagePaths = [...new Set(productionImagePaths)];
const missingProductionImages = uniqueProductionImagePaths.filter(
  (relativePath) => !imageFiles.includes(relativePath),
);

const extracted = {
  version: 1,
  source: {
    kind: "static-portfolio",
    root: sourceRoot,
    publishedOnly: true,
    locales: ["en", "fa"],
  },
  content: { home, sections, awards, teaching, gallery, extras },
  productions,
  html,
};

const inventory = {
  sourceKind: extracted.source.kind,
  scope:
    "Published portfolio website content; cv.html and portfolio.html remain static downloads.",
  locales: extracted.source.locales,
  counts: {
    portfolioPages: 1,
    productions: Object.keys(productions).length,
    awards: awards.items.length,
    teachingExperiences: teaching.items.length,
    galleryItems: gallery.items.length,
    customSections: extras.items.length,
    educationItems: html.resume.education.length,
    skillItems: html.resume.skills.length,
    imageFilesOnDisk: imageFiles.length,
    productionImageReferences: productionImagePaths.length,
    uniqueProductionImages: uniqueProductionImagePaths.length,
  },
  missingProductionImages,
  sourceFiles: [
    "content/home.json",
    "content/sections.json",
    "content/awards.json",
    "content/teaching.json",
    "content/gallery.json",
    "content/extra-sections.json",
    "assets/js/productions.js",
    "index.html",
    "dist/en/index.html",
    "dist/fa/index.html",
  ],
  skipped: [
    "images/optimized derivatives (the migration uses original source paths)",
    "Generated presentation markup inside cv.html and portfolio.html (kept as static downloads)",
  ],
};

await fs.mkdir(path.dirname(extractedPath), { recursive: true });
await fs.mkdir(path.dirname(inventoryReportPath), { recursive: true });
await fs.writeFile(extractedPath, `${JSON.stringify(extracted, null, 2)}\n`);
await fs.writeFile(
  inventoryReportPath,
  `${JSON.stringify(inventory, null, 2)}\n`,
);

console.log(`Extracted ${inventory.counts.productions} productions`);
console.log(
  `Found ${inventory.counts.uniqueProductionImages} unique production images`,
);
console.log(`Inventory: ${inventoryReportPath}`);
