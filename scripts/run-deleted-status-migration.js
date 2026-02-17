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
    console.log('🚀 Starting Deleted Status Migration (054)...\n')

    // Drop existing constraint if it exists
    console.log('[1/3] Dropping existing constraint (if any)...')
    try {
      await sql`ALTER TABLE collections DROP CONSTRAINT IF EXISTS chk_collection_status`
      console.log('✅ Constraint dropped\n')
    } catch (error) {
      console.log('⚠️  No existing constraint found (this is okay)\n')
    }

    // Add new CHECK constraint with deleted status
    console.log('[2/3] Adding CHECK constraint with deleted status...')
    await sql`ALTER TABLE collections ADD CONSTRAINT chk_collection_status CHECK (collection_status IN ('draft', 'launchpad', 'self_inscribe', 'marketplace', 'deleted'))`
    console.log('✅ Constraint added\n')

    // Update comment
    console.log('[3/3] Updating column comment...')
    await sql`COMMENT ON COLUMN collections.collection_status IS 'Collection status: draft, launchpad, self_inscribe, marketplace, or deleted'`
    console.log('✅ Comment updated\n')

    // Verification
    console.log('🔍 Verifying migration results...')
    const constraintCheck = await sql`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'chk_collection_status'
    `
    const constraint = Array.isArray(constraintCheck) ? constraintCheck : []
    if (constraint.length > 0) {
      console.log('✅ CHECK constraint exists:')
      console.log(`   - Name: ${constraint[0].constraint_name}`)
      console.log(`   - Check: ${constraint[0].check_clause}`)
    } else {
      throw new Error('CHECK constraint not found')
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Deleted Status Migration (054) completed successfully!')
    console.log('='.repeat(50))
    console.log('\n💡 Collections can now be soft-deleted by setting collection_status = \'deleted\'')
    console.log('💡 Deleted collections will be hidden from normal queries but can be restored\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()

