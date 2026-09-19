import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

async function downloadImageToBlob(url: string): Promise<Blob> {
  const imageResponse = await fetch(url)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`)
  }
  return await imageResponse.blob()
}

const flyerPrompts = {
  'what-is-hoodgfx': {
    title: 'What is HoodGFX',
    prompt: `Create a professional marketing flyer with a luxury gold and black color scheme (#2DE2FF gold, black background).

Main headline: "HOODGFX - Become an Artist. Create High-Quality Art."

Subheading: "Anyone Can Be an Artist"

Key messages to include:
- "No design skills needed - AI creates stunning artwork from simple descriptions"
- "Generate entire collections in minutes, not months"
- "Professional-grade quality ready for NFT marketplace"
- "Built-in tools to mint and sell your creations"

Visual style: Modern, luxury, premium feel with gold accents, clean typography, professional layout. Include subtle artistic elements like paint splashes or creative icons. Footer should say "START CREATING TODAY" and "www.hoodgfx.com"

The flyer should feel high-end, empowering, and accessible to beginners.`
  },

  'launchpad': {
    title: 'Launchpad Features',
    prompt: `Create a professional marketing flyer with a luxury gold and black color scheme (#2DE2FF gold, black background).

Main headline: "LAUNCHPAD - Mint Fresh NFT Collections"

Icon/Symbol: Rocket 🚀

Key Features to highlight:
- "Featured Collections - Discover hottest new NFT drops on Solana"
- "Multiple Mint Phases - Whitelist, public mint, and special allocations for fair distribution"
- "Secure Minting - Built on Solana blockchain with audited smart contracts"
- "Live Analytics - Real-time mint progress, rarity reveals, and collection statistics"
- "Instant Reveals - See your NFT immediately after minting"

Visual style: Modern, exciting, dynamic with gold accents. Include rocket/launch imagery. Footer: "EXPLORE LAUNCHPAD" and "www.hoodgfx.com/launchpad"

The flyer should feel exciting and trustworthy.`
  },

  'marketplace': {
    title: 'Marketplace Features',
    prompt: `Create a professional marketing flyer with a luxury gold and black color scheme (#2DE2FF gold, black background).

Main headline: "MARKETPLACE - Buy, Sell & Trade NFTs"

Icon/Symbol: Shopping bag 🛍️

Key Features to highlight:
- "Curated Collections - Browse premium NFTs from verified creators"
- "Advanced Filters - Find exactly what you want with price, rarity, and trait filtering"
- "Low Fees - Minimal marketplace fees on Solana's lightning-fast network"
- "Secure Escrow - Safe peer-to-peer trading with smart contract protection"
- "Price Analytics - Historical pricing data and market trends"

Visual style: Professional, trustworthy, premium with gold accents. Include marketplace/shopping imagery. Footer: "START TRADING" and "www.hoodgfx.com/marketplace"

The flyer should feel secure and professional.`
  },

  'collection-creator': {
    title: 'Collection Creator',
    prompt: `Create a professional marketing flyer with a luxury gold and black color scheme (#2DE2FF gold, black background).

Main headline: "COLLECTION CREATOR - Build Your NFT Empire"

Icon/Symbol: Artist palette 🎨

Key Features to highlight:
- "3 Creation Modes - Lazy Mode (AI auto-generate), Maker Mode (trait layers), Artist Mode (upload your art)"
- "AI-Powered Generation - Describe your vision and AI creates unique, high-quality artwork"
- "Rarity System - Configure trait rarities and create exciting reveals"
- "Full Control - Edit, regenerate, or replace individual NFTs until perfect"
- "Batch Operations - Generate hundreds or thousands of unique NFTs in one click"

Visual style: Creative, powerful, inspiring with gold accents. Include artistic/creative tools imagery. Footer: "CREATE COLLECTION" and "www.hoodgfx.com/collections/create"

The flyer should feel empowering and creative.`
  },

  'ai-tools': {
    title: 'AI-Powered Tools',
    prompt: `Create a professional marketing flyer with a luxury gold and black color scheme (#2DE2FF gold, black background).

Main headline: "AI-POWERED TOOLS - Create Like a Professional"

Icon/Symbol: Magic wand/sparkles ✨

Key Features to highlight:
- "Art Style Library - Dozens of professional art styles from pixel art to photorealistic 3D"
- "Prompt Assistant - AI helps you write perfect prompts for consistent quality"
- "Remix & Iterate - Easily modify and improve creations with one-click variations"
- "Smart Composition - Automatic layering, positioning, and sizing for perfect results"
- "Character Consistency - Generate entire collections with consistent characters and style"

Visual style: Futuristic, magical, high-tech with gold accents. Include AI/technology imagery. Footer: "UNLEASH CREATIVITY" and "www.hoodgfx.com"

The flyer should feel innovative and powerful.`
  },

  'founder-vision': {
    title: 'Founder Vision - The HoodGFX Story',
    prompt: `Create an inspiring, professional founder's vision flyer with luxury gold and black color scheme (#2DE2FF gold, black background).

MAIN HEADLINE: "REVOLUTIONIZING NFT CREATION"
Subheading: "Making Everyone an Artist & Community Leader"

FOUNDER SECTION:
"Founded by SignullBTC - A 22-year-old developer on a mission to democratize digital art and NFT creation"

THE PROBLEM WE'RE SOLVING:
Traditional NFT creation is:
• Too technical - requires coding knowledge and blockchain expertise
• Too expensive - hiring designers and developers costs thousands
• Too slow - manual creation takes months for a single collection
• Too exclusive - only tech-savvy creators can participate
• Too fragmented - multiple tools needed (design, minting, marketplace, promotion)

OUR SOLUTION - HOODGFX:
The world's first all-in-one AI-powered NFT creation platform that turns anyone into a professional NFT creator in minutes, not months.

CORE THESIS:
"Every person has creative ideas worth sharing. Technology shouldn't be a barrier - it should be an enabler. We're building the future where becoming an artist or community leader is as simple as describing your vision."

WHO IT'S FOR:
✓ Aspiring artists without design skills
✓ Community leaders wanting to unite their audience
✓ Entrepreneurs launching NFT projects
✓ Creators who want professional quality without professional costs
✓ Anyone with an idea but no technical knowledge

WHY IT MATTERS:
• Democratizes access to NFT creation (no coding required)
• Reduces creation time from months to minutes (AI-powered)
• Eliminates high costs (no need to hire designers/developers)
• Empowers communities (anyone can be a leader)
• Built on Solana (fast, affordable, sustainable)

WHAT MAKES US DIFFERENT:
1. THREE CREATION MODES: Lazy Mode (fully AI), Maker Mode (trait-based), Artist Mode (upload custom art)
2. INTEGRATED PLATFORM: Create, launch, mint, sell - all in one place
3. AI-FIRST: Advanced prompt engineering, style library, automatic variations
4. FAIR LAUNCHES: Whitelist management, multiple mint phases, anti-bot protection
5. BUILT FOR CREATORS: Royalty management, analytics, community tools

THE VISION:
"In 5 years, when someone says 'I want to launch an NFT collection,' they won't need a team of developers and designers. They'll just need HoodGFX and their imagination."

CALL TO ACTION:
"Join the revolution. Start creating today."

Visual style: Professional, inspiring, visionary. Include subtle tech/blockchain imagery, creative elements, and a professional photo placeholder area for the founder. Gold accents throughout. Should feel premium, trustworthy, and revolutionary.

Footer: "HOODGFX - Empowering the Next Generation of Digital Creators" • www.hoodgfx.com`
  }
}

export async function POST(request: Request) {
  try {
    const { flyerType } = await request.json()

    if (!flyerType || !flyerPrompts[flyerType as keyof typeof flyerPrompts]) {
      return NextResponse.json(
        { error: 'Invalid flyer type' },
        { status: 400 }
      )
    }

    const flyer = flyerPrompts[flyerType as keyof typeof flyerPrompts]

    console.log(`Generating flyer: ${flyer.title}`)

    // Generate image using GPT Image model
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: flyer.prompt,
        n: 1,
        size: '1024x1536',
        quality: 'high'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate image')
    }

    const data = await response.json()
    const tempImageUrl = data.data[0].url

    // Download image from OpenAI
    console.log(`Downloading flyer image from OpenAI...`)
    const imageBlob = await downloadImageToBlob(tempImageUrl)

    // Upload to Vercel Blob Storage for permanent hosting
    const filename = `flyer-${flyerType}-${Date.now()}.png`
    const blob = await put(filename, imageBlob, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log(`Flyer uploaded to: ${blob.url}`)

    return NextResponse.json({
      success: true,
      title: flyer.title,
      imageUrl: blob.url,
      flyerType
    })

  } catch (error: any) {
    console.error('Error generating flyer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate flyer' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    availableFlyers: Object.keys(flyerPrompts).map(key => ({
      id: key,
      title: flyerPrompts[key as keyof typeof flyerPrompts].title
    }))
  })
}
