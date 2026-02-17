require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.NEON_DATABASE || process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ No database URL found. Please set NEON_DATABASE or DATABASE_URL')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function runMigration() {
  try {
    console.log('🚀 Starting Social Links Migration (055)...\n')

    // Execute ALTER TABLE with tagged template
    console.log('[1/4] Adding twitter_url column...')
    await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS twitter_url TEXT`
    console.log('✅ Column added\n')

    console.log('[2/4] Adding discord_url column...')
    await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS discord_url TEXT`
    console.log('✅ Column added\n')

    console.log('[3/4] Adding telegram_url column...')
    await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS telegram_url TEXT`
    console.log('✅ Column added\n')

    console.log('[4/4] Adding website_url column...')
    await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS website_url TEXT`
    console.log('✅ Column added\n')

    console.log('✅ Migration completed successfully!')
    console.log('\n📝 Social links columns added to collections table:')
    console.log('   - twitter_url')
    console.log('   - discord_url')
    console.log('   - telegram_url')
    console.log('   - website_url')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

