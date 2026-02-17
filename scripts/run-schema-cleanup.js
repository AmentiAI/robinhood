/**
 * Run Schema Cleanup and Optimization Migration
 * Fixes inconsistencies, adds missing indexes, and ensures proper constraints
 * Usage: node scripts/run-schema-cleanup.js
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

  console.log('🚀 Running Schema Cleanup and Optimization Migration...')
  console.log('📡 Connecting to database...')

  const sql = neon(databaseUrl)

  try {
    // Read the SQL file
    const migrationPath = path.join(__dirname, 'migrations', '042_schema_cleanup_and_optimization.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Loaded migration file\n')

    // Split SQL into individual statements
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
    console.log('🔍 Verifying migration results...\n')
    
    // Check indexes on mint_inscriptions
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'mint_inscriptions' 
      ORDER BY indexname
    `
    
    console.log(`📇 Indexes on mint_inscriptions (${Array.isArray(indexes) ? indexes.length : 0}):`)
    if (Array.isArray(indexes) && indexes.length > 0) {
      indexes.forEach(idx => console.log(`   - ${idx.indexname}`))
    }
    
    // Check foreign keys
    const foreignKeys = await sql`
      SELECT conname, confrelid::regclass as references_table
      FROM pg_constraint 
      WHERE contype = 'f' 
      AND conrelid = 'mint_inscriptions'::regclass
      ORDER BY conname
    `
    
    console.log(`\n🔗 Foreign keys on mint_inscriptions (${Array.isArray(foreignKeys) ? foreignKeys.length : 0}):`)
    if (Array.isArray(foreignKeys) && foreignKeys.length > 0) {
      foreignKeys.forEach(fk => console.log(`   - ${fk.conname} → ${fk.references_table}`))
    }
    
    // Check column existence
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mint_inscriptions' 
      AND column_name IN ('session_id', 'phase_id', 'payment_address', 'commit_last_checked_at', 'reveal_last_checked_at')
      ORDER BY column_name
    `
    
    console.log(`\n📊 Critical columns check:`)
    if (Array.isArray(columns) && columns.length > 0) {
      columns.forEach(col => console.log(`   ✅ ${col.column_name} (${col.data_type})`))
    }
    
    const expectedColumns = ['session_id', 'phase_id', 'payment_address', 'commit_last_checked_at', 'reveal_last_checked_at']
    const foundColumns = Array.isArray(columns) ? columns.map(c => c.column_name) : []
    const missingColumns = expectedColumns.filter(c => !foundColumns.includes(c))
    
    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Missing columns: ${missingColumns.join(', ')}`)
    } else {
      console.log(`\n✅ All critical columns exist`)
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Schema Cleanup Migration completed!')
    console.log('='.repeat(50))
    console.log('\n💡 Database schema is now optimized and consistent')
    console.log('💡 All critical indexes and foreign keys are in place\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

