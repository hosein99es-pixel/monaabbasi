import { createHash } from "node:crypto";

export function stableKey(value) {
  return createHash("sha1").update(String(value)).digest("hex").slice(0, 12);
}

export function makeKeyGenerator(seed) {
  let index = 0;
  return () => stableKey(`${seed}:${index++}`);
}

export function localizedString(en, fa) {
  const values = [
    ["en", en],
    ["fa", fa],
  ]
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([language, value]) => ({
      _key: language,
      _type: "localizedStringValue",
      language,
      value: value.trim(),
    }));

  return values.length ? values : undefined;
}

export function localizedBlocks(markdownToPortableText, seed, en, fa) {
  const values = [
    ["en", en],
    ["fa", fa],
  ]
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([language, value]) => ({
      _key: language,
      _type: "localizedBlockContentValue",
      language,
      value: markdownToPortableText(value.trim(), {
        keyGenerator: makeKeyGenerator(`${seed}:${language}`),
      }),
    }));

  return values.length ? values : undefined;
}

export function migrationImage(sourcePath, alt, hotspot) {
  if (!sourcePath) return undefined;
  return {
    _type: "migrationImage",
    sourcePath,
    ...(alt ? { alt } : {}),
    ...(hotspot ? { hotspot } : {}),
  };
}

export function compact(value) {
  if (Array.isArray(value))
    return value.map(compact).filter((item) => item !== undefined);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, compact(item)])
      .filter(([, item]) => {
        if (item === undefined || item === null || item === "") return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (
          typeof item === "object" &&
          !Array.isArray(item) &&
          Object.keys(item).length === 0
        ) {
          return false;
        }
        return true;
      }),
  );
}

export function collectMigrationImages(value, images = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectMigrationImages(item, images));
    return images;
  }
  if (!value || typeof value !== "object") return images;

  if (value._type === "migrationImage" && value.sourcePath) {
    images.set(value.sourcePath, { sourcePath: value.sourcePath });
    return images;
  }

  Object.values(value).forEach((item) => collectMigrationImages(item, images));
  return images;
}
