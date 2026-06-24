import Image from 'next/image'
import Link from 'next/link'

import type {PORTFOLIO_QUERY_RESULT} from '../../sanity.types'
import {localeCopy, type Locale} from '@/lib/locales'
import {urlFor} from '@/sanity/image'
import {PortableText} from './PortableText'

type Portfolio = NonNullable<PORTFOLIO_QUERY_RESULT>
type SanityImage = NonNullable<Portfolio['headshot']>
type Production = NonNullable<Portfolio['productions']>[number]

function imageUrl(image: SanityImage, width = 1400) {
  return urlFor(image).width(width).auto('format').quality(86).url()
}

function Artwork({
  image,
  className,
  priority = false,
  sizes,
}: {
  image?: SanityImage | null
  className?: string
  priority?: boolean
  sizes: string
}) {
  const dimensions = image?.asset?.metadata?.dimensions
  if (!image?.asset?.url || !dimensions?.width || !dimensions?.height) return null

  const blur = image.asset.metadata?.lqip
  return (
    <Image
      alt={image.alt ?? ''}
      blurDataURL={blur ?? undefined}
      className={className}
      height={dimensions.height}
      placeholder={blur ? 'blur' : 'empty'}
      priority={priority}
      sizes={sizes}
      src={imageUrl(image)}
      width={dimensions.width}
    />
  )
}

function SectionTitle({act, eyebrow, title}: {act: string; eyebrow: string; title?: string | null}) {
  return (
    <header className="section-heading">
      <span className="act-label">{act}</span>
      <p className="eyebrow">{eyebrow}</p>
      {title ? <h2>{title}</h2> : null}
    </header>
  )
}

function introFor(page: Portfolio, section: string) {
  return page.sectionIntroductions?.find((item) => item.section === section)
}

function ProductionGrid({items, locale}: {items: Production[]; locale: Locale}) {
  const directedBy = locale === 'fa' ? 'کارگردان' : 'Directed by'
  return (
    <div className="production-grid">
      {items.map((production, index) => (
        <article className="production-card" key={production._id}>
          <div className="production-image">
            <Artwork
              image={production.heroImage as SanityImage}
              sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
            />
            <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div className="production-copy">
            <div className="production-meta">
              <span>{production.role}</span>
              <span>{production.year}</span>
            </div>
            <h3>{production.title}</h3>
            <p>{[production.director ? `${directedBy} ${production.director}` : null, production.venue].filter(Boolean).join(' · ')}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

export function PortfolioSite({page, locale}: {page: Portfolio; locale: Locale}) {
  const c = localeCopy[locale]
  const otherLocale = locale === 'en' ? 'fa' : 'en'
  const theatre = page.productions?.filter((item) => ['theatre', 'performance'].includes(item.medium ?? '')) ?? []
  const film = page.productions?.filter((item) => ['shortFilm', 'film', 'television'].includes(item.medium ?? '')) ?? []
  const theatreIntro = introFor(page, 'theatre')
  const filmIntro = introFor(page, 'film')
  const awardsIntro = introFor(page, 'awards')
  const teachingIntro = introFor(page, 'teaching')
  const galleryIntro = introFor(page, 'gallery')
  const downloadsIntro = introFor(page, 'downloads')
  const portfolioFile = page.downloads?.portfolioFile?.asset
  const resumeFile = page.downloads?.resumeFile?.asset

  const nav = [
    ['profile', c.intro], ['resume', c.resume], ['theatre', c.theatre], ['film', c.film],
    ['awards', c.awards], ['teaching', c.teaching], ['upcoming', c.upcoming], ['gallery', c.gallery],
    ['downloads', c.downloads], ['contact', c.contact],
  ]

  return (
    <div className="site-shell" dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#main">{c.skip}</a>
      <header className="site-header">
        <Link className="brand" href={locale === 'en' ? '/' : '/fa'} aria-label={`${page.name} home`}>
          <span className="brand-mark">FA</span>
          <span><strong>{page.name}</strong><small>{c.intro}</small></span>
        </Link>
        <nav aria-label={c.nav}>
          {nav.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
        </nav>
        <Link className="locale-switch" href={`/${otherLocale}`} lang={otherLocale} hrefLang={otherLocale}>
          {locale === 'en' ? 'فارسی' : 'English'}
        </Link>
      </header>

      <main id="main">
        <section className="hero" id="profile" aria-labelledby="profile-title">
          <div className="hero-art">
            <Artwork image={page.headshot} className="hero-image" priority sizes="100vw" />
            <div className="hero-shade" />
          </div>
          <div className="hero-content">
            <p className="act-label">{c.act} 01</p>
            <h1 id="profile-title">{page.name}</h1>
            <PortableText value={page.intro} className="hero-intro" />
            <ul className="role-list" aria-label={locale === 'fa' ? 'زمینه‌های کاری' : 'Portfolio categories'}>
              {page.roles?.map((role) => <li key={role._key}>{role.label}</li>)}
            </ul>
            <div className="hero-actions">
              {portfolioFile?.url ? <a className="button primary" href={`${portfolioFile.url}?dl=${portfolioFile.originalFilename ?? 'portfolio'}`}>{c.portfolio}</a> : null}
              <a className="button ghost" href="#contact">{c.contact}</a>
            </div>
          </div>
        </section>

        <section className="section section-resume" id="resume" aria-labelledby="resume-title">
          <div className="resume-art"><Artwork image={page.resumeImage as SanityImage} sizes="(max-width: 800px) 100vw, 42vw" /></div>
          <div className="resume-copy">
            <SectionTitle act={`${c.act} 02`} eyebrow={c.resume} title={page.resumeHeading} />
            <PortableText value={page.resumeBody} className="rich-copy" />
            <div className="detail-columns">
              <div><h3>{locale === 'fa' ? 'تحصیلات' : 'Education'}</h3>{page.education?.map((item) => <article key={item._key}><span>{item.qualification}</span><h4>{item.institution}</h4><PortableText value={item.description} /></article>)}</div>
              <div><h3>{locale === 'fa' ? 'مهارت‌ها' : 'What I bring into the room'}</h3>{page.skills?.map((item) => <article key={item._key}><span>{item.category}</span><h4>{item.title}</h4><PortableText value={item.description} /></article>)}</div>
            </div>
          </div>
        </section>

        <section className="section" id="theatre" aria-labelledby="theatre-title">
          <SectionTitle act={`${c.act} 03`} eyebrow={theatreIntro?.label ?? c.theatre} title={theatreIntro?.heading ?? c.theatre} />
          <PortableText value={theatreIntro?.body} className="section-intro" />
          <ProductionGrid items={theatre} locale={locale} />
        </section>

        <section className="section section-rose" id="film" aria-labelledby="film-title">
          <SectionTitle act={`${c.act} 04`} eyebrow={filmIntro?.label ?? c.film} title={filmIntro?.heading ?? c.film} />
          <PortableText value={filmIntro?.body} className="section-intro" />
          <ProductionGrid items={film} locale={locale} />
        </section>

        <section className="section" id="awards" aria-labelledby="awards-title">
          <SectionTitle act={`${c.act} 05`} eyebrow={awardsIntro?.label ?? c.awards} title={awardsIntro?.heading ?? c.awards} />
          <div className="award-grid">{page.awards?.map((award, index) => <article key={award._key}><span>{String(index + 1).padStart(2, '0')}</span><h3>{award.title}</h3><PortableText value={award.description} /></article>)}</div>
        </section>

        <section className="section section-teaching" id="teaching" aria-labelledby="teaching-title">
          <SectionTitle act={`${c.act} 06`} eyebrow={teachingIntro?.label ?? c.teaching} title={teachingIntro?.heading ?? c.teaching} />
          <div className="timeline">{page.teachingExperiences?.map((item) => <article key={item._key}><div className="timeline-dot"/><div><h3>{item.title}</h3><PortableText value={item.description} /></div></article>)}</div>
        </section>

        <section className="section upcoming" id="upcoming" aria-labelledby="upcoming-title">
          <div className="upcoming-image"><Artwork image={page.upcomingWork?.image as SanityImage} sizes="(max-width: 800px) 100vw, 50vw" /></div>
          <div><SectionTitle act={`${c.act} 07`} eyebrow={c.upcoming} title={page.upcomingWork?.title} /><PortableText value={page.upcomingWork?.description} className="section-intro" /></div>
        </section>

        <section className="section" id="gallery" aria-labelledby="gallery-title">
          <SectionTitle act={`${c.act} 08`} eyebrow={galleryIntro?.label ?? c.gallery} title={galleryIntro?.heading ?? c.gallery} />
          <div className="gallery-grid">{page.gallery?.map((item, index) => <figure key={item._key} className={`gallery-item gallery-item-${index + 1}`}><Artwork image={item.image as SanityImage} sizes="(max-width: 700px) 100vw, 50vw" /><figcaption><span>{item.label}</span><strong>{item.title}</strong></figcaption></figure>)}</div>
        </section>

        <section className="section downloads" id="downloads" aria-labelledby="downloads-title">
          <SectionTitle act={`${c.act} 09`} eyebrow={downloadsIntro?.label ?? c.downloads} title={downloadsIntro?.heading ?? c.downloads} />
          <PortableText value={downloadsIntro?.body} className="section-intro" />
          <div className="download-actions">
            {portfolioFile?.url ? <a className="button primary" href={`${portfolioFile.url}?dl=${portfolioFile.originalFilename ?? 'portfolio'}`}>{c.portfolio}</a> : null}
            {resumeFile?.url ? <a className="button outline" href={`${resumeFile.url}?dl=${resumeFile.originalFilename ?? 'cv'}`}>{c.cv}</a> : null}
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <p className="act-label">{c.act} 10</p>
          <p className="eyebrow">{c.contact}</p>
          <h2 id="contact-title">{page.contact?.heading}</h2>
          <PortableText value={page.contact?.description} className="section-intro" />
          <div className="contact-links">
            {page.contact?.email ? <a href={`mailto:${page.contact.email}`}>{page.contact.email}</a> : null}
            {page.contact?.phone ? <a href={`tel:${page.contact.phone}`}>{page.contact.phone}</a> : null}
            {page.contact?.whatsappUrl ? <a href={page.contact.whatsappUrl}>WhatsApp</a> : null}
          </div>
        </section>
      </main>

      <footer className="site-footer"><span>© {new Date().getFullYear()} {page.name}</span><p>{page.footerText}</p></footer>
    </div>
  )
}
