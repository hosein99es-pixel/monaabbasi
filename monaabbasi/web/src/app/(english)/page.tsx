import {PortfolioSite} from '@/components/Portfolio'
import {client} from '@/sanity/client'
import {PORTFOLIO_QUERY} from '@/sanity/queries'

export default async function HomePage() {
  const page = await client.fetch(PORTFOLIO_QUERY, {locale: 'en'}, {next: {revalidate: 30}})
  if (!page) return <main className="unavailable"><p>Portfolio temporarily unavailable.</p><a href="mailto:monaaaabbasi@gmail.com">Contact Fateme</a></main>
  return <PortfolioSite page={page} locale="en" />
}
