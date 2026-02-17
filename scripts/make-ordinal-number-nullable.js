import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

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

async function makeOrdinalNumberNullable() {
  try {
    console.log('📊 Making ordinal_number nullable...\n');
    
    await sql`ALTER TABLE generated_ordinals ALTER COLUMN ordinal_number DROP NOT NULL`;
    console.log('✅ ordinal_number is now nullable');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

makeOrdinalNumberNullable();

