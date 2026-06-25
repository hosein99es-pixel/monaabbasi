import {notFound} from 'next/navigation'
import {draftMode} from 'next/headers'
import {PortfolioSite} from '@/components/Portfolio'
import {isLocale} from '@/lib/locales'
import {sanityFetch} from '@/sanity/live'
import {PORTFOLIO_QUERY} from '@/sanity/queries'

export default async function LocalePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const {isEnabled: isDraftMode} = await draftMode()

  if (!isLocale(locale)) notFound()

  const {data: page} = await sanityFetch({
    query: PORTFOLIO_QUERY,
    params: {locale},
    perspective: isDraftMode ? 'drafts' : 'published',
    stega: isDraftMode,
  })

  if (!page) return <main className="unavailable"><p>{locale === 'fa' ? 'پرتفولیو موقتاً در دسترس نیست.' : 'Portfolio temporarily unavailable.'}</p><a href="mailto:monaaaabbasi@gmail.com">{locale === 'fa' ? 'تماس با فاطمه' : 'Contact Fateme'}</a></main>
  return <PortfolioSite page={page} locale={locale} />
}
