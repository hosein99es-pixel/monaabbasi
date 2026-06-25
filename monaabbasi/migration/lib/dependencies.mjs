import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { sourceRoot, studioRoot } from "../config.mjs";

const studioRequire = createRequire(path.join(studioRoot, "package.json"));
const sourceRequire = createRequire(path.join(sourceRoot, "package.json"));

async function importResolved(requireFrom, packageName) {
  return import(pathToFileURL(requireFrom.resolve(packageName)).href);
}

export async function loadMarkdown() {
  return importResolved(studioRequire, "@portabletext/markdown");
}

export async function loadCliCore() {
  return importResolved(studioRequire, "@sanity/cli-core");
}

export function loadJsdom() {
  return sourceRequire("jsdom");
}
