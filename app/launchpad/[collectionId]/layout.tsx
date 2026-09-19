import type { Metadata } from 'next'
import { sql } from '@/lib/database'
// VideoBackground disabled for debugging click issues
// import { VideoBackground } from './components/VideoBackground'

interface Collection {
  name: string
  description?: string
  banner_image_url?: string
}

async function getCollection(collectionId: string): Promise<Collection | null> {
  if (!sql) return null

  try {
    const result = await sql`
      SELECT 
        name,
        description,
        banner_image_url
      FROM collections
      WHERE id = ${collectionId}
    `
    const collection = Array.isArray(result) && result.length > 0 ? result[0] : null
    return collection as Collection | null
  } catch (error) {
    console.error('Error fetching collection for metadata:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collectionId: string }>
}): Promise<Metadata> {
  const { collectionId } = await params
  const collection = await getCollection(collectionId)

  if (!collection) {
    return {
      title: 'Collection - HoodGFX',
      description: 'Mint ordinals on HoodGFX',
    }
  }

  const title = `${collection.name} - HoodGFX Launchpad`
  const description = collection.description || `Mint ${collection.name} on HoodGFX Launchpad`
  const imageUrl = collection.banner_image_url || '/hoodgfx-hero.png'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hoodgfx.com'
  const pageUrl = `${siteUrl}/${collectionId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HoodGFX',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: collection.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@hoodgfx',
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}

export default async function LaunchpadCollectionLayout({
  children,
  params: _params,
}: {
  children: React.ReactNode
  params: Promise<{ collectionId: string }>
}) {
  // VideoBackground disabled for debugging click issues
  // const { collectionId } = await _params

  return (
    <div className="relative min-h-screen" style={{ zIndex: 1 }}>
      {/* VideoBackground disabled for debugging click issues */}
      {/* <VideoBackground collectionId={collectionId} /> */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
