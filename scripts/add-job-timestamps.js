import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function runMigration() {
  try {
    console.log('📊 Adding job timestamp columns and cleaning up stuck jobs...\n');
    
    // First, check current state
    console.log('🔍 Checking current job states...');
    const pendingCount = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'pending'`;
    const processingCount = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'processing'`;
    const completedCount = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'completed'`;
    const failedCount = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'failed'`;
    
    console.log(`   Pending: ${pendingCount[0]?.count || 0}`);
    console.log(`   Processing: ${processingCount[0]?.count || 0}`);
    console.log(`   Completed: ${completedCount[0]?.count || 0}`);
    console.log(`   Failed: ${failedCount[0]?.count || 0}`);
    console.log('');
    
    // Run migration SQL
    const migrationPath = join(__dirname, 'migrations', '031_add_job_timestamps.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolons and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`⚙️  Running: ${statement.substring(0, 60)}...`);
        await sql.unsafe(statement);
      }
    }
    
    // Check final state
    console.log('\n🔍 Checking final job states...');
    const finalPending = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'pending'`;
    const finalProcessing = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'processing'`;
    const finalCompleted = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'completed'`;
    const finalFailed = await sql`SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'failed'`;
    
    console.log(`   Pending: ${finalPending[0]?.count || 0}`);
    console.log(`   Processing: ${finalProcessing[0]?.count || 0}`);
    console.log(`   Completed: ${finalCompleted[0]?.count || 0}`);
    console.log(`   Failed: ${finalFailed[0]?.count || 0}`);
    
    // Check columns exist
    console.log('\n🔍 Verifying columns exist...');
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'generation_jobs' 
      AND column_name IN ('started_at', 'completed_at', 'error_message')
    `;
    
    const colNames = columns.map(c => c.column_name);
    console.log(`   ✅ started_at: ${colNames.includes('started_at') ? 'exists' : 'MISSING'}`);
    console.log(`   ✅ completed_at: ${colNames.includes('completed_at') ? 'exists' : 'MISSING'}`);
    console.log(`   ✅ error_message: ${colNames.includes('error_message') ? 'exists' : 'MISSING'}`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Any stuck "processing" jobs have been marked as failed.');
    console.log('📝 Very old pending jobs (>24h) have been cleaned up.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

