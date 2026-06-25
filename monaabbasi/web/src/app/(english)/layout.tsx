import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {DisableDraftMode} from '@/components/DisableDraftMode'
import {SanityLive} from '@/sanity/live'
import '../globals.css'

export const metadata: Metadata = {
  title: {default: 'Fateme Abbasi — Portfolio', template: '%s — Fateme Abbasi'},
  description: 'The official acting, theatre, teaching, and screen portfolio of Fateme Abbasi.',
}

export default async function EnglishLayout({children}: Readonly<{children: React.ReactNode}>) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode ? (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        ) : null}
      </body>
    </html>
  )
}
