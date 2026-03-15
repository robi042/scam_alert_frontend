import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) return envUrl.replace(/\/$/, '')
  try {
    const h = await headers()
    const host = h.get('host') || h.get('x-forwarded-host')
    const proto = h.get('x-forwarded-proto') || 'https'
    if (host) return `${proto === 'https' ? 'https' : 'http'}://${host}`
  } catch (_) {}
  return 'https://scam-alert.example.com'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl()
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
