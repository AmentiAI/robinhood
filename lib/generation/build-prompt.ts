/**
 * Shared NFT generation prompt builder.
 * Used by cron image generation and example-prompt preview — keep as single source of truth.
 */

export type GenerationCollectionSettings = {
  name: string
  description?: string | null
  art_style?: string | null
  border_requirements?: string | null
  custom_rules?: string | null
  colors_description?: string | null
  lighting_description?: string | null
  is_pfp_collection?: boolean | string | null
  facing_direction?: string | null
  body_style?: string | null
  pixel_perfect?: boolean | string | null
  wireframe_config?: any
}

export type GenerationTrait = {
  name: string
  description?: string
  trait_prompt?: string
}

const VALID_FACING = new Set(['left', 'left-front', 'front', 'right-front', 'right'])
const VALID_BODY = new Set(['full', 'half', 'headonly'])

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    return v === 'true' || v === 't' || v === '1' || v === 'yes'
  }
  if (typeof value === 'number') return value !== 0
  return fallback
}

/** Normalize DB/API collection fields so generation always sees clean settings. */
export function normalizeCollectionSettings(
  collection: GenerationCollectionSettings
): GenerationCollectionSettings & {
  is_pfp_collection: boolean
  facing_direction: string
  body_style: string
  pixel_perfect: boolean
} {
  const isPfp = asBool(collection.is_pfp_collection, false)
  let facing = String(collection.facing_direction || 'front')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')

  // Common aliases
  if (facing === 'forward' || facing === 'center' || facing === 'straight') facing = 'front'
  if (facing === 'frontleft' || facing === 'leftfront') facing = 'left-front'
  if (facing === 'frontright' || facing === 'rightfront') facing = 'right-front'

  if (!VALID_FACING.has(facing)) facing = 'front'

  let body = String(collection.body_style || 'full').trim().toLowerCase()
  if (body === 'head' || body === 'head-only' || body === 'bust') body = 'headonly'
  if (body === 'upper' || body === 'waist-up' || body === 'waistup') body = 'half'
  if (!VALID_BODY.has(body)) body = 'full'

  let wireframe = collection.wireframe_config
  if (typeof wireframe === 'string') {
    try {
      wireframe = JSON.parse(wireframe)
    } catch {
      wireframe = null
    }
  }

  return {
    ...collection,
    is_pfp_collection: isPfp,
    facing_direction: isPfp ? facing : 'front',
    body_style: isPfp ? body : 'full',
    pixel_perfect: asBool(collection.pixel_perfect, false),
    wireframe_config: wireframe,
  }
}

function facingOrientationBlock(facingDirection: string): string {
  const directionMap: Record<string, string> = {
    left: `ORIENTATION LOCK (CRITICAL — HIGHEST PRIORITY):
Character is facing LEFT (←).
Body rotated 70–90° toward the LEFT edge of the image.
Face turned LEFT, nose pointing toward left image boundary.
Left shoulder is closer to the viewer than the right.
Camera positioned left-side of the character.

TORSO & PELVIS ORIENTATION LOCK (CRITICAL):
Torso, chest, AND pelvis all face the SAME direction (left).
Spine aligned with body rotation — no twist.
Chest plane angled 70–90° toward the LEFT image edge.
Pelvis square with torso, NOT counter-rotated.
NO contrapposto stance.

NEGATIVE ORIENTATION:
NOT facing right.
NOT angled toward right edge.
NOT mirrored.
NOT right-leaning.
NOT contrapposto.
NOT torso twisted opposite the head.
NOT hips facing right.
NOT shoulders facing right while head faces left.

If orientation is incorrect, FLIP HORIZONTALLY so the character faces LEFT.
Left-facing orientation takes absolute priority over all other pose details.`,

    'left-front': `ORIENTATION LOCK (CRITICAL — HIGHEST PRIORITY):
Character is facing FRONT-LEFT (↖).
Body rotated 10–20° toward the LEFT edge of the image.
Face turned slightly LEFT, nose pointing toward left image boundary.
Left shoulder is closer to the viewer than the right.
Camera positioned front-left of the character.

TORSO & PELVIS ORIENTATION LOCK (CRITICAL):
Torso, chest, AND pelvis all face the SAME direction (front-left).
Spine aligned with body rotation — no twist.
Chest plane angled 10–20° toward the LEFT image edge.
Pelvis square with torso, NOT counter-rotated.
NO contrapposto stance.

NEGATIVE ORIENTATION:
NOT facing right.
NOT angled toward right edge.
NOT mirrored.
NOT right-leaning.
NOT contrapposto.
NOT torso twisted opposite the head.
NOT hips facing right.
NOT shoulders facing right while head faces left.

If orientation is incorrect, FLIP HORIZONTALLY so the character faces LEFT.
Left-facing orientation takes absolute priority over all other pose details.`,

    front: `ORIENTATION LOCK (CRITICAL — HIGHEST PRIORITY):
Character is facing DIRECTLY FRONT (↑).
Body rotated 0° - perfectly centered and symmetrical.
Face turned directly forward, nose pointing straight at viewer.
Both shoulders equidistant from viewer.
Camera positioned directly in front of the character.

TORSO & PELVIS ORIENTATION LOCK (CRITICAL):
Torso, chest, AND pelvis all face the SAME direction (directly front).
Spine aligned with body rotation — no twist.
Chest plane perfectly centered, 0° rotation.
Pelvis square with torso, NOT counter-rotated.
NO contrapposto stance.

NEGATIVE ORIENTATION:
NOT facing left.
NOT facing right.
NOT angled toward either edge.
NOT rotated.
NOT contrapposto.
NOT torso twisted.
NOT hips rotated.
NOT shoulders angled while head faces front.

If orientation is incorrect, CENTER the character so they face DIRECTLY FRONT.
Front-facing orientation takes absolute priority over all other pose details.`,

    'right-front': `ORIENTATION LOCK (CRITICAL — HIGHEST PRIORITY):
Character is facing FRONT-RIGHT (↗).
Body rotated 10–20° toward the RIGHT edge of the image.
Face turned slightly RIGHT, nose pointing toward right image boundary.
Right shoulder is closer to the viewer than the left.
Camera positioned front-right of the character.

TORSO & PELVIS ORIENTATION LOCK (CRITICAL):
Torso, chest, AND pelvis all face the SAME direction (front-right).
Spine aligned with body rotation — no twist.
Chest plane angled 10–20° toward the RIGHT image edge.
Pelvis square with torso, NOT counter-rotated.
NO contrapposto stance.

NEGATIVE ORIENTATION:
NOT facing left.
NOT angled toward left edge.
NOT mirrored.
NOT left-leaning.
NOT contrapposto.
NOT torso twisted opposite the head.
NOT hips facing left.
NOT shoulders facing left while head faces right.

If orientation is incorrect, FLIP HORIZONTALLY so the character faces RIGHT.
Right-facing orientation takes absolute priority over all other pose details.`,

    right: `ORIENTATION LOCK (CRITICAL — HIGHEST PRIORITY):
Character is facing RIGHT (→).
Body rotated 70–90° toward the RIGHT edge of the image.
Face turned RIGHT, nose pointing toward right image boundary.
Right shoulder is closer to the viewer than the left.
Camera positioned right-side of the character.

TORSO & PELVIS ORIENTATION LOCK (CRITICAL):
Torso, chest, AND pelvis all face the SAME direction (right).
Spine aligned with body rotation — no twist.
Chest plane angled 70–90° toward the RIGHT image edge.
Pelvis square with torso, NOT counter-rotated.
NO contrapposto stance.

NEGATIVE ORIENTATION:
NOT facing left.
NOT angled toward left edge.
NOT mirrored.
NOT left-leaning.
NOT contrapposto.
NOT torso twisted opposite the head.
NOT hips facing left.
NOT shoulders facing left while head faces right.

If orientation is incorrect, FLIP HORIZONTALLY so the character faces RIGHT.
Right-facing orientation takes absolute priority over all other pose details.`,
  }

  return directionMap[facingDirection] || directionMap.front
}

function bodyVisibilityBlock(
  isPfpCollection: boolean,
  bodyStyle: string,
  pixelPerfect: boolean
): string | null {
  if (!isPfpCollection) return null
  const style = String(bodyStyle || 'full').toLowerCase()

  if (style === 'headonly') {
    const headOnlyBase = [
      '⚠️ BODY VISIBILITY (NON-NEGOTIABLE): HEAD & SHOULDERS ONLY.',
      'Framing: crop just below shoulders / upper chest. NO torso below chest. NO waist. NO legs.',
      'If any body beyond shoulders would appear, adjust camera/framing to remove it.',
    ]

    if (pixelPerfect) {
      const topOfHead = 150
      const leftMargin = 200
      const rightMargin = 200
      const shoulderLine = 750
      const bottomCrop = 850
      headOnlyBase.push(
        '\n\nPIXEL-PERFECT POSITIONING (1024x1024 canvas):',
        `– Top of head frame: ${topOfHead}px from top edge.`,
        `– Left margin: ${leftMargin}px from left edge.`,
        `– Right margin: ${rightMargin}px from right edge.`,
        `– Character frame width: ${1024 - leftMargin - rightMargin}px (centered horizontally).`,
        `– Shoulder line position: ${shoulderLine}px from top edge.`,
        `– Bottom crop: ${bottomCrop}px from top edge.`,
        '\n\nNote: Character facing direction is set separately and takes priority. Frame dimensions apply within the chosen orientation.'
      )
    }

    return headOnlyBase.join(' ')
  }

  if (style === 'half') {
    return [
      '⚠️ BODY VISIBILITY (NON-NEGOTIABLE): UPPER BODY ONLY (WAIST UP).',
      'Framing: include head, shoulders, chest, and waist/hips area. EXCLUDE legs and feet entirely.',
      'If legs/feet would appear, zoom/crop to waist-up.',
    ].join(' ')
  }

  const fullBodyBase = [
    '⚠️ BODY VISIBILITY (NON-NEGOTIABLE): FULL BODY.',
    'Framing: include the entire character from head to feet in-frame. NO cropping of feet or lower legs.',
    'If feet would be cut off, zoom out / reposition to keep full body visible.',
  ]

  if (pixelPerfect) {
    const topOfHead = 100
    const leftMargin = 150
    const rightMargin = 150
    const shoulderLine = 300
    const waistLine = 550
    const feetBottom = 950
    fullBodyBase.push(
      '\n\nPIXEL-PERFECT POSITIONING (1024x1024 canvas):',
      `– Top of head: ${topOfHead}px from top edge.`,
      `– Left margin: ${leftMargin}px from left edge.`,
      `– Right margin: ${rightMargin}px from right edge.`,
      `– Character frame width: ${1024 - leftMargin - rightMargin}px (centered horizontally).`,
      `– Shoulder line: ${shoulderLine}px from top edge.`,
      `– Waist/hips: ${waistLine}px from top edge.`,
      `– Feet soles: ${feetBottom}px from top edge.`,
      '\n\nNote: Character facing direction is set separately and takes priority. Frame dimensions apply within the chosen orientation.'
    )
  }

  return fullBodyBase.join(' ')
}

/**
 * Build the final image-generation prompt from collection settings + selected traits.
 */
export function buildGenerationPrompt(
  rawCollection: GenerationCollectionSettings,
  traits: Record<string, GenerationTrait>
): string {
  const collection = normalizeCollectionSettings(rawCollection)

  const artStyle = collection.art_style?.trim()
  const borderReqs = collection.border_requirements?.trim()
  const customRules = collection.custom_rules?.trim()
  const colorsDescription = collection.colors_description?.trim()
  const lightingDescription = collection.lighting_description?.trim()
  const isPfpCollection = collection.is_pfp_collection
  const facingDirection = collection.facing_direction
  const bodyStyle = collection.body_style
  const pixelPerfect = collection.pixel_perfect

  const visibility = bodyVisibilityBlock(isPfpCollection, bodyStyle, pixelPerfect)

  const traitDescriptions = Object.entries(traits)
    .map(([layerName, trait]) => {
      const desc = trait.description || trait.trait_prompt || trait.name
      return `${layerName}: ${trait.name} - ${desc}`
    })
    .join('\n')

  const isAbstractStyle = !!(
    artStyle &&
    (artStyle.toLowerCase().includes('abstract') ||
      artStyle.toLowerCase().includes('surreal') ||
      artStyle.toLowerCase().includes('non-representational'))
  )

  const sections: string[] = []

  // PFP orientation FIRST so the model locks facing before style/traits dilute it
  if (isPfpCollection && !isAbstractStyle) {
    sections.push(facingOrientationBlock(facingDirection))
    sections.push('')
    if (visibility) {
      sections.push(visibility)
      sections.push('')
    }
  } else if (isPfpCollection && isAbstractStyle) {
    const abstractFacing: Record<string, string> = {
      left: 'General left-facing orientation',
      'left-front': 'General front-left orientation',
      front: 'General front-facing orientation',
      'right-front': 'General front-right orientation',
      right: 'General right-facing orientation',
    }
    sections.push(
      `ORIENTATION: ${abstractFacing[facingDirection] || abstractFacing.front} (interpreted abstractly)`
    )
    sections.push('')
    if (bodyStyle === 'headonly') {
      sections.push('COMPOSITION: Focus on head and upper area, interpreted through abstract forms.')
      sections.push('')
    } else if (visibility && pixelPerfect) {
      sections.push(visibility)
      sections.push('')
    }
  }

  if (isAbstractStyle && artStyle) {
    sections.push(`🎨 PRIMARY ART STYLE (MOST IMPORTANT): ${artStyle}`)
    sections.push('')
    sections.push(
      '⚠️ ABSTRACT/SURREAL INTERPRETATION: All elements should be interpreted through an abstract, non-representational lens. Traits are INSPIRATIONS, not literal requirements. Use flowing forms, dreamlike aesthetics, and artistic expression over literal representation.'
    )
    sections.push('')
  }

  sections.push(
    '⚠️ SINGLE CHARACTER REQUIREMENT: This image must contain EXACTLY ONE character. NO multiple characters, NO two characters, NO group shots, NO companions, NO sidekicks, NO background characters. ONLY ONE main character/subject in the entire image.'
  )
  sections.push('')

  sections.push(
    isAbstractStyle
      ? 'Abstract artistic illustration with non-representational elements.'
      : 'Professional digital illustration.'
  )
  sections.push('')

  if (artStyle && !isAbstractStyle) {
    sections.push(`ART STYLE: ${artStyle}`)
    sections.push('')
  }

  if (collection.description?.trim()) {
    sections.push(`DESCRIPTION: ${collection.description.trim()}`)
    sections.push('')
  }

  sections.push('ASSIGNED TRAITS:')
  sections.push(traitDescriptions)
  sections.push('')

  if (isAbstractStyle) {
    sections.push(
      'TRAIT INTERPRETATION: Use traits as abstract INSPIRATIONS. Interpret colors, textures, and concepts through flowing forms, dreamlike aesthetics, and artistic expression. NO literal representation required - prioritize abstract artistic expression over exact trait matching.'
    )
  } else {
    sections.push(
      'TRAIT RENDERING: Each trait must be rendered EXACTLY as specified in the descriptions. NO artistic interpretation, NO variation. Preserve facing/orientation locks above — do not change pose to showcase a trait.'
    )
  }
  sections.push('')

  if (customRules) {
    const formattedCustomRules = customRules.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    sections.push(`CUSTOM RULES: ${formattedCustomRules}`)
    sections.push('')
  }

  const isMinimalistStyle = !!(
    artStyle &&
    (artStyle.toLowerCase().includes('minimalist') ||
      artStyle.toLowerCase().includes('flat design') ||
      artStyle.toLowerCase().includes('simple'))
  )
  const isPixelArtStyle = !!(artStyle && artStyle.toLowerCase().includes('pixel'))

  if (isAbstractStyle) {
    sections.push(
      'DETAIL: Flowing forms, dreamlike textures, abstract patterns, artistic expression, vibrant colors, imaginative composition, non-representational elements.'
    )
    sections.push('')
  } else if (!isMinimalistStyle && !isPixelArtStyle) {
    sections.push('DETAIL: Multiple layers, texture, highlights, shadows, material quality rendering.')
    sections.push('')
  } else if (isPixelArtStyle) {
    sections.push(
      'DETAIL: Crisp pixel edges, limited color palette, retro game aesthetic, no anti-aliasing, clean blocky pixels.'
    )
    sections.push('')
  } else if (isMinimalistStyle) {
    sections.push(
      'DETAIL: Clean shapes, limited colors, simple geometric forms, no unnecessary complexity.'
    )
    sections.push('')
  }

  if (lightingDescription) {
    const formattedLighting = lightingDescription.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    sections.push(`LIGHTING: ${formattedLighting}`)
    sections.push('')
  }

  if (colorsDescription) {
    const formattedColors = colorsDescription.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    sections.push(`COLORS: ${formattedColors}`)
    sections.push('')
  }

  if (borderReqs) {
    const formattedBorder = borderReqs.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    sections.push(
      `BORDER: ${formattedBorder} - PLACEMENT: Outer edge EXACTLY at canvas edge, NO gaps, FULL BLEED.`
    )
    sections.push('')
  }

  if (isAbstractStyle) {
    sections.push(
      'QUALITY: Abstract artistic expression, flowing forms, dreamlike aesthetic, vibrant colors, imaginative composition.'
    )
    sections.push('')
    sections.push(
      'FINAL: Abstract surreal style with non-representational elements, artistic expression prioritized over literal representation, dreamlike aesthetic throughout.'
    )
  } else if (isMinimalistStyle) {
    sections.push(
      'QUALITY: Professional flat design, clean edges, consistent color fills, balanced composition.'
    )
    sections.push('')
    sections.push(
      'FINAL: Clean minimalist aesthetic, simple shapes, limited color palette, modern design.'
    )
  } else if (isPixelArtStyle) {
    sections.push(
      'QUALITY: Professional pixel art, crisp edges, consistent pixel size, retro game quality.'
    )
    sections.push('')
    sections.push(
      'FINAL: Authentic pixel art style, no smoothing, consistent blocky aesthetic throughout.'
    )
  }

  // Reinforce facing at the end for PFP (models often overweight late instructions)
  if (isPfpCollection && !isAbstractStyle) {
    sections.push('')
    sections.push(
      `FINAL ORIENTATION CHECK: Character MUST face ${facingDirection.toUpperCase()} as locked above. Do not override facing for trait visibility.`
    )
  }

  return sections.join('\n')
}
