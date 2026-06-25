import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  projectId,
  schemaApiVersion,
  studioRoot,
  targetDataset,
  temporaryManifestPath,
} from "../config.mjs";
import { loadCliCore } from "../lib/dependencies.mjs";
import { getManagementClient } from "../lib/sanity.mjs";

if (targetDataset !== "migration-test") {
  throw new Error(
    `Dataset preparation is locked to migration-test, received: ${targetDataset}`,
  );
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}

const managementClient = await getManagementClient();
const datasets = await managementClient.datasets.list();
if (!datasets.some((dataset) => dataset.name === targetDataset)) {
  await managementClient.datasets.create(targetDataset, { aclMode: "public" });
  console.log(`Created dataset: ${targetDataset}`);
} else {
  console.log(`Dataset already exists: ${targetDataset}`);
}

await fs.rm(temporaryManifestPath, { recursive: true, force: true });
const sanityBin = path.join(studioRoot, "node_modules", ".bin", "sanity");
await run(sanityBin, ["manifest", "extract", "--path", temporaryManifestPath], {
  cwd: studioRoot,
  env: { ...process.env, SANITY_STUDIO_DATASET: targetDataset },
});

const manifest = JSON.parse(
  await fs.readFile(
    path.join(temporaryManifestPath, "create-manifest.json"),
    "utf8",
  ),
);
const workspace = manifest.workspaces.find((item) => item.name === "default");
if (!workspace)
  throw new Error(
    "Default Studio workspace is missing from the generated manifest",
  );

const schema = JSON.parse(
  await fs.readFile(path.join(temporaryManifestPath, workspace.schema), "utf8"),
);
const { getGlobalCliClient } = await loadCliCore();
const schemaClient = await getGlobalCliClient({
  apiVersion: schemaApiVersion,
  requireUser: true,
});

await schemaClient.request({
  method: "PUT",
  uri: `/projects/${projectId}/datasets/${targetDataset}/schemas`,
  body: {
    schemas: [
      {
        schema,
        version: "2025-05-01",
        workspace: { name: "default", title: "monaabbasi" },
      },
    ],
  },
});

await fs.rm(temporaryManifestPath, { recursive: true, force: true });
console.log(`Deployed schema to ${projectId}/${targetDataset}`);
