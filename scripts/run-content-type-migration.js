#!/usr/bin/env node

/**
 * Migration: Add content_type column to ordinal_listings table
 * This allows proper display of HTML, video, audio, and other content types
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

  console.log('🚀 Running Content Type Migration...')
  console.log('📡 Connecting to database...')

  const sql = neon(databaseUrl)

  try {
    // Add content_type column
    console.log('  Adding content_type column to ordinal_listings...')
    await sql`
      ALTER TABLE ordinal_listings
      ADD COLUMN IF NOT EXISTS content_type VARCHAR(255);
    `
    console.log('  ✅ Added content_type column')

    // Add index
    console.log('  Adding index for content_type...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ordinal_listings_content_type ON ordinal_listings(content_type) WHERE content_type IS NOT NULL;
    `
    console.log('  ✅ Added index')

    console.log('\n✅ Content Type Migration Complete!')
    console.log('   - Added content_type column to ordinal_listings table')
    console.log('   - Added index for content_type queries')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    
    // Check if column already exists
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
      console.log('⚠️  Column may already exist. This is okay.')
      process.exit(0)
    }
    
    process.exit(1)
  }
}

runMigration()
