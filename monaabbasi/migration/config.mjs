import path from "node:path";
import { fileURLToPath } from "node:url";

const migrationRoot = path.dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = path.resolve(migrationRoot, "..");
export const studioRoot = path.join(workspaceRoot, "studio");
export const sourceRoot = process.env.SOURCE_ROOT
  ? path.resolve(process.env.SOURCE_ROOT)
  : path.resolve(migrationRoot, "../..");

export const extractedPath = path.join(
  migrationRoot,
  "extracted",
  "source.json",
);
export const transformedPath = path.join(
  migrationRoot,
  "transformed",
  "manifest.json",
);
export const dryRunReportPath = path.join(
  migrationRoot,
  "reports",
  "dry-run.json",
);
export const inventoryReportPath = path.join(
  migrationRoot,
  "reports",
  "inventory.json",
);
export const remoteReportPath = path.join(
  migrationRoot,
  "reports",
  "remote-validation.json",
);
export const importReportPath = path.join(
  migrationRoot,
  "reports",
  "import.json",
);
export const temporaryManifestPath = path.join(migrationRoot, ".tmp-manifest");

export const projectId = "esf8v11h";
export const targetDataset = process.env.SANITY_DATASET || "migration-test";
export const apiVersion = "2026-06-22";
export const schemaApiVersion = "v2025-03-01";

export const locales = [
  { id: "en", title: "English" },
  { id: "fa", title: "فارسی" },
];
