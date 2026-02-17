#!/usr/bin/env node
/**
 * Run banner video migration (034_add_banner_video_url.sql)
 */

const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const databaseUrl = process.env.NEON_DATABASE || process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ No database URL found. Please set NEON_DATABASE or DATABASE_URL')
    process.exit(1)
  }

  const migrationPath = path.join(__dirname, 'migrations', '034_add_banner_video_url.sql')
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const sqlText = fs.readFileSync(migrationPath, 'utf8')
  const sql = neon(databaseUrl)

  console.log('🚀 Running banner video migration (034_add_banner_video_url.sql)...')
  try {
    // execute as a single statement (file is just one ALTER TABLE)
    await sql.unsafe(sqlText)
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()


