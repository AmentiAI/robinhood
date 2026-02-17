const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const getDatabaseUrl = () => {
  return process.env.NEON_DATABASE || 
         process.env.DATABASE_URL || 
         process.env.NEXT_PUBLIC_NEON_DATABASE ||
         ''
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.error('❌ No database connection string found. Please set NEON_DATABASE environment variable.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add status field to collection_collaborators...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', '023_add_collaborator_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await sql(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added status column to collection_collaborators');
    console.log('   - Set existing records to "accepted" status');
    console.log('   - Created index on status field');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

