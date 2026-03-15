import './globals.css'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scam-alert.example.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Scam Alert – Report & Search Scam Phone Numbers',
    template: '%s | Scam Alert',
  },
  description:
    'Crowdsourced scam phone number reports. Report suspicious numbers, search by number, see risk levels and affected areas. Protect yourself from bKash, Nagad, job and marketplace scams.',
  keywords: [
    'scam alert',
    'scam phone number',
    'report scam',
    'Bangladesh scam',
    'bKash scam',
    'Nagad scam',
    'fraud report',
    'phone number scam',
  ],
  authors: [{ name: 'Scam Alert' }],
  creator: 'Scam Alert',
  openGraph: {
    type: 'website',
    locale: 'en',
    url: siteUrl,
    siteName: 'Scam Alert',
    title: 'Scam Alert – Report & Search Scam Phone Numbers',
    description:
      'Crowdsourced scam phone number reports. Report and search suspicious numbers, see risk levels and affected areas.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scam Alert – Report & Search Scam Phone Numbers',
    description: 'Crowdsourced scam phone number reports. Report and search suspicious numbers.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: '66ef131f269072d8',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Scam Alert',
  description:
    'Crowdsourced scam phone number reports. Report and search suspicious numbers, see risk levels and affected areas.',
  url: siteUrl,
  applicationCategory: 'UtilitiesApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="app-body">{children}</body>
    </html>
  )
}

