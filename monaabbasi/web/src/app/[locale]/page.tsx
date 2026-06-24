import {notFound} from 'next/navigation'
import {PortfolioSite} from '@/components/Portfolio'
import {isLocale} from '@/lib/locales'
import {client} from '@/sanity/client'
import {PORTFOLIO_QUERY} from '@/sanity/queries'

export default async function LocalePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  const page = await client.fetch(PORTFOLIO_QUERY, {locale}, {next: {revalidate: 30}})
  if (!page) return <main className="unavailable"><p>{locale === 'fa' ? 'پرتفولیو موقتاً در دسترس نیست.' : 'Portfolio temporarily unavailable.'}</p><a href="mailto:monaaaabbasi@gmail.com">{locale === 'fa' ? 'تماس با فاطمه' : 'Contact Fateme'}</a></main>
  return <PortfolioSite page={page} locale={locale} />
}
