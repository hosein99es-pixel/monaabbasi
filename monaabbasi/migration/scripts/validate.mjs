import fs from "node:fs/promises";
import path from "node:path";

import {
  dryRunReportPath,
  inventoryReportPath,
  remoteReportPath,
  sourceRoot,
  targetDataset,
  transformedPath,
} from "../config.mjs";
import { getAuthenticatedClient } from "../lib/sanity.mjs";

const isRemote = process.argv.includes("--remote");

function walk(value, visitor, currentPath = "$") {
  visitor(value, currentPath);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walk(item, visitor, `${currentPath}[${index}]`),
    );
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      walk(item, visitor, `${currentPath}.${key}`),
    );
  }
}

async function validateLocal() {
  const [manifest, inventory] = await Promise.all([
    fs.readFile(transformedPath, "utf8").then(JSON.parse),
    fs.readFile(inventoryReportPath, "utf8").then(JSON.parse),
  ]);
  const errors = [];
  const warnings = [];

  if (manifest.target.dataset !== "migration-test") {
    errors.push(
      `Dry-run target must be migration-test, received ${manifest.target.dataset}`,
    );
  }
  if (manifest.documents.productions.length !== inventory.counts.productions) {
    errors.push("Production count does not match the source inventory");
  }
  if (
    manifest.documents.portfolioPage.awards?.length !== inventory.counts.awards
  ) {
    errors.push("Award count does not match the source inventory");
  }
  if (
    manifest.documents.portfolioPage.teachingExperiences?.length !==
    inventory.counts.teachingExperiences
  ) {
    errors.push("Teaching count does not match the source inventory");
  }
  if (
    manifest.documents.portfolioPage.gallery?.length !==
    inventory.counts.galleryItems
  ) {
    errors.push("Gallery count does not match the source inventory");
  }
  if (
    manifest.productionOrder.length !== manifest.documents.productions.length
  ) {
    errors.push("Production ordering does not include every production");
  }

  const sourceKeys = manifest.documents.productions.map(
    (document) => document.sourceKey,
  );
  if (new Set(sourceKeys).size !== sourceKeys.length)
    errors.push("Production source keys are not unique");

  for (const asset of manifest.assets) {
    try {
      await fs.access(path.join(sourceRoot, asset.sourcePath));
    } catch {
      errors.push(`Missing asset: ${asset.sourcePath}`);
    }
  }

  walk(manifest.documents, (value, valuePath) => {
    if (!Array.isArray(value) || value.length === 0) return;

    const localizedTypes = new Set([
      "localizedStringValue",
      "localizedBlockContentValue",
    ]);
    if (value.every((item) => item && localizedTypes.has(item._type))) {
      const languages = value.map((item) => item.language);
      for (const language of ["en", "fa"]) {
        if (!languages.includes(language))
          warnings.push(`${valuePath}: missing ${language} translation`);
      }
      if (new Set(languages).size !== languages.length) {
        errors.push(`${valuePath}: duplicate locale value`);
      }
    }

    const keys = value.map((item) => item?._key).filter(Boolean);
    if (keys.length && new Set(keys).size !== keys.length) {
      errors.push(`${valuePath}: duplicate array _key`);
    }
  });

  walk(manifest.documents, (value, valuePath) => {
    if (value?._type !== "localizedBlockContentValue") return;
    if (!Array.isArray(value.value)) {
      errors.push(`${valuePath}.value: Portable Text must be an array`);
      return;
    }
    if (value.value.some((block) => !block?._type || !block?._key)) {
      errors.push(
        `${valuePath}.value: Portable Text block is missing _type or _key`,
      );
    }
  });

  const uniqueWarnings = [...new Set(warnings)].sort();
  const report = {
    status: errors.length
      ? "failed"
      : uniqueWarnings.length
        ? "passed_with_warnings"
        : "passed",
    targetDataset: manifest.target.dataset,
    counts: {
      productions: manifest.documents.productions.length,
      portfolioPages: 1,
      assets: manifest.assets.length,
      awards: manifest.documents.portfolioPage.awards?.length || 0,
      teachingExperiences:
        manifest.documents.portfolioPage.teachingExperiences?.length || 0,
      galleryItems: manifest.documents.portfolioPage.gallery?.length || 0,
    },
    errors,
    warnings: uniqueWarnings,
    checks: [
      "source-to-transform counts",
      "source key uniqueness",
      "asset file existence",
      "localized field coverage",
      "Portable Text shape and stable keys",
      "array key uniqueness",
    ],
  };

  await fs.mkdir(path.dirname(dryRunReportPath), { recursive: true });
  await fs.writeFile(dryRunReportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Local validation: ${report.status}`);
  console.log(`Errors: ${errors.length}; warnings: ${uniqueWarnings.length}`);
  console.log(`Report: ${dryRunReportPath}`);

  if (errors.length) process.exitCode = 1;
}

async function validateRemote() {
  const manifest = JSON.parse(await fs.readFile(transformedPath, "utf8"));
  const client = await getAuthenticatedClient(targetDataset);
  const result = await client.fetch(`{
    "productionCount": count(*[_type == "production"]),
    "portfolio": *[_id == "portfolioPage"][0]{
      _id,
      "productionReferenceCount": count(productions),
      "awardCount": count(awards),
      "teachingCount": count(teachingExperiences),
      "galleryCount": count(gallery)
    },
    "brokenProductionReferences": count(*[_id == "portfolioPage"].productions[!defined(@->._id)]),
    "launchGaps": *[_id == "portfolioPage"][0]{
      "contactHeadingFa": defined(contact.heading[language == "fa"][0].value),
      "headshotAltFa": defined(headshot.alt[language == "fa"][0].value),
      "resumeAltFa": defined(resumeImage.alt[language == "fa"][0].value),
      "upcomingAltFa": defined(upcomingWork.image.alt[language == "fa"][0].value),
      "galleryAltGaps": count(gallery[!defined(image.alt[language == "fa"][0].value)]),
      "managedPortfolio": defined(downloads.portfolioFile.asset->url),
      "managedResume": defined(downloads.resumeFile.asset->url)
    }
  }`);

  const errors = [];
  if (result.productionCount !== manifest.counts.productions) {
    errors.push(
      `Expected ${manifest.counts.productions} productions, found ${result.productionCount}`,
    );
  }
  if (!result.portfolio?._id) errors.push("Portfolio singleton is missing");
  if (
    result.portfolio?.productionReferenceCount !==
    manifest.productionOrder.length
  ) {
    errors.push(
      "Portfolio production reference count does not match the manifest",
    );
  }
  if (result.brokenProductionReferences)
    errors.push("Portfolio contains broken production references");
  if (!result.launchGaps?.contactHeadingFa) errors.push('Persian contact heading is missing')
  if (!result.launchGaps?.headshotAltFa) errors.push('Persian headshot alt text is missing')
  if (!result.launchGaps?.resumeAltFa) errors.push('Persian resume image alt text is missing')
  if (!result.launchGaps?.upcomingAltFa) errors.push('Persian upcoming image alt text is missing')
  if (result.launchGaps?.galleryAltGaps) errors.push('Gallery has missing Persian alt text')
  if (!result.launchGaps?.managedPortfolio) errors.push('Managed portfolio file is missing')
  if (!result.launchGaps?.managedResume) errors.push('Managed CV file is missing')

  const report = {
    status: errors.length ? "failed" : "passed",
    targetDataset,
    result,
    errors,
  };
  await fs.writeFile(remoteReportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Remote validation: ${report.status}`);
  console.log(`Report: ${remoteReportPath}`);
  if (errors.length) process.exitCode = 1;
}

if (isRemote) await validateRemote();
else await validateLocal();
