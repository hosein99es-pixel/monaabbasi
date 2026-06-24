import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";

import {
  importReportPath,
  sourceRoot,
  targetDataset,
  transformedPath,
} from "../config.mjs";
import { stableKey } from "../lib/content.mjs";
import { getAuthenticatedClient } from "../lib/sanity.mjs";

const shouldCommit = process.argv.includes("--commit");
const manifest = JSON.parse(await fs.readFile(transformedPath, "utf8"));

if (targetDataset !== "migration-test") {
  throw new Error(
    `Import is locked to migration-test, received: ${targetDataset}`,
  );
}

if (!shouldCommit) {
  console.log("Dry run only; no Sanity data was changed.");
  console.log(
    `Target: ${manifest.target.projectId}/${manifest.target.dataset}`,
  );
  console.log(`Productions: ${manifest.counts.productions}`);
  console.log(`Assets: ${manifest.counts.assets}`);
  console.log(
    "Run `npm run import:commit` after reviewing reports/dry-run.json.",
  );
  process.exit(0);
}

const client = await getAuthenticatedClient(targetDataset);
const datasets = await client.datasets.list();
if (!datasets.some((dataset) => dataset.name === targetDataset)) {
  throw new Error(
    `Dataset ${targetDataset} does not exist. Run npm run dataset:prepare first.`,
  );
}

async function resolveAsset(sourcePath) {
  const sourceId = `legacy:${sourcePath}`;
  const existingId = await client.fetch(
    `*[_type == "sanity.imageAsset" && source.id == $sourceId][0]._id`,
    { sourceId },
  );
  if (existingId) return existingId;

  const absolutePath = path.join(sourceRoot, sourcePath);
  const asset = await client.assets.upload(
    "image",
    createReadStream(absolutePath),
    {
      filename: path.basename(sourcePath),
      preserveFilename: true,
      source: { id: sourceId, name: "legacy static portfolio" },
    },
  );
  console.log(`Uploaded ${sourcePath}`);
  return asset._id;
}

const assetIds = new Map();
for (const asset of manifest.assets) {
  assetIds.set(asset.sourcePath, await resolveAsset(asset.sourcePath));
}

function resolveImages(value) {
  if (Array.isArray(value)) return value.map(resolveImages);
  if (!value || typeof value !== "object") return value;

  if (value._type === "migrationImage") {
    const assetId = assetIds.get(value.sourcePath);
    if (!assetId) throw new Error(`No uploaded asset for ${value.sourcePath}`);

    return {
      ...(value._key ? { _key: value._key } : {}),
      _type: "portfolioImage",
      asset: { _type: "reference", _ref: assetId },
      ...(value.alt ? { alt: value.alt } : {}),
      ...(value.hotspot ? { hotspot: value.hotspot } : {}),
    };
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, resolveImages(item)]),
  );
}

function withMigrationTimestamp(document) {
  return {
    ...document,
    migration: {
      ...document.migration,
      migratedAt: new Date().toISOString(),
    },
  };
}

async function upsertProduction(document) {
  const matches = await client.fetch(
    `*[_type == "production" && sourceKey == $sourceKey][0...2]{_id}`,
    { sourceKey: document.sourceKey },
  );
  if (matches.length > 1)
    throw new Error(`Duplicate production sourceKey: ${document.sourceKey}`);

  const resolved = withMigrationTimestamp(resolveImages(document));
  if (matches[0]?._id) {
    return client.createOrReplace({ ...resolved, _id: matches[0]._id });
  }
  return client.create(resolved);
}

const productionIds = new Map();
for (const production of manifest.documents.productions) {
  const imported = await upsertProduction(production);
  productionIds.set(production.sourceKey, imported._id);
  console.log(`Upserted ${production.sourceKey}`);
}

const portfolio = withMigrationTimestamp(
  resolveImages(manifest.documents.portfolioPage),
);
portfolio.productions = manifest.productionOrder.map((sourceKey) => {
  const documentId = productionIds.get(sourceKey);
  if (!documentId) throw new Error(`No imported production for ${sourceKey}`);
  return {
    _key: stableKey(`portfolio:production-reference:${sourceKey}`),
    _type: "reference",
    _ref: documentId,
  };
});

await client.createOrReplace(portfolio);

const report = {
  status: "imported",
  dataset: targetDataset,
  counts: {
    productions: productionIds.size,
    portfolioPages: 1,
    assets: assetIds.size,
  },
};
await fs.writeFile(importReportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Import complete: ${importReportPath}`);
