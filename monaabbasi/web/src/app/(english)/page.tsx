import {draftMode} from 'next/headers'
import {PortfolioSite} from '@/components/Portfolio'
import {sanityFetch} from '@/sanity/live'
import {PORTFOLIO_QUERY} from '@/sanity/queries'

export default async function HomePage() {
  const {isEnabled: isDraftMode} = await draftMode()
  const {data: page} = await sanityFetch({
    query: PORTFOLIO_QUERY,
    params: {locale: 'en'},
    perspective: isDraftMode ? 'drafts' : 'published',
    stega: isDraftMode,
  })

  if (!page) return <main className="unavailable"><p>Portfolio temporarily unavailable.</p><a href="mailto:monaaaabbasi@gmail.com">Contact Fateme</a></main>
  return <PortfolioSite page={page} locale="en" />
}
