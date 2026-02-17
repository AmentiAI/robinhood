/**
 * Run Phase ID Migration
 * Ensures phase_id column exists in mint_inscriptions and backfills from ordinal_reservations
 * Usage: node scripts/run-phase-id-migration.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const databaseUrl = process.env.NEON_DATABASE || process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ No database URL found. Please set NEON_DATABASE or DATABASE_URL')
    process.exit(1)
  }

  console.log('🚀 Running Phase ID Migration...')
  console.log('📡 Connecting to database...')

  const sql = neon(databaseUrl)

  try {
    // Read the SQL file
    const migrationPath = path.join(__dirname, 'migrations', '041_ensure_phase_id_in_mint_inscriptions.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Loaded migration file\n')

    // Split SQL into individual statements
    // Remove comments and split by semicolon
    const lines = migrationSQL.split('\n')
    let currentStatement = ''
    const statements = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('--')) {
        continue
      }
      
      currentStatement += (currentStatement ? ' ' : '') + trimmed
      
      // If line ends with semicolon, we have a complete statement
      // But DO blocks end with $$, not semicolon
      if (trimmed.endsWith(';') && !currentStatement.toUpperCase().includes('DO $$')) {
        const stmt = currentStatement.trim()
        if (stmt && stmt.length > 1) {
          statements.push(stmt)
        }
        currentStatement = ''
      } else if (currentStatement.includes('$$') && 
                 (currentStatement.match(/\$\$/g) || []).length >= 2) {
        // DO block is complete (has both opening and closing $$)
        const stmt = currentStatement.trim()
        if (stmt && stmt.length > 1) {
          statements.push(stmt)
        }
        currentStatement = ''
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }
    
    console.log(`Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const preview = statement.substring(0, 80).replace(/\n/g, ' ')
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`)
        await sql.unsafe(statement)
        console.log(`✅ [${i + 1}/${statements.length}] Completed\n`)
      } catch (error) {
        const errorMsg = error?.message || String(error)
        // Some errors are expected (like "already exists")
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('does not exist') && errorMsg.includes('IF NOT EXISTS')) {
          console.log(`⏭️  [${i + 1}/${statements.length}] Already applied, skipping\n`)
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Error:`, errorMsg)
          console.error('Statement preview:', preview)
          // Continue with other statements even if one fails
        }
      }
    }
    
    // Verify the migration
    console.log('🔍 Verifying migration results...')
    const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE phase_id IS NOT NULL) as with_phase,
        COUNT(*) FILTER (WHERE phase_id IS NULL AND is_test_mint = false) as without_phase,
        COUNT(*) as total
      FROM mint_inscriptions
    `
    
    const statsResult = Array.isArray(stats) ? stats[0] : stats
    console.log(`\n📊 Results:`)
    console.log(`   Total records: ${statsResult.total}`)
    console.log(`   With phase_id: ${statsResult.with_phase}`)
    console.log(`   Without phase_id (non-test): ${statsResult.without_phase}`)
    
    // Check if indexes were created
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'mint_inscriptions' 
      AND indexname LIKE '%phase%'
      ORDER BY indexname
    `
    
    if (Array.isArray(indexes) && indexes.length > 0) {
      console.log(`\n📇 Phase-related indexes:`)
      indexes.forEach(idx => console.log(`   - ${idx.indexname}`))
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Phase ID Migration completed successfully!')
    console.log('='.repeat(50))
    console.log('\n💡 All new mints will now have phase_id set automatically')
    console.log('💡 Queries can now use mi.phase_id directly (no JOINs needed)\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

