import fs from 'node:fs'
import path from 'node:path'

import {sourceRoot, targetDataset} from '../config.mjs'
import {getAuthenticatedClient} from '../lib/sanity.mjs'

if (targetDataset !== 'migration-test') {
  throw new Error(`Safety stop: remediation only targets migration-test, received ${targetDataset}`)
}

const client = await getAuthenticatedClient(targetDataset)
const portfolio = await client.fetch('*[_id == "portfolioPage"][0]')
if (!portfolio) throw new Error('portfolioPage was not found in migration-test')

const translations = {
  headshot: 'پرتره گرم فاطمه عباسی برای پرتفولیوی بازیگری',
  resumeImage: 'فاطمه عباسی در فضای گرم نمایشی رو به قاب‌های خالی نگاه می‌کند',
  upcomingImage: 'فاطمه عباسی نشسته مقابل پس‌زمینه سبز برای نمایش مفیستو برای همیشه',
  gallery: {
    cbb3f1397a04: 'پرتره گرم فاطمه عباسی برای پرتفولیوی بازیگری',
    ec1758046a0c: 'عکس اجرای نمایش مرگ فروشنده',
    '7095a6b2e82b': 'عکس اجرای نمایش کچل و کفترباز',
    '911373155adc': 'نمایی از فیلم کوتاه نهال و فضانورد با حضور فاطمه عباسی',
  },
}

function addPersian(values = [], text) {
  if (values.some((entry) => entry.language === 'fa')) return values
  return [...values, {_key: 'fa', _type: 'localizedStringValue', language: 'fa', value: text}]
}

async function ensureFileAsset(field, sourceName, filename) {
  if (portfolio.downloads?.[field]?.asset?._ref) return portfolio.downloads[field]
  const sourcePath = path.join(sourceRoot, sourceName)
  const asset = await client.assets.upload('file', fs.createReadStream(sourcePath), {
    contentType: 'text/html; charset=utf-8',
    filename,
  })
  return {_type: 'file', asset: {_type: 'reference', _ref: asset._id}}
}

const gallery = (portfolio.gallery ?? []).map((item) => ({
  ...item,
  image: {
    ...item.image,
    alt: addPersian(item.image?.alt, translations.gallery[item._key] ?? 'تصویر پرتفولیوی فاطمه عباسی'),
  },
}))

const [portfolioFile, resumeFile] = await Promise.all([
  ensureFileAsset('portfolioFile', 'portfolio.html', 'fateme-abbasi-portfolio.html'),
  ensureFileAsset('resumeFile', 'cv.html', 'fateme-abbasi-cv.html'),
])

const contact = {
  ...portfolio.contact,
  heading: addPersian(portfolio.contact?.heading, 'هر صحنه‌ای باید تمام شود.'),
}

const nextDownloads = {...portfolio.downloads, portfolioFile, resumeFile}

await client
  .patch('portfolioPage')
  .ifRevisionId(portfolio._rev)
  .set({
    contact,
    downloads: nextDownloads,
    gallery,
    headshot: {...portfolio.headshot, alt: addPersian(portfolio.headshot?.alt, translations.headshot)},
    resumeImage: {...portfolio.resumeImage, alt: addPersian(portfolio.resumeImage?.alt, translations.resumeImage)},
    upcomingWork: {
      ...portfolio.upcomingWork,
      image: {
        ...portfolio.upcomingWork?.image,
        alt: addPersian(portfolio.upcomingWork?.image?.alt, translations.upcomingImage),
      },
    },
  })
  .commit()

console.log('Patched migration-test launch translations and managed download assets.')
