import {notFound} from 'next/navigation'
import type {Metadata} from 'next'
import {isLocale, locales} from '@/lib/locales'
import '../globals.css'

export const metadata: Metadata = {
  title: {default: 'Fateme Abbasi — Portfolio', template: '%s — Fateme Abbasi'},
  description: 'The official acting, theatre, teaching, and screen portfolio of Fateme Abbasi.',
}

export function generateStaticParams() { return locales.map((locale) => ({locale})) }

export default async function LocaleLayout({children, params}: Readonly<{children: React.ReactNode; params: Promise<{locale: string}>}>) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  return <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'} data-scroll-behavior="smooth"><body>{children}</body></html>
}
