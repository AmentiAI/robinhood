# SolMaker Developer Onboarding Guide

Welcome to **SolMaker** - a complete NFT generation and minting platform for Solana and Bitcoin ordinals! This guide will get you up to speed quickly.

---

## 🎯 What is SolMaker?

**SolMaker** (formerly "ordmakerfun-1") is a full-stack NFT platform that enables creators to:

1. **Generate AI-powered NFT collections** using OpenAI's image generation
2. **Mint on Solana** using Metaplex Candy Machine v3
3. **Mint Bitcoin Ordinals** using taproot inscriptions
4. **Launch NFT collections** with whitelist/phase management
5. **Run a marketplace** for buying/selling collections and NFTs
6. **Manage collections** with trait-based generation systems
7. **Promote collections** with automated video generation

### Key Value Propositions
- **AI-Generated Art**: Create unique NFT collections using trait-based AI generation
- **Multi-Chain**: Support for both Solana NFTs and Bitcoin Ordinals
- **Launchpad**: Full mint phase management with whitelist support
- **Marketplace**: Built-in secondary market for collections and NFTs
- **Credit System**: Platform credits for purchasing features
- **Non-Custodial**: Users sign all transactions in their own wallets

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Hooks + Context API
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Image Optimization**: Sharp

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL (Neon Serverless)
- **Storage**: Vercel Blob (images, metadata, videos)
- **AI**: OpenAI API (image generation, prompt enhancement)
- **Video**: KIE.ai API (promotional videos)

### Blockchain
- **Solana**:
  - @solana/web3.js
  - @solana/wallet-adapter-react
  - @metaplex-foundation/umi (Candy Machine v3)
  - @metaplex-foundation/mpl-core-candy-machine
- **Bitcoin**:
  - @omnisat/lasereyes (wallet connection)
  - @cmdcode/tapscript (inscriptions)
  - bitcoinjs-lib
  - Mempool.space API (fee rates, broadcasting)

### Payment & Credits
- Multi-chain support (SOL, BTC, ETH)
- Credit purchase with automatic conversion
- Platform wallet system

---

## 📁 Project Structure

```
solmaker-fun/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (backend endpoints)
│   │   ├── admin/               # Admin-only endpoints
│   │   ├── collections/         # Collection CRUD
│   │   ├── launchpad/           # Minting & launches
│   │   ├── marketplace/         # NFT marketplace
│   │   ├── credits/             # Credit purchases
│   │   ├── solana/              # Solana-specific APIs
│   │   └── cron/                # Scheduled jobs
│   ├── collections/             # Collection management UI
│   ├── launchpad/               # Public launchpad pages
│   ├── marketplace/             # Marketplace UI
│   ├── admin/                   # Admin dashboard
│   ├── profile/                 # User profiles
│   └── [...other pages]/
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   └── [feature components]
├── lib/                         # Utility libraries
│   ├── solana/                  # Solana integration
│   ├── wallet/                  # Wallet adapters
│   ├── database.ts              # DB utilities
│   ├── types.ts                 # TypeScript types
│   └── [other utilities]
├── scripts/                     # Database migrations & tools
│   └── migrations/              # SQL migration files
├── public/                      # Static assets
└── styles/                      # Global styles
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Vercel account (for Blob storage)
- OpenAI API key
- Solana wallet (Phantom recommended)

### 2. Clone & Install
```bash
git clone <repository-url>
cd ordmakerfun-1
npm install
```

### 3. Environment Setup

Create `.env.local` with these variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Solana
NEXT_PUBLIC_SOLANA_NETWORK="mainnet-beta"  # or "devnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
SOLANA_PLATFORM_WALLET_SECRET_KEY="[base58-private-key]"

# Bitcoin
NEXT_PUBLIC_BITCOIN_NETWORK="mainnet"  # or "testnet"

# Vercel Blob (automatic in Vercel)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Optional: KIE.ai for video generation
KIE_AI_API_KEY="kie-..."
KIE_AI_CALLBACK_URL="https://your-domain.com/api/promotion/kie-ai-callback"

# Credits & Payments
PLATFORM_BITCOIN_ADDRESS="bc1p..."
PLATFORM_SOLANA_ADDRESS="..."
PLATFORM_ETHEREUM_ADDRESS="0x..."
```

### 4. Database Setup

Run all migrations to set up the database:

```bash
# Create all tables
node scripts/setup-all-tables.js

# Add missing columns
node scripts/add-missing-columns.js

# Verify setup
node scripts/check-tables.js  # Should show 36 tables

# Run specific migrations if needed
node scripts/run-migration-084.js  # Solana system
```

### 5. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

The homepage redirects to `/launchpad` by default.

---

## 🎨 Core Features

### 1. **AI-Powered NFT Generation**

**Location**: `/collections/[id]`

Users create collections with:
- **Layers**: Categories like "Head", "Body", "Eyes", etc.
- **Traits**: Individual options within each layer (e.g., "Pumpkin Head", "Crown", etc.)
- **AI Generation**: Each trait can have AI-generated descriptions
- **Ordinals**: System randomly combines traits and generates unique images via OpenAI

**Key Files**:
- `app/collections/[id]/page.tsx` - Collection management
- `app/api/collections/[id]/generate/route.ts` - Image generation
- `lib/trait-generator.ts` - Trait generation logic

**How it Works**:
1. Creator builds a collection with layers and traits
2. System randomly selects one trait per layer
3. Creates a unique prompt using trait descriptions
4. Generates 1024x1024 image via OpenAI
5. Stores image in Vercel Blob
6. Saves ordinal to database with trait combination hash (prevents duplicates)

### 2. **Solana NFT Minting (Candy Machine)**

**Location**: `/collections/[id]/launch`

**Flow**:
1. **Deploy Collection NFT** - Creates on-chain collection
2. **Upload Metadata** - Stores metadata in Vercel Blob
3. **Deploy Candy Machine** - Creates Candy Machine v3 with config lines
4. **Configure Guards** - Set price, time limits, whitelist
5. **Go Live** - Users can mint NFTs

**Cost**: ~0.16 SOL (~$32) one-time deployment cost per collection

**Key Files**:
- `lib/solana/candy-machine.ts` - Candy Machine creation
- `lib/solana/collection-nft.ts` - Collection NFT creation
- `components/SolanaDeploymentWizard.tsx` - UI wizard
- `app/api/cron/monitor-solana-mints/route.ts` - Automatic monitoring

**Database Tables**:
- `candy_machine_deployments` - Deployment tracking
- `solana_nft_mints` - Mint records
- `nft_metadata_uris` - Metadata URIs

### 3. **Bitcoin Ordinal Inscriptions**

**Location**: `/collections/[id]/self-inscribe`

**Flow** (Commit/Reveal Pattern):
1. **Create Commit Transaction** - User commits to inscription
2. **Broadcast Commit** - Transaction sent to Bitcoin network
3. **Create Reveal Transaction** - Inscribes data on-chain
4. **Broadcast Reveal** - Inscription appears on Bitcoin

**Key Files**:
- `lib/inscription-utils.ts` - Tapscript inscription logic
- `app/api/mint/create-commit/route.ts` - Commit PSBT creation
- `lib/wallet/index.tsx` - LaserEyes wallet integration

**Supported Wallets**: UniSat, Xverse, OYL, Leather, Magic Eden, Phantom, OKX

### 4. **Launchpad System**

**Location**: `/launchpad` and `/launchpad/[collectionId]`

Creators can launch their collections with:
- **Multiple Mint Phases** - Public, whitelist, pre-sale
- **Time-based Controls** - Start/end times
- **Price Controls** - Different prices per phase
- **Whitelist Management** - CSV upload, manual entry
- **Mint Limits** - Per wallet, per transaction
- **Royalties** - Creator royalty percentage
- **Revenue Sharing** - Optional community payouts

**Key Files**:
- `app/launchpad/[collectionId]/page.tsx` - Mint interface
- `app/api/launchpad/[collectionId]/reserve/route.ts` - Reservation system
- `app/api/launchpad/[collectionId]/mint/build/route.ts` - PSBT building
- `app/api/launchpad/[collectionId]/mint/confirm/route.ts` - Mint confirmation

**Database Tables**:
- `mint_phases` - Phase configuration
- `whitelists` & `whitelist_entries` - Whitelist management
- `mint_inscriptions` - Individual mint records
- `mint_sessions` - Batch mint sessions

### 5. **NFT Marketplace**

**Location**: `/marketplace`

Two marketplace types:
1. **Collection Marketplace** - Sell entire unminted collections
2. **Ordinal Marketplace** - Sell individual inscribed ordinals

**Features**:
- List NFTs/collections for sale
- Credit-based payments
- Seller ratings and reviews
- Fraud prevention (ban system)
- Atomic ownership transfers

**Key Files**:
- `app/marketplace/page.tsx` - Browse listings
- `app/api/marketplace/listings/route.ts` - Listing management
- `app/api/marketplace/purchase/route.ts` - Purchase flow

**Database Tables**:
- `collection_marketplace_listings` - Collection sales
- `ordinal_marketplace_listings` - Ordinal sales
- `marketplace_transactions` - Transaction history
- `marketplace_reviews` - Seller ratings

### 6. **Credit System**

**Location**: `/buy-credits`

Platform credits for:
- AI image generation (~10 credits per image)
- Collection deployment (~1000 credits)
- Marketplace purchases
- Promotional videos

**Payment Options**:
- Bitcoin (BTC)
- Solana (SOL)
- Ethereum (ETH)

**Key Files**:
- `app/api/credits/purchase/route.ts` - Credit purchase
- `app/api/credits/verify-payment/route.ts` - Payment verification
- `lib/credits/credits.ts` - Credit utilities

**Database Tables**:
- `credits` - User credit balances
- `credit_transactions` - Transaction history
- `pending_payments` - Pending purchases
- `credit_costs` - Pricing configuration

### 7. **Admin Dashboard**

**Location**: `/admin`

Comprehensive admin panel for:
- **Collections** - View all collections, deployment status
- **Mints** - Track all minting activity
- **Users** - User management, credit balances
- **Marketplace** - Listings, sales, reviews
- **Transactions** - All payment activity
- **Solana** - Candy Machine stats, platform wallet
- **Generation Errors** - AI generation debugging
- **Site Settings** - Platform configuration

**Key Files**:
- `app/admin/page.tsx` - Admin dashboard home
- `app/admin/solana/page.tsx` - Solana-specific admin
- `app/api/admin/**` - Admin-only APIs

### 8. **Promotional Videos**

**Location**: `/promotion`

Automated video generation using KIE.ai:
- Upload images from collection
- Generate promotional videos
- Multiple aspect ratios (16:9, 9:16, 1:1)
- Webhook-based processing

**Key Files**:
- `app/promotion/page.tsx` - Video generation UI
- `app/api/promotion/generate/route.ts` - Start video job
- `app/api/promotion/kie-ai-callback/route.ts` - Webhook handler

**Database Tables**:
- `promotion_jobs` - Video generation jobs
- `promotions` - Completed promotional assets

### 9. **Profile System**

**Location**: `/profile`

User profiles with:
- Username & avatar
- Social links (Twitter, Telegram)
- Credit balance
- Collections created
- Mints owned
- Marketplace activity

**Key Files**:
- `app/profile/page.tsx` - Profile management
- `app/api/profile/route.ts` - Profile CRUD

**Database Tables**:
- `profiles` - User profiles
- `admin_visits` - Admin activity tracking

---

## 🗄️ Database Schema

### Core Tables (36 total)

**User System**:
- `profiles` - User profiles
- `credits` - Credit balances
- `credit_transactions` - Credit history

**Collections**:
- `collections` - NFT collections
- `layers` - Trait categories
- `traits` - Individual traits
- `generated_ordinals` - Generated NFT images

**Minting**:
- `mint_sessions` - Batch mint sessions
- `mint_inscriptions` - Individual inscriptions
- `mint_phases` - Launch phases
- `whitelists` - Whitelist groups
- `whitelist_entries` - Individual whitelist spots

**Solana**:
- `candy_machine_deployments` - Deployment tracking
- `solana_nft_mints` - Solana mint records
- `nft_metadata_uris` - Metadata storage

**Marketplace**:
- `collection_marketplace_listings` - Collection sales
- `ordinal_marketplace_listings` - Ordinal sales
- `marketplace_transactions` - Purchase history
- `marketplace_reviews` - Seller ratings

**System**:
- `generation_jobs` - AI generation queue
- `generation_errors` - Error tracking
- `promotion_jobs` - Video generation jobs
- `site_settings` - Platform configuration
- `admin_visits` - Admin analytics

### Key Relationships

```
collections
  ├─ has many: layers
  │   └─ has many: traits
  ├─ has many: generated_ordinals
  ├─ has many: mint_phases
  └─ has many: mint_inscriptions

profiles
  ├─ has one: credits
  ├─ has many: collections (as creator)
  └─ has many: mint_inscriptions (as minter)

mint_phases
  ├─ belongs to: collection
  └─ has many: whitelists
      └─ has many: whitelist_entries
```

---

## 🔌 API Structure

### RESTful Conventions

```
GET    /api/resource         - List all
POST   /api/resource         - Create new
GET    /api/resource/[id]    - Get one
PUT    /api/resource/[id]    - Update
PATCH  /api/resource/[id]    - Partial update
DELETE /api/resource/[id]    - Delete
```

### Key API Groups

**Collections**: `/api/collections/`
- CRUD operations
- Generation
- Layer/trait management
- Launch configuration

**Launchpad**: `/api/launchpad/[collectionId]/`
- Mint building
- Confirmation
- Whitelist checking
- Phase management

**Marketplace**: `/api/marketplace/`
- Listings
- Purchases
- Reviews
- Ordinal/collection sales

**Admin**: `/api/admin/`
- Statistics
- User management
- Transaction monitoring
- Platform wallet

**Cron Jobs**: `/api/cron/`
- `check-mint-transactions` - Monitor Bitcoin mints
- `monitor-solana-mints` - Monitor Solana mints
- `check-payments` - Verify credit purchases
- `release-expired-locks` - Clean up reservations
- `update-btc-price` - BTC price updates

---

## 🔐 Authentication & Authorization

### Wallet-Based Auth

The platform uses **wallet signature verification** instead of traditional passwords:

1. User connects wallet (Solana/Bitcoin)
2. User signs a message with their wallet
3. Backend verifies signature
4. Session created based on wallet address

**Key Files**:
- `lib/auth/signature-verification.ts` - Signature verification
- `lib/wallet/api-auth.ts` - API authentication
- `components/wallet-connect.tsx` - Connection UI

### Admin Protection

Admin routes check for admin status:

```typescript
// In API route
const isAdmin = await checkIsAdmin(walletAddress)
if (!isAdmin) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

**Admin Table**: Track admin wallets in database or environment variables.

---

## 💰 Credits System

### How Credits Work

1. **Purchase**: User buys credits with SOL/BTC/ETH
2. **Verification**: Payment verified on blockchain
3. **Credit**: Credits added to user balance
4. **Usage**: Credits deducted for services
5. **History**: All transactions logged

### Credit Costs

Configurable in `credit_costs` table:
- `generate_ordinal` - ~10 credits
- `deploy_collection` - ~1000 credits
- `promotional_video` - ~50 credits

### Exchange Rates

Pulled from external APIs and cached:
- BTC to USD
- SOL to USD
- ETH to USD

**Key Files**:
- `lib/credits/credit-costs.ts` - Cost calculation
- `lib/payment/exchange-rates.ts` - Exchange rate fetching

---

## 🎨 UI/UX Patterns

### Design System

The app uses a **modern, dark theme** with:
- **Primary Color**: Gold (#D4AF37)
- **Background**: Dark (#0a0a0a, #141414)
- **Accent**: Purple/Blue gradients
- **Typography**: System fonts, clean hierarchy

### Component Patterns

**shadcn/ui** components are customized in `components/ui/`:
- Buttons with loading states
- Modals with confirmation dialogs
- Toast notifications (Sonner)
- Form inputs with validation
- Data tables with pagination

### Responsive Design

Mobile-first approach:
- Collapsible sidebars on mobile
- Stacked layouts for tablets
- Full-featured desktop views

---

## 🧪 Testing & Development

### Local Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing on Devnet/Testnet

For Solana:
```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

For Bitcoin:
```bash
# .env.local
NEXT_PUBLIC_BITCOIN_NETWORK=testnet
```

Get test funds:
- Solana Devnet: https://faucet.solana.com/
- Bitcoin Testnet: https://testnet-faucet.mempool.co/

### Database Utilities

```bash
# Reset database (CAUTION!)
node scripts/reset-database.js

# Check specific table
node scripts/check-tables.js

# Run specific migration
node scripts/run-migration-084.js

# Verify credits setup
node scripts/verify-credits-setup.js
```

---

## 🚨 Common Issues & Solutions

### 1. Database Connection Issues
**Error**: "relation does not exist"
**Solution**: Run `node scripts/setup-all-tables.js`

### 2. Solana RPC 403 Errors
**Error**: "403 Forbidden"
**Solution**: Use Helius RPC with API key instead of public endpoint

### 3. Wallet Connection Issues
**Error**: "Wallet not connecting"
**Solution**:
- Ensure correct network (devnet vs mainnet)
- Check wallet adapter is installed
- Clear browser cache

### 4. Image Generation Failing
**Error**: "OpenAI API error"
**Solution**:
- Verify OPENAI_API_KEY is set
- Check credit balance
- Verify prompt doesn't violate content policy

### 5. Mint Stuck in Pending
**Error**: "Transaction pending forever"
**Solution**: Manually trigger cron job:
```bash
curl -X POST http://localhost:3000/api/cron/monitor-solana-mints
```

---

## 📚 Key Concepts

### Trait-Based Generation

Instead of random art, SolMaker uses:
1. **Layers** - Categories (Head, Body, Accessories)
2. **Traits** - Options within layers (Crown, Hat, Helmet)
3. **Rarity Weights** - Control trait frequency
4. **Trait Combinations** - Unique NFTs from trait combos
5. **Hash-Based Duplicates** - Prevent exact duplicates

### Launchpad Phases

Collections can have multiple mint phases:
- **Pre-sale** - Whitelist only, lower price
- **Public** - Open to everyone, higher price
- **Final** - Last chance, potential discount

Each phase has:
- Start/end times
- Price
- Mint limits
- Whitelist (optional)

### PSBT (Partially Signed Bitcoin Transaction)

Bitcoin minting uses PSBTs:
1. Backend creates unsigned transaction
2. Wallet signs transaction
3. Backend broadcasts to network

Benefits:
- Non-custodial (user controls keys)
- Transparent (user sees what they sign)
- Standard Bitcoin practice

### Candy Machine Guards

Solana Candy Machines use "guards" for access control:
- **Sol Payment** - Cost to mint
- **Start Date** - When minting begins
- **End Date** - When minting ends
- **Mint Limit** - Max per wallet
- **Token Gate** - Require specific token

---

## 🎯 Development Workflow

### Adding a New Feature

1. **Database Schema** - Create migration in `scripts/migrations/`
2. **API Routes** - Add endpoints in `app/api/`
3. **Types** - Define TypeScript interfaces in `lib/types.ts`
4. **UI Components** - Create components in `components/`
5. **Pages** - Add pages in `app/`
6. **Documentation** - Update relevant docs

### Making Changes to Existing Features

1. **Read Documentation** - Check feature docs (e.g., `MARKETPLACE_FEATURE.md`)
2. **Find Files** - Use project structure above
3. **Update Backend** - Modify API routes if needed
4. **Update Frontend** - Modify components/pages
5. **Test Locally** - Test on devnet/testnet first
6. **Deploy** - Push to production

### Git Workflow

```bash
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "Descriptive message"
git push origin feature/your-feature-name
# Create PR
```

---

## 🔗 Important Links

### External Services
- **Helius Dashboard**: https://dashboard.helius.dev/
- **Vercel Blob**: https://vercel.com/dashboard/stores
- **OpenAI Platform**: https://platform.openai.com/
- **Mempool.space**: https://mempool.space/
- **Solscan**: https://solscan.io/

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Solana**: https://docs.solana.com/
- **Metaplex**: https://docs.metaplex.com/
- **Bitcoin Taproot**: https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki

### Tools
- **Solana Explorer**: https://explorer.solana.com/
- **Bitcoin Explorer**: https://blockstream.info/
- **PSBT Viewer**: https://psbt.io/

---

## 🤝 Getting Help

### Internal Resources
- Read feature docs in project root (e.g., `MARKETPLACE_FEATURE.md`)
- Check implementation summaries (e.g., `IMPLEMENTATION_SUMMARY.md`)
- Review quick start guides (e.g., `QUICK_START.md`)

### External Help
- Solana Discord: https://discord.gg/solana
- Metaplex Discord: https://discord.gg/metaplex
- Stack Overflow: Tag questions with `solana`, `next.js`, `bitcoin`

### Common Commands Reference

```bash
# Development
npm run dev

# Database
node scripts/setup-all-tables.js
node scripts/check-tables.js

# Migrations
node scripts/run-migration-084.js

# Testing
curl -X POST http://localhost:3000/api/cron/monitor-solana-mints

# Platform wallet balance
node scripts/test-platform-wallet.js
```

---

## 📋 Developer Checklist

Before you start coding:
- [ ] Environment variables configured
- [ ] Database set up (36 tables)
- [ ] Dev server running
- [ ] Wallet connected (Phantom/UniSat)
- [ ] Test on devnet/testnet first
- [ ] Read relevant feature docs
- [ ] Understand the user flow

---

## 🎓 Next Steps

1. **Run the App**: Get it running locally
2. **Create a Test Collection**: Experience the full flow
3. **Deploy to Devnet**: Test Solana deployment
4. **Explore Admin Dashboard**: Understand monitoring
5. **Read Feature Docs**: Deep dive into specific features
6. **Make a Small Change**: Practice the workflow

---

## 🚀 Welcome to the Team!

You now have all the information you need to start contributing to SolMaker. The platform is feature-rich and production-ready. Start by exploring the codebase, running it locally, and testing features on devnet.

**Happy coding!** 🎉
