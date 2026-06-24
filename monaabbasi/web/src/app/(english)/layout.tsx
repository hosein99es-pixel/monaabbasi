import type {Metadata} from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: {default: 'Fateme Abbasi — Portfolio', template: '%s — Fateme Abbasi'},
  description: 'The official acting, theatre, teaching, and screen portfolio of Fateme Abbasi.',
}

export default function EnglishLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>
}
