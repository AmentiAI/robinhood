/**
 * Script to directly add compression columns (bypassing IF NOT EXISTS issues)
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const getDatabaseUrl = () => {
  return process.env.NEON_DATABASE || 
         process.env.DATABASE_URL || 
         ''
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.error('❌ No database connection string found. Please set NEON_DATABASE in .env.local');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function addColumns() {
  try {
    console.log('📊 Adding compression columns directly...\n');
    
    // Add compression_quality to collections
    try {
      await sql`
        ALTER TABLE collections 
        ADD COLUMN compression_quality INTEGER DEFAULT 100
      `;
      console.log('✅ Added compression_quality to collections table');
    } catch (error) {
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.log('⏭️  compression_quality already exists in collections');
      } else {
        throw error;
      }
    }
    
    // Add compression_dimensions to collections
    try {
      await sql`
        ALTER TABLE collections 
        ADD COLUMN compression_dimensions INTEGER DEFAULT 1024
      `;
      console.log('✅ Added compression_dimensions to collections table');
    } catch (error) {
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.log('⏭️  compression_dimensions already exists in collections');
      } else {
        throw error;
      }
    }
    
    // Add compressed_image_url to generated_ordinals
    try {
      await sql`
        ALTER TABLE generated_ordinals 
        ADD COLUMN compressed_image_url TEXT
      `;
      console.log('✅ Added compressed_image_url to generated_ordinals table');
    } catch (error) {
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.log('⏭️  compressed_image_url already exists in generated_ordinals');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ All columns added successfully!');
    console.log('\nVerifying...\n');
    
    // Verify
    const check = await sql`
      SELECT 
        column_name, 
        data_type, 
        column_default
      FROM information_schema.columns 
      WHERE (table_name = 'collections' AND column_name IN ('compression_quality', 'compression_dimensions'))
         OR (table_name = 'generated_ordinals' AND column_name = 'compressed_image_url')
      ORDER BY table_name, column_name
    `;
    
    const checkArray = Array.isArray(check) ? check : [check];
    checkArray.forEach((col) => {
      console.log(`  ✅ ${col.table_name}.${col.column_name}: ${col.data_type} (default: ${col.column_default || 'NULL'})`);
    });
    
    if (checkArray.length === 3) {
      console.log('\n✅ All 3 columns confirmed to exist!');
    } else {
      console.log(`\n⚠️  Only found ${checkArray.length}/3 columns`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addColumns();

