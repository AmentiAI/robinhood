import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { sql } from '@/lib/database'
import {
  compressImage,
  compressionExtension,
  normalizeCompressionFormat,
} from '@/lib/image-compression'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function extractValue(data: unknown): string | null {
  if (typeof data === 'string') return data
  if (typeof data === 'number') return String(data)
  if (data === null || data === undefined) return null
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.name === 'string') return obj.name
    if (typeof obj.value === 'string') return obj.value
    if (obj.name && typeof obj.name === 'object') return extractValue(obj.name)
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && (obj[key] as string).length > 0) {
        return obj[key] as string
      }
    }
  }
  return null
}

function traitsToAttributes(traits: unknown): Array<{ trait_type: string; value: string }> {
  let parsed = traits
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return []
    }
  }
  if (!parsed || typeof parsed !== 'object') return []

  const attributes: Array<{ trait_type: string; value: string }> = []
  for (const [traitType, traitData] of Object.entries(parsed as Record<string, unknown>)) {
    const traitValue = extractValue(traitData)
    if (traitValue) {
      attributes.push({
        trait_type: traitType,
        value: capitalizeWords(traitValue),
      })
    }
  }
  return attributes
}

// GET /api/collections/[id]/export-opensea?wallet_address=
// Builds an OpenSea drop zip: compressed images + per-token metadata.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const { id: collectionId } = await params
    const walletAddress = new URL(request.url).searchParams.get('wallet_address')?.trim()
    if (!walletAddress) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 })
    }

    const collectionResult = await sql`
      SELECT id, name, description, wallet_address,
             COALESCE(compression_quality::integer, 100) as compression_quality,
             COALESCE(compression_dimensions::integer, 1024) as compression_dimensions,
             compression_target_kb,
             COALESCE(compression_format, 'webp') as compression_format
      FROM collections
      WHERE id::text = ${collectionId}
    ` as any[]

    const collection = Array.isArray(collectionResult) ? collectionResult[0] : null
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const isOwner = walletAddress === collection.wallet_address
    if (!isOwner) {
      const collaboratorResult = await sql`
        SELECT role
        FROM collection_collaborators
        WHERE collection_id::text = ${collectionId}
          AND wallet_address = ${walletAddress}
          AND status = 'accepted'
      ` as any[]
      if (!Array.isArray(collaboratorResult) || collaboratorResult.length === 0) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }

    const ordinalsResult = await sql`
      SELECT id, image_url, ordinal_number, traits, created_at
      FROM generated_ordinals
      WHERE collection_id::text = ${collectionId}
        AND image_url IS NOT NULL
      ORDER BY ordinal_number ASC NULLS LAST, created_at ASC
    ` as any[]

    const ordinals = Array.isArray(ordinalsResult) ? ordinalsResult : []
    if (ordinals.length === 0) {
      return NextResponse.json({ error: 'No images to export' }, { status: 400 })
    }

    const quality = Number(collection.compression_quality ?? 100)
    const dimensions = Number(collection.compression_dimensions ?? 1024)
    const targetKB = collection.compression_target_kb
      ? Number(collection.compression_target_kb)
      : undefined
    const format = normalizeCompressionFormat(collection.compression_format)
    const ext = compressionExtension(format)
    const description = String(collection.description || collection.name || '').trim()

    const zip = new JSZip()
    const images = zip.folder('images')
    const metadataFolder = zip.folder('metadata')
    const allMetadata: Array<Record<string, unknown>> = []
    const failures: number[] = []

    for (let i = 0; i < ordinals.length; i++) {
      const ordinal = ordinals[i]
      const tokenId = i + 1
      const filename = `${tokenId}.${ext}`

      try {
        const imageResponse = await fetch(ordinal.image_url)
        if (!imageResponse.ok) throw new Error(`Download failed (${imageResponse.status})`)
        const imageBlob = await imageResponse.blob()
        const compressed = await compressImage(
          imageBlob,
          quality,
          dimensions,
          targetKB && targetKB > 0 ? targetKB : undefined,
          format
        )
        const bytes = Buffer.from(await compressed.arrayBuffer())
        images?.file(filename, bytes)

        const item = {
          name: `${collection.name} #${tokenId}`,
          description,
          image: `ipfs://REPLACE_WITH_IMAGES_CID/${filename}`,
          attributes: traitsToAttributes(ordinal.traits),
        }
        metadataFolder?.file(`${tokenId}.json`, JSON.stringify(item, null, 2))
        allMetadata.push({ tokenId, ...item })
      } catch (error) {
        console.error(`[OpenSea export] token ${tokenId} failed:`, error)
        failures.push(tokenId)
      }
    }

    if (allMetadata.length === 0) {
      return NextResponse.json({ error: 'Failed to compress any images' }, { status: 500 })
    }

    zip.file('metadata.json', JSON.stringify(allMetadata, null, 2))
    zip.file(
      'README.txt',
      [
        'OpenSea export',
        '',
        `Images were compressed with this collection's launch settings: ${quality}% quality, ${dimensions}px, ${format.toUpperCase()}${targetKB ? `, target ${targetKB} KB` : ''}.`,
        '',
        '1. Upload the images/ folder to IPFS.',
        '2. Replace REPLACE_WITH_IMAGES_CID in metadata/ and metadata.json with that folder CID.',
        '3. Upload the metadata/ folder (or metadata.json) and use it as the token URI base.',
        '',
        `Exported ${allMetadata.length} of ${ordinals.length} items.${failures.length ? ` Failed token numbers: ${failures.join(', ')}` : ''}`,
      ].join('\n')
    )

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const safeName = String(collection.name || 'collection')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName || 'collection'}-opensea.zip"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[OpenSea export] failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export collection' },
      { status: 500 }
    )
  }
}
