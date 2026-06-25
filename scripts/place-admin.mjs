// Copies the built Sanity Studio (monaabbasi/studio/dist, produced by
// `sanity build` with basePath '/admin') into dist/admin so the Studio is served
// at https://<site>/admin on the same Netlify site. Content-only copy (no mode
// preservation) to stay friendly to mounted filesystems. Run after both the site
// build and the studio build (see `build:all`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'monaabbasi', 'studio', 'dist');
const DEST = path.join(ROOT, 'dist', 'admin');

if (!fs.existsSync(SRC)) {
  console.error(`[place-admin] Studio build not found at ${SRC}. Run \`npm --prefix monaabbasi/studio run build\` first.`);
  process.exit(1);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === '.DS_Store') continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
}

fs.mkdirSync(DEST, { recursive: true });
copyRecursive(SRC, DEST);
console.log('[place-admin] copied Sanity Studio -> dist/admin');
